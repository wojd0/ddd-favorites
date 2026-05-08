# Agent Context — ddd-favorites

## Project

A static mirror of the DDD Milano schedule (https://milano.ddd.live/schedule/) with a favorites feature, deployable to GitHub Pages.

**Location:** `/Users/wduda-air/d/ddd-favorites/`

## Structure

```
ddd-favorites/
├── package.json                  # scripts: fetch, dev, build, preview
├── vite.config.js                # Vite + @preact/preset-vite, root: public/, base: VITE_BASE env var
├── tsconfig.json                 # strict TS, jsx: react-jsx, target esnext
├── .gitignore                    # ignores node_modules/, dist/, public/index.html
├── README.md
├── scripts/
│   └── fetch-schedule.js        # fetches https://milano.ddd.live/schedule/, rewrites
│                                 # relative asset URLs to absolute, removes <base> tag,
│                                 # injects <script type="module" src="/src/init.jsx">
│                                 # writes result to public/index.html
├── src/
│   ├── init.jsx                 # entry point — waits for DOMContentLoaded then calls init()
│   ├── favorites.jsx            # main orchestrator: injects FavButtons, FavTab, FavPanel
│   │                            # into the DOM using Preact render(); MutationObserver
│   │                            # for lazy-rendered sessions; reactive via @preact/signals
│   ├── favorites.ts             # legacy vanilla TS implementation (kept for reference,
│   │                            # not used by the build — init.jsx imports favorites.jsx)
│   ├── favorites.css            # all custom styles (star buttons, tab, panel, items)
│   ├── store.ts                 # reactive state: favorites signal, toggleFavorite,
│   │                            # clearFavorites, isFavorite, getSessionId helpers
│   ├── env.d.ts                 # Vite client types
│   └── components/
│       ├── FavButton.jsx        # ☆/★ toggle button rendered into each session card
│       ├── FavTab.jsx           # inner content of the "★ Favs" tab button
│       └── FavPanel.jsx         # favorites list panel with grouped sessions, stage
│                                # pills, remove buttons, and clear-all action
└── .github/
    └── workflows/
        └── deploy.yml           # triggers: push to main, daily cron 06:00 UTC, manual
                                  # runs bun install --frozen-lockfile → bun run build
                                  # → peaceiris/actions-gh-pages to gh-pages branch
```

## How the build works

1. `bun run fetch` → `scripts/fetch-schedule.js` fetches the live HTML, rewrites all
   relative URLs to absolute `https://milano.ddd.live/...` ones, removes the original
   `<base>` tag (since all URLs are already absolute), injects `<script type="module"
   src="/src/init.jsx">`, writes to `public/index.html`.
2. `vite build` → Vite (with `@preact/preset-vite`) treats `public/` as root, compiles
   JSX/TS, bundles `src/` into `dist/assets/index-*.js`, outputs final `dist/index.html`.
3. `bun run build` = steps 1 + 2 combined.

## Key implementation details

- **UI framework**: Preact + `@preact/signals` for reactive state. Components are JSX
  rendered into mount points created in the existing DDD schedule DOM.
- `vite.config.js`: `root: 'public'`, `build.outDir` is absolute path to `../dist`,
  `@preact/preset-vite` plugin handles JSX transform.
- `base` is read from `VITE_BASE` env var (default `'./'`). GH Pages workflow sets it
  to `/ddd-favorites/` — must match repo name.
- `server.fs.allow` includes the project root so Vite dev server can resolve `/src/`.
- `resolve.alias` maps `/src` → the absolute src directory path.
- The fetch script removes the original `<base>` tag — all URLs are rewritten to absolute
  so a `<base>` would break bundled script src resolution.
- `src/store.ts` holds the `favorites` signal (reactive array of string IDs).
  `toggleFavorite` and `clearFavorites` update both the signal and localStorage.
- `src/favorites.jsx` uses `effect()` from `@preact/signals` to re-render Preact
  components when favorites change, and a MutationObserver to inject into lazily-rendered
  sessions when the user switches day tabs.
- localStorage key: `ddd_milano_favorites` — array of string IDs.
- Session ID format: `{date}__{start-time}__{title}` (e.g. `2026-05-07__12:40__Itay Schiff`)
- Session links are intercepted and opened in a new tab to avoid navigating away from the mirror.
- On load, the page scrolls to the favorites tab for quick access.

## GitHub Pages setup instructions

1. Push repo to GitHub (repo name should match `VITE_BASE` in deploy.yml, default: `ddd-favorites`)
2. Settings → Pages → Source: `gh-pages` branch
3. URL will be `https://<user>.github.io/ddd-favorites/`
4. For a custom domain: set `VITE_BASE: /` in deploy.yml and configure the domain in Pages settings

## Dependencies

- `vite` ^5.4.0 (devDependency)
- `node-html-parser` ^6.1.13 (devDependency)
- `preact` ^10.29.1
- `@preact/preset-vite` ^2.10.5
- `@preact/signals` ^2.9.0
