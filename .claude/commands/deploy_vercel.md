Deploy this project to Vercel and report the deployed URL.

Follow these steps in order:

## Step 1 — Check Vercel CLI
Run `vercel --version` to check if Vercel CLI is installed.
If it is not installed, run `npm install -g vercel` to install it globally.

## Step 2 — Build the frontend
Run `npm run build` to produce the production build in the `./build` directory.
If the build fails, stop and report the error.

## Step 3 — Check login status
Run `vercel whoami` to check if the user is already logged in.
If not logged in, tell the user to run `! vercel login` in the prompt to authenticate, then wait for confirmation before continuing.

## Step 4 — Ensure vercel.json exists
If `vercel.json` does not exist in the project root, create it with this content:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite"
}
```

## Step 5 — Deploy to Vercel
Run the following command and capture all output:
```
vercel --prod --yes
```

## Step 6 — Report the URL
Parse the deployment output and extract the production URL (the `.vercel.app` line).
Display it clearly to the user:

---
Deployment complete!
URL: https://your-project.vercel.app
---

## Important notes
- This project has a Node.js/Express backend (`server/index.js`) with SQLite that **cannot run on Vercel**. Only the React frontend will be deployed.
- After deployment, sign-in/sign-up features will not work without a separate backend host.
- Suggest the user deploy the backend separately on Railway, Render, or Fly.io.
