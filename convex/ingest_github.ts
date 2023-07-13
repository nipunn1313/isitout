"use node";
import { Octokit } from "@octokit/rest";
import { internalAction } from "./_generated/server";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN2 });

export const ingestFromGithub = internalAction(async (_ctx) => {
  const commits = await octokit.request(
    "GET /repos/get-convex/convex/commits",
    {
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  return commits;
});
