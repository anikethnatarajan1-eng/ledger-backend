import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { createClient } from "@supabase/supabase-js";

// --- Initialize Supabase ---
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

    // --- Iterate through repos ---
    for (const repo of repos) {
      try {
        const commitResponse = await octokit.request(
          "GET /repos/{owner}/{repo}/commits",
          {
            owner: repo.owner.login,
            repo: repo.name,
            per_page: 10, // number of commits to fetch per repo
          }
        );

        const commits = commitResponse?.data || [];

        for (const commit of commits) {
          if (!commit.commit || !commit.commit.author || !commit.commit.author.date) continue;

          // --- canonicalUser: use author login if exists, else repo owner ---
          const canonicalUser = commit.author?.login ?? repo.owner.login;

          // --- Store each commit in Supabase ---
          const { data, error } = await supabase
            .from("contributions")
            .upsert(
              {
                canonical_user: canonicalUser,
                source: "github",
                repo: repo.full_name,
                sha: commit.sha,
                message: commit.commit.message,
                contribution_date: commit.commit.author.date,
                weight: 1.0,
              },
              { onConflict: ["source", "sha"] } // prevent duplicates
            );

          if (error) console.error("Supabase error:", error);
          else outcomes.push({
            user: canonicalUser,
            repo: repo.full_name,
            sha: commit.sha,
            message: commit.commit.message,
            contribution_date: commit.commit.author.date
          });
        }
      } catch (repoError) {
        if ([403, 404, 409].includes(repoError.status)) continue; // skip non-fatal errors
        console.error("Repo error:", repo.full_name, repoError.message);
      }
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
