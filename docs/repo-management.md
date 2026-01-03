# Repository Management

Pumilo now supports managing multiple repositories with proper data isolation.

## Core Concept

**RepoName** is a user-defined identifier that maps to one or more repository paths. This allows:
- Multiple repositories to be managed independently
- Pages from different repos to be completely isolated
- Same repo to be accessed from different paths (local + remote)

## Data Structure

### Storage Layout

```
.pumilo/
├── repos.json              # Repository registry
├── {repoName}/
│   ├── pages/
│   │   └── {route}.json   # Page metadata
│   └── data/
│       └── {route}.json   # Page content data
└── ...
```

### repos.json Format

```json
{
  "my-blog": {
    "name": "my-blog",
    "paths": [
      "/home/user/blog",
      "https://github.com/user/blog.git"
    ],
    "activePath": "https://github.com/user/blog.git",
    "lastUsed": "2026-01-03T11:45:10.170Z"
  }
}
```

## API Changes

All page-related APIs now require `repoName` parameter:

### Validate Repository
```bash
POST /api/repo/validate
{
  "repoName": "my-blog",
  "repoPath": "/path/to/repo"
}
```

### List Repositories
```bash
GET /api/repos
```

### List Pages (per repo)
```bash
GET /api/pages?repoName=my-blog
```

### Create/Load Page
```bash
POST /api/pages/create
{
  "repoName": "my-blog",
  "route": "/about",
  "repoPath": "/path/to/repo",
  "templateName": "HelloTemplate"
}
```

### Update Data
```bash
POST /api/data/update
{
  "repoName": "my-blog",
  "route": "/about",
  "data": { "title": "About Us" }
}
```

### Publish
```bash
POST /api/compile
{
  "repoName": "my-blog",
  "route": "/about",
  "repoPath": "/path/to/repo"
}
```

## Frontend Usage

1. **Enter Repo Name**: Type a name or select from existing repos
2. **Enter Repo Path**: Local path or remote URL
3. **Validate**: Click validate button to prepare the repository
4. **Work**: Create/edit pages within that repo context

The UI shows:
- Dropdown suggestions for existing repo names
- Current active repo and path
- Only pages belonging to current repo

## Multi-Path Support

A single RepoName can have multiple paths:

```json
{
  "my-project": {
    "paths": [
      "/home/user/local-dev",
      "https://github.com/user/project.git"
    ],
    "activePath": "https://github.com/user/project.git"
  }
}
```

When you validate with a new path for an existing repo:
- The path is added to the `paths` array (if not already present)
- `activePath` is updated to the newly validated path
- All subsequent operations use the `activePath`

## Data Isolation

Pages are completely isolated by repo:
- `test-repo` with route `/home` → `.pumilo/test-repo/pages/home.json`
- `another-repo` with route `/home` → `.pumilo/another-repo/pages/home.json`

No conflicts, clean separation.

