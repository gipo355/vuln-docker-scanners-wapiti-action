import {
  setFailed,
  // ExitCode
  info,
} from "@actions/core";
import { exec } from "@actions/exec";
import fs from "node:fs";
import { getOctokit, context } from "@actions/github";
import { inputs } from "./inputs";
import { collapsibleWrapper } from "./utils";

async function main() {
  const workspace = process.env.GITHUB_WORKSPACE;
  const currentRunnerID = context.runId;

  if (!workspace) {
    throw new Error("GITHUB_WORKSPACE is not defined");
  }

  const repoName = context.repo.repo;
  const repoOwner = context.repo.owner;

  const imageName = "gipo355/wapiti:latest";

  console.log(
    `🚀 Starting the action! workspace: ${workspace} currentRunnerID: ${currentRunnerID} `,
  );

  console.log(`Pulling the image: ${imageName}`);
  let pullCmd = `docker pull ${imageName} -q`;
  await exec(pullCmd);

  // docker run --network=host --volume="./.wapiti:/root/.wapiti" gipo355/wapiti:latest -u http://localhost:8080/tomcat-webapp-boilerplate/app/base

  const runCmd = [
    "docker",
    "run",
    `-v ${workspace}/.wapiti:/root/.wapiti`,
    `--network=host`,
    `${imageName}`,
    "-u " + inputs.target,
  ].join(" ");

  console.log(`🚀 Executing attack: ${runCmd}`);
  await exec(runCmd);

  const octokit = getOctokit(inputs.githubToken);

  const issueTitle = "Wapiti scan reports";

  // get issue, if exists, update it adding a comment with new reports
  const { data: issues } = await octokit.rest.issues.listForRepo({
    state: "open",
    owner: repoOwner,
    repo: repoName,
  });

  console.log("looking for issue: ", issueTitle);

  const issue = issues.find((issue) => issue.title === issueTitle);

  console.log("issue", issue);

  if (issue?.id) {
    console.log("updating issue", issue.number);
    await octokit.rest.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: issue.number,
      body: "this is just a test to check if we could upload the reports to the issue.",
    });
  } else {
    console.log("creating issue");
    // TODO: put in inputs to allow creating issues. we are testing for now
    // Ideally we want to create a sarif and upload to code scans
    // create an issue with the reports
    // IF CREATEISSUE
    await octokit.rest.issues.create({
      owner: repoOwner,
      repo: repoName,
      title: issueTitle,
      body: "this is just a test to check if we could upload the reports to the issue.",
    });
  }
}

main().catch((error) => {
  console.error(error);
  setFailed("Action failed");
});
