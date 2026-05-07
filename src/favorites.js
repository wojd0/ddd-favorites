/**
 * DDD Milano – Favorites feature
 *
 * Injected into the fetched schedule page at build time.
 * Adds ☆/★ buttons on every session card and a "★ Favorites" tab
 * next to the existing Thu/Fri/Sat day tabs.  Persists to localStorage.
 */

const LS_KEY = "ddd_milano_favorites";

// ── Storage helpers ──────────────────────────────────────────────────────────

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

/**
 * Toggle a session in/out of favorites.
 * @returns {boolean} true if it was added, false if removed
 */
function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }
  saveFavorites(favs);
  return idx === -1;
}

// ── Unique session ID ─────────────────────────────────────────────────────────

function getSessionId(session) {
  const day = session.closest("[data-date]");
  const date = day ? day.dataset.date : "unknown";
  const start = session.dataset.start || "";
  const title = session.querySelector(".c-day__session-title")?.textContent?.trim() || "";
  return `${date}__${start}__${title}`;
}

// ── Star button ───────────────────────────────────────────────────────────────

function makeFavBtn(id) {
  const btn = document.createElement("button");
  btn.className = "ddd-fav-btn" + (isFavorite(id) ? " ddd-fav-btn--active" : "");
  btn.dataset.favId = id;
  btn.innerHTML = isFavorite(id) ? "★" : "☆";
  btn.setAttribute("aria-label", isFavorite(id) ? "Remove from favorites" : "Add to favorites");
  btn.title = btn.getAttribute("aria-label");

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(id);
    btn.innerHTML = added ? "★" : "☆";
    btn.classList.toggle("ddd-fav-btn--active", added);
    const label = added ? "Remove from favorites" : "Add to favorites";
    btn.setAttribute("aria-label", label);
    btn.title = label;
    updateAllFavBtnsForId(id, added);
    refreshFavTab();
    renderFavoritesPanel();
  });

  return btn;
}

// Keep all star buttons for the same session in sync (e.g. duplicate cards)
function updateAllFavBtnsForId(id, active) {
  document.querySelectorAll(`.ddd-fav-btn[data-fav-id]`).forEach((b) => {
    if (b.dataset.favId !== id || b.classList.contains("ddd-fav-remove")) return;
    b.innerHTML = active ? "★" : "☆";
    b.classList.toggle("ddd-fav-btn--active", active);
    const label = active ? "Remove from favorites" : "Add to favorites";
    b.setAttribute("aria-label", label);
    b.title = label;
  });
}

// ── Inject star buttons into session cards ────────────────────────────────────

function injectFavButtons() {
  document.querySelectorAll(".c-day__session").forEach((session) => {
    if (!session.querySelector(".c-day__session-title")) return;
    if (session.querySelector(".ddd-fav-btn")) return; // already injected

    const id = getSessionId(session);
    const btn = makeFavBtn(id);

    const footer = session.querySelector(".c-day__session-footer");
    if (footer) {
      footer.appendChild(btn);
    } else {
      session.querySelector(".c-day__session-content")?.appendChild(btn);
    }
  });
}

// ── Favorites tab + panel ─────────────────────────────────────────────────────

function refreshFavTab() {
  const badge = document.querySelector(".ddd-fav-tab-count");
  if (badge) {
    const count = getFavorites().length;
    badge.textContent = count > 0 ? String(count) : "";
  }
}

