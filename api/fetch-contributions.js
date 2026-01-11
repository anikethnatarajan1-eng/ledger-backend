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

    // ✅ GitHub App–correct endpoint
    const response = await octokit.request(
      "GET /installation/repositories"
    );

    res.status(200).json({
      user: "aniketh",
      repositories: response.data.repositories.map(r => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error
    });
  }
}
