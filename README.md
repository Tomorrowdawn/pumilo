# Pumilo - Quick Start Guide

## Prerequisites

- Bun installed (default location: `~/.bun/bin/bun`)
- Git

## Start Pumilo in 3 Steps

### 1. Start the Backend

**Option A: Use the startup script (recommended)**

```bash
cd /home/tomorrowdawn/project/pumilo
./pumilo-dev.sh
```

**Option B: Use bun directly**

```bash
cd /home/tomorrowdawn/project/pumilo
export PATH="$HOME/.bun/bin:$PATH"
bun run dev:serve
```

**Option C: Set custom bun path**

```bash
export BUN_PATH=/path/to/your/bun/bin
./pumilo-dev.sh
```

This will:
1. Build the web UI (`dist/webui/`)
2. Start the backend server

You should see:
```
Bundled 11 modules in 43ms
🚀 Pumilo backend running on http://localhost:3000
   Editor: http://localhost:3000/editor
   Health: http://localhost:3000/healthz
```

### 2. Open the Editor

Open your browser and navigate to:

```
http://localhost:3000/editor
```

### 3. Create Your First Page

In the editor:

1. **Repo Path**: `/home/tomorrowdawn/project/pumilo-target-example`
2. **Template Name**: `HelloTemplate`
3. **Route**: `/hello-world` (or any route path)
4. Click **"Create/Load Page"**

Now you can:
- Edit the content in the TEXT field
- Click **"Save Changes"** to persist your edits
- Click **"Publish & Preview"** to see the compiled HTML

## What You're Editing

When you create a page, Pumilo:

1. Loads the template from `pumilo-target-example/pumilo-templates/HelloTemplate/template.tsx`
2. Reads the schema from `schema.json` to create default data
3. Renders the template in **edit mode** (TEXT → input field)
4. Saves your data to `.pumilo/data/`

When you publish:

1. Renders the template in **publish mode** (TEXT → HTML span)
2. Generates static HTML
3. Saves to `pumilo-target-example/dist/`
4. Commits changes to git

## Preview Published Pages

After publishing, preview the GitHub Pages branch like it would appear when deployed:

```bash
./pumilo-preview.sh /home/tomorrowdawn/project/pumilo-target-example
```

Custom port:

```bash
./pumilo-preview.sh /home/tomorrowdawn/project/pumilo-target-example 3000
```

Custom branch:

```bash
./pumilo-preview.sh /home/tomorrowdawn/project/pumilo-target-example 8080 gh-pages
```

The script will:
1. Checkout to the specified branch (default: `gh-pages`)
2. Start HTTP server at `http://localhost:8080`
3. Restore your original branch when stopped (Ctrl+C)

## Create Your Own Template

1. Go to the target repo:

```bash
cd /home/tomorrowdawn/project/pumilo-target-example/pumilo-templates
mkdir MyTemplate
cd MyTemplate
```

2. Create `template.tsx`:

```tsx
import type { FC } from "react";
import { TEXT } from "@pumilo/sdk";

const MyTemplate: FC = () => (
  <div>
    <h1><TEXT id="title" placeholder="Enter title" /></h1>
    <p><TEXT id="description" placeholder="Enter description" /></p>
  </div>
);

export default MyTemplate;
```

3. Create `schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "default": "My Title"
    },
    "description": {
      "type": "string",
      "default": "My Description"
    }
  },
  "required": ["title", "description"]
}
```

4. In the editor, use `MyTemplate` as the template name!

## Troubleshooting

### Port 3000 already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### Backend won't start

Check the error in the terminal. Common issues:
- Missing dependencies: `cd pumilo-target-example && bun install` (ensure bun is in PATH)
- Git not initialized: `cd pumilo-target-example && git init`

### Can't see my changes

Make sure to click "Save Changes" before "Publish & Preview"

## Test Everything

Run the automated test:

```bash
/home/tomorrowdawn/project/pumilo/test-e2e.sh
```

All tests should pass with ✅

## Next Steps

- Read `MILESTONE1.md` for complete documentation
- Check `design/milstone1.md` for the original specification
- Explore the code in `src/sdk/`, `src/backend/`, and `src/webui/`

