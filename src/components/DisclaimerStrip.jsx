import "./DisclaimerStrip.sass";

const modifierUrl = "https://wojd0.github.io";
const officialUrl = "https://ddd.live";

export function DisclaimerStrip() {
  return (
    <aside
      class="ddd-disclaimer-strip u-text-mono"
      aria-label="Site disclaimer"
    >
      Official Digital Design Days website modified by{" "}
      <a href={modifierUrl} target="_blank" rel="noopener">
        {modifierUrl}
      </a>
      . All rights belong to their rightful owners at{" "}
      <a href={officialUrl} target="_blank" rel="noopener">
        {officialUrl}
      </a>
      .
    </aside>
  );
}
