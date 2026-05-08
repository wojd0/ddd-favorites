import {
  favorites,
  toggleFavorite,
  clearFavorites,
  getSessionId,
} from "../store";
import "./FavPanel.sass";

const DAY_LABELS = {
  "2026-05-07": "Thu 7 May",
  "2026-05-08": "Fri 8 May",
  "2026-05-09": "Sat 9 May",
};

function collectFavorites() {
  const favs = favorites.value;
  if (favs.length === 0) return { byDate: {}, missing: [] };

  const byDate = {};
  document.querySelectorAll(".c-day__session").forEach((session) => {
    const id = getSessionId(session);
    if (!favs.includes(id)) return;
    const day = session.closest("[data-date]");
    const date = day ? day.dataset.date : "unknown";
    if (!byDate[date]) byDate[date] = [];
    if (!byDate[date].find((e) => e.id === id)) {
      byDate[date].push({ id, session });
    }
  });

  const domIds = new Set(
    [...document.querySelectorAll(".c-day__session")].map(getSessionId)
  );
  const missing = favs.filter((id) => !domIds.has(id));

  return { byDate, missing };
}

function getPillTextColor(color) {
  const hex = color.match(/^#?([a-f\d]{6})$/i)?.[1];
  if (!hex) return "#111120";

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 135 ? "#111120" : "#ffffff";
}

function getStageInfo(session) {
  const day = session.closest(".c-day");
  const fallbackColor = "#f5c518";
  if (!day) {
    return {
      label: "Unknown stage",
      color: fallbackColor,
      textColor: getPillTextColor(fallbackColor),
    };
  }

  const inlineRoom = session.style.getPropertyValue("--room")?.trim();
  const roomIndex = Number.parseInt(inlineRoom, 10);

  if (Number.isFinite(roomIndex) && roomIndex > 0) {
    const grid = session.closest(".c-day__grid") || day;
    const roomEls = [...grid.querySelectorAll(".c-day__room")];
    const roomEl = roomEls[roomIndex - 1];
    if (roomEl) {
      const labelEl = roomEl.querySelector(".c-day__room-title") || roomEl;
      const normalized = labelEl.textContent.replace(/\s+/g, " ").trim();
      const color =
        roomEl.style.getPropertyValue("--color")?.trim() || fallbackColor;

      if (normalized) {
        return {
          label: normalized,
          color,
          textColor: getPillTextColor(color),
        };
      }
    }
  }

  const roomId = session.dataset.roomId;
  return {
    label: roomId ? `Stage ${roomId}` : "Unknown stage",
    color: fallbackColor,
    textColor: getPillTextColor(fallbackColor),
  };
}

function FavItem({ id, session }) {
  const title =
    session.querySelector(".c-day__session-title")?.textContent?.trim() || "";
  const description =
    session.querySelector(".c-day__session-description")?.textContent?.trim() ||
    "";
  const colophon =
    session.querySelector(".c-day__session-colophon")?.textContent?.trim() || "";
  const tag =
    session.querySelector(".c-day__session-tag")?.textContent?.trim() || "";
  const start = session.dataset.start || "";
  const end = session.dataset.end || "";
  const stage = getStageInfo(session);
  const linkEl = session.querySelector(".c-day__session-link");
  const link = linkEl ? linkEl.getAttribute("href") : "";

  function handleRemove(e) {
    e.preventDefault();
    toggleFavorite(id);
  }

  return (
    <li class="ddd-fav-item">
      <div class="ddd-fav-item__header u-text-mono">
        {tag && <span class="ddd-fav-item__tag">{tag}</span>}
        <span class="ddd-fav-item__time">
          {start}
          {end ? `–${end}` : ""}
        </span>
      </div>
      <h4 class="ddd-fav-item__title u-text-headline">{title}</h4>
      <p class="ddd-fav-item__stage u-text-mono">
        <span
          class="ddd-fav-item__stage-pill"
          style={{
            "--ddd-fav-stage-bg": stage.color,
            "--ddd-fav-stage-fg": stage.textColor,
          }}
        >
          {stage.label}
        </span>
      </p>
      {description && (
        <p class="ddd-fav-item__desc u-text-mono">{description}</p>
      )}
      {colophon && (
        <p class="ddd-fav-item__colophon u-text-mono">{colophon}</p>
      )}
      {link && (
        <a
          href={link}
          class="ddd-fav-item__link u-text-mono"
          target="_blank"
          rel="noopener"
        >
          More info →
        </a>
      )}
      <button
        class="ddd-fav-remove-btn u-text-mono"
        data-fav-id={id}
        aria-label="Remove from favorites"
        title="Remove from favorites"
        onClick={handleRemove}
      >
        Remove
      </button>
    </li>
  );
}

export function FavPanel() {
  const favs = favorites.value;

  if (favs.length === 0) {
    return (
      <p class="ddd-fav-empty u-text-mono">
        No favorites yet — click ☆ on any session to save it here.
      </p>
    );
  }

  const { byDate, missing } = collectFavorites();
  const dates = Object.keys(byDate).sort();

  function handleClearAll(e) {
    e.preventDefault();
    clearFavorites();
  }

  return (
    <>
      <div class="ddd-fav-toolbar">
        <span class="ddd-fav-count u-text-mono">{favs.length} favorite(s)</span>
        <button class="ddd-fav-clear-btn u-text-mono" onClick={handleClearAll}>
          Clear favorites
        </button>
      </div>

      {missing.length > 0 && (
        <p class="ddd-fav-notice u-text-mono">
          ⚠ {missing.length} saved session(s) could not be found in the current
          schedule and may have been removed or renamed.
        </p>
      )}
      {dates.length === 0 ? (
        <p class="ddd-fav-empty u-text-mono">
          None of your saved sessions are currently visible in the schedule.
        </p>
      ) : (
        dates.map((date) => (
          <div key={date}>
            <h3 class="ddd-fav-day-label u-text-mono">
              {DAY_LABELS[date] || date}
            </h3>
            <ul class="ddd-fav-list">
              {byDate[date].map(({ id, session }) => (
                <FavItem key={id} id={id} session={session} />
              ))}
            </ul>
          </div>
        ))
      )}
    </>
  );
}
