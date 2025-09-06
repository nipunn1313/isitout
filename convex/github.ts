import { Octokit } from "@octokit/rest";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

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

export const getLatestConvexBackendRelease = internalAction({
  args: {},
  handler: async (_ctx, _args) => {
    const release = await octokit.repos.getLatestRelease({
      owner: "get-convex",
      repo: "convex-backend",
    });
    return release.data.tag_name;
  },
});

export const getLatestConvexBackendContainer = internalAction({
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

export const getBranchRev = internalAction({
  args: { branch: v.string() },
  handler: async (_ctx, args) => {
    const branch = await octokit.repos.getBranch({
      owner: "get-convex",
      repo: "convex",
      branch: args.branch,
    });
    return branch.data.commit.sha;
  },
});

export const trackConvexBackendRelease = internalAction({
  args: {},
  handler: async (ctx) => {
    const version = await ctx.runAction(
      internal.github.getLatestConvexBackendRelease,
    );
    await ctx.runMutation(api.version_history.addRow, {
      version,
      service: "local-dev",
      secret: process.env.ISITOUT_SECRET!,
    });
  },
});

export const trackConvexBackendContainer = internalAction({
  args: {},
  handler: async (ctx) => {
    const version = await ctx.runAction(
      internal.github.getLatestConvexBackendContainer,
    );
    await ctx.runMutation(api.version_history.addRow, {
      version,
      service: "self-hosted",
      secret: process.env.ISITOUT_SECRET!,
    });
  },
});

export const trackBranchRevs = internalAction({
  args: {},
  handler: async (ctx) => {
    const branchByService = {
      dashboard: "dashboard-prod",
      docs: "docs-prod",
    };
    for (const [service, branch] of Object.entries(branchByService)) {
      const rev = await ctx.runAction(internal.github.getBranchRev, {
        branch,
      });
      await ctx.runMutation(api.version_history.addRow, {
        version: rev,
        service,
        secret: process.env.ISITOUT_SECRET!,
      });
    }
  },
});
