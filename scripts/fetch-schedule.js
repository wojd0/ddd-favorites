#!/usr/bin/env node
/**
 * Fetches the DDD Milano schedule page, rewrites all relative asset URLs to
 * absolute ones pointing back at the original domain, and injects our custom
 * favorites script + a build timestamp.  The result is written to
 * public/index.html so Vite can pick it up as the entry HTML.
 */

import {readFileSync, writeFileSync, mkdirSync} from "fs";
import {parse} from "node-html-parser";

const ORIGIN = "https://milano.ddd.live";
const SCHEDULE_URL = `${ORIGIN}/schedule/`;
const OUT_DIR = "public";
const OUT_FILE = `${OUT_DIR}/index.html`;

console.log(`[fetch-schedule] Fetching ${SCHEDULE_URL} …`);

const res = await fetch(SCHEDULE_URL, {
  headers: {
    // Identify ourselves politely
    "User-Agent": "ddd-favorites-builder/1.0 (github pages static mirror)",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

if (!res.ok) {
  console.error(`[fetch-schedule] HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const html = await res.text();
console.log(`[fetch-schedule] Fetched ${html.length} bytes`);

const root = parse(html, {comment: true, fixNestedATags: true});

// ── Rewrite relative URLs to absolute ────────────────────────────────────────
// Attributes that can carry URLs
const URL_ATTRS = {
  a: ["href"],
  link: ["href"],
  script: ["src"],
  img: ["src", "data-src"],
  source: ["src", "srcset"],
  form: ["action"],
  iframe: ["src"],
  use: ["xlink:href", "href"],
};

function makeAbsolute(val) {
  if (
    !val ||
    val.startsWith("http") ||
    val.startsWith("//") ||
    val.startsWith("data:") ||
    val.startsWith("blob:") ||
    val.startsWith("#") ||
    val.startsWith("mailto:") ||
    val.startsWith("tel:")
  ) {
    return val;
  }
  if (val.startsWith("/")) return `${ORIGIN}${val}`;
  return `${ORIGIN}/schedule/${val}`;
}

for (const [tag, attrs] of Object.entries(URL_ATTRS)) {
  root.querySelectorAll(tag).forEach((el) => {
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val) el.setAttribute(attr, makeAbsolute(val));
    }
  });
}

// Rewrite srcset attributes (comma-separated list of "url [descriptor]")
root.querySelectorAll("[srcset],[data-srcset],[data-bgset]").forEach((el) => {
  for (const attr of ["srcset", "data-srcset", "data-bgset"]) {
    const val = el.getAttribute(attr);
    if (!val) continue;
    const rewritten = val
      .split(",")
      .map((part) => {
        const trimmed = part.trim();
        const [url, ...rest] = trimmed.split(/\s+/);
        return [makeAbsolute(url), ...rest].join(" ");
      })
      .join(", ");
    el.setAttribute(attr, rewritten);
  }
});

// Rewrite inline style background-image URLs
root.querySelectorAll("[style]").forEach((el) => {
  const style = el.getAttribute("style");
  if (!style) return;
  const rewritten = style.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (_, u) => {
    return `url('${makeAbsolute(u)}')`;
  });
  el.setAttribute("style", rewritten);
});

// Remove <base> tag — all URLs are already rewritten to absolute above,
// and a <base> would break the bundled script src resolution in production.
const baseEl = root.querySelector("base");
if (baseEl) {
  baseEl.remove();
}

// ── Inject build timestamp comment ───────────────────────────────────────────
const body = root.querySelector("body");
if (body) {
  body.insertAdjacentHTML("afterbegin", `<!-- ddd-favorites mirror – built at ${new Date().toISOString()} from ${SCHEDULE_URL} -->\n`);
}

// ── Inject our favorites script ───────────────────────────────────────────────
// During `vite build`, Vite will process index.html and bundle any <script type="module">
// that references a local file.  We inject the reference here so Vite picks it up.
// IMPORTANT: Insert BEFORE the <base> tag so the browser resolves the src against
// the page's own origin (localhost in dev) rather than the <base href> domain.
const head = root.querySelector("head");
if (head) {
  head.insertAdjacentHTML("afterbegin", `<script type="module" src="/src/init.jsx"></script>\n`);
}

// ── Write output ──────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, {recursive: true});
writeFileSync(OUT_FILE, root.toString(), "utf8");
console.log(`[fetch-schedule] Written to ${OUT_FILE}`);
