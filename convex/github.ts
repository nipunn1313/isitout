import { Octokit } from "@octokit/rest";
import { action } from "./_generated/server";
import { v } from "convex/values";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN2 });

export const compareCommits = action({
  args: {
    base: v.string(),
    head: v.string(),
  },
  handler: async (_ctx, args) => {
    const comparison = await octokit.repos.compareCommits({
      owner: "get-convex",
      repo: "convex",
      base: args.base,
      head: args.head,
    });
    return comparison.data.status;
  },
});
