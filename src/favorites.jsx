/**
 * DDD Milano – Favorites feature
 *
 * Injected into the fetched schedule page at build time.
 * Adds ☆/★ buttons on every session card and a "★ Favorites" tab
 * next to the existing Thu/Fri/Sat day tabs.  Persists to localStorage.
 */

import { effect, signal } from "@preact/signals";
import { render } from "preact";
import { DisclaimerStrip } from "./components/DisclaimerStrip";
import { FavButton } from "./components/FavButton";
import { FavPanel } from "./components/FavPanel";
import { FavTab } from "./components/FavTab";
import { favorites, getSessionId } from "./store";
import "./favorites.sass";

// ── Reactive state for tab ────────────────────────────────────────────────────

const favTabActive = signal(false);

function injectDisclaimerStrip() {
  if (document.getElementById("ddd-disclaimer-strip")) return;

  const mount = document.createElement("div");
  mount.id = "ddd-disclaimer-strip";
  document.body.prepend(mount);
  render(<DisclaimerStrip />, mount);

  const updateStripHeight = () => {
    const stripHeight = mount.offsetHeight;
    document.documentElement.style.setProperty(
      "--ddd-disclaimer-strip-height",
      `${stripHeight}px`,
    );

    document.querySelectorAll(".c-site-header__wrapper").forEach((header) => {
      header.style.setProperty("top", `${stripHeight + 40}px`, "important");
    });
  };

  updateStripHeight();
  new ResizeObserver(updateStripHeight).observe(mount);
}

// ── Mount a FavButton into each session card ──────────────────────────────────

function injectFavButtons() {
  document.querySelectorAll(".c-day__session").forEach((session) => {
    if (!session.querySelector(".c-day__session-title")) return;
    if (session.querySelector(".ddd-fav-btn")) return;

    const id = getSessionId(session);
    const mount = document.createElement("span");
    mount.className = "ddd-fav-btn-mount";

    const footer = session.querySelector(".c-day__session-footer");
    if (footer) {
      let actions = footer.querySelector(".ddd-fav-session-actions");
      if (!actions) {
        actions = document.createElement("span");
        actions.className = "ddd-fav-session-actions";
        const link = footer.querySelector(".c-day__session-link");
        if (link) {
          link.before(actions);
          actions.appendChild(link);
        } else {
          footer.appendChild(actions);
        }
      }
      actions.appendChild(mount);
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

  // Create the tab button directly as a child of tabBar (no wrapper)
  // so CSS direct-child selectors like .c-tab-days > .c-tab-days_day work.
  const tabBtn = document.createElement("button");
  tabBtn.id = "ddd-fav-tab";
  const existingTabs = tabBar.querySelectorAll('[data-ref="tab-days.day"]');
  const depth = existingTabs.length;
  tabBtn.style.setProperty("--depth", String(depth));
  tabBar.appendChild(tabBtn);

  // Render the inner content (edges + title) once
  render(<FavTab />, tabBtn);

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

    // All day tabs become is-prev with depth = distance from Favs (last position)
    const dayTabs = tabBar.querySelectorAll('[data-ref="tab-days.day"]');
    dayTabs.forEach((d, i) => {
      d.classList.remove("is-active", "is-next");
      d.classList.add("is-prev");
      d.style.setProperty("--depth", String(dayTabs.length - i));
    });
    tabBtn.style.setProperty("--depth", "0");

    favTabActive.value = true;
    cDays.style.display = "none";
    panelMount.style.display = "block";
  }

  // Attach click handler directly on the button
  tabBtn.addEventListener("click", handleTabClick);

  // When any original day tab is clicked, hide fav panel
  tabBar.addEventListener("click", (e) => {
    const dayBtn = e.target.closest('[data-ref="tab-days.day"]');
    if (!dayBtn) return;
    favTabActive.value = false;
    tabBtn.style.setProperty("--depth", String(existingTabs.length));
    panelMount.style.display = "none";
    cDays.style.display = "";
    setTimeout(injectFavButtons, 400);
  });

  // Reactively sync tab classes
  effect(() => {
    const active = favTabActive.value;
    tabBtn.className = `c-tab-days_day ddd-fav-tab-btn ${active ? "is-active" : "is-next"}`;
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
    true,
  );
}

// ── MutationObserver — handles lazy-rendered sessions ─────────────────────────

function observe() {
  const observer = new MutationObserver(() => {
    injectDisclaimerStrip();
    injectFavTab();
    injectFavButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

export function init() {
  injectDisclaimerStrip();
  injectFavTab();
  injectFavButtons();
  fixSessionLinks();
  observe();
}
