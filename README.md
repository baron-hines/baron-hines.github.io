# baron-hines.github.io

The source of https://baron-hines.github.io/: a blog and a list of projects, built with [Astro](https://astro.build/) and themed with the two design systems from [baron-hines/themes](https://github.com/baron-hines/themes): Tidewater in light mode, Neon Terminal in dark.

## Contents

- [Running it locally](#running-it-locally)
- [How a change goes live](#how-a-change-goes-live)
- [Blog posts](#blog-posts)
- [Projects](#projects)
- [The side rail](#the-side-rail)
- [Themes](#themes)
- [Other pages](#other-pages)
- [The site's own look](#the-sites-own-look)
- [Rules that protect the site](#rules-that-protect-the-site)
- [Where things are](#where-things-are)

## Running it locally

The themes repo is a git submodule, so clone with it:

```powershell
git clone --recurse-submodules https://github.com/baron-hines/baron-hines.github.io.git
```

In a clone made without it, run `git submodule update --init` once. Without the submodule the build stops with "The themes repo has no neon-terminal/README.md".

A **worktree** — `git worktree add`, or a `.claude/worktrees/` checkout — is a fresh working tree, so it starts with `themes/` empty and git submodule commands it runs are confined to it. You may also find `npm ci` has not been run there and the usual tools are missing. Before you can build or see a page in a worktree:

```powershell
git submodule update --init themes
npm ci
npm run dev
```

A worktree is fine for editing and for `npm run check`. It is **not** enough to prove a change works: `check` type-checks templates, but it cannot tell you a page rendered the wrong thing. Do not merge a UI change on `check` alone — build and look at the page first (`npm run build && npm run preview`, or `npm run dev`), in light and dark and at a narrow width.

Node comes from `.nvmrc` (the current LTS). Then:

```powershell
npm ci
```
```powershell
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Live-reloading site at http://localhost:4321. Shows drafts. |
| `npm run check` | Type and template check, as CI runs it. |
| `npm run build` | Builds the site into `dist/`, without drafts. |
| `npm run privacy-check` | Scans `dist/` for things that must never be published (see [Rules](#rules-that-protect-the-site)). Run it after a build. |
| `npm run preview` | Serves `dist/` as it will be published. |

## How a change goes live

1. Make the change on a branch and open a PR.
2. CI ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) runs `check`, `build` and `privacy-check` on the PR.
3. Merge to `main`. The same workflow builds again and publishes to GitHub Pages. It takes about a minute.

The repo's Pages source is **GitHub Actions**, not "deploy from a branch". Pushing files to `main` without the workflow publishes nothing.

## Blog posts

### New post

Add a Markdown file to `src/content/blog/`. The file name becomes the URL: `src/content/blog/my-first-post.md` is published at `/blog/my-first-post/`.

```markdown
---
title: My first post
date: 2026-11-27
summary: One or two sentences. Shown on the card, in link previews and in RSS.
tags: [site, notes]
draft: true
---

The post, in Markdown.
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD`. Posts are sorted newest first. |
| `summary` | yes | |
| `tags` | no | A list of lowercase words. |
| `draft` | no | `true` keeps the post out of the published site but shows it in `npm run dev`. Remove it, or set it to `false`, to publish. |

A missing or misspelled field fails the build. The schema is in [`src/content.config.ts`](src/content.config.ts).

The home page shows the three newest posts. The post is also added to `/blog/`, `/rss.xml` and `/sitemap.xml` on its own.
### Updating a post

Edit the file. To change the URL, rename the file. The old URL then returns 404, so only do it before anyone has linked to it.

### Deleting a post

Delete the file. It disappears from the blog, the home page, RSS and the sitemap, and its URL returns 404. To take a post down for now without losing it, set `draft: true` instead.

### What a post can contain

- Ordinary Markdown: headings, lists, tables, quotes, links, images.
- Code blocks with a language (```` ```ts ````) are highlighted in the current theme's colors.
- A ```` ```mermaid ```` block is drawn as a diagram and redrawn when the theme toggles. Mermaid is only loaded on pages that have one. Bar charts use `xychart-beta`. Keep their x-axis labels short, because they run together in Neon Terminal's monospace font.
- A hand-drawn illustration is an `.svg` file next to the Markdown, added on a line of its own as `<img class="illustration" src="name.svg" alt="…">`. GitHub shows it as an image. On the site, [`src/components/Illustrations.astro`](src/components/Illustrations.astro) puts the SVG's markup into the page instead, so its `<style>` can color it from the theme tokens and it follows the light/dark toggle. Give every color a `var(--token, fallback)` so it still looks right on GitHub. [`coding-stack.svg`](src/content/projects/coding-stack.svg) is the example.

## Projects

### New project

Add a Markdown file to `src/content/projects/`. `src/content/projects/my-tool.md` is published at `/projects/my-tool/`.

```markdown
---
title: my-tool
summary: What it is and why, in one or two sentences.
status: active
keepCase: true
repo: https://github.com/baron-hines/my-tool
links:
  - label: Live site
    href: https://example.com/
tags: [python, home-server]
---

The write-up, in Markdown.
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `summary` | yes | Shown on the card and in link previews. |
| `status` | yes | `active`, `paused` or `done`. The list is sorted in that order. Shown as "● Active" in light mode and `[ACTIVE]` in dark. |
| `featured` | no | `true` lists the project in the home page's [side rail](#the-side-rail). Every project is on `/projects/` either way. |
| `keepCase` | no | `true` when the title is a lowercase name (`oscar-wallpaper`), so Neon Terminal's uppercase headings leave it as written. |
| `repo` | no | **Public repos only.** Adds a "Source on GitHub" link. Leave it out for a private repo. |
| `links` | no | Extra links, each with a `label` and an `href`. |
| `tags` | no | |
| `draft` | no | As for posts. |

### Updating a project

Edit the file. When a project finishes or stalls, change `status`. To rename its URL, rename the file. The old URL then returns 404.

### Deleting a project

Delete the file, or set `draft: true` to hide it without losing it. Then search for links to it from other pages (for example, `themes.md` links to `/projects/themes/neon-terminal/`), and fix or remove them:

```powershell
git grep -n "projects/my-tool/"
```

### Projects with extra pages

A project can have its own pages under its URL, as Themes does. Put them in `src/pages/projects/<project>/…`, and add their URLs to the sitemap (see [Other pages](#other-pages)).

## The side rail

Only the home page has a **side rail** ([`src/components/SideRail.astro`](src/components/SideRail.astro)): the latest posts on the left, projects on the right, so the front page shows both sections. `/blog/` and `/projects/` are single lists at the normal reading width.

The rail lists the projects with `featured: true` in their front matter (today the two stack pages). If none are featured it lists the active ones, and if none are active, the finished ones under "Recently finished", so the two-column layout never collapses. It uses the same `projects()` helper from [`src/lib/content.ts`](src/lib/content.ts) as `/projects/`.

The home page passes `wide` to `BaseLayout` (`.container--wide`, 66rem) to make room for it; every other page keeps 44rem. Below 60rem the rail drops under the posts and its cards go two-up; below 34rem they stack.

## Themes

The Themes project ([`src/content/projects/themes.md`](src/content/projects/themes.md)) links to one page per theme, `/projects/themes/<id>/`. Those pages are built from the [themes repo](https://github.com/baron-hines/themes), which is checked out as the `themes/` submodule. The themes repo is the source of truth, so nothing about a theme is copied into this site:

| On the page | Comes from |
|---|---|
| The design philosophy | `themes/<id>/README.md`, rendered as is. Relative links in it are pointed at GitHub. |
| Fonts, color swatches, type, space, shape and depth | `themes/<id>/THEME.md`: its `## Fonts` link and `## Tokens` CSS block |
| Component styles | `THEME.md`'s `## Components` CSS block |
| Component demos | `THEME.md`'s `### Markup patterns` (each HTML block, captioned by the line above it), then the extras in [`src/data/showcase-extras.ts`](src/data/showcase-extras.ts) |

Each showcase is a declarative shadow root holding only that theme's CSS, so it shows the theme as written whatever mode the site is in. The parsing is in [`src/lib/themes.ts`](src/lib/themes.ts), and the rendering in [`src/components/ThemeShowcase.astro`](src/components/ThemeShowcase.astro).

### Updating a theme

1. Change the theme in the themes repo and merge it there (its README explains how).
2. Here, on a branch, move the submodule to the themes repo's latest `main`:

   ```powershell
   git submodule update --remote themes
   ```
   ```powershell
   git add themes
   ```

3. Build and look at the theme's page. If the change affects the site's own look, update [`src/styles/theme.css`](src/styles/theme.css) to match (see [The site's own look](#the-sites-own-look)).
4. Open a PR. The diff shows the submodule moving from one themes commit to the next.

Nothing reaches this site until the submodule is moved, so a theme change can't break it by surprise.

### Adding a theme

1. Add the theme to the themes repo, with a `README.md` and a `THEME.md` laid out like the existing ones. The page builder needs `## Fonts`, `## Tokens`, `## Components` and, inside Components, `### Markup patterns` in `THEME.md`, and stops with an error naming the missing one.
2. Move the submodule here, as above.
3. Add the theme to `THEMES` in [`src/lib/themes.ts`](src/lib/themes.ts): its folder name as `id`, plus `name`, `mode`, `tagline` and `labelPrefix` (`"// "` if its section labels are written as comments, otherwise `""`).
4. Optionally, add demos to [`src/data/showcase-extras.ts`](src/data/showcase-extras.ts) for components its markup patterns don't show. Use only classes from its `THEME.md`.
5. Add it to the table and `links` in [`src/content/projects/themes.md`](src/content/projects/themes.md).

The page and its sitemap entry are created from `THEMES`.

### Removing a theme

1. Remove it from `THEMES`, from `showcase-extras.ts`, and from the table and `links` in `themes.md`.
2. If the site uses it for light or dark mode, change [`src/styles/theme.css`](src/styles/theme.css) first.
3. Remove it from the themes repo and move the submodule, as above. Do these in that order: a theme still listed in `THEMES` but missing from the submodule fails the build.

## Other pages

Pages that aren't posts or projects are `.astro` files in [`src/pages/`](src/pages/). Because of `build.format: 'preserve'`, the file path is the URL: `src/pages/about/index.astro` is `/about/`, and `src/pages/about.astro` is `/about.html`.

- **New page:** add the file, wrap it in `BaseLayout` (as `src/pages/404.astro` does), and add its URL to `STATIC_PAGES` in [`src/pages/sitemap.xml.ts`](src/pages/sitemap.xml.ts). Posts, projects and theme pages are added to the sitemap on their own, but other pages aren't.
- **In the nav:** the header links are the `nav` list in [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro). A page outside a section's URL can still highlight that section with `section="/projects/"` on `BaseLayout`, as the oscar-wallpaper pages do.
- **Deleting a page:** delete the file, remove it from `STATIC_PAGES` and the nav, and search for links to it.

## The site's own look

[`src/styles/theme.css`](src/styles/theme.css) maps the two themes onto the site. The first block of tokens is Tidewater (light). Neon Terminal (dark) is repeated twice, once for "the device is dark" and once for "the visitor picked dark", and **the two dark blocks must stay identical**. Components only use these tokens, so a color, case or spacing rule changes in one place per mode.

These values are copied from the themes repo, not read from it. When a theme's tokens change there, update them here too.

[`public/theme.js`](public/theme.js) is the light/dark toggle. It loads before the page draws, so a saved choice never flashes the wrong theme.

## Rules that protect the site

- **The oscar-wallpaper URLs never move.** `/oscar-wallpaper/` and `/oscar-wallpaper/privacy.html` are the homepage and privacy policy on the oscar-wallpaper app's Google sign-in consent screen. If either one moves, the published app goes out of compliance. `build.format: 'preserve'` keeps them exact, and the project page at `/projects/oscar-wallpaper/` links to them.
- **No private details.** `npm run privacy-check` fails the build on a private IPv4 address, an email address or a token prefix (`ghp_`, `github_pat_`, `sk-`). It can't catch names, so when writing about the home setup, also leave out hostnames, ports, domains, account and project IDs, and file paths.
- **Repo links only for public repos.**

## Where things are

| Path | What |
|---|---|
| `src/content/blog/`, `src/content/projects/` | Posts and projects, one Markdown file each |
| `src/content.config.ts` | The fields each one allows |
| `src/pages/` | Pages and routes: home, blog, projects, theme pages, oscar-wallpaper, 404, RSS, sitemap |
| `src/layouts/BaseLayout.astro` | The page frame: head tags, header nav, footer |
| `src/components/` | Cards, tags, status, Mermaid, the home page's side rail, the theme showcase |
| `src/lib/` | Content helpers, and the themes repo reader |
| `src/styles/` | The site's tokens and styles, and code block styles |
| `themes/` | The themes repo (submodule) |
| `scripts/privacy-check.mjs` | The privacy check |
| `plans/` | Plans for the site, by status |
