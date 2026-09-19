# Seasoned

**"Ready before the rush."**

Seasoned is an interactive demo of an AI frontline-readiness app for restaurant groups. Employees practice hard guest situations with a realistic AI guest, managers see who is ready and approve certification, and owners compare every location at a glance.

The demo runs on a fictional customer, **Cameron Coffee Co.** (8 coffee shops across Durham, Chapel Hill and Raleigh, NC, with 60 employees), so it looks like a company that has been using Seasoned for a while.

> This README covers the application only. Everything in the app is sample data.

---

## Try it in 10 seconds (no setup)

**Open the live demo: [scale-startup-jet.vercel.app](https://scale-startup-jet.vercel.app)**

It works in any browser with nothing to install. On the home screen, click **▶ Guided demo** for a 3-minute walkthrough. (Use Chrome or Edge if you want to talk to the AI guest by voice. Typing works everywhere.)

---

## Run it on your own computer

You only need this if you want to run or change the code. Pick the easiest option for you.

### Option 1: Windows, double-click
1. Install [Node.js](https://nodejs.org) (download the **LTS** version and click through the installer).
2. Download this project (green **Code** button on GitHub → **Download ZIP**, then unzip it).
3. Double-click **`start-demo.bat`**. The first run installs what it needs (a minute or two), then your browser opens the demo.

Keep the black window open while you use the demo, and close it to stop.

### Option 2: Any computer, two commands
Needs [Node.js](https://nodejs.org) 20.9 or newer. In a terminal inside the project folder:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in Chrome or Edge. Stop with `Ctrl + C`.

Starting from GitHub instead of a download? Run this first:

```bash
git clone https://github.com/chatcher1107/scale_startup.git
cd scale_startup
```

### Optional: turn on live AI
Skip this to run in mock mode (see below). To use a real AI guest, copy `.env.example` to `.env.local` (`Copy-Item .env.example .env.local` in PowerShell, or `cp .env.example .env.local` on macOS/Linux), paste your key after `OPENAI_API_KEY=`, and restart the app.

**Where to get a key**
- **Duke students and staff:** the Duke community can create an API key through Duke's AI Gateway. Follow [Duke OIT's guide](https://oit.duke.edu/help/articles/kb0038824/): open the **AI Gateway** section of the AI Dashboard, click **Create API key**, and give it a nickname. A Duke fund code is optional. Without one, you get a daily request limit that varies by model, and you can only create one key. With one, requests are billed at cost to that fund code.
- **Everyone else:** create a key at [platform.openai.com](https://platform.openai.com).

Seasoned expects an OpenAI-style chat API. Duke's guide doesn't list the gateway's endpoint or models, so if the AI Dashboard shows a different endpoint URL for your key, also set `OPENAI_BASE_URL` (and `OPENAI_MODEL` to a model your key can use) in `.env.local`. If the AI service ever fails or you hit a daily limit, the app falls back to mock mode instead of breaking.

### No API key? It still works
Without a key, the app runs in **mock mode**: the AI guest gives scripted replies and grading uses keyword matching. Everything else (dashboards, certification, the tour) behaves the same. To check which mode you are in, open **☰ → About this demo**. It says **Live** or **Mock mode**.

### Windows notes
- If `npm` is "not recognized" right after installing Node, close and reopen your terminal (or VS Code entirely).
- If PowerShell says "running scripts is disabled", either run `npm.cmd run dev` instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.

---

## Environment variables

Set these in `.env.local` (local) or in your host's settings (Vercel). See [`.env.example`](.env.example).

| Variable | Required | What it does |
|---|---|---|
| `OPENAI_API_KEY` | For live AI | Key used by the server-side AI routes. It is never sent to the browser. |
| `OPENAI_MODEL` | No | Model name. Default: `gpt-4o-mini`. |
| `OPENAI_BASE_URL` | No | Custom OpenAI-compatible endpoint. Default: `https://api.openai.com/v1`. |

**Restart `npm run dev` after changing `.env.local`.** Never commit `.env.local`. It is already git-ignored.

Duke students can get a key from Duke's AI Gateway (see [Where to get a key](#optional-turn-on-live-ai)).

---

## Take the tour

On the home screen, click **▶ Guided demo**. It resets to fresh sample data, then walks through 14 steps across all three roles: the owner's overview, policy updates, the heatmap, impact, sending training, a manager reviewing grades, tonight's shift, feedback, the policy sheet, and a trainee's progress, tailored practice and certificate.

- Next / Back buttons, or the ← → keys. **Esc** exits.
- **☰ → Feature callouts** turns on small "✦ What's unique" pop-ups across the app. They are off by default.
- **☰ → Reset demo data** restores the starting data at any time.

---

## What's in the app

Choose a role on the home screen. The company is fixed. Managers and trainees also pick a location, and trainees pick who they are.

### Trainee
- **Readiness bar** across the top: 100% means every skill is at 90% or higher *and* the GM has signed off.
- **Skill profile** (radar and bars) across six skills: Allergy & Food Safety, Difficult Guests, Policy & Exceptions, Menu Knowledge, Service Recovery, Composure Under Rush.
- **Practice scenarios** with an AI guest, by voice (Chrome/Edge) or typing, with hints. A standard module and, when a manager left feedback, a **tailored** module built from that note.
- **Results with transcript playback**: every criterion shows pass or fail with the exact line that earned it.
- **Printable certificate** once certified.

### General manager
- **Team overview**: readiness, at-risk teammates, skill gaps vs. the company, and a sortable roster.
- **Certification approvals**: sign off teammates who reach 90% in every skill.
- **Grades to review**: confirm the AI's grade or disagree and recalculate. The AI-and-manager agreement rate is tracked, and corrections are sent back to the grader as examples.
- **Tonight's shift**: each station has minimum skill scores. See who is cleared, swap in a cleared teammate from the bench, or send practice.
- **Reviews & feedback**: guest reviews, manager notes and owner notes, each with **Turn into training**.
- **Policy updates**: when a policy changes, see who hasn't practiced since and send a refresher.

### Owner
- **Company overview**: KPIs, a location-by-skill **heatmap**, leaderboard, trend and top issues.
- **Impact**: links practice to guest complaints, ratings and comp costs (modeled sample data).
- **Send training**: pick a scenario (or describe a new one for the AI to write), choose locations and an audience, and every GM is notified.
- **Notes to GMs** and per-location drill-downs.

### Everyone
- **Menu & policy sheet** (`/menu` is public and read-only). GMs and owners can edit menu items and policies, with a change log. The AI guest, grader and scenario writer read the current sheet, and editing a policy marks the related skill's training as out of date.

---

## How it works

- **Certification rule:** every skill at or above 90%, plus GM sign-off. Readiness is the average of `min(skill ÷ 90, 1)`, so it reaches exactly 100% when the bar is met.
- **Grading:** a criterion passes only for observable actions the employee actually said. In live mode, the model returns pass or fail with a quote. In mock mode, keywords are matched.
- **Station clearance:** Register needs Allergy ≥ 70, Difficult Guests ≥ 60, Policy ≥ 60. Espresso bar needs Menu ≥ 65, Allergy ≥ 70, Composure ≥ 60. Hand-off needs Difficult Guests ≥ 55, Service Recovery ≥ 55. Floater has no minimums.
- **Policy versions:** each policy is tied to a skill. Editing it bumps the sheet version and flags that skill as out of date for anyone who hasn't practiced since.

### AI routes
All AI calls are server-side route handlers that fall back to mock mode if there is no key, an error, or too many requests.

| Route | Purpose |
|---|---|
| `POST /api/ai/guest` | Plays the guest in a practice conversation |
| `POST /api/ai/grade` | Grades a transcript against the scenario's criteria |
| `POST /api/ai/scenario` | Turns a review, note or description into a practice scenario |
| `GET /api/ai/status` | Reports live vs. mock mode |

A per-visitor limit (50 AI requests per 10 minutes, best-effort and in memory) protects the key on a public link. Beyond it, requests quietly switch to mock mode.

### Data and state
There is no database. Sample data is generated in code by a seeded, deterministic function, so everyone sees the same company. Each visitor's changes (approvals, edits, practice) are saved in **their own browser** (`localStorage`, key `seasoned-demo-v10`), so visitors can't affect each other. **Reset demo data** clears them. If you change the seed data, bump the storage key in `lib/store.tsx` so browsers pick up the new data.

---

## Project structure

```
app/
  page.tsx               Home screen: company intro, role and location picker
  menu/                  Public, read-only menu & policy sheet
  (app)/                 Everything behind the role picker (shared layout: sidebar, top bar, ☰ menu)
    owner/ gm/ trainee/  Role pages
    handbook/ session/   Editable sheet, session results
  api/ai/                AI route handlers (guest, grade, scenario, status)
components/              UI: dashboards, charts, certificate, guided tour, callouts, handbook
lib/
  data.ts                Company, locations, employees and the seeded demo data
  scenarios.ts           Skills, certification bar, practice scenarios
  handbook.ts            Menu & policy sheet content and versioning
  shift.ts               Station rules and the sample schedule
  impact.ts              Modeled outcome data for the Impact page
  seedSessions.ts        Sample graded sessions
  stats.ts               Readiness, rankings, policy-version and agreement helpers
  store.tsx              App state, saved to localStorage
  ai.ts                  Server-side AI helper and rate limiting
public/                  Logo and static files
start-demo.bat           Windows double-click launcher
.env.example             Template for the API key file
```

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Charts are hand-drawn SVG, so there are no chart libraries. Fonts: Carlito, and Fraunces for the Seasoned wordmark.

> This version of Next.js has breaking changes from older releases. See [`AGENTS.md`](AGENTS.md) and the docs in `node_modules/next/dist/docs/` before changing framework-level code.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | Run ESLint |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import the repo. Next.js is detected automatically.
3. Under **Environment Variables**, add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`).
4. Click **Deploy**. Vercel gives you a public link, and every push to `main` redeploys.

`.env.local` is not uploaded, so the key must be added in Vercel's settings.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| About says "Mock mode" but you added a key | Check the line is `OPENAI_API_KEY=...` with no quotes or spaces, save, then restart `npm run dev`. |
| AI errors or feels stuck | The key may not allow the model, or it hit a rate limit. Set `OPENAI_MODEL`, or check the key's limits. The app falls back to mock mode automatically. |
| Voice input button is missing | Speech recognition needs Chrome or Edge. Typing always works. |
| Data looks old or wrong after an update | Use **☰ → Reset demo data**, or clear the site's storage in your browser. |
| Port 3000 is busy | Stop the other server, or run `npm run dev -- -p 3001`. |

---

## Notes

- **Fictional company.** Cameron Coffee Co. and everyone in it are made up. The logo is an original design and uses no Duke University marks.
- **Sample data.** Outcomes on the Impact page, the schedule, and the network benchmark are modeled for demonstration. A real deployment would connect a POS, scheduling tool and review feeds.
- **Seasoned logo** is the project's own artwork (`public/seasoned-logo.png`).