function buildPanelHTML() {
  const favs = getFavorites();

  if (favs.length === 0) {
    return '<p class="ddd-fav-empty u-text-mono">No favorites yet — click ☆ on any session to save it here.</p>';
  }

  // Collect matching sessions from the DOM, grouped by date
  const byDate = {};
  document.querySelectorAll(".c-day__session").forEach((session) => {
    const id = getSessionId(session);
    if (!favs.includes(id)) return;
    const day = session.closest("[data-date]");
    const date = day ? day.dataset.date : "unknown";
    if (!byDate[date]) byDate[date] = [];
    // Avoid duplicates (same session can appear in multiple grid groups)
    if (!byDate[date].find((e) => e.id === id)) {
      byDate[date].push({id, session});
    }
  });

  const dayLabels = {
    "2026-05-07": "Thu 7 May",
    "2026-05-08": "Fri 8 May",
    "2026-05-09": "Sat 9 May",
  };

  // Warn if some saved sessions aren't currently in the DOM
  const domIds = new Set([...document.querySelectorAll(".c-day__session")].map(getSessionId));
  const missing = favs.filter((id) => !domIds.has(id));

  let html = "";

  if (missing.length) {
    html += `<p class="ddd-fav-notice u-text-mono">⚠ ${missing.length} saved session(s) could not be found in the current schedule and may have been removed or renamed.</p>`;
  }

  if (Object.keys(byDate).length === 0) {
    html += '<p class="ddd-fav-empty u-text-mono">None of your saved sessions are currently visible in the schedule.</p>';
    return html;
  }

  Object.keys(byDate)
    .sort()
    .forEach((date) => {
      html += `<h3 class="ddd-fav-day-label u-text-mono">${dayLabels[date] || date}</h3><ul class="ddd-fav-list">`;

      byDate[date].forEach(({id, session}) => {
        const title = session.querySelector(".c-day__session-title")?.textContent?.trim() || "";
        const description = session.querySelector(".c-day__session-description")?.textContent?.trim() || "";
        const colophon = session.querySelector(".c-day__session-colophon")?.textContent?.trim() || "";
        const tag = session.querySelector(".c-day__session-tag")?.textContent?.trim() || "";
        const start = session.dataset.start || "";
        const end = session.dataset.end || "";
        // The link href was already rewritten to absolute by fetch-schedule.js
        const linkEl = session.querySelector(".c-day__session-link");
        const link = linkEl ? linkEl.getAttribute("href") : "";
        const safeId = id.replace(/"/g, "&quot;");

        html += `
        <li class="ddd-fav-item">
          <div class="ddd-fav-item__header u-text-mono">
            ${tag ? `<span class="ddd-fav-item__tag">${tag}</span>` : ""}
            <span class="ddd-fav-item__time">${start}${end ? "–" + end : ""}</span>
            <button class="ddd-fav-btn ddd-fav-btn--active ddd-fav-remove"
                    data-fav-id="${safeId}"
                    aria-label="Remove from favorites"
                    title="Remove from favorites">★</button>
          </div>
          <h4 class="ddd-fav-item__title u-text-headline">${title}</h4>
          ${description ? `<p class="ddd-fav-item__desc u-text-mono">${description}</p>` : ""}
          ${colophon ? `<p class="ddd-fav-item__colophon u-text-mono">${colophon}</p>` : ""}
          ${link ? `<a href="${link}" class="ddd-fav-item__link u-text-mono" target="_blank" rel="noopener">More info →</a>` : ""}
        </li>`;
      });

      html += "</ul>";
    });

  return html;
}

function renderFavoritesPanel() {
  const panel = document.getElementById("ddd-fav-panel");
  if (!panel || panel.style.display === "none") return;
  panel.innerHTML = buildPanelHTML();
  wireRemoveButtons(panel);
}

function wireRemoveButtons(panel) {
  panel.querySelectorAll(".ddd-fav-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.favId;
      toggleFavorite(id);
      updateAllFavBtnsForId(id, false);
      refreshFavTab();
      renderFavoritesPanel();
    });
  });
}

function showFavPanel() {
  const cDays = document.querySelector(".c-days");
  const panel = document.getElementById("ddd-fav-panel");
  if (!panel || !cDays) return;
  cDays.style.display = "none";
  panel.style.display = "block";
  renderFavoritesPanel();
}

function hideFavPanel() {
  const cDays = document.querySelector(".c-days");
  const panel = document.getElementById("ddd-fav-panel");
  if (!panel || !cDays) return;
  panel.style.display = "none";
  cDays.style.display = "";
}

function injectFavTab() {
  if (document.getElementById("ddd-fav-tab")) return;

  const tabBar = document.querySelector(".c-tab-days");
  if (!tabBar) return;

  // Build and append the tab button
  const tabBtn = document.createElement("button");
  tabBtn.id = "ddd-fav-tab";
  tabBtn.className = "c-tab-days_day ddd-fav-tab-btn is-next";
  // Set depth to match position after existing tabs
  const existingTabs = tabBar.querySelectorAll('[data-ref="tab-days.day"]');
  tabBtn.style.setProperty("--depth", String(existingTabs.length));
  tabBtn.innerHTML = `
    <div class="c-tab-days_edge c-tab-days_edge--left"></div>
    <div class="c-tab-days_title">
      <span>★ Favs <span class="ddd-fav-tab-count"></span></span>
    </div>
    <div class="c-tab-days_edge c-tab-days_edge--right"></div>
  `;
  tabBar.appendChild(tabBtn);

  // Build and insert the panel right after .c-days
  const cDays = document.querySelector(".c-days");
  if (!cDays) return;

  const panel = document.createElement("div");
  panel.id = "ddd-fav-panel";
  panel.className = "ddd-fav-panel o-container";
  panel.style.display = "none";
  cDays.insertAdjacentElement("afterend", panel);

  // Favorites tab click
  tabBtn.addEventListener("click", () => {
    if (tabBtn.classList.contains("is-active")) return;
    document.querySelectorAll('[data-ref="tab-days.day"]').forEach((d) => {
      d.classList.remove("is-active");
      d.classList.add("is-next");
    });
    tabBtn.classList.add("is-active");
    tabBtn.classList.remove("is-next");
    showFavPanel();
  });

  // When any original day tab is clicked, hide fav panel
  // Use event delegation on the tab bar to catch both initial and future clicks
  tabBar.addEventListener("click", (e) => {
    const dayBtn = e.target.closest('[data-ref="tab-days.day"]');
    if (!dayBtn) return;
    hideFavPanel();
    tabBtn.classList.remove("is-active");
    tabBtn.classList.add("is-next");
    // Re-inject buttons after the site re-renders sessions for the new day
    setTimeout(injectFavButtons, 400);
  });

  refreshFavTab();
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
      padding: 2px 7px;
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

    /* Make sure the footer area is flex so the btn sits inline */
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
    .ddd-fav-tab-count {
      display: inline-block;
      min-width: 18px;
      background: #f5c518;
      color: #000;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      padding: 0 5px;
      line-height: 18px;
      vertical-align: middle;
      margin-left: 4px;
      transition: transform 0.15s ease;
    }
    .ddd-fav-tab-count:empty {
      display: none;
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
  observer.observe(document.body, {childList: true, subtree: true});
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function init() {
  injectStyles();
  injectFavTab();
  injectFavButtons();
  observe();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
