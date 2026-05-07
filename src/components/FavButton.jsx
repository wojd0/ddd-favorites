import { isFavorite, toggleFavorite } from "../store";

export function FavButton({ id }) {
  const active = isFavorite(id);

  function applyButtonState(btn, isActive) {
    btn.classList.toggle("ddd-fav-btn--active", isActive);
    btn.textContent = isActive ? "★" : "☆";
    const label = isActive ? "Remove from favorites" : "Add to favorites";
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(id);
    applyButtonState(e.currentTarget, added);
  }

  return (
    <button
      class={`ddd-fav-btn${active ? " ddd-fav-btn--active" : ""}`}
      data-fav-id={id}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onClick={handleClick}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
