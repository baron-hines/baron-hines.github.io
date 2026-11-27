import { getCollection, type CollectionEntry } from "astro:content";

type Section = "blog" | "setups" | "projects";

/** Entries for a section, without drafts in production builds (site-plan D9). */
export async function published<S extends Section>(section: S): Promise<CollectionEntry<S>[]> {
  const entries = (await getCollection(section)) as CollectionEntry<S>[];
  return import.meta.env.PROD ? entries.filter((e) => !e.data.draft) : entries;
}

export async function posts() {
  return (await published("blog")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function setups() {
  return (await published("setups")).sort((a, b) => a.data.title.localeCompare(b.data.title));
}

const STATUS_ORDER = { active: 0, paused: 1, done: 2 } as const;

export async function projects() {
  return (await published("projects")).sort(
    (a, b) =>
      STATUS_ORDER[a.data.status] - STATUS_ORDER[b.data.status] ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** True when a Markdown body has a Mermaid block, so the page loads Mermaid (site-plan D6). */
export function hasMermaid(body: string | undefined): boolean {
  return !!body && /^```mermaid\b/m.test(body);
}
