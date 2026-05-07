import {signal, computed} from "@preact/signals";

const LS_KEY = "ddd_milano_favorites";

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export const favorites = signal(load());

export function isFavorite(id) {
  return favorites.value.includes(id);
}

export function toggleFavorite(id) {
  const favs = [...favorites.value];
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(favs));
  favorites.value = favs;
  return idx === -1;
}

export function getSessionId(session) {
  const day = session.closest("[data-date]");
  const date = day ? day.dataset.date : "unknown";
  const start = session.dataset.start || "";
  const title = session.querySelector(".c-day__session-title")?.textContent?.trim() || "";
  return `${date}__${start}__${title}`;
}
