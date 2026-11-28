import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { getCollection, type CollectionEntry } from "astro:content";

type Section = "blog" | "projects";

/** Entries for a section, without drafts in production builds (site-plan D9). */
export async function published<S extends Section>(section: S): Promise<CollectionEntry<S>[]> {
  const entries = (await getCollection(section)) as CollectionEntry<S>[];
  return import.meta.env.PROD ? entries.filter((e) => !e.data.draft) : entries;
}

export async function posts() {
  return (await published("blog")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const STATUS_ORDER = { active: 0, paused: 1, done: 2 } as const;

export async function projects() {
  return (await published("projects")).sort(
    (a, b) =>
      STATUS_ORDER[a.data.status] - STATUS_ORDER[b.data.status] ||
      a.data.title.localeCompare(b.data.title),
  );
}

/**
 * When a project last changed: the date of the newest commit that touched
 * its Markdown file or the illustration beside it
 * (src/content/projects/<id>.md and .svg). The date is the committer's own
 * calendar day, so an evening commit isn't shown as the next day in UTC.
 * CI checks out the full history (fetch-depth: 0) so this is right there too.
 * A file with no commit yet (a new project in `npm run dev`) uses its
 * modified time.
 */
export function projectUpdated(id: string): Date {
  const files = [`src/content/projects/${id}.md`, `src/content/projects/${id}.svg`];
  const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], { encoding: "utf8" }).trim();
  if (out) return new Date(out);
  return new Date(Math.max(...files.filter((f) => existsSync(f)).map((f) => statSync(f).mtimeMs)));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** True when a Markdown body has a Mermaid block, so the page loads Mermaid (site-plan D6). */
export function hasMermaid(body: string | undefined): boolean {
  return !!body && /^```mermaid\b/m.test(body);
}
