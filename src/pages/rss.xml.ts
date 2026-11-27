// The blog's RSS feed at /rss.xml (site-plan D6c).
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { posts } from "../lib/content";

export async function GET(context: APIContext) {
  return rss({
    title: "baron-hines",
    description: "Posts on what I'm building and learning.",
    site: context.site!,
    items: (await posts()).map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      categories: post.data.tags,
      link: `/blog/${post.id}/`,
    })),
  });
}
