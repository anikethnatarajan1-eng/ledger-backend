import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import pkg from "pg";

const { Pool } = pkg;

// Connect to Postgres/Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    // Octokit with GitHub App auth
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        installationId: parseInt(process.env.GITHUB_INSTALLATION_ID),
      },
    });

    // Fetch repos for the authenticated installation
    const reposRes = await octokit.rest.repos.listForAuthenticatedUser();
    const repos = reposRes.data;

    let outcomes = [];

    for (let repo of repos) {
      // Fetch PRs
      const prs = await octokit.rest.pulls.list({
        owner: repo.owner.login,
        repo: repo.name,
        state: "all",
      });

      prs.data.forEach(pr => {
        outcomes.push({
          repo: repo.name,
          type: "PR",
          status: pr.merged_at ? "merged" : pr.state,
          date: pr.updated_at,
        });
      });

      // Fetch issues (excluding PRs)
      const issues = await octokit.rest.issues.listForRepo({
        owner: repo.owner.login,
        repo: repo.name,
        state: "all",
      });

      issues.data.forEach(issue => {
        if (!issue.pull_request) {
          outcomes.push({
            repo: repo.name,
            type: "Issue",
            status: issue.state,
            date: issue.updated_at,
          });
        }
      });
    }

    // Save outcomes to Postgres
    for (let outcome of outcomes) {
      await pool.query(
        `INSERT INTO outcomes(user_name, repo, type, status, date)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [username, outcome.repo, outcome.type, outcome.status, outcome.date]
      );
    }

    res.status(200).json({ user: username, outcomes });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
