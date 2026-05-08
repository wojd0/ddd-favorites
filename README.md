# DDD Milano – Favorites

A static mirror of the [DDD Milano schedule](https://milano.ddd.live/schedule/) with a **★ Favorites** tab and per-session favorite buttons. Favorites persist to `localStorage`.

## How it works

1. `scripts/fetch-schedule.js` — fetches the live schedule HTML, rewrites all relative asset URLs to absolute ones (so fonts, CSS, images keep loading from `milano.ddd.live`), and injects the favorites script tag.
2. `src/favorites.js` — the favorites feature (star buttons, tab, panel, localStorage).
3. Vite bundles everything into `dist/`.
4. A GitHub Actions workflow rebuilds and deploys to GitHub Pages every day at 06:00 UTC, on every push to `main`, and on manual dispatch.

## Local development

```bash
bun install
bun run dev        # fetch + vite dev server
```

## Build

```bash
bun run build      # produces dist/
```

## GitHub Pages deployment

1. Push this directory to a GitHub repository.
2. In **Settings → Pages**, set the source to the `gh-pages` branch (the workflow creates it automatically).
3. If your repo is `https://github.com/<user>/ddd-favorites`, the site will be live at `https://<user>.github.io/ddd-favorites/`.
4. The `VITE_BASE` env var in `.github/workflows/deploy.yml` is set to `/ddd-favorites/` — update it if your repo name differs or you use a custom domain (use `/` for a custom domain).

## Customising the rebuild schedule

Edit the `cron` expression in `.github/workflows/deploy.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'   # daily at 06:00 UTC
```
