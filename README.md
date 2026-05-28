# WDW Wait Times

A mobile-first PWA that lists Walt Disney World attractions with live wait times,
plus a star button for attractions you want to ride and a "visited" toggle that
strikes through ones you've already done. All preferences are saved in your
browser — no account needed.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- `vite-plugin-pwa` for installable PWA support
- [queue-times.com](https://queue-times.com) public API for live wait times

## Develop

```bash
npm install
npm run dev    # http://localhost:5173 (also exposed on your LAN)
```

Open it on your phone via the network URL Vite prints, then "Add to Home
Screen" — it'll launch full-screen as if it were a native app.

## Build

```bash
npm run typecheck
npm run build
npm run preview
```

`dist/` is a static bundle deployable to any static host (Vercel, Netlify,
Cloudflare Pages, GitHub Pages).

## Parks covered

Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom — switch between
them with the pill tabs at the top.

## Data storage

- `wdw:starred` — JSON array of starred ride IDs
- `wdw:visited` — JSON array of visited ride IDs
- `wdw:lastPark` — last viewed park ID

Clear them via the browser's site settings to reset.
