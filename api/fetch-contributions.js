import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // --- Iterate through repos safely ---
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
          if (
            !commit.author ||
            !commit.commit ||
            !commit.commit.author ||
            !commit.commit.author.date
          ) continue;

          outcomes.push({
            user: commit.author.login,
            repo: repo.full_name,
            message: commit.commit.message,
            sha: commit.sha,
            date: commit.commit.author.date,
          });
        }
      } catch (repoError) {
        if (repoError.status === 409 || repoError.status === 404 || repoError.status === 403)
          continue; // skip non-fatal repo errors
        console.error("Repo error:", repo.full_name, repoError.message);
      }
    }

    // --- Save to Supabase ---
    for (const outcome of outcomes) {
      const { data, error } = await supabase
        .from("contributions") // your table name
        .upsert({
          user: outcome.user,
          repo: outcome.repo,
          message: outcome.message,
          sha: outcome.sha,
          date: outcome.date,
        }, { onConflict: ["sha"] });

      if (error) console.error("Supabase error:", error);
    }

    res.status(200).json({
      user: "aniketh",
      totalRepos: repos.length,
      totalOutcomes: outcomes.length,
      outcomes,
    });
  } catch (err) {
    console.error("Fatal error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
