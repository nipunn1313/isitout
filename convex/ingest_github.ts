"use node";
import { Octokit } from "@octokit/rest";
import { internalAction } from "./_generated/server";

const octokit = new Octokit();

export const ingestFromGithub = internalAction(async (_ctx) => {
    const commits = await octokit.request('GET /repos/nipunn1313/oncall_app/commits', {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    return commits;
});
