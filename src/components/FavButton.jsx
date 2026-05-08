import { isFavorite, toggleFavorite } from "../store";

function stopFavoriteEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  e.nativeEvent?.stopImmediatePropagation?.();
  e.stopImmediatePropagation?.();
}

export function FavButton({ id }) {
  const active = isFavorite(id);

  function applyButtonState(btn, isActive) {
    btn.classList.toggle("ddd-fav-btn--active", isActive);
    btn.textContent = isActive ? "★" : "☆";
    const label = isActive ? "Remove from favorites" : "Add to favorites";
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  function toggleButton(btn) {
    const added = toggleFavorite(id);
    applyButtonState(btn, added);
  }

  function handlePointerUp(e) {
    if (typeof e.button === "number" && e.button !== 0) return;

    const btn = e.currentTarget;
    stopFavoriteEvent(e);
    btn.dataset.dddFavPointerHandled = "true";
    toggleButton(btn);
    setTimeout(() => {
      delete btn.dataset.dddFavPointerHandled;
    }, 0);
  }

  function handleClick(e) {
    stopFavoriteEvent(e);
    if (e.currentTarget.dataset.dddFavPointerHandled === "true") {
      delete e.currentTarget.dataset.dddFavPointerHandled;
      return;
    }

    toggleButton(e.currentTarget);
  }

  return (
    <button
      class={`ddd-fav-btn${active ? " ddd-fav-btn--active" : ""}`}
      data-fav-id={id}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onPointerDown={stopFavoriteEvent}
      onPointerUp={handlePointerUp}
      onMouseDown={stopFavoriteEvent}
      onMouseUp={stopFavoriteEvent}
      onClick={handleClick}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
