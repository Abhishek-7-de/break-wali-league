# 🏏 Break Wali League — AI Context & Project Status

> **For AI assistant resuming this project:** Read this entire file before making any changes.  
> This documents everything done so far, the current state, what still needs to be done, and important decisions made.

---

## 🗂️ Project Overview

- **App name:** Break Wali League / Chai Break Cricket League  
- **Live URL:** Deployed on Vercel (check vercel dashboard for current URL)  
- **GitHub repo:** `https://github.com/Abhishek-7-de/break-wali-league`  
- **Local path:** `c:\Users\Hp\Desktop\chai-break-cricket-league`  
- **Firebase project:** `break-wali-league-5c94b`  
- **Google Sheet backend:** Google Apps Script (deployed as web app, URL in the GAS project)

### What the app does
A cricket fantasy game tied to IPL matches. Users:
1. Log in with phone + Firebase OTP
2. Choose to BAT or BOWL
3. Play 1 over (6 balls) — score based on random ball outcomes
4. Get 12-hour cooldown before next over
5. Compete on live leaderboard
6. During IPL match hours (7–11:30 PM) scores get 2× Boost

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `index.html` | Main app HTML |
| `js/app.firebase-ready.js` | Main app logic — game loop, UI, state management |
| `js/firebase-service.js` | All Firebase/Firestore interactions |
| `js/auth.firebase-ready.js` | Auth flow — OTP send/verify |
| `js/config.js` | All config constants — users, boost times, IPL matches |
| `google-apps-script-backend.js` | Google Apps Script backend for the Google Sheet logging |
| `admin.html` | Admin panel (exists, can be expanded) |
| `audit-tool.html` | Browser-based audit tool (NEW — see below) |
| `billing_list.csv` | ~1,112 valid phone numbers from actual billing system |
| `current_game_data.csv` | Full history of game plays exported from Google Sheet |

---

## ⚠️ History & Context (IMPORTANT)

### Phase 1 — Demo OTP (BAD era)
- Before Firebase was integrated, the app used a **built-in demo OTP** where any phone number could log in without real verification
- This allowed ghost/test accounts to join
- **Any user from this phase that is NOT in `billing_list.csv` is considered invalid**

### Phase 2 — Firebase OTP (GOOD era)
- Firebase Phone Auth was integrated — real SMS OTP required
- Only billing-list users can realistically verify
- All plays from this phase onward are considered legitimate

### Phase 3 — Cooldown Hack
- People discovered that logging out and logging back in **reset the cooldown timer** (it was client-side only)
- Some users played 10–20+ overs in one day instead of 1
- These inflated scores are still in Firestore and need to be reset

---

## 🐛 Bugs Found & Status

### Bug 1 — Fake Users in Firestore ✅ Tool built, ⏳ Reset pending
- Phones not in `billing_list.csv` are in Firestore from the demo OTP era
- **Fix:** `audit-tool.html` identifies them and generates a Firestore script to zero them out
- **Status:** Code tool ready, Firestore data NOT yet reset manually

### Bug 2 — 116,000+ Fake Points ✅ FIXED in code
- `simulateRivalsTick()` in `app.firebase-ready.js` was adding random points (1–6 pts) to ALL users every 9 seconds
- This ran in the browser — so anyone who had the app open for hours accumulated fake points
- **Fix:** `simulateRivalsTick()` now **only runs on demo users `u1`, `u2`, `u3`** — real players are never modified by it
- Real player scores come only from Firestore
- **Status:** ✅ Fixed and pushed to GitHub

### Bug 3 — Cooldown Bypass ✅ FIXED in code
- Cooldown was client-side only — logging out and back in reset it
- **Fix:** `firebase-service.js` now checks `lastOverTime` in Firestore BEFORE saving any result
- If < 12 hours since last over, throws `COOLDOWN:Xms:message` error
- Client catches this, shows toast `⏳ Come back in Xh Ym`, does NOT save points
- **Status:** ✅ Fixed and pushed to GitHub. Old abused scores still in Firestore (pending reset)

### Bug 4 — Double Entries in Google Sheet ✅ FIXED in code
- Every ball click (6 per over) was logging a new row → 6 rows per player per over
- REGISTER event also logged a row → first 2 rows for each player were duplicates
- **Fix:** `google-apps-script-backend.js` now has early return: if `overComplete !== true` and mode is not REGISTER/sync, the row is silently skipped
- **Status:** ✅ Fixed locally. ⏳ Needs redeployment in Google Apps Script (see Section below)

### Bug 5 — Leaderboard Capped at 25 ✅ FIXED
- Hard-coded `limit(25)` in Firestore query
- **Fix:** Changed to `limit(500)` and added real-time `onSnapshot` listener
- **Status:** ✅ Fixed and pushed

### Bug 6 — No Real-Time Leaderboard ✅ FIXED
- Had to refresh page to see new scores
- **Fix:** `listenLeaderboard()` function uses Firestore `onSnapshot` — auto-updates UI whenever any score changes in the database
- **Status:** ✅ Fixed and pushed

