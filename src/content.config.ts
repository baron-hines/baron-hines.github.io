// The site's two sections. Each Markdown file's front matter is checked
// against these schemas at build time (plans/completed/site-plan.md, D3).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// draft: true keeps an entry out of production builds; `npm run dev` still shows it (D9).
const draft = z.boolean().default(false);
const tags = z.array(z.string()).default([]);

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags,
    draft,
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["active", "paused", "done"]),
    // Public repos only.
    repo: z.url().optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    tags,
    // The title is a lowercase name (kiosk, oscar-wallpaper): Neon Terminal's
    // uppercase headings leave it as written.
    keepCase: z.boolean().default(false),
    draft,
  }),
});

// Each theme's README.md in the themes repo (the `themes` submodule): its
// design philosophy, rendered on /projects/themes/<id>/. The repo is the
// source of truth, so these are read from it, never copied.
const themeDocs = defineCollection({
  loader: glob({
    base: "./themes",
    pattern: "*/README.md",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({}),
});

export const collections = { blog, projects, themeDocs };
