# StudyFlow AI (Vite + React + Firebase + Vercel Functions)

## Project Stack
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Auth/DB: Firebase Auth + Firestore
- AI API: Gemini (server-side via Vercel Function)
- Billing API: Stripe (server-side via Vercel Function)

## Local Development

Prerequisites: Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from `.env.example` and set values.
3. Start frontend dev server:
   ```bash
   npm run dev
   ```

> Note: `/api/*` endpoints are Vercel Functions. For local full-stack parity, use `vercel dev`.

## Build
```bash
npm run build
```

Output directory: `dist`

## Vercel Deployment
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

`vercel.json` includes SPA fallback routing while preserving API/filesystem routes.


## GitHub → Vercel Auto Deploy
This repo now includes a GitHub Actions workflow at `.github/workflows/vercel-deploy.yml` that deploys to **Vercel Production** on every push to the `main` branch.

### One-time GitHub Secrets setup
In **GitHub → Settings → Secrets and variables → Actions**, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

How to get values:
- `VERCEL_TOKEN`: Vercel dashboard → Account Settings → Tokens
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`: run `vercel link` locally once, then copy from `.vercel/project.json`

After this setup, any commit merged/pushed to `main` in GitHub will automatically deploy to your Vercel production site.

## Required Environment Variables
Set these in **Vercel Project Settings → Environment Variables**:

- `GEMINI_API_KEY` (required, server-side AI endpoint)
- `STRIPE_SECRET_KEY` (required if billing is enabled)
- `APP_URL` (recommended, e.g. `https://your-domain.vercel.app`)

Optional:
- `VITE_STRIPE_PUBLISHABLE_KEY` (client-side Stripe usage)

Firebase configuration is currently sourced from `firebase-applet-config.json`.
