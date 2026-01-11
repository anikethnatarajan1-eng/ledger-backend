import { createClient } from "@supabase/supabase-js";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    // --- Initialize Octokit with GitHub App auth ---
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        installationId: process.env.GITHUB_INSTALLATION_ID,
      },
    });

    // --- Fetch repos this app is installed on ---
    const repoResponse = await octokit.request("GET /installation/repositories");
    const repos = repoResponse?.data?.repositories || [];
    const outcomes = [];

    // --- Iterate through repos ---
    for (const repo of repos) {
      try {
        const commitResponse = await octokit.request(
          "GET /repos/{owner}/{repo}/commits",
          {
            owner: repo.owner.login,
            repo: repo.name,
            per_page: 10,
          }
        );

        const commits = commitResponse?.data || [];

        for (const commit of commits) {
          if (!commit.author || !commit.commit?.author?.date) continue;

          const outcome = {
            user: commit.author.login,
            repo: repo.full_name,
            message: commit.commit.message,
            sha: commit.sha,
            date: commit.commit.author.date,
          };

          outcomes.push(outcome);

          // --- Insert into Supabase table 'contributions' ---
          await supabase
            .from("contributions")
            .upsert({
              sha: outcome.sha,
              repo: outcome.repo,
              user: outcome.user,
              message: outcome.message,
              date: outcome.date,
            });
        }
      } catch (repoError) {
        if ([403, 404, 409].includes(repoError.status)) continue;
        console.error("Repo error:", repo.name, repoError.message);
      }
    }

    res.status(200).json({
      user: "aniketh",
      totalRepos: repos.length,
      totalOutcomes: outcomes.length,
      outcomes,
    });
  } catch (error) {
    console.error("Fatal error:", error);
    res.status(500).json({ error: error.message });
  }
}
