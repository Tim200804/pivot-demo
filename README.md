# Pivot — Athlete Resilience Platform (Demo)

Pivot helps college coaches spot struggling athletes before burnout or injury by combining daily wellness check-ins, wearable health trends (HRV, resting heart rate, sleep), and an early-warning alert system that routes the right support to the right athlete. This repository is a fully client-side public demo — no backend, no login required, all data is fictional.

**Live demo: https://tim200804.github.io/pivot-demo/**

## Try it

1. Open the live URL.
2. Pick **Coach** or **Athlete** and press the one-click demo button — you're in instantly.
3. Everything is mock data served in-browser (reset on refresh). No account, no password, no tracking.

## What's inside

- Coach dashboard: team health overview, alert queue (yellow / red / black), athlete detail trends, interventions, roster, substitutions
- Athlete app: daily check-in, biometric trends, alert history, substitution requests
- Substitution workflow: request → teammate accept → coach approve
- In-browser mock backend (`src/config/mockBackend.js`) mimicking the production Flask API shapes

## Tech

React 18 + Vite 5 + Tailwind CSS + Chart.js. Deployed to GitHub Pages via GitHub Actions.

## Redeploy after changes

Push to `main` — the workflow builds and deploys automatically:

```bash
git push origin main
```

To build locally:

```bash
npm ci --legacy-peer-deps
VITE_BASE_PATH=/pivot-demo/ npm run build:mock
cp dist/index.html dist/404.html   # SPA fallback for GitHub Pages
VITE_BASE_PATH=/pivot-demo/ npx vite preview   # check at http://localhost:4173/pivot-demo/
```

> Note: `.env.mock` contains only `VITE_AUTH_MODE=mock` — no secrets, no real user data.
