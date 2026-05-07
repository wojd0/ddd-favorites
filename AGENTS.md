# Agent Context — ddd-favorites

## Project

A static mirror of the DDD Milano schedule (https://milano.ddd.live/schedule/) with a favorites feature, deployable to GitHub Pages.

**Location:** `/Users/wduda-air/d/ddd-favorites/`

## Structure

```
ddd-favorites/
├── package.json                  # scripts: fetch, dev, build, preview
├── vite.config.js                # root: public/, base: VITE_BASE env var (default './')
├── .gitignore                    # ignores node_modules/, dist/, public/index.html
├── README.md
├── scripts/
│   └── fetch-schedule.js        # fetches https://milano.ddd.live/schedule/, rewrites
│                                 # relative asset URLs to absolute, injects <base> tag,
│                                 # injects <script type="module" src="/src/favorites.js">
│                                 # writes result to public/index.html
├── src/
│   └── favorites.js             # favorites feature: star buttons on session cards,
│                                 # "★ Favorites" tab next to Thu/Fri/Sat tabs,
│                                 # localStorage persistence (key: ddd_milano_favorites),
│                                 # MutationObserver for lazy-rendered sessions
└── .github/
    └── workflows/
        └── deploy.yml           # triggers: push to main, daily cron 06:00 UTC, manual
                                  # runs npm ci → npm run build → peaceiris/actions-gh-pages
                                  # publishes ddd-favorites/dist to gh-pages branch
```

## How the build works

1. `npm run fetch` → `scripts/fetch-schedule.js` fetches the live HTML, rewrites all
   relative URLs to absolute `https://milano.ddd.live/...` ones, injects a `<base>` tag
   and the favorites script reference, writes to `public/index.html`.
2. `npx vite build` → Vite treats `public/` as root, bundles `src/favorites.js` into
   `dist/assets/index-*.js`, outputs final `dist/index.html`.
3. `npm run build` = steps 1 + 2 combined.

## Key implementation details

- `vite.config.js`: `root: 'public'`, `build.outDir` is absolute path to `../dist`
- `base` is read from `VITE_BASE` env var (default `'./'`). GH Pages workflow sets it
  to `/ddd-favorites/` — must match repo name.
- `server.fs.allow` includes the project root so Vite dev server can resolve `/src/`.
- The fetch script injects `<base href="https://milano.ddd.live/">` so any URLs not
  caught by the rewriter still resolve correctly against the original domain.
- `src/favorites.js` uses a MutationObserver to inject star buttons into sessions
  rendered lazily when the user switches day tabs.
- localStorage key: `ddd_milano_favorites` — array of string IDs.
- Session ID format: `{date}__{start-time}__{title}` (e.g. `2026-05-07__12:40__Itay Schiff`)

## GitHub Pages setup instructions

1. Push repo to GitHub (repo name should match `VITE_BASE` in deploy.yml, default: `ddd-favorites`)
2. Settings → Pages → Source: `gh-pages` branch
3. URL will be `https://<user>.github.io/ddd-favorites/`
4. For a custom domain: set `VITE_BASE: /` in deploy.yml and configure the domain in Pages settings

## Dependencies

- `vite` ^5.4.0
- `node-html-parser` ^6.1.13

## Build output (verified locally 2026-05-07)

- `dist/index.html` — 257.64 kB (gzip: 18.21 kB)
- `dist/assets/index-*.js` — 10.62 kB (gzip: 3.46 kB)
