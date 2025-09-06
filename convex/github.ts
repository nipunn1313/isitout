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

export const getLatestConvexBackendRelease = action({
  args: {},
  handler: async (_ctx, _args) => {
    const release = await octokit.repos.getLatestRelease({
      owner: "get-convex",
      repo: "convex-backend",
    });
    return release.data.tag_name;
  },
});

export const getLatestConvexBackendContainer = action({
  args: {},
  handler: async (_ctx, _args) => {
    const packages =
      await octokit.packages.getAllPackageVersionsForPackageOwnedByOrg({
        package_type: "container",
        package_name: "convex-backend",
        org: "get-convex",
        per_page: 1,
        page: 1,
      });

    if (packages.data.length === 0) {
      throw new Error("No container packages found");
    }

    // Return the most recent package version name/tag
    return (
      packages.data[0].metadata?.container?.tags?.[0] || packages.data[0].name
    );
  },
});
