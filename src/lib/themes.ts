// Reads the design systems from the themes repo (the `themes` git submodule),
// which is their source of truth. Each theme page renders its README.md and
// builds its showcase from its THEME.md, so the site can't drift from the repo.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ThemeInfo {
  /** Folder name in the themes repo, also the URL slug. */
  id: string;
  name: string;
  mode: "light" | "dark";
  tagline: string;
  /** Section labels: Neon Terminal writes them as comments ("// color"). */
  labelPrefix: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: "neon-terminal",
    name: "Neon Terminal",
    mode: "dark",
    tagline: "Signal in the dark: near-black, one hot cyan for action, neon only where it means something.",
    labelPrefix: "// ",
  },
  {
    id: "tidewater",
    name: "Tidewater",
    mode: "light",
    tagline: "Cyan, then quiet: one calm hue for every action, cool neutrals, nothing extra.",
    labelPrefix: "",
  },
];

export const REPO = "https://github.com/baron-hines/themes";

export interface Token {
  name: string;
  value: string;
  note?: string;
  group: string;
}

export interface Pattern {
  caption: string;
  html: string;
}

export interface ThemeSource {
  fontsHref?: string;
  tokensCss: string;
  componentsCss: string;
  tokens: Token[];
  patterns: Pattern[];
}

function readThemeFile(id: string, file: string): string {
  return readFileSync(join(process.cwd(), "themes", id, file), "utf8").replace(/^﻿/, "");
}

/** The text of a "## heading" section, up to the next level-2 heading. */
function section(md: string, heading: string): string {
  const start = md.search(new RegExp(`^## ${heading}\\s*$`, "m"));
  if (start < 0) throw new Error(`THEME.md has no "## ${heading}" section`);
  const rest = md.slice(start).split("\n").slice(1).join("\n");
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

function codeBlocks(text: string, lang: string): string[] {
  return [...text.matchAll(new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g"))].map((m) => m[1]);
}

/** "--name: value; /* note *\/" declarations, grouped by the comment line above them. */
function parseTokens(css: string): Token[] {
  const tokens: Token[] = [];
  let group = "Tokens";
  for (const line of css.split("\n")) {
    const heading = line.match(/^\s*\/\*\s*(.+?)\s*\*\/\s*$/);
    if (heading) {
      group = heading[1].replace(/[.:]$/, "");
      continue;
    }
    const decls = [...line.matchAll(/--([\w-]+):\s*([^;]+);/g)];
    const note = line.match(/\/\*\s*(.+?)\s*\*\/\s*$/)?.[1];
    decls.forEach((d, i) =>
      tokens.push({
        name: `--${d[1]}`,
        value: d[2].trim(),
        // A trailing comment describes the line's only (or last) declaration.
        note: i === decls.length - 1 ? note : undefined,
        group,
      }),
    );
  }
  return tokens;
}

function parsePatterns(components: string): Pattern[] {
  const start = components.search(/^### Markup patterns\s*$/m);
  if (start < 0) throw new Error('THEME.md has no "### Markup patterns" section under Components');
  const text = components.slice(start).split("\n").slice(1).join("\n");
  const patterns: Pattern[] = [];
  const re = /([^\n`][^\n]*)\n+```html\n([\s\S]*?)```/g;
  for (const m of text.matchAll(re)) {
    patterns.push({ caption: m[1].trim().replace(/:$/, ""), html: m[2] });
  }
  return patterns;
}

export function loadTheme(id: string): ThemeSource {
  const md = readThemeFile(id, "THEME.md");
  const fontsHtml = codeBlocks(section(md, "Fonts"), "html")[0] ?? "";
  const tokensCss = codeBlocks(section(md, "Tokens"), "css")[0];
  const components = section(md, "Components");
  const componentsCss = codeBlocks(components, "css")[0];
  if (!tokensCss || !componentsCss) throw new Error(`THEME.md for ${id} is missing its tokens or components CSS`);
  return {
    fontsHref: fontsHtml.match(/href="([^"]+)"/)?.[1],
    tokensCss,
    componentsCss,
    tokens: parseTokens(tokensCss),
    patterns: (() => {
      const patterns = parsePatterns(components);
      if (patterns.length === 0) throw new Error(`THEME.md for ${id} has no html blocks under "### Markup patterns"`);
      return patterns;
    })(),
  };
}

/** The theme's CSS, moved from the page onto a shadow root's host. */
export function shadowCss(source: ThemeSource): string {
  const scope = (css: string) =>
    css
      .replace(/:root\b/g, ":host")
      // The theme styles `body`; inside the showcase, `.page` plays that part.
      .replace(/(^|[\s,}])body(?=\s*[{,])/gm, "$1.page");
  return `:host { all: initial; display: block; }\n${scope(source.tokensCss)}\n${scope(source.componentsCss)}`;
}
