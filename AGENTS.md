# Instructions for AI agents

For any AI coding agent working in this repository. [README.md](README.md) is the reference for how the site is built and published. Read it first. This file covers what agents keep tripping over.

## Setting up a worktree

A new worktree, from `git worktree add` or a `.claude/worktrees/` checkout, starts with an empty `themes/` folder and no `node_modules`. `themes` is a git submodule, and a worktree doesn't check submodules out. Without it, `npm run build` stops with "The themes repo has no neon-terminal/README.md". Before building or viewing a page, run this in the worktree:

```powershell
git submodule update --init themes
```
```powershell
npm ci
```

`npm run check` passing doesn't show that a page renders correctly. Before merging a UI change, build it and look at the page in light and dark mode and at a narrow width, as [Running it locally](README.md#running-it-locally) describes.

## Writing posts and project pages

Follow [Rules that protect the site](README.md#rules-that-protect-the-site). `npm run privacy-check` catches private IP addresses, email addresses and token prefixes. It doesn't catch hostnames, ports, domains, account or project IDs, or file paths, so leave those out by hand.

`privacy-check` scans `dist/`, and a post with `draft: true` isn't built into `dist/`. A draft is never checked until it's published. Before removing `draft: true`, run `npm run build` and `npm run privacy-check` with the post published, and read it once more against the rules.

The owner approves anything under `src/content/` before it goes live, because it publishes their writing.

## Attribution

PR descriptions and comments end with one footer line naming the agent and the model that actually answered, for example `🤖 Generated with [Claude Code](https://claude.com/claude-code) · <model> ·`. Commit messages end with a `Co-Authored-By:` trailer naming the same. Read the model's name right before writing it; if it can't be read, leave it out rather than guess.
