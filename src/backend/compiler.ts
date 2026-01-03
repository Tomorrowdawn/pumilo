import { build } from "bun";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

export interface CompileTemplateOptions {
  repoPath: string;
  templateName: string;
  mode: "edit" | "publish";
}

export async function compileTemplate(options: CompileTemplateOptions): Promise<string> {
  const { repoPath, templateName, mode } = options;
  const templatePath = path.join(
    repoPath,
    "pumilo-templates",
    templateName,
    "template.tsx"
  );

  const tempDir = path.join(process.cwd(), ".pumilo", "temp");
  await mkdir(tempDir, { recursive: true });
  
  const outfile = path.join(tempDir, `${templateName}-${mode}-${Date.now()}.js`);

  await build({
    entrypoints: [templatePath],
    outdir: path.dirname(outfile),
    target: "browser",
    format: "esm",
    splitting: false,
    minify: false,
    sourcemap: "none",
    external: ["react", "react-dom", "@pumilo/sdk"],
    define: {
      "process.env.NODE_ENV": mode === "publish" ? '"production"' : '"development"',
    },
  });

  return outfile;
}

export interface RenderOptions {
  Component: React.ComponentType;
  mode: "edit" | "publish";
  data: Record<string, string>;
}

export async function renderTemplate(options: RenderOptions): Promise<string> {
  const { Component, mode, data } = options;
  
  const { PumiloProvider } = await import("../sdk/context");
  
  const element = React.createElement(
    PumiloProvider,
    { mode, initialData: data },
    React.createElement(Component)
  );
  
  return renderToStaticMarkup(element);
}

export function wrapHtml(body: string, mode: "edit" | "publish"): string {
  const scripts = mode === "edit" 
    ? `<script type="module" src="/webui/pumilo-editor.js"></script>`
    : "";
    
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pumilo Page</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      margin: 0; 
      padding: 2rem;
    }
    input[data-pumilo-field] {
      font: inherit;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="root">${body}</div>
  ${scripts}
</body>
</html>`;
}

