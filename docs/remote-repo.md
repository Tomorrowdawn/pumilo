# Remote Repository Support

Pumilo now supports working with remote Git repositories in addition to local paths.

## How It Works

1. **Validation**: Before using a repository, click the "Validate" button next to the repo path input
2. **Remote Detection**: If the path is a Git URL (starts with `http://`, `https://`, or `git@`), Pumilo will:
   - Clone the repository to `~/.cache/pumilo/repos/{repo-name}`
   - Verify that you have push access (using `git push --dry-run`)
   - If the repository already exists locally, it will pull the latest changes
3. **Local Path**: If the path is a local directory, it will be validated directly
4. **Publishing**: When you publish pages, changes will be automatically pushed to the remote repository

## Requirements

For remote repositories to work, you must:
- Have Git installed
- Have proper credentials configured (SSH keys or HTTPS credentials)
- Have both clone AND push permissions to the repository

## Usage

### Using a Remote Repository

1. Enter a Git URL in the "Repo Path" field:
   ```
   https://github.com/username/my-pumilo-site.git
   ```
   or
   ```
   git@github.com:username/my-pumilo-site.git
   ```

2. Click the "Validate" button
3. If successful, the button will show a checkmark (✓)
4. You can now create/load pages and templates will be loaded from the repository

### Using a Local Repository

1. Enter a local path:
   ```
   /home/user/my-pumilo-site
   ```

2. Click the "Validate" button
3. The path will be verified to exist

## Error Handling

If validation fails, an error message will be displayed. Common errors:

- **Clone failed**: Repository doesn't exist or you don't have access
- **Push validation failed**: You can clone but cannot push to the repository
- **Local path doesn't exist**: The specified directory doesn't exist

All errors are displayed directly to the user without any retry logic (fail-fast approach).

## Cache Location

Remote repositories are cached at:
```
~/.cache/pumilo/repos/{repository-name}/
```

This cache is automatically updated (git pull) each time you validate the repository.

