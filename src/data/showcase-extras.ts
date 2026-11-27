// Demos for the parts of each theme that THEME.md defines in CSS but doesn't
// show in its markup patterns. Every class used here comes from that theme's
// THEME.md components block; the showcase renders it with that CSS only.
import type { Pattern } from "../lib/themes";

/** A small line chart drawn the way each theme's Charts rules say. */
function chart(line: string, grid: string, axis: string, fillOpacity: number): string {
  const pts = [38, 30, 34, 22, 26, 14, 18, 10];
  const x = (i: number) => 40 + i * 50;
  const path = pts.map((y, i) => `${i ? "L" : "M"}${x(i)} ${y * 3}`).join(" ");
  const area = `${path} L${x(pts.length - 1)} 130 L${x(0)} 130 Z`;
  const gridLines = [30, 60, 90, 130]
    .map((y) => `<line x1="40" x2="390" y1="${y}" y2="${y}" stroke="var(${grid})" stroke-width="1"/>`)
    .join("");
  return `<svg viewBox="0 0 400 150" width="100%" style="max-width: 440px; display: block" role="img" aria-label="Example line chart">
  ${gridLines}
  <path d="${area}" fill="var(${line})" fill-opacity="${fillOpacity}"/>
  <path d="${path}" fill="none" stroke="var(${line})" stroke-width="2" stroke-linejoin="round"/>
  <text x="34" y="134" text-anchor="end" font-size="11" fill="var(${axis})" font-family="var(--font-mono)">0</text>
  <text x="34" y="34" text-anchor="end" font-size="11" fill="var(${axis})" font-family="var(--font-mono)">100</text>
</svg>`;
}

const neonTerminal: Pattern[] = [
  {
    caption: "Disabled button and the other tags",
    html: `<div class="sc-row">
  <button class="btn" disabled>Execute</button>
  <span class="tag tag-idle">[IDLE]</span>
  <span class="tag tag-new">[NEW]</span>
</div>`,
  },
  {
    caption: "Checkbox",
    html: `<label class="sc-row"><input type="checkbox" checked> Retry failed jobs</label>`,
  },
  {
    caption: "Big-number tiles",
    html: `<div class="sc-tiles">
  <div class="stat"><span class="label">// jobs waiting</span><span class="stat-value">1,204</span><span class="small">oldest 4s</span></div>
  <div class="stat"><span class="label">// workers</span><span class="stat-value">12</span><span class="small">2 idle</span></div>
  <div class="stat"><span class="label">// failed today</span><span class="stat-value" style="color: var(--red)">3</span><span class="small"><span class="tag tag-error">[DOWN]</span> worker-09</span></div>
</div>`,
  },
  {
    caption: "Segmented progress",
    html: `<div class="progress" role="img" aria-label="7 of 10"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i></div>
<div class="small">7 of 10 shards synced</div>`,
  },
  {
    caption: "Top bar and navigation",
    html: `<div class="topbar">
  <span class="brand">NEON//QUEUES</span>
  <nav><a class="nav-link" href="#" aria-current="page">Queues</a><a class="nav-link" href="#">Workers</a><a class="nav-link" href="#">Logs</a></nav>
</div>`,
  },
  {
    caption: "Log lines and a shell prompt",
    html: `<section class="window">
  <div class="window-bar"><span>Log / worker-03</span><span class="tag-ok">[ONLINE]</span></div>
  <div class="window-body" style="font-size: 13px; line-height: 22px">
    <div><span style="color: var(--green)">[ok]</span> job 4412 finished in 1.2s</div>
    <div><span style="color: var(--acid)">[warn]</span> queue invoices above 1,000 waiting</div>
    <div><span style="color: var(--red)">[err]</span> job 4415 timed out after 30s</div>
    <div><span style="color: var(--dim)">user@host:~</span><span style="color: var(--green)">$</span> deploy --target edge</div>
  </div>
</section>`,
  },
  {
    caption: "A line chart",
    html: chart("--cyan", "--line", "--dim", 0.15),
  },
  {
    caption: "Names and code keep their case",
    html: `<h2>Deploying <code>kiosk</code> to the edge</h2>
<p class="small">The heading is uppercase, but the repo name inside it stays as written.</p>`,
  },
  {
    caption: "Reading column",
    html: `<div class="reading" style="margin: 0">
  <p>Long text in a monospace face is hard to follow from the end of one line to the start of the next. On a page that is mostly text, the column stops at 68 characters and the lines get a little more room.</p>
  <p>Dashboards and tools keep the full-width layout. This is for articles, docs and write-ups.</p>
</div>`,
  },
];

const tidewater: Pattern[] = [
  {
    caption: "Ghost and disabled buttons, and the other tags",
    html: `<div class="sc-row">
  <button class="btn btn-ghost">Cancel</button>
  <button class="btn" disabled>Create project</button>
  <span class="tag tag-idle">Idle</span>
  <span class="tag tag-info">Beta</span>
  <span class="tag tag-selected">Selected</span>
</div>`,
  },
  {
    caption: "Checkbox",
    html: `<label class="sc-row"><input type="checkbox" checked> Email me when a job fails</label>`,
  },
  {
    caption: "Information alert and a floating card",
    html: `<div class="sc-stack">
  <div class="alert"><div><strong>Backups are on</strong><div>The first one runs tonight at 03:30.</div></div></div>
  <section class="card card-floating"><h3>Share project</h3><p class="small">Floating cards are for menus and dialogs only.</p></section>
</div>`,
  },
  {
    caption: "Big-number tiles",
    html: `<div class="sc-tiles">
  <div class="stat"><span class="label">Jobs waiting</span><span class="stat-value">1,204</span><span class="small">Oldest 4s</span></div>
  <div class="stat"><span class="label">Workers</span><span class="stat-value">12</span><span class="small">2 idle</span></div>
  <div class="stat"><span class="label">Failed today</span><span class="stat-value">3</span><span class="small"><span class="tag tag-error">Failing</span></span></div>
</div>`,
  },
  {
    caption: "Top bar and navigation",
    html: `<div class="topbar">
  <strong style="font: 600 18px var(--font-display)">Queuewatch</strong>
  <nav><a class="nav-link" href="#" aria-current="page">Queues</a><a class="nav-link" href="#">Workers</a><a class="nav-link" href="#">Settings</a></nav>
</div>`,
  },
  {
    caption: "A line chart",
    html: chart("--primary", "--border", "--muted", 0.12),
  },
];

export const SHOWCASE_EXTRAS: Record<string, Pattern[]> = {
  "neon-terminal": neonTerminal,
  tidewater,
};
