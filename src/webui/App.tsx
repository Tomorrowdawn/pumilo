import { useState, useCallback, useEffect } from "react";

interface PageInfo {
  route: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
}

interface RepoInfo {
  name: string;
  paths: string[];
  activePath: string;
  lastUsed: string;
}

export const App = () => {
  const [repoName, setRepoName] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [repos, setRepos] = useState<Record<string, RepoInfo>>({});
  const [currentRepo, setCurrentRepo] = useState<{
    name: string;
    path: string;
    localPath: string;
  } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [route, setRoute] = useState("");
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<{ 
    route: string; 
    data: Record<string, string>;
    repoPath: string;
    templateName: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const loadRepos = useCallback(async () => {
    try {
      const response = await fetch("/api/repos");
      const result = await response.json();
      setRepos(result.repos || {});
    } catch (error) {
      setMessage(`Error loading repos: ${error}`);
    }
  }, []);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const loadPages = useCallback(async (repoName: string) => {
    try {
      const response = await fetch(`/api/pages?repoName=${encodeURIComponent(repoName)}`);
      const result = await response.json();
      setPages(result.pages || []);
    } catch (error) {
      setMessage(`Error loading pages: ${error}`);
    }
  }, []);

  const validateRepoPath = useCallback(async () => {
    if (!repoName || !repoPath) {
      setMessage("Please enter both repository name and path");
      return;
    }

    setIsValidating(true);
    setMessage("Validating repository...");
    
    try {
      const response = await fetch("/api/repo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName, repoPath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Validation failed");
      }

      const result = await response.json();
      setCurrentRepo({
        name: result.repoName,
        path: repoPath,
        localPath: result.localPath,
      });
      setMessage(result.message);
      
      await loadTemplates(result.localPath);
      await loadPages(result.repoName);
      await loadRepos();
    } catch (error) {
      setMessage(`Error: ${error}`);
      setCurrentRepo(null);
      setTemplates([]);
      setPages([]);
    } finally {
      setIsValidating(false);
    }
  }, [repoName, repoPath, loadPages]);

  const loadTemplates = useCallback(async (path: string) => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath: path }),
      });
      const result = await response.json();
      setTemplates(result.templates || []);
      if (result.templates && result.templates.length > 0) {
        setTemplateName(result.templates[0]);
      }
    } catch (error) {
      setMessage(`Error loading templates: ${error}`);
      setTemplates([]);
    }
  }, []);

  const createPage = useCallback(async () => {
    if (!route || !currentRepo || !templateName) {
      setMessage("Please validate repository and fill all fields");
      return;
    }

    try {
      setMessage("Creating page...");
      const response = await fetch("/api/pages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: currentRepo.name,
          route, 
          repoPath: currentRepo.localPath, 
          templateName 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create page");
      }

      const result = await response.json();
      setCurrentPage({ route, data: result.data, repoPath: currentRepo.localPath, templateName });
      setPreviewHtml(result.html);
      setMessage("Page created successfully");
      loadPages(currentRepo.name);
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  }, [route, currentRepo, templateName, loadPages]);

  const loadPage = useCallback(async (pageRoute: string, pageTemplateName: string) => {
    if (!currentRepo) {
      setMessage("Please validate repository first");
      return;
    }

    try {
      setMessage("Loading page...");
      const response = await fetch("/api/pages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: currentRepo.name,
          route: pageRoute, 
          repoPath: currentRepo.localPath, 
          templateName: pageTemplateName 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load page");
      }

      const result = await response.json();
      setCurrentPage({ route: pageRoute, data: result.data, repoPath: currentRepo.localPath, templateName: pageTemplateName });
      setPreviewHtml(result.html);
      setRoute(pageRoute);
      setTemplateName(pageTemplateName);
      setMessage("Page loaded");
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  }, [currentRepo]);

  const saveChanges = useCallback(async () => {
    if (!currentPage || !currentRepo) return;

    try {
      setMessage("Saving...");
      await fetch("/api/data/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: currentRepo.name,
          route: currentPage.route, 
          data: currentPage.data 
        }),
      });

      const weaveResponse = await fetch("/api/weave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: currentRepo.name,
          route: currentPage.route, 
          repoPath: currentPage.repoPath,
          data: currentPage.data 
        }),
      });

      if (!weaveResponse.ok) {
        throw new Error("Failed to weave");
      }

      const html = await weaveResponse.text();
      setPreviewHtml(html);
      setMessage("Changes saved successfully");
    } catch (error) {
      setMessage(`Error saving: ${error}`);
    }
  }, [currentPage, currentRepo]);

  const publishPage = useCallback(async () => {
    if (!currentPage || !currentRepo) return;

    try {
      setMessage("Publishing...");
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: currentRepo.name,
          route: currentPage.route, 
          repoPath: currentPage.repoPath 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile");
      }

      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setMessage("Page compiled and opened in new tab");
    } catch (error) {
      setMessage(`Error publishing: ${error}`);
    }
  }, [currentPage, currentRepo]);

  const updateFieldValue = useCallback((fieldId: string, value: string) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      data: { ...currentPage.data, [fieldId]: value }
    });
  }, [currentPage]);

  useEffect(() => {
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.dataset?.pumiloField) {
        updateFieldValue(target.dataset.pumiloField, target.value);
      }
    };

    document.addEventListener('change', handleChange);
    document.addEventListener('input', handleChange);
    
    return () => {
      document.removeEventListener('change', handleChange);
      document.removeEventListener('input', handleChange);
    };
  }, [updateFieldValue]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh",
      fontFamily: "system-ui, sans-serif" 
    }}>
      <header style={{ 
        padding: "1rem 2rem", 
        background: "#1e293b", 
        color: "white",
        borderBottom: "1px solid #334155"
      }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Pumilo Editor</h1>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>
          Milestone 1 - Static Site Generator
        </p>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ 
          width: "350px", 
          background: "#f8fafc", 
          borderRight: "1px solid #e2e8f0",
          overflowY: "auto",
          padding: "1.5rem"
        }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Repository</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#475569" }}>
                  Repo Name
                </label>
                <input 
                  type="text" 
                  list="repo-names"
                  value={repoName} 
                  onChange={(e) => {
                    const name = e.target.value;
                    setRepoName(name);
                    if (repos[name]) {
                      setRepoPath(repos[name].activePath);
                    }
                  }}
                  disabled={isValidating}
                  placeholder="e.g. my-blog"
                  style={{ 
                    width: "100%",
                    padding: "0.5rem", 
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "0.875rem"
                  }}
                />
                <datalist id="repo-names">
                  {Object.keys(repos).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#475569" }}>
                  Repo Path
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    value={repoPath} 
                    onChange={(e) => setRepoPath(e.target.value)}
                    disabled={isValidating}
                    placeholder="/path/to/repo or https://github.com/..."
                    style={{ 
                      flex: 1,
                      padding: "0.5rem", 
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "0.875rem"
                    }}
                  />
                  <button
                    onClick={validateRepoPath}
                    disabled={isValidating}
                    style={{
                      padding: "0.5rem 1rem",
                      background: currentRepo ? "#10b981" : "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isValidating ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      opacity: isValidating ? 0.6 : 1
                    }}
                  >
                    {isValidating ? "..." : currentRepo ? "✓" : "Validate"}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#475569" }}>
                  Template Name
                </label>
                {templates.length > 0 ? (
                  <select 
                    value={templateName} 
                    onChange={(e) => setTemplateName(e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "0.5rem", 
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      background: "white"
                    }}
                  >
                    {templates.map((template) => (
                      <option key={template} value={template}>
                        {template}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ 
                    padding: "0.5rem", 
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                    fontStyle: "italic"
                  }}>
                    No templates found
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#475569" }}>
                  Route
                </label>
                <input 
                  type="text" 
                  value={route} 
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="e.g. /blog/hello-world"
                  style={{ 
                    width: "100%", 
                    padding: "0.5rem", 
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "0.875rem"
                  }}
                />
              </div>
              <button 
                onClick={createPage}
                disabled={!currentRepo}
                style={{ 
                  padding: "0.625rem 1rem", 
                  background: "#3b82f6", 
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: currentRepo ? "pointer" : "not-allowed",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  opacity: currentRepo ? 1 : 0.5
                }}
              >
                Create/Load Page
              </button>
            </div>
          </section>

          {currentRepo && (
            <div style={{ 
              padding: "0.75rem", 
              background: "#f0fdf4", 
              border: "1px solid #86efac",
              borderRadius: "4px",
              fontSize: "0.875rem",
              marginBottom: "2rem"
            }}>
              <div><strong>Current Repo:</strong> {currentRepo.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.25rem" }}>
                {currentRepo.path}
              </div>
            </div>
          )}

          {currentPage && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button 
                  onClick={saveChanges}
                  style={{ 
                    padding: "0.625rem 1rem", 
                    background: "#10b981", 
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={publishPage}
                  style={{ 
                    padding: "0.625rem 1rem", 
                    background: "#8b5cf6", 
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}
                >
                  Publish & Preview
                </button>
              </div>
            </section>
          )}

          {currentPage && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Current Data</h2>
              <pre style={{ 
                background: "white", 
                padding: "1rem", 
                borderRadius: "4px",
                fontSize: "0.75rem",
                overflow: "auto",
                border: "1px solid #e2e8f0"
              }}>
                {JSON.stringify(currentPage.data, null, 2)}
              </pre>
            </section>
          )}

          {pages.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Existing Pages</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {pages.map((page) => (
                  <li 
                    key={page.route}
                    style={{ 
                      padding: "0.75rem", 
                      background: "white", 
                      marginBottom: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem"
                    }}
                  >
                    <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>{page.route}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {page.templateName}
                    </div>
                    <button 
                      onClick={() => loadPage(page.route, page.templateName)}
                      style={{ 
                        marginTop: "0.5rem",
                        padding: "0.375rem 0.75rem",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem"
                      }}
                    >
                      Load
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {message && (
            <div style={{ 
              padding: "1rem", 
              background: "#fef3c7", 
              borderBottom: "1px solid #fde68a",
              fontSize: "0.875rem"
            }}>
              {message}
            </div>
          )}

          {currentPage ? (
            <div style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
              <h2 style={{ marginTop: 0 }}>Editing: {currentPage.route}</h2>
              <div 
                style={{ 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "8px", 
                  padding: "2rem", 
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "#94a3b8"
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No page loaded</p>
                <p style={{ fontSize: "0.875rem" }}>Create or load a page to start editing</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
