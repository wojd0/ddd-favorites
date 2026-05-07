import { isFavorite, toggleFavorite } from "../store";

export function FavButton({ id }) {
  const active = isFavorite(id);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
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
