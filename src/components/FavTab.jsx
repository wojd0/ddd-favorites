export function FavTab({ active, onClick }) {
  const classes = [
    "c-tab-days_day",
    "ddd-fav-tab-btn",
    active ? "is-active" : "is-next",
  ].join(" ");

  return (
    <button id="ddd-fav-tab" class={classes} onClick={onClick}>
      <div class="c-tab-days_edge c-tab-days_edge--left"></div>
      <div class="c-tab-days_title">
        <span>★ Favs</span>
      </div>
      <div class="c-tab-days_edge c-tab-days_edge--right"></div>
    </button>
  );
}
