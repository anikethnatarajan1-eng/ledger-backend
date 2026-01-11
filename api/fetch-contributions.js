import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        installationId: process.env.GITHUB_INSTALLATION_ID,
      },
    });

    // 1️⃣ Get all repos this app is installed on
    const response = await octokit.request(
      "GET /installation/repositories"
    );

    const repos = response.data.repositories;
    let outcomes = [];

    // 2️⃣ Loop through repos and fetch commits
    for (const repo of repos) {
  try {
    const commits = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner: "anikethnatarajan1-eng",
        repo: repo.name,
        per_page: 10
      }
    );

    commits.data.forEach(commit => {
      if (!commit.author) return;

      outcomes.push({
        user: commit.author.login,
        repo: repo.full_name,
        message: commit.commit.message,
        sha: commit.sha,
        date: commit.commit.author.date
      });
    });

  } catch (err) {
    // ✅ Skip empty repos or restricted repos
    if (err.status === 409) {
      continue;
    }
    throw err;
  }
}
