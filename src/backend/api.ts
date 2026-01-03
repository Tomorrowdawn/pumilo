import path from "node:path";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { PumiloDataset, PageInfo, RepoInfo } from "./types";
import {
  savePageInfo,
  getPageInfo,
  listPages,
  savePageData,
  getPageData,
  createDefaultData,
  getRepos,
} from "./storage";
import { renderTemplate, wrapHtml } from "./renderer";
import { validateAndPrepareRepo } from "./repo";

export async function createEditableInstance(
  repoName: string,
  route: string,
  repoPath: string,
  templateName: string
): Promise<{ html: string; data: PumiloDataset }> {
  let pageInfo = await getPageInfo(repoName, route);
  
  if (!pageInfo) {
    const schemaPath = path.join(
      repoPath,
      "pumilo-templates",
      templateName,
      "schema.json"
    );
    
    const defaultData = await createDefaultData(schemaPath);
    await savePageData(repoName, route, defaultData);
    
    const now = new Date().toISOString();
    pageInfo = {
      route,
      templateName,
      createdAt: now,
      updatedAt: now,
    };
    await savePageInfo(repoName, pageInfo);
  }
  
  const data = await getPageData(repoName, route) ?? {};
  
  const body = await renderTemplate({
    repoPath,
    templateName: pageInfo.templateName,
    mode: "edit",
    data,
  });
  
  const html = wrapHtml(body, "edit");
  
  return { html, data };
}

export async function createData(
  repoName: string,
  route: string,
  schemaPath?: string
): Promise<PumiloDataset> {
  let data = await getPageData(repoName, route);
  
  if (!data && schemaPath) {
    data = await createDefaultData(schemaPath);
    await savePageData(repoName, route, data);
  }
  
  return data ?? {};
}

export async function weave(
  repoName: string,
  route: string,
  repoPath: string,
  data: PumiloDataset
): Promise<string> {
  const pageInfo = await getPageInfo(repoName, route);
  if (!pageInfo) {
    throw new Error(`Page ${route} not found`);
  }
  
  const body = await renderTemplate({
    repoPath,
    templateName: pageInfo.templateName,
    mode: "edit",
    data,
  });
  
  return wrapHtml(body, "edit");
}

export async function updateData(
  repoName: string,
  route: string,
  data: PumiloDataset
): Promise<void> {
  await savePageData(repoName, route, data);
}

export async function readPages(repoName: string): Promise<PageInfo[]> {
  return await listPages(repoName);
}

export async function compileAndPublish(
  repoName: string,
  route: string,
  repoPath: string
): Promise<string> {
  const pageInfo = await getPageInfo(repoName, route);
  if (!pageInfo) {
    throw new Error(`Page ${route} not found`);
  }
  
  const data = await getPageData(repoName, route) ?? {};
  
  const body = await renderTemplate({
    repoPath,
    templateName: pageInfo.templateName,
    mode: "publish",
    data,
  });
  
  const html = wrapHtml(body, "publish");
  
  const { publishToGithubPages } = await import("./publisher");
  await publishToGithubPages({
    repoPath,
    route: pageInfo.route,
    html,
  });
  
  return html;
}

export async function listTemplates(repoPath: string): Promise<string[]> {
  const templatesDir = path.join(repoPath, "pumilo-templates");
  
  if (!existsSync(templatesDir)) {
    return [];
  }
  
  const entries = await readdir(templatesDir, { withFileTypes: true });
  const templates: string[] = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const templatePath = path.join(templatesDir, entry.name, "template.tsx");
      const schemaPath = path.join(templatesDir, entry.name, "schema.json");
      
      if (existsSync(templatePath) && existsSync(schemaPath)) {
        templates.push(entry.name);
      }
    }
  }
  
  return templates.sort();
}

export async function validateRepo(repoName: string, repoPath: string): Promise<{ repoName: string; isRemote: boolean; localPath: string; message: string }> {
  return await validateAndPrepareRepo(repoName, repoPath);
}

export async function listRepos(): Promise<Record<string, RepoInfo>> {
  return await getRepos();
}
