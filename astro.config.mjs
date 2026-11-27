import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://baron-hines.github.io",
  build: {
    // Source files map one-to-one to output files, so
    // src/pages/oscar-wallpaper/privacy.astro builds /oscar-wallpaper/privacy.html.
    // That URL and /oscar-wallpaper/ are on the wallpaper app's Google OAuth
    // consent screen and must never move (plans/in-progress/site-plan.md, D2).
    format: "preserve",
  },
  markdown: {
    syntaxHighlight: {
      type: "shiki",
      // Mermaid blocks stay as plain <code class="language-mermaid"> for the
      // Mermaid component to draw (D6b).
      excludeLangs: ["mermaid", "math"],
    },
    shikiConfig: {
      // Token colors come from --astro-code-* in src/styles/theme.css, so code
      // switches with the light/dark toggle (D6a).
      theme: "css-variables",
    },
  },
  vite: {
    build: {
      // Mermaid's chunks are large (its ELK layout engine is ~1.5 MB) but only
      // load on pages with a diagram, and only the parts a diagram needs (D6b).
      chunkSizeWarningLimit: 2000,
    },
  },
});
