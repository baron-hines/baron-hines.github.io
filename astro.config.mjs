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
});
