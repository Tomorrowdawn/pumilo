export type PumiloMode = "edit" | "publish";

export type PumiloDataset = Record<string, string>;

export interface PageInfo {
  route: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepoInfo {
  name: string;
  paths: string[];
  activePath: string;
  lastUsed: string;
}

export interface CreatePageRequest {
  repoName: string;
  route: string;
  templateName: string;
  repoPath: string;
}

export interface UpdateDataRequest {
  repoName: string;
  route: string;
  data: PumiloDataset;
}

export interface CompileRequest {
  repoName: string;
  route: string;
  repoPath: string;
}

