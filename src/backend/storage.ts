import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import type { PageInfo, PumiloDataset, RepoInfo } from "./types";

const PUMILO_DIR = path.join(process.cwd(), ".pumilo");
const REPOS_FILE = path.join(PUMILO_DIR, "repos.json");

async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

function routeToFilename(route: string): string {
  return route.replace(/^\//, "").replace(/\//g, "-") || "index";
}

function getRepoDir(repoName: string): string {
  return path.join(PUMILO_DIR, repoName);
}

function getPagesDir(repoName: string): string {
  return path.join(getRepoDir(repoName), "pages");
}

function getDataDir(repoName: string): string {
  return path.join(getRepoDir(repoName), "data");
}

export async function getRepos(): Promise<Record<string, RepoInfo>> {
  try {
    await ensureDir(PUMILO_DIR);
    const content = await readFile(REPOS_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function saveRepo(name: string, repoPath: string): Promise<void> {
  await ensureDir(PUMILO_DIR);
  const repos = await getRepos();
  
  if (repos[name]) {
    if (!repos[name].paths.includes(repoPath)) {
      repos[name].paths.push(repoPath);
    }
    repos[name].activePath = repoPath;
    repos[name].lastUsed = new Date().toISOString();
  } else {
    repos[name] = {
      name,
      paths: [repoPath],
      activePath: repoPath,
      lastUsed: new Date().toISOString(),
    };
  }
  
  await writeFile(REPOS_FILE, JSON.stringify(repos, null, 2), "utf8");
}

export async function getRepoActivePath(name: string): Promise<string | null> {
  const repos = await getRepos();
  return repos[name]?.activePath ?? null;
}

export async function savePageInfo(repoName: string, info: PageInfo): Promise<void> {
  const pagesDir = getPagesDir(repoName);
  await ensureDir(pagesDir);
  const filename = routeToFilename(info.route);
  const filePath = path.join(pagesDir, `${filename}.json`);
  await writeFile(filePath, JSON.stringify(info, null, 2), "utf8");
}

export async function getPageInfo(repoName: string, route: string): Promise<PageInfo | null> {
  try {
    const pagesDir = getPagesDir(repoName);
    const filename = routeToFilename(route);
    const filePath = path.join(pagesDir, `${filename}.json`);
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as PageInfo;
  } catch {
    return null;
  }
}

export async function listPages(repoName: string): Promise<PageInfo[]> {
  try {
    const pagesDir = getPagesDir(repoName);
    await ensureDir(pagesDir);
    const files = await readdir(pagesDir);
    const pages: PageInfo[] = [];
    
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await readFile(path.join(pagesDir, file), "utf8");
        pages.push(JSON.parse(content) as PageInfo);
      }
    }
    
    return pages.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function savePageData(repoName: string, route: string, data: PumiloDataset): Promise<void> {
  const dataDir = getDataDir(repoName);
  await ensureDir(dataDir);
  const filename = routeToFilename(route);
  const filePath = path.join(dataDir, `${filename}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  
  const info = await getPageInfo(repoName, route);
  if (info) {
    info.updatedAt = new Date().toISOString();
    await savePageInfo(repoName, info);
  }
}

export async function getPageData(repoName: string, route: string): Promise<PumiloDataset | null> {
  try {
    const dataDir = getDataDir(repoName);
    const filename = routeToFilename(route);
    const filePath = path.join(dataDir, `${filename}.json`);
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as PumiloDataset;
  } catch {
    return null;
  }
}

export async function createDefaultData(schemaPath: string): Promise<PumiloDataset> {
  try {
    const schemaContent = await readFile(schemaPath, "utf8");
    const schema = JSON.parse(schemaContent);
    
    const defaultData: PumiloDataset = {};
    
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const property = prop as { default?: string };
        defaultData[key] = property.default ?? "";
      }
    }
    
    return defaultData;
  } catch (error) {
    throw new Error(`Failed to create default data from schema: ${error}`);
  }
}

