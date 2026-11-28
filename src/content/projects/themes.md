---
title: Themes
summary: Two design systems, Tidewater for light and Neon Terminal for dark, written so people and AI agents apply them the same way every time.
status: active
repo: https://github.com/baron-hines/themes
links:
  - label: Neon Terminal, the dark theme
    href: /projects/themes/neon-terminal/
  - label: Tidewater, the light theme
    href: /projects/themes/tidewater/
tags: [design, css, design-systems]
---

I keep two design systems in [a repo of plain files](https://github.com/baron-hines/themes), so that anything I build, by hand or with an AI agent, comes out looking the same. Each one has only its own mode. Together they make a light/dark pair: this site uses Tidewater in light mode and Neon Terminal in dark mode, and so does the Forgejo on my home server.

## The themes

| Theme | Mode | In one line |
|---|---|---|
| [Neon Terminal](/projects/themes/neon-terminal/) | Dark | Signal in the dark: near-black, one hot cyan for action, neon only where it means something. |
| [Tidewater](/projects/themes/tidewater/) | Light | Cyan, then quiet: one calm hue for every action, cool neutrals, nothing extra. |

Each theme's page covers its design philosophy and shows every token and component live, rendered from the repo's own files.

## What a theme covers

- **Tokens:** every color, font, space step, radius, shadow or glow, as CSS custom properties.
- **Components:** buttons, form fields, status tags, cards or windows, alerts, big-number tiles, table rows, the top bar and navigation.
- **Markup patterns:** the HTML that goes with the components.
- **Rules:** which color does which job, how labels, buttons and errors are worded, layout, charts, a "do not" list, and a checklist to run before a screen is done.

## How they're written

Each theme folder has two files:

- **`README.md`** is for people: the design philosophy and the foundations behind it.
- **`THEME.md`** is the build guide. It's written to be followed literally ("copy the CSS blocks unchanged", "do not add new colors"), because AI agents follow exact instructions far more reliably than taste. It ends with a checklist the builder answers before calling a screen done.

Changes start as [proposals](https://github.com/baron-hines/themes/blob/main/PROPOSALS.md). The first ones came from building this site: the themes were designed for dashboards, and a site that is mostly text found the gaps. Neon Terminal now has a reading column for long text, keeps lowercase names like `oscar-wallpaper` in their own case inside its uppercase headings, and saves cyan for what you can click.
