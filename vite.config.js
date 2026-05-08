import {defineConfig} from "vite";
import preact from "@preact/preset-vite";
import path from "path";

export default defineConfig({
  plugins: [preact()],
  // Set base to './' so all asset paths are relative.
  // When deployed to GH Pages under a sub-path (e.g. /ddd-favorites/)
  // this is overridden by the VITE_BASE env var set in the workflow.
  base: process.env.VITE_BASE ?? "./",

  // Tell Vite the project root is the public dir where our fetched index.html lives
  root: "public",

  // Output goes to dist/ (relative to the project root, not the vite root)
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    // Inline small assets so we don't need to worry about relative paths
    assetsInlineLimit: 4096,
  },

  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },

  // During dev, serve src/ so the module import in index.html resolves
  server: {
    fs: {
      // Allow serving files from one level up (the project root, where src/ lives)
      allow: [path.resolve(import.meta.dirname)],
    },
  },

  // Resolve the /src/ import that fetch-schedule.js injects into the HTML
  resolve: {
    alias: {
      "/src": path.resolve(import.meta.dirname, "src"),
    },
  },
});
