import { getInput } from "@actions/core";

export const inputs = {
  githubToken: getInput("github_token"),
  target: getInput("target"),
};
