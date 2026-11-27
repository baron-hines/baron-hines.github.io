// The site's three sections. Each Markdown file's front matter is checked
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

// Living reference pages: edited over time, so they carry `updated`, not a post date.
const setups = defineCollection({
  loader: glob({ base: "./src/content/setups", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    updated: z.coerce.date(),
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
    draft,
  }),
});

export const collections = { blog, setups, projects };
