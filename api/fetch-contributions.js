import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    console.log("Starting contributions fetch...");

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        installationId: process.env.GITHUB_INSTALLATION_ID,
      },
    });

    const repoResponse = await octokit.request("GET /installation/repositories");
    const repos = repoResponse?.data?.repositories || [];
    console.log(`Fetched ${repos.length} repos`);

    const outcomes = [];

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
        console.log(`Processing ${commits.length} commits for repo: ${repo.name}`);

        for (const commit of commits) {
          if (!commit.author || !commit.commit || !commit.commit.author?.date) continue;

          const outcome = {
            user: commit.author.login,
            repo: repo.full_name,
            message: commit.commit.message,
            sha: commit.sha,
            date: commit.commit.author.date,
          };

          outcomes.push(outcome);

          // Insert into Supabase
          const { error: dbError } = await supabase
            .from("contributions")
            .upsert(outcome, { onConflict: ["sha"] }); // prevent duplicates

          if (dbError) console.error("Supabase insert error:", dbError.message);
        }
      } catch (repoError) {
        console.warn(`Skipping repo ${repo.name} due to error:`, repoError.message);
      }
    }

    res.status(200).json({
      user: "aniketh",
      totalRepos: repos.length,
      totalOutcomes: outcomes.length,
      outcomes,
    });

    console.log("Contributions fetch completed successfully!");

  } catch (error) {
    console.error("Fatal error:", error);
    res.status(500).json({ error: error.message });
  }
}
