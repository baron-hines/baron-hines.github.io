---
title: Theming this site
summary: Light mode is Tidewater, dark mode is Neon Terminal, and the components only ever see tokens.
date: 2026-11-26
tags: [site, design, css]
---

I have two design systems. **Tidewater** is a calm light theme built on one cyan, with cool off-white backgrounds, gentle radii, and Sora with IBM Plex. **Neon Terminal** is a dark, command-line-flavored one: near-black with faint scanlines, square corners, Chakra Petch and JetBrains Mono, and a few neon colors that each mean one thing. Neither has the other's mode, so this site pairs them: Tidewater when your device is in light mode, Neon Terminal when it's in dark.

## Tokens, not themes

Both design systems ship their colors as CSS custom properties, scoped to `data-theme="light"` and `data-theme="dark"`. The site's own styles never use a color directly. They use a small set of neutral tokens, and each mode fills them in:

```css
:root {
  --bg: #f7fbfc;        /* Tidewater ground */
  --heading: #0b2530;
  --card-radius: 12px;
  --tag-open: "";
}

:root[data-theme="dark"] {
  --bg: #05080a;        /* Neon Terminal void */
  --heading: #00f0ff;
  --card-radius: 0;
  --tag-open: "[";
}

.tag::before { content: var(--tag-open); }
```

Even the punctuation lives in tokens. A tag is a cyan pill in light mode and `[bracketed]` in dark mode, with the same markup. Project status works the same way: "● Active" in Tidewater, `[ACTIVE]` in green in Neon Terminal. The posts themselves are plain sentence case. Neon Terminal's uppercase headings and `// labels` come from CSS, so one piece of Markdown reads right in both.

## Following the device, with an override

With no choice saved, the mode follows `prefers-color-scheme`. The toggle in the header saves a choice in `localStorage` and sets `data-theme` on the page. The dark tokens therefore appear twice in the stylesheet: once inside the media query (for "the device says dark and you haven't picked light"), and once under `[data-theme="dark"]`. CSS can't share one block between a media query and an attribute selector.

The script that applies a saved choice loads in `<head>` without `defer`. If it waited for the page to load, picking dark on a light-mode device would flash Tidewater on every page before switching.

## Code and diagrams

Code blocks use [Shiki](https://shiki.style/)'s `css-variables` theme, so syntax colors are tokens too, and the palette matches the themes I made for my Forgejo. Diagrams are [Mermaid](https://mermaid.js.org/), drawn in the browser with the current mode's colors and redrawn when you flip the toggle. Mermaid is large, so it only loads on pages that have a diagram. This page doesn't, so the only script here is the toggle.
