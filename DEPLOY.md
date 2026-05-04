# EWA System — MVP Deployment Guide

> Stack: Next.js 15 · TypeScript · Tailwind · Vercel  
> Repo: https://github.com/yanavat/paydayplus_poc  
> Last updated: May 2026

---

## Prerequisites

- GitHub account with access to `yanavat/paydayplus_poc`
- Vercel account (free Hobby plan is fine for demo)
- Node.js 18+ installed locally

---

## Step 1 — Commit & Push to GitHub

Open a terminal in the project folder and run:

```bash
# Stage the new deployment files
git add .env.example vercel.json

# Commit
git commit -m "feat<deploy>: add vercel.json and .env.example for MVP"

# Push to GitHub
git push paydayplus_poc master
```

---

## Step 2 — Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm i -g vercel

# From the project folder, deploy
vercel

# Follow the prompts:
#   Set up and deploy? → Y
#   Which scope? → select your account
#   Link to existing project? → N (first time)
#   Project name? → wow-payday-plus  (or any name)
#   In which directory is your code? → ./  (press Enter)
#
# First deploy goes to a preview URL.
# To deploy to production:
vercel --prod
```

### Option B — Vercel Dashboard (no CLI)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `yanavat/paydayplus_poc`
4. Leave all build settings as-is (auto-detected as Next.js)
5. Click **Deploy**

---

## Step 3 — Environment Variables

The MVP uses only mock data — no environment variables are required for the demo.

When you're ready to add a real backend, add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required for | Example |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute URLs in emails | `https://your-project.vercel.app` |
| `JWT_SECRET` | Auth (post-MVP) | 64-char random string |
| `DATABASE_URL` | DB (post-MVP) | `postgresql://...` |
| `LINE_NOTIFY_TOKEN` | LINE alerts (post-MVP) | from LINE Notify console |

---

## Step 4 — Test on Mobile

Once deployed, open the Vercel preview URL on your phone:

### Employee side (mobile 390px)
```
https://your-project.vercel.app/employee/login
```
- PIN: `1234` (mock)
- Employee ID: any from the list (e.g. `EMP001`)

### HR side (desktop)
```
https://your-project.vercel.app/hr/login
```
- Email: `hr@company.com` (mock)
- Password: `password` (mock)

### Quick mobile test checklist
- [ ] Login PIN pad is usable with thumbs
- [ ] Home balance card renders correctly
- [ ] 3-step request wizard flows end-to-end
- [ ] History accordion taps correctly
- [ ] Bottom tab bar stays fixed at bottom
- [ ] Thai text renders correctly (Sarabun font loads)

---

## Step 5 — Share Demo Link

Once Vercel assigns a production URL, share it with the HR team:

```
Subject: EWA System Demo — ขอความเห็น

สวัสดีครับ/ค่ะ

ขอนำเสนอระบบ EWA (Earned Wage Access) รุ่นทดลองใช้งานครับ

🔗 HR Dashboard (เปิดบน desktop):
   https://your-project.vercel.app/hr/login
   Email: hr@company.com | Password: password

📱 Employee App (เปิดบนมือถือ):
   https://your-project.vercel.app/employee/login
   รหัสพนักงาน: EMP001 | PIN: 1234

ยินดีรับฟังความคิดเห็นทุกด้านครับ 🙏
```

---

## Step 6 — Collect Feedback → Backlog

After sharing, log feedback in GitHub Issues:

```bash
# Example: open issues directly from CLI
gh issue create --title "Feedback: [ชื่อเรื่อง]" --body "..."
```

Or paste feedback into the **Backlog** section of `task.md`.

---

## Build Verification

| Check | Status |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint` | ✅ 0 warnings |
| `next build` (Vercel x64) | ✅ Expected to pass |
| `next build` (local arm64 sandbox) | ⚠️ @parcel/watcher sandbox-only issue — not a Vercel concern |

---

## Domains (Optional)

To add a custom domain:
1. Vercel → Project → Settings → Domains
2. Add your domain (e.g. `ewa.yourcompany.com`)
3. Point a CNAME at `cname.vercel-dns.com` in your DNS provider
