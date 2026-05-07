---
name: ddd-injection-component
description: >
  Generates new Preact JSX components wired into the DDD Milano schedule injection system.
  Trigger when creating new UI elements that should be injected into the fetched DDD schedule page,
  such as buttons, panels, overlays, badges, or any interactive widget mounted onto existing DOM elements.
---

# DDD Injection Component Generator

This project is a static mirror of the DDD Milano conference schedule. Our code is injected into the
fetched HTML page at runtime. All custom UI is built with **Preact** + **@preact/signals** and mounted
into the existing DOM via imperative `render()` calls inside an injection function.

## Architecture Overview

```
src/
├── store.js                     # Shared reactive state (Preact signals) + helpers
├── favorites.jsx                # Main entry: injection functions, styles, MutationObserver, boot
└── components/
    ├── FavButton.jsx            # Star button — mounted per session card
    ├── FavTab.jsx               # Tab button — mounted into .c-tab-days tab bar
    └── FavPanel.jsx             # Panel — mounted after .c-days when tab is active
```

### Key Files

- **`src/store.js`** — exports Preact signals and pure helper functions. No JSX. No DOM access.
- **`src/favorites.jsx`** — the orchestrator. Contains `inject*()` functions that query the DOM,
  create mount points, and call `render(<Component />, mountEl)`. Also contains styles and the
  MutationObserver that re-runs injection when the page lazily renders new content.
- **`src/components/*.jsx`** — pure Preact functional components. They receive props and read
  signals from the store. They do NOT touch the DOM directly.

## How to Generate a New Injected Component

Follow these steps exactly:

### Step 1 — Define the component in `src/components/`

Create a new `.jsx` file. The component must:

1. Be a named export (functional component).
2. Use `class` instead of `className` (Preact convention).
3. Import state/helpers from `../store` — never use `document.*` inside the component.
4. Accept all dynamic data as **props**.
5. Attach event handlers inline via `onClick`, `onInput`, etc.

**Template:**

```jsx
// src/components/MyWidget.jsx
import { someSignal, someHelper } from "../store";

export function MyWidget({ someProp }) {
  const value = someSignal.value;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    someHelper(someProp);
  }

  return (
    <div class="ddd-my-widget">
      <button onClick={handleClick}>{value}</button>
    </div>
  );
}
```

### Step 2 — Add state to `src/store.js` (if needed)

If the component needs shared reactive state:

1. Create a `signal()` in `store.js` and export it.
2. Export pure helper functions that mutate the signal.
3. Persist to `localStorage` if the state should survive page reloads.

```js
import { signal } from "@preact/signals";

export const myState = signal(initialValue);

export function updateMyState(newVal) {
  myState.value = newVal;
  localStorage.setItem("ddd_my_key", JSON.stringify(newVal));
}
```

### Step 3 — Wire it up in `src/favorites.jsx`

Add an injection function that:

1. Queries the target DOM element(s) where the component should appear.
2. Guards against duplicate injection (check for an existing marker class or id).
3. Creates a mount point (`document.createElement("span")` or `"div"`).
4. Appends the mount point to the target element.
5. Wraps `render()` in an `effect()` so the component re-renders when signals change.

**Template:**

```jsx
import { render } from "preact";
import { effect } from "@preact/signals";
import { MyWidget } from "./components/MyWidget";
import { myState } from "./store";

function injectMyWidget() {
  document.querySelectorAll(".target-selector").forEach((el) => {
    // Guard: skip if already injected
    if (el.querySelector(".ddd-my-widget")) return;

    // Create mount point
    const mount = document.createElement("span");
    el.appendChild(mount);

    // Render reactively
    effect(() => {
      myState.value; // subscribe to signal changes
      render(<MyWidget someProp={el.dataset.someAttr} />, mount);
    });
  });
}
```

Then register the injection function:

1. Call it in `init()`.
2. Call it in the `MutationObserver` callback so it runs when new DOM is lazily rendered.

```jsx
function observe() {
  const observer = new MutationObserver(() => {
    injectFavTab();
    injectFavButtons();
    injectMyWidget();       // ← add here
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function init() {
  injectStyles();
  injectFavTab();
  injectFavButtons();
  injectMyWidget();         // ← add here
  fixSessionLinks();
  observe();
}
```

### Step 4 — Add CSS to `injectStyles()`

Add styles for the new component inside the `injectStyles()` function's template literal.
Prefix all class names with `ddd-` to avoid collisions with the original site's CSS.

```css
/* ── My Widget ── */
.ddd-my-widget {
  /* styles here */
}
```

### Step 5 — Import in `favorites.jsx`

Add the import at the top of `favorites.jsx`:

```jsx
import { MyWidget } from "./components/MyWidget";
```

## Rules & Conventions

- **Class prefix**: All custom CSS classes must start with `ddd-` to avoid collisions.
- **No `className`**: Use `class` (Preact, not React).
- **No direct DOM manipulation in components**: Components are pure JSX. All DOM
  querying/mounting happens in `inject*()` functions in `favorites.jsx`.
- **Guard against duplicates**: Every `inject*()` function must check if the component
  is already mounted before creating a new mount point.
- **Use signals for shared state**: Import from `store.js`. Don't use component-local
  `useState` for state that needs to be shared across components or synced.
- **`effect()` for reactive rendering**: Wrap `render()` calls in `effect()` and
  reference the signal's `.value` to subscribe to changes.
- **Event propagation**: Always call `e.preventDefault()` and `e.stopPropagation()` in
  click handlers to prevent the host page's event listeners (SWUP, analytics) from
  interfering.
- **External links**: Use `target="_blank" rel="noopener"` for links pointing to the
  original DDD site.
- **MutationObserver**: The existing observer on `document.body` catches lazily rendered
  content. Register your injection function there.

## DDD Page DOM Reference

Key selectors available in the host page:

| Selector | Description |
|---|---|
| `.c-tab-days` | Tab bar container (Thu / Fri / Sat tabs) |
| `[data-ref="tab-days.day"]` | Individual day tab button |
| `.c-days` | Container for all day schedule grids |
| `[data-date]` | Day wrapper, `dataset.date` = `"2026-05-07"` etc. |
| `.c-day__session` | Individual session card |
| `.c-day__session-title` | Session title text |
| `.c-day__session-description` | Session description |
| `.c-day__session-footer` | Footer area of a session card |
| `.c-day__session-link` | "More info" anchor (href to original site) |
| `.c-day__session-tag` | Session category tag |
| `.c-day__session-colophon` | Speaker/company info |
| `data-start` / `data-end` | Time attributes on `.c-day__session` |
| `.c-site-header` | Site header |
| `.c-overlay` | Overlay opened by SWUP for speaker/session details |
