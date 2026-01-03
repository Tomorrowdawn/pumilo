import { writeFile, mkdir, readdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";
import { isRepoRemote, pushToRemote } from "./repo";

export interface PublishOptions {
  repoPath: string;
  route: string;
  html: string;
}

export async function publishToGithubPages(options: PublishOptions): Promise<void> {
  const { repoPath, route, html } = options;
  
  const currentBranch = await $`git -C ${repoPath} branch --show-current`.text();
  const trimmedBranch = currentBranch.trim();
  
  const tempDir = path.join(tmpdir(), `pumilo-publish-${Date.now()}`);
  const distDir = path.join(tempDir, "dist");
  await mkdir(distDir, { recursive: true });
  
  const fileName = route.replace(/^\//, "").replace(/\//g, "-") || "index";
  const htmlFileName = `${fileName}.html`;
  const outputPath = path.join(distDir, htmlFileName);
  await writeFile(outputPath, html, "utf8");
  
  let branchChanged = false;
  const hasRemote = await isRepoRemote(repoPath);
  
  try {
    const hasGhPages = await $`git -C ${repoPath} branch -a`.text();
    
    if (!hasGhPages.includes("gh-pages")) {
      await $`git -C ${repoPath} checkout --orphan gh-pages`.quiet();
      await $`git -C ${repoPath} rm -rf .`.quiet();
    } else {
      await $`git -C ${repoPath} checkout gh-pages`.quiet();
    }
    branchChanged = true;
    
    const distEntries = await readdir(distDir, { withFileTypes: true });
    const copiedFiles: string[] = [];
    
    for (const entry of distEntries) {
      const srcPath = path.join(distDir, entry.name);
      const destPath = path.join(repoPath, entry.name);
      
      if (entry.isFile()) {
        await copyFile(srcPath, destPath);
        copiedFiles.push(entry.name);
      }
    }
    
    for (const fileName of copiedFiles) {
      await $`git -C ${repoPath} add ${fileName}`.quiet();
    }
    
    const status = await $`git -C ${repoPath} status --porcelain`.text();
    if (status.trim()) {
      await $`git -C ${repoPath} commit -m "Update page: ${route}"`.quiet();
    }
    
    if (hasRemote) {
      await pushToRemote(repoPath);
    }
  } finally {
    if (branchChanged) {
      await $`git -C ${repoPath} checkout ${trimmedBranch}`.quiet();
    }
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function buildDist(repoPath: string, pages: Array<{ route: string; html: string }>): Promise<void> {
  const distDir = path.join(repoPath, "dist");
  await mkdir(distDir, { recursive: true });
  
  for (const page of pages) {
    const fileName = page.route.replace(/^\//, "").replace(/\//g, "-") || "index";
    const outputPath = path.join(distDir, `${fileName}.html`);
    await writeFile(outputPath, page.html, "utf8");
  }
}

