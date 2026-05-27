Deploy this project to GitHub. Follow these steps carefully:

## Step 1 — Check prerequisites

Run these checks in sequence:
- `git --version` — confirm git is installed
- `gh --version` — check if GitHub CLI is available
- `git status` — check if this is already a git repo (look for "fatal: not a git repository" to know it is NOT)
- If git repo exists: `git remote -v` — check if a remote named `origin` already exists

## Step 2 — Initialize git (if needed)

If this is NOT already a git repository:
1. `git init`
2. Create a `.gitignore` if one doesn't exist — include at minimum: `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `*.env`
3. `git add .`
4. `git commit -m "Initial commit"`

If a git repo already exists with uncommitted changes, stage and commit them:
1. `git add .`
2. `git commit -m "Deploy: update project files"`

## Step 3 — Create GitHub repository (if no remote exists)

### If `gh` CLI is available:
Run: `gh repo create <repo-name> --public --source=. --remote=origin --push`
- Use the current directory name as `<repo-name>` (convert spaces/underscores to hyphens, lowercase)
- If the repo already exists on GitHub, use `--push` only after adding the remote manually

### If `gh` CLI is NOT available:
Tell the user:
> GitHub CLI (`gh`) is not installed. Please either:
> 1. Install it from https://cli.github.com and run `/deploy_github` again, OR
> 2. Manually create a repo at https://github.com/new, then run:
>    ```
>    git remote add origin https://github.com/<your-username>/<repo-name>.git
>    git branch -M main
>    git push -u origin main
>    ```
> After adding the remote, run `/deploy_github` again to complete the deployment.

Then STOP — do not proceed until the user confirms a remote has been added.

## Step 4 — Push to GitHub

If a remote `origin` already exists (confirmed in Step 1):
1. `git branch -M main` — ensure branch is named `main`
2. `git push -u origin main` — push and set upstream

If push fails due to diverged history (remote already has commits), ask the user whether to:
- `git pull --rebase origin main` then push, OR
- Force push with `git push --force-with-lease origin main` (warn that this overwrites remote history)

## Step 5 — Confirm and report

After a successful push:
- Run `git remote get-url origin` to get the repo URL
- Report the GitHub repository URL to the user
- Show the branch name and latest commit hash (`git log --oneline -1`)

## Step 6 — Configure Vite base path for GitHub Pages

GitHub Pages serves the site under `https://<username>.github.io/<repo-name>/`, so Vite's `base` must match the repo name. Skip this step if a custom domain is being used.

1. Get the repo name from the remote URL:
   ```
   git remote get-url origin
   ```
   Extract `<repo-name>` from the URL (the last path segment, without `.git`).

2. Open `vite.config.ts` and add `base: '/<repo-name>/'` inside `defineConfig`:
   ```ts
   export default defineConfig({
     base: '/claude-code-treasure-game/',  // replace with actual repo name
     // ...rest of config unchanged
   })
   ```

3. Stage and commit the change:
   ```
   git add vite.config.ts
   git commit -m "chore: set Vite base path for GitHub Pages"
   git push origin main
   ```

## Step 7 — Choose deployment method

Ask the user:
> Which deployment method do you prefer?
> **A) GitHub Actions** — automated CI/CD: rebuilds and deploys whenever you push to a chosen branch (recommended)
> **B) Manual gh-pages** — build locally and push the `build/` folder to the `gh-pages` branch on demand

Then follow the matching section below.

---

### Option A — GitHub Actions (automated)

Ask the user: **Which branch should trigger the deployment?** (common choices: `main`, `develop`, or a release branch)

1. Create the workflow file:
   ```
   mkdir -p .github/workflows
   ```
   Write `.github/workflows/deploy.yml` with this content (replace `main` with the user's chosen branch):

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches:
         - main   # ← change to the user's chosen branch

   permissions:
     contents: write

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Deploy to gh-pages branch
           uses: peaceiris/actions-gh-pages@v4
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./build
   ```

2. Commit and push the workflow:
   ```
   git add .github/workflows/deploy.yml
   git commit -m "ci: add GitHub Pages deploy workflow"
   git push origin main
   ```

3. Enable GitHub Pages in the repo settings:
   - If `gh` CLI is available:
     ```
     gh api repos/{owner}/{repo} --method PATCH -f has_pages=true
     gh api repos/{owner}/{repo}/pages --method POST -f source[branch]=gh-pages -f source[path]=/
     ```
   - Otherwise, tell the user:
     > Go to **Settings → Pages** in your GitHub repo, set **Source** to `Deploy from a branch`, choose branch `gh-pages`, folder `/`, and click Save.

4. Verify: after the push, run `gh run list --limit 5` (if available) to confirm the Actions workflow triggered. The site will be live at `https://<username>.github.io/<repo-name>/` once the run completes.

---

### Option B — Manual gh-pages package

Ask the user: **Which branch's build output should be deployed?** (this is the source branch you want to build from, e.g. `main` or `develop`)

1. Switch to the chosen branch:
   ```
   git checkout <chosen-branch>
   ```

2. Install the `gh-pages` package if not already present:
   ```
   npm install --save-dev gh-pages
   ```

3. Add a deploy script to `package.json`. Open the file and add inside `"scripts"`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```

4. Commit the changes:
   ```
   git add package.json
   git commit -m "chore: add gh-pages deploy script"
   git push origin <chosen-branch>
   ```

5. Run the deploy:
   ```
   npm run deploy
   ```
   This builds the project and pushes the `build/` folder to the `gh-pages` branch automatically.

6. Enable GitHub Pages in the repo settings:
   - Same as Option A step 3 above.

7. Report the live URL: `https://<username>.github.io/<repo-name>/`

---

## Step 8 — Final report

After deployment completes, report to the user:
- GitHub repo URL: `https://github.com/<username>/<repo-name>`
- GitHub Pages URL: `https://<username>.github.io/<repo-name>/`
- Deployment method used (Actions or gh-pages)
- Source branch that triggers deploys (Option A) or was built (Option B)

## Important rules

- NEVER commit `.env` files or any file containing secrets
- NEVER force-push without explicit user confirmation
- If `gh` auth is required but not set up, instruct: `! gh auth login`
- Always show the user the final GitHub URL on success
- The `build/` directory must be listed in `.gitignore` — the gh-pages package handles publishing it separately; do NOT commit the build output to the source branch
