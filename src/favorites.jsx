/**
 * DDD Milano – Favorites feature
 *
 * Injected into the fetched schedule page at build time.
 * Adds ☆/★ buttons on every session card and a "★ Favorites" tab
 * next to the existing Thu/Fri/Sat day tabs.  Persists to localStorage.
 */

import { render } from "preact";
import { signal, effect } from "@preact/signals";
import { favorites, getSessionId } from "./store";
import { FavButton } from "./components/FavButton";
import { FavTab } from "./components/FavTab";
import { FavPanel } from "./components/FavPanel";

// ── Reactive state for tab ────────────────────────────────────────────────────

const favTabActive = signal(false);

// ── Mount a FavButton into each session card ──────────────────────────────────

function injectFavButtons() {
  document.querySelectorAll(".c-day__session").forEach((session) => {
    if (!session.querySelector(".c-day__session-title")) return;
    if (session.querySelector(".ddd-fav-btn")) return;

    const id = getSessionId(session);
    const mount = document.createElement("span");

    const footer = session.querySelector(".c-day__session-footer");
    if (footer) {
      footer.appendChild(mount);
    } else {
      session.querySelector(".c-day__session-content")?.appendChild(mount);
    }

    // Re-render the button when favorites change
    effect(() => {
      favorites.value; // subscribe
      render(<FavButton id={id} />, mount);
    });
  });
}

// ── Mount the Favorites tab ───────────────────────────────────────────────────

function injectFavTab() {
  if (document.getElementById("ddd-fav-tab")) return;

  const tabBar = document.querySelector(".c-tab-days");
  if (!tabBar) return;

  // Mount point for the tab button
  const tabMount = document.createElement("span");
  tabMount.style.display = "contents";
  const existingTabs = tabBar.querySelectorAll('[data-ref="tab-days.day"]');
  const depth = existingTabs.length;
  tabBar.appendChild(tabMount);

  // Mount point for the favorites panel (after .c-days)
  const cDays = document.querySelector(".c-days");
  if (!cDays) return;

  const panelMount = document.createElement("div");
  panelMount.id = "ddd-fav-panel";
  panelMount.className = "ddd-fav-panel o-container";
  panelMount.style.display = "none";
  cDays.insertAdjacentElement("afterend", panelMount);

  function handleTabClick() {
    if (favTabActive.value) return;

    // Deactivate original day tabs
    document.querySelectorAll('[data-ref="tab-days.day"]').forEach((d) => {
      d.classList.remove("is-active");
      d.classList.add("is-next");
    });

    favTabActive.value = true;
    cDays.style.display = "none";
    panelMount.style.display = "block";
  }

  // When any original day tab is clicked, hide fav panel
  tabBar.addEventListener("click", (e) => {
    const dayBtn = e.target.closest('[data-ref="tab-days.day"]');
    if (!dayBtn) return;
    favTabActive.value = false;
    panelMount.style.display = "none";
    cDays.style.display = "";
    setTimeout(injectFavButtons, 400);
  });

  // Reactively render the tab button
  effect(() => {
    const active = favTabActive.value;
    render(<FavTab active={active} onClick={handleTabClick} />, tabMount);
    // Set --depth on the rendered button
    const btn = tabMount.querySelector("#ddd-fav-tab");
    if (btn) btn.style.setProperty("--depth", String(depth));
  });

  // Reactively render the panel content when visible
  effect(() => {
    favorites.value; // subscribe
    if (favTabActive.value) {
      render(<FavPanel />, panelMount);
    }
  });
}

// ── Open session links in new tab ─────────────────────────────────────────────

function fixSessionLinks() {
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest("a.c-day__session-link");
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, "_blank", "noopener");
    },
    true
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById("ddd-fav-styles")) return;

  const style = document.createElement("style");
  style.id = "ddd-fav-styles";
  style.textContent = `
    /* ── Star button on session cards ── */
    .ddd-fav-btn {
      background: none;
      border: 1px solid currentColor;
      border-radius: 4px;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      padding: 8px 17px;
      opacity: 0.5;
      transition: opacity 0.15s ease, color 0.15s ease, transform 0.1s ease;
      color: inherit;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .ddd-fav-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    .ddd-fav-btn--active {
      opacity: 1;
      color: #f5c518;
      border-color: #f5c518;
    }
    .c-day__session-footer {
      display: flex !important;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* ── Favorites tab button ── */
    .ddd-fav-tab-btn {
      cursor: pointer;
    }
    .ddd-fav-tab-btn.is-active {
      --depth: 0 !important;
    }
    .ddd-fav-tab-btn.is-active > * {
      background: #fff8e1 !important;
    }
    .ddd-fav-tab-btn.is-active .c-tab-days_title {
      color: #1a1a1a;
    }

    /* ── Favorites panel ── */
    .ddd-fav-panel {
      padding-top: 52px;
      padding-bottom: 100px;
    }
    .ddd-fav-empty,
    .ddd-fav-notice {
      font-size: 14px;
      opacity: 0.65;
      margin-top: 28px;
      line-height: 1.6;
    }
    .ddd-fav-notice {
      color: #f5c518;
      opacity: 1;
      margin-bottom: 12px;
    }
    .ddd-fav-day-label {
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.5;
      margin: 48px 0 18px;
      padding-bottom: 10px;
      border-bottom: 1px solid currentColor;
    }
    .ddd-fav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 16px;
    }
    @media (min-width: 768px) {
      .ddd-fav-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1200px) {
      .ddd-fav-list {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .ddd-fav-item {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 20px 22px;
      background: rgba(255,255,255,0.035);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ddd-fav-item__header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      opacity: 0.65;
      margin-bottom: 4px;
    }
    .ddd-fav-item__tag {
      border: 1px solid currentColor;
      border-radius: 3px;
      padding: 1px 6px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .ddd-fav-item__time {
      margin-right: auto;
    }
    .ddd-fav-item__title {
      font-size: clamp(16px, 1.8vw, 22px);
      margin: 0;
      line-height: 1.25;
    }
    .ddd-fav-item__desc {
      font-size: 12px;
      opacity: 0.65;
      margin: 0;
    }
    .ddd-fav-item__colophon {
      font-size: 12px;
      opacity: 0.5;
      margin: 0;
      font-style: italic;
    }
    .ddd-fav-item__link {
      font-size: 12px;
      opacity: 0.7;
      text-decoration: underline;
      letter-spacing: 0.04em;
      margin-top: auto;
      padding-top: 10px;
    }
    .ddd-fav-item__link:hover {
      opacity: 1;
    }
    .ddd-fav-remove {
      padding: 1px 5px;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
}

// ── MutationObserver — handles lazy-rendered sessions ─────────────────────────

function observe() {
  const observer = new MutationObserver(() => {
    injectFavTab();
    injectFavButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function init() {
  injectStyles();
  injectFavTab();
  injectFavButtons();
  fixSessionLinks();
  observe();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
