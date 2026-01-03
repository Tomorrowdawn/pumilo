import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import path from "node:path";
import type { PumiloDataset } from "./types";

export interface RenderTemplateOptions {
  repoPath: string;
  templateName: string;
  mode: "edit" | "publish";
  data: PumiloDataset;
}

export async function renderTemplate(options: RenderTemplateOptions): Promise<string> {
  const { repoPath, templateName, mode, data } = options;
  
  const templatePath = path.join(
    repoPath,
    "pumilo-templates",
    templateName,
    "template.tsx"
  );
  
  try {
    delete require.cache[templatePath];
  } catch {}
  
  const templateModule = await import(templatePath);
  const TemplateComponent = templateModule.default;
  
  if (!TemplateComponent) {
    throw new Error(`Template ${templateName} does not have a default export`);
  }
  
  const { PumiloProvider } = await import("../sdk/context");
  
  const element = React.createElement(
    PumiloProvider,
    { mode, initialData: data },
    React.createElement(TemplateComponent)
  );
  
  return renderToStaticMarkup(element);
}

export function wrapHtml(body: string, mode: "edit" | "publish", styles?: string): string {
  const editorScript = "";
    
  const baseStyles = `
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      margin: 0; 
      padding: 2rem;
      line-height: 1.6;
    }
    input[data-pumilo-field] {
      font: inherit;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-width: 200px;
    }
    input[data-pumilo-field]:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    #pumilo-metadata-toolbar {
      position: sticky;
      top: 0;
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      padding: 1rem;
      margin: -2rem -2rem 2rem -2rem;
      z-index: 1000;
    }
    #pumilo-metadata-toolbar h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pumilo-metadata-field {
      margin-bottom: 0.75rem;
    }
    .pumilo-metadata-field label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }
    .pumilo-metadata-field input {
      width: 100%;
      max-width: 500px;
    }
  `;
    
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pumilo Page</title>
  <style>${baseStyles}${styles || ""}</style>
</head>
<body>
  <div id="root">${body}</div>
  ${editorScript}
</body>
</html>`;
}