### Bug 7 — No Cooldown Timer UI ✅ FIXED
- Players didn't know how long to wait — buttons showed as active even during cooldown
- **Fix:** `updateProfile()` now checks `lastOverTime` and displays `⏳ Xh Ym` on Bat/Bowl buttons, disables them
- Refreshes every 60 seconds
- **Status:** ✅ Fixed and pushed

### Bug 8 — IPL Schedule Missing ✅ FIXED
- No fixture data in config
- **Fix:** Added `iplMatches` array to `config.js` with Match 36–70 (Apr 25 – May 24, 2026)
- **Status:** ✅ Fixed and pushed

---

## 🔧 What STILL Needs To Be Done

### PRIORITY 1 — Reset Firestore Data (Manual — CRITICAL)
The code is fixed but the bad historical data is still in Firestore. Steps:
1. Open `audit-tool.html` in Chrome
2. Upload `billing_list.csv` (column of phone numbers, no header needed)
3. Upload `current_game_data.csv` (exported game history from Google Sheet)
4. Click **Run Audit** — review fake users and cheaters
5. Click **Generate Script** — copy the Firestore reset script
6. Go to `console.firebase.google.com` → Project → Firestore
7. Press F12 → Console tab → Paste the script → Press Enter
8. The script will:
   - Set fair points for all billing-list users (based on valid overs only)
   - Zero out all fake/billing-invalid users
   - Clear `lastOverTime` so everyone starts with a fresh cooldown from 0

### PRIORITY 2 — Redeploy Google Apps Script (Manual)
1. Go to `script.google.com` → Open the BWL project
2. Replace entire code with contents of `google-apps-script-backend.js` 
3. Deploy → Manage Deployments → Edit → New Version → Deploy
4. Future game plays will only log 1 row per over

### PRIORITY 3 — Show IPL Schedule in App UI (Code work)
`config.js` now has `iplMatches` array but the app UI doesn't display the upcoming fixtures yet.
Need to add a "Fixtures" section or update the match banner to auto-detect today's match.

### PRIORITY 4 — Admin Panel Enhancement (Optional)
`admin.html` exists but is basic. Could add:
- Button to view all players with their status (valid/fake)
- Button to trigger Firestore resets from within the app

---

## 💾 Data Files Reference

### `billing_list.csv`
- ~1,112 rows
- One 10-digit phone number per line, no header
- These are the ONLY valid users

### `current_game_data.csv`
- 7,301 rows (as of April 30, 2026)
- Headers: `Timestamp, Date, Time, Phone, Name, Nick, Mode, Outcome, Points, Boost, TotalPoints, Runs, Wickets, Sixes, BallsPlayed, OverComplete, OverRuns, OverWickets, OverPoints`
- Valid game rows have `OverComplete = YES`
- REGISTER rows are login events (not game plays)
- Per-ball rows (no OverComplete) are old format noise

---

## 🎯 Fair Points Logic (for Audit Tool)

A player's **fair total points** = sum of `OverPoints` for all `Over Complete = YES` rows where each consecutive over is at least 12 hours after the previous one for that phone number.

**Max possible legitimate score:**
- 1 over per 12h × 6 balls × max 6 per ball = 36 pts (no boost)
- With 2× boost window: 72 pts per over
- Over 7 days: max ~252–504 pts

Anyone with > 1000 pts has definitely abused the system.

---

## 🏗️ Architecture Notes

### State Management
- `state` object in `app.firebase-ready.js` holds current user, all users, current screen
- `storage.save(state)` persists to `localStorage`
- Firestore is source of truth — `listenLeaderboard()` overwrites local state with Firestore data

### Cooldown Flow
```
User clicks Bat/Bowl
    → app.firebase-ready.js: finishPlay()
        → firebase-service.js: saveGameResult()
            → Firestore: read user.lastOverTime
            → If < 12h: throw COOLDOWN error
            → If ≥ 12h: save result + set lastOverTime = Date.now()
        ← Returns COOLDOWN error or saved result
    → If COOLDOWN: toast + return (no points saved)
    → If success: update local state + refresh UI
```

### Real-Time Leaderboard Flow
```
App boots
    → listenLeaderboard() starts onSnapshot listener
        → Firestore sends all users ordered by totalPoints
            → For each player: update state.users or add new entry
            → Call updateBoards() + updateProfile()
            → UI re-renders leaderboard
```

---

## 📝 Developer Notes

- The app uses Firebase ES module imports via CDN (no bundler) — keep import URLs consistent
- `hasFirebase()` check in auth — some paths fall back to local-only mode
- Demo users `u1`, `u2`, `u3` in `config.js` are seeded as fake rivals — they should NOT appear in the real leaderboard (filtered by ID)
- `simulateRivalsTick()` is intentionally kept but restricted to demo users only — it's the "animation" that makes the leaderboard feel alive even when no one is playing
- The Google Apps Script backend URL is embedded in the app — if redeployed, the URL changes and must be updated in the frontend

---

*This file was last updated: April 30, 2026 at 7:43 PM IST*
