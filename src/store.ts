import {signal, computed} from "@preact/signals";

const LS_KEY = "ddd_milano_favorites";

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
      localStorage.removeItem(LS_KEY);
      return [];
    }
    return parsed;
  } catch {
    localStorage.removeItem(LS_KEY);
    return [];
  }
}

export const favorites = signal(load());

export function isFavorite(id) {
  return favorites.value.includes(id);
}

function save(favs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch { /* quota exceeded or private browsing — state stays in-memory */ }
}

export function toggleFavorite(id) {
  const favs = [...favorites.value];
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }
  save(favs);
  favorites.value = favs;
  return idx === -1;
}

export function clearFavorites() {
  save([]);
  favorites.value = [];
}

export function getSessionId(session) {
  const day = session.closest("[data-date]");
  const date = day ? day.dataset.date : "unknown";
  const start = session.dataset.start || "";
  const title = session.querySelector(".c-day__session-title")?.textContent?.trim() || "";
  return `${date}__${start}__${title}`;
}
