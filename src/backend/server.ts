import path from "node:path";
import type { CreatePageRequest, UpdateDataRequest, CompileRequest } from "./types";
import {
  createEditableInstance,
  createData,
  weave,
  updateData,
  readPages,
  compileAndPublish,
  listTemplates,
  validateRepo,
  listRepos,
} from "./api";

const PORT = Number(process.env.PORT) || 3000;
const WEBUI_DIR = path.join(process.cwd(), "dist", "webui");

async function serveStaticFile(filePath: string): Promise<Response> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(file);
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/healthz") {
      return Response.json({ status: "ok" });
    }
    
    if (url.pathname === "/api/repos" && request.method === "GET") {
      try {
        const repos = await listRepos();
        return Response.json({ repos });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/pages" && request.method === "GET") {
      try {
        const repoName = url.searchParams.get("repoName");
        if (!repoName) {
          return Response.json({ error: "repoName is required" }, { status: 400 });
        }
        const pages = await readPages(repoName);
        return Response.json({ pages });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/repo/validate" && request.method === "POST") {
      try {
        const { repoName, repoPath } = await request.json() as { repoName: string; repoPath: string };
        const result = await validateRepo(repoName, repoPath);
        return Response.json(result);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/templates" && request.method === "POST") {
      try {
        const { repoPath } = await request.json() as { repoPath: string };
        const templates = await listTemplates(repoPath);
        return Response.json({ templates });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/pages/create" && request.method === "POST") {
      try {
        const body = await request.json() as CreatePageRequest;
        const { repoName, route, repoPath, templateName } = body;
        
        const result = await createEditableInstance(repoName, route, repoPath, templateName);
        return Response.json(result);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/data/create" && request.method === "POST") {
      try {
        const { repoName, route, schemaPath } = await request.json() as { repoName: string; route: string; schemaPath?: string };
        const data = await createData(repoName, route, schemaPath);
        return Response.json({ data });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/data/update" && request.method === "POST") {
      try {
        const { repoName, route, data } = await request.json() as UpdateDataRequest;
        await updateData(repoName, route, data);
        return Response.json({ status: "ok" });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/weave" && request.method === "POST") {
      try {
        const { repoName, route, repoPath, data } = await request.json() as { 
          repoName: string;
          route: string; 
          repoPath: string;
          data: Record<string, string>;
        };
        const html = await weave(repoName, route, repoPath, data);
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/api/compile" && request.method === "POST") {
      try {
        const { repoName, route, repoPath } = await request.json() as { repoName: string; route: string; repoPath: string };
        const html = await compileAndPublish(repoName, route, repoPath);
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }
    
    if (url.pathname === "/" || url.pathname === "/editor") {
      return serveStaticFile(path.join(WEBUI_DIR, "index.html"));
    }
    
    if (url.pathname.startsWith("/webui/")) {
      const assetPath = url.pathname.replace("/webui/", "");
      return serveStaticFile(path.join(WEBUI_DIR, assetPath));
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Pumilo backend running on http://localhost:${server.port}`);
console.log(`   Editor: http://localhost:${server.port}/editor`);
console.log(`   Health: http://localhost:${server.port}/healthz`);
