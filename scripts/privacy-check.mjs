// Fails if the built site contains details that must never be published:
// private IPv4 addresses, email addresses or token prefixes.
// See plans/completed/site-plan.md, D7.
//
// Usage: node scripts/privacy-check.mjs <dir>

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.argv[2] ?? "dist";
const TEXT = new Set([".html", ".xml", ".txt", ".json", ".js", ".css", ".svg", ".webmanifest"]);

const RULES = [
  ["private IPv4 (10/8)", /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g],
  ["private IPv4 (172.16/12)", /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g],
  ["private IPv4 (192.168/16)", /\b192\.168\.\d{1,3}\.\d{1,3}\b/g],
  ["email address", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g],
  ["API key (sk-)", /\bsk-[A-Za-z0-9_-]{16,}/g],
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (TEXT.has(extname(name))) yield path;
  }
}

let problems = 0;
for (const path of files(root)) {
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const [label, re] of RULES) {
      for (const m of line.matchAll(re)) {
        problems++;
        console.error(`${relative(root, path)}:${i + 1}: ${label}: ${m[0]}`);
      }
    }
  });
}

if (problems) {
  console.error(`\n${problems} problem(s). These details must not be published (site-plan D7).`);
  process.exit(1);
}
console.log(`privacy check: ${root} is clean`);
