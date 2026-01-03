#!/usr/bin/env bash

set -e

REPO_PATH="${1:-}"
PORT="${2:-8080}"
BRANCH="${3:-gh-pages}"

if [ -z "$REPO_PATH" ]; then
    echo "Usage: $0 <repo-path> [port] [branch]"
    echo ""
    echo "Preview GitHub Pages by checking out a branch and starting HTTP server"
    echo ""
    echo "Arguments:"
    echo "  repo-path  Path to git repository (required)"
    echo "  port       Server port (default: 8080)"
    echo "  branch     Git branch to preview (default: gh-pages)"
    echo ""
    echo "Examples:"
    echo "  $0 /home/tomorrowdawn/project/pumilo-target-example"
    echo "  $0 /home/tomorrowdawn/project/pumilo-target-example 3000"
    echo "  $0 /home/tomorrowdawn/project/pumilo-target-example 3000 gh-pages"
    echo ""
    exit 1
fi

if [ ! -d "$REPO_PATH" ]; then
    echo "Error: directory not found: $REPO_PATH"
    exit 1
fi

if [ ! -d "$REPO_PATH/.git" ]; then
    echo "Error: not a git repository: $REPO_PATH"
    exit 1
fi

cd "$REPO_PATH"

if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    echo "Error: branch '$BRANCH' does not exist"
    echo "Available branches:"
    git branch -a
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)

echo "📦 Switching to branch: $BRANCH"
git checkout "$BRANCH"

echo ""
echo "🌐 Starting preview server..."
echo "   Repository: $REPO_PATH"
echo "   Branch: $BRANCH"
echo "   URL: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop (will restore to $CURRENT_BRANCH)"
echo ""

cleanup() {
    echo ""
    echo "🔄 Restoring to branch: $CURRENT_BRANCH"
    git checkout "$CURRENT_BRANCH" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

python3 -m http.server "$PORT"

