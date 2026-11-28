// /sitemap.xml (site-plan D6d). Written by hand instead of with @astrojs/sitemap,
// which guesses URLs from route names and gets build.format "preserve" wrong
// (it listed /oscar-wallpaper/privacy instead of privacy.html).
import type { APIContext } from "astro";
import { posts, projects } from "../lib/content";
import { THEMES } from "../lib/themes";

// Every page that isn't a collection entry. Add new ones here.
const STATIC_PAGES = [
  "/",
  "/blog/",
  "/projects/",
  "/about/",
  "/oscar-wallpaper/",
  "/oscar-wallpaper/privacy.html",
];

export async function GET(context: APIContext) {
  const paths = [
    ...STATIC_PAGES,
    ...(await posts()).map((p) => `/blog/${p.id}/`),
    ...(await projects()).map((p) => `/projects/${p.id}/`),
    ...THEMES.map((t) => `/projects/themes/${t.id}/`),
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, context.site)}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
