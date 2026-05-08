import { useRef, useEffect } from "preact/hooks";
import { isFavorite, toggleFavorite } from "../store";
import "./FavButton.sass";

export function FavButton({ id }) {
  const active = isFavorite(id);
  const ref = useRef(null);

  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;

    function handleClick(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggleFavorite(id);
    }

    btn.addEventListener("click", handleClick, true);
    return () => btn.removeEventListener("click", handleClick, true);
  }, [id]);

  return (
    <button
      ref={ref}
      class={`ddd-fav-btn${active ? " ddd-fav-btn--active" : ""}`}
      data-fav-id={id}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
