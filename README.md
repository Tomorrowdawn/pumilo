# Pumilo

A lightweight, React-based static site generator that bridges the gap between developer flexibility and content editor simplicity.

## What is Pumilo?

Pumilo lets developers write React templates with editable regions, then provides a visual editor for non-technical users to create and publish static pages. No complex CMS, no database, just pure static HTML published via Git.

**Key Features:**
- 🎨 Write templates in React with full TypeScript support
- ✏️ Visual editor for content editing (no HTML knowledge required)
- 📦 Zero runtime dependencies in published pages
- 🚀 One-command publish to GitHub Pages
- 🔄 Git-based workflow with full version control

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- Git
- A target repository for your templates

### 1. Install Dependencies

```bash
cd ~/project/pumilo
bun install
```

### 2. Start the Backend

```bash
bun run dev:serve
```

This will:
1. Build the web UI
2. Start the backend server on `http://localhost:3000`

You should see:
```
🚀 Pumilo backend running on http://localhost:3000
   Editor: http://localhost:3000/editor
   Health: http://localhost:3000/healthz
```

### 3. Open the Editor

Navigate to: `http://localhost:3000/editor`

### 4. Create Your First Page

In the editor:
1. **Repo Path**: Path to your target repository (e.g., `~/project/my-site`)
2. **Template Name**: Name of the template to use (e.g., `HelloTemplate`)
3. **Route**: URL path for the page (e.g., `/hello-world`)
4. Click **"Create/Load Page"**

Now you can:
- Edit content in the editable fields
- Click **"Save Changes"** to persist your edits
- Click **"Publish & Preview"** to generate static HTML

## Creating Templates

### Template Structure

Templates live in your target repository under `pumilo-templates/`:

```
my-site/
├── pumilo-templates/
│   └── HelloTemplate/
│       ├── template.tsx
│       └── schema.json
└── dist/                    # Published HTML goes here
```

### Example Template

**template.tsx:**

```tsx
import type { FC } from "react";
import { TEXT } from "@pumilo/sdk";

const HelloTemplate: FC = () => (
  <div>
    <h1><TEXT id="title" placeholder="Enter title" /></h1>
    <p><TEXT id="description" placeholder="Enter description" /></p>
  </div>
);

export default HelloTemplate;
```

**schema.json:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "default": "Welcome"
    },
    "description": {
      "type": "string",
      "default": "This is my page"
    }
  },
  "required": ["title", "description"]
}
```

## How It Works

1. **Edit Mode**: `<TEXT>` components render as input fields in the editor
2. **Publish Mode**: Same components render as static HTML
3. **Git-Based Publishing**: Changes are committed to a `gh-pages` branch automatically
4. **No Runtime**: Published pages are pure HTML with zero JavaScript overhead

## Preview Published Pages

Preview the GitHub Pages branch locally:

```bash
./pumilo-preview.sh <target-repo-path> [port] [branch]
```

Example:

```bash
./pumilo-preview.sh ~/project/my-site 8080 gh-pages
```

The script will:
1. Checkout to the specified branch
2. Start an HTTP server
3. Restore your original branch when stopped (Ctrl+C)

## Documentation

- **[Implementation Guide](docs/implementation.md)** - Deep dive into Pumilo's architecture
- **[Repository Management](docs/repo-management.md)** - Managing target repositories
- **[Remote Repository Setup](docs/remote-repo.md)** - Working with remote Git repos

## Development

### Available Scripts

```bash
# Development mode (watch mode)
bun run dev

# Build and serve (for testing)
bun run dev:serve

# Build web UI only
bun run build:webui

# Start production server
bun run start

# Type check
bun run typecheck

# Preview published site
bun run preview
```

### Project Structure

```
pumilo/
├── src/
│   ├── backend/        # Bun server, rendering engine
│   ├── sdk/            # React components for templates
│   └── webui/          # Visual editor interface
├── docs/               # Documentation
├── design/             # Design documents
└── dist/               # Build output
```

## Troubleshooting

### Port 3000 already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### Backend won't start

Common issues:
- Missing dependencies: `bun install`
- Git not initialized in target repo: `cd <target-repo> && git init`

### Can't see my changes

Make sure to click "Save Changes" before "Publish & Preview"

## Requirements

- **Bun**: >=1.0.0
- **Git**: Any recent version
- **Target Repository**: Must be a Git repository

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Pumilo is designed for simplicity and clarity. When contributing:
- Follow the existing code style
- Keep dependencies minimal
- Document architectural decisions
- Write tests for new features

---

Built with [Bun](https://bun.sh/) and [React](https://react.dev/)
