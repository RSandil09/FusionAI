# CI & Deployment Setup

## How CI Works (No Secrets Needed)

The GitHub Actions workflow uses **dummy/placeholder** environment variables for the build. This allows CI to pass (lint, format, test, build) without storing real credentials in the repo.

Required for CI: nothing — the workflow provides placeholders automatically.

## Deploying with Real Credentials

When deploying (e.g. Vercel, Railway, or a self-hosted server), add your real environment variables:

### Option 1: Vercel / Hosting Dashboard

Add each variable from `.env.example` in your hosting provider's dashboard (Settings → Environment Variables).

### Option 2: GitHub Secrets (for GitHub Actions deploy)

If you add a deploy step to CI that pushes to a hosting provider:

1. Go to **Repo → Settings → Secrets and variables → Actions**
2. Add each secret (e.g. `FIREBASE_SERVICE_ACCOUNT`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
3. Reference in workflow: `${{ secrets.FIREBASE_SERVICE_ACCOUNT }}`

### Required Variables (see `.env.example`)

| Variable | Used for |
|---------|----------|
| `FIREBASE_PROJECT_ID` | Auth |
| `FIREBASE_SERVICE_ACCOUNT` | Auth (JSON string) |
| `NEXT_PUBLIC_FIREBASE_*` | Client-side Firebase config |
| `NEXT_PUBLIC_SUPABASE_URL` | Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access |
| `R2_*` | File storage |
| `COMBO_SK` | Render & transcribe API |

Optional: `GEMINI_API_KEY`, `PEXELS_API_KEY`, `GIPHY_API_KEY` (features degrade if missing).
