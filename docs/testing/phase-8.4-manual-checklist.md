# Phase 8.4 Manual Testing Checklist

> Use this checklist before pilot rollout. Check off each item as you verify it.
> Prerequisites: a registered LIFF endpoint URL in LINE Developer Console and a deployed Vercel URL.

---

## 1. HTTPS Tunnel / Local Dev (ngrok)

```bash
# Install ngrok and authenticate (one-time)
ngrok config add-authtoken <your-token>

# Expose the Next.js dev server
ngrok http 3000
```

1. Copy the `https://xxxx.ngrok-free.app` forwarding URL.
2. In LINE Developer Console → your LIFF app → **Endpoint URL** → paste the ngrok URL.
3. Set `NEXT_PUBLIC_LIFF_ID` and `NEXT_PUBLIC_LIFF_MOCK=false` in `.env.local`.
4. Run `pnpm dev` and open the ngrok URL inside LINE on your phone.

| | Check |
|---|---|
| `liff.init()` completes without error | `[ ]` |
| LINE login flow completes | `[ ]` |
| Employee ID linking form appears for new users | `[ ]` |
| App loads home screen after linking | `[ ]` |

---

## 2. External Browser Flow

Open `https://liff.line.me/<LIFF_ID>` in a normal browser (Safari / Chrome) — **not LINE**.

| | Check |
|---|---|
| "Open in LINE" screen appears (not a blank page or error) | `[ ]` |
| Button links to `https://liff.line.me/<LIFF_ID>` | `[ ]` |
| Opening the link from LINE redirects to the correct LIFF screen | `[ ]` |

---

## 3. Inside LINE — iOS

Device: iPhone with LINE app installed.

| | Check |
|---|---|
| Open app via rich menu or LIFF URL — loads within 3 seconds | `[ ]` |
| `liff.isInClient()` returns `true` (no "Open in LINE" banner) | `[ ]` |
| Viewport fits screen — no horizontal scroll | `[ ]` |
| Home indicator (bottom bar) is not obscured by tab bar | `[ ]` |
| Notch / Dynamic Island area shows correctly | `[ ]` |
| Request flow: amount → confirm → success | `[ ]` |
| Share Receipt button appears and triggers `liff.shareTargetPicker()` | `[ ]` |
| History loads and deep-link `?page=history&id=EWA-001` works | `[ ]` |
| Profile shows LINE display name and picture | `[ ]` |
| Unlink account flow works | `[ ]` |

---

## 4. Inside LINE — Android

Device: Android phone with LINE app installed.

| | Check |
|---|---|
| App loads within 3 seconds | `[ ]` |
| Navigation gestures don't conflict with tab bar | `[ ]` |
| Keyboard pushes content up without covering inputs | `[ ]` |
| Share Receipt flow completes | `[ ]` |
| All four tabs navigate correctly | `[ ]` |

---

## 5. `liff.isInClient()` and Viewport Checks

Run in LINE DevTools (shake device or use remote debug via LINE PC):

```js
// In LINE's JavaScript console
liff.isInClient()          // → true inside LINE
liff.getOS()               // → 'ios' or 'android'
liff.getAppLanguage()      // → 'th', 'en', or user locale
window.innerHeight         // should match visual viewport
```

| | Check |
|---|---|
| `liff.isInClient()` returns `true` | `[ ]` |
| `env(safe-area-inset-bottom)` resolves > 0 on notch devices | `[ ]` |
| Tab bar doesn't overlap home indicator on iPhone | `[ ]` |
| Main content scrolls without being cut off by tab bar | `[ ]` |
| `viewport-fit=cover` set in `<head>` (check via DevTools) | `[ ]` |
| `user-scalable=no` prevents pinch zoom (LIFF standard) | `[ ]` |

---

## 6. Language Testing

Switch LINE app language to each locale before testing.

### Thai (th)
| | Check |
|---|---|
| All screens render in Thai | `[ ]` |
| Thai font (Noto Sans Thai) loads — no tofu/boxes | `[ ]` |
| Line height is correct (taller than Latin) | `[ ]` |
| Date format uses Buddhist calendar (BE year) where applicable | `[ ]` |

### English (en)
| | Check |
|---|---|
| All screens render in English | `[ ]` |
| No untranslated keys (no raw key strings like `liff.loading`) | `[ ]` |

### Myanmar (my)
| | Check |
|---|---|
| All screens render in Myanmar (Burmese script) | `[ ]` |
| Myanmar font renders correctly — no tofu | `[ ]` |
| No untranslated keys | `[ ]` |

---

## 7. Push Notification Delivery

These require a real LINE channel with Messaging API and a valid channel access token.

**Setup:** Ensure `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET` are set in Vercel env vars.

### Test each notification type (trigger from HR dashboard):

| Notification | Trigger action | Expected delivery | Received |
|---|---|---|---|
| Request approved | HR approves a request | Flex Message with green checkmark | `[ ]` |
| Request rejected | HR rejects a request | Flex Message with rejection reason | `[ ]` |
| Disbursement complete | HR marks as disbursed | Flex Message with amount and date | `[ ]` |
| Payday reminder | Cron / manual trigger | Reminder message with payday date | `[ ]` |
| Cutoff warning | Cron / manual trigger | Warning with hours remaining | `[ ]` |

**Verify for each:**
- Message received within 10 seconds
- Flex Message renders correctly (not raw JSON)
- Deep-link button opens the correct LIFF screen

---

## 8. Performance Audit

Target: initial LIFF load under **3 seconds** on a mid-range Android on 4G.

```bash
# Build and start production server
pnpm build && pnpm start

# Open in LINE and measure via DevTools remote debug
# Or use Lighthouse Mobile in Chrome DevTools on the ngrok URL
```

| Metric | Target | Measured |
|---|---|---|
| First Contentful Paint | < 1.5s | |
| Time to Interactive | < 3.0s | |
| Total JS bundle (LIFF entry) | < 250 KB gzipped | |
| LIFF SDK lazy-load (not in initial chunk) | confirmed | |
| `canvas-confetti` lazy-load (not in initial chunk) | confirmed | |

**Lighthouse command:**
```bash
npx lighthouse https://<ngrok-url> \
  --preset=perf \
  --form-factor=mobile \
  --throttling-method=simulate \
  --output=html --output-path=./docs/testing/lighthouse-report.html
```

---

## 9. Pilot Rollout

1. **Select department** — recommend HR or Finance (already familiar with system)
2. **Notify participants** — share LIFF URL or add to LINE rich menu for that group
3. **Monitor** — check Vercel logs and LINE webhook logs for errors during pilot week
4. **Collect feedback** — use a simple LINE survey or Google Form linked from the profile screen
5. **Backlog** — capture feedback as GitHub issues with label `pilot-feedback`

| | Check |
|---|---|
| Rich menu published for pilot group | `[ ]` |
| Vercel error alerts configured | `[ ]` |
| Feedback form link ready | `[ ]` |
| Pilot start date confirmed | `[ ]` |
| One-week check-in scheduled | `[ ]` |
