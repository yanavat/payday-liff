# Deployment Guide

> Stack: Next.js 15 · TypeScript · Tailwind · Vercel

This guide covers deploying the PayDay+ LIFF frontend to Vercel. The app
runs against mock data out of the box, so it deploys with no backend or
secrets required — useful for previews and demos.

---

## Prerequisites

- Node.js 18+ installed locally
- A [Vercel](https://vercel.com) account (the free Hobby plan is sufficient)
- The repository pushed to your own Git remote

---

## Step 1 — Build locally

Verify the project builds before deploying:

```bash
npm install
npm run build
```

---

## Step 2 — Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel

# From the project root
vercel            # creates a preview deployment
vercel --prod     # promotes to production
```

Vercel auto-detects Next.js, so the default build settings work as-is.

### Option B — Vercel Dashboard

1. Go to <https://vercel.com/new>
2. Import your Git repository
3. Leave the build settings at their auto-detected defaults
4. Click **Deploy**

---

## Step 3 — Environment variables

The app runs entirely on mock data when `NEXT_PUBLIC_LIFF_MOCK=true`, so no
variables are required for a demo deployment.

To connect a real LINE LIFF app and backend, set these in
**Vercel → Project → Settings → Environment Variables** (see
[`.env.example`](.env.example) for the full list):

| Variable                    | Description                                   |
| --------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_LIFF_MOCK`     | `false` to use real LINE auth                 |
| `NEXT_PUBLIC_LIFF_ID`       | LIFF App ID from the LINE Developer Console   |
| `NEXT_PUBLIC_LIFF_URL`      | Public URL of the deployed LIFF app           |
| `LINE_CHANNEL_ACCESS_TOKEN` | Channel Access Token (server-side only)       |
| `NEXT_PUBLIC_API_BASE_URL`  | Base URL of the backend API                   |

---

## Step 4 — Test the deployment

Open the deployment URL and check both sides of the app:

**Employee app (mobile, LINE LIFF)** — the LIFF root route. With
`NEXT_PUBLIC_LIFF_MOCK=true` it loads a mock profile, so it can be opened in a
desktop browser at a 390px viewport without a real LINE account.

**HR dashboard (desktop)** — `/<locale>/hr/login` (e.g. `/en/hr/login`).

A quick smoke-test checklist:

- [ ] Employee home balance card renders
- [ ] 3-step request wizard flows end to end
- [ ] History tabs switch correctly
- [ ] Bottom tab bar stays fixed
- [ ] Thai and Myanmar text render with the correct fonts
- [ ] HR dashboard metrics and request list load

---

## LINE LIFF on a real device

To test inside the LINE app, register your deployment URL as the LIFF endpoint
in the [LINE Developer Console](https://developers.line.biz/console/), set
`NEXT_PUBLIC_LIFF_MOCK=false`, and provide a valid `NEXT_PUBLIC_LIFF_ID`.

---

## Custom domain (optional)

1. Vercel → Project → Settings → Domains
2. Add your domain
3. Point a CNAME at `cname.vercel-dns.com` in your DNS provider
