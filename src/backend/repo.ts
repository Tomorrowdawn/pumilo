import { $ } from "bun";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { saveRepo } from "./storage";

interface RepoValidationResult {
  repoName: string;
  isRemote: boolean;
  localPath: string;
  message: string;
}

function isRemoteUrl(repoPath: string): boolean {
  return repoPath.startsWith("http://") || 
         repoPath.startsWith("https://") || 
         repoPath.startsWith("git@");
}

function extractRepoName(remoteUrl: string): string {
  const parts = remoteUrl.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.replace(/\.git$/, "");
}

function getCacheDir(): string {
  return path.join(homedir(), ".cache", "pumilo", "repos");
}

export async function validateAndPrepareRepo(repoName: string, repoPath: string): Promise<RepoValidationResult> {
  if (!isRemoteUrl(repoPath)) {
    if (!existsSync(repoPath)) {
      throw new Error(`Local path does not exist: ${repoPath}`);
    }
    await saveRepo(repoName, repoPath);
    return {
      repoName,
      isRemote: false,
      localPath: repoPath,
      message: "Local repository validated",
    };
  }

  const cacheDir = getCacheDir();
  await mkdir(cacheDir, { recursive: true });
  
  const cacheName = extractRepoName(repoPath);
  const localPath = path.join(cacheDir, cacheName);

  if (existsSync(localPath)) {
    await $`git -C ${localPath} pull`.quiet();
    await saveRepo(repoName, repoPath);
    return {
      repoName,
      isRemote: true,
      localPath,
      message: `Remote repository updated: ${cacheName}`,
    };
  }

  await $`git clone ${repoPath} ${localPath}`.quiet();
  
  const canPush = await $`git -C ${localPath} push --dry-run`.quiet().nothrow();
  if (canPush.exitCode !== 0) {
    throw new Error("Repository validation failed: cannot push to remote. Please ensure you have proper credentials configured.");
  }

  await saveRepo(repoName, repoPath);
  return {
    repoName,
    isRemote: true,
    localPath,
    message: `Remote repository cloned and validated: ${cacheName}`,
  };
}

export async function isRepoRemote(repoPath: string): Promise<boolean> {
  const remoteOutput = await $`git -C ${repoPath} remote -v`.text();
  return remoteOutput.trim().length > 0;
}

export async function pushToRemote(repoPath: string): Promise<void> {
  await $`git -C ${repoPath} push`.quiet();
}

