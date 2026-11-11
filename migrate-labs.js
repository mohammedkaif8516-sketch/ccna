#!/usr/bin/env node
/**
 * Applies the "ccna-lab" theme migration to the lab .tsx files.
 *
 * Usage:
 *   node migrate-labs.js [dir] [--dry]
 *
 *   dir    folder to search recursively (default: app/labs)
 *   --dry  show what would change, write nothing
 *
 * Whitespace-tolerant (regex based) and idempotent: running it twice is safe.
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ROOT = args.find((a) => !a.startsWith("--")) || "components/labs";

const TARGETS = new Set([
  "eigrp-lab.tsx",
  "etherch-lab.tsx",
  "intervlan-lab.tsx",
  "inter-vlan-sticl-subinterface.tsx",
  "manual-trunk-lab.tsx",
  "mls-ring-lab.tsx",
  "ospf-lab.tsx",
  "phy-log.tsx",
  "rip-v1.tsx",
  "rip-v2.tsx",
  "static-routing-lab.tsx",
  "vtp-labs.tsx",
  "dtp-trunk-lab.tsx",
]);

// Rules applied to every file. `min` = how many matches we expect at least
// (a warning is printed if fewer are found and the file isn't already migrated).
const RULES = [
  {
    name: "Colored: hardcoded colors -> CSS vars",
    min: 1,
    re: /const color =[\s\S]*?"inherit";/g,
    to: (block) =>
      block
        .replace(/"#c084fc"/g, '"var(--primary)"')
        .replace(/"#38bdf8"/g, '"var(--accent)"'),
    // only count if something actually changed
    changed: (m, out) => m !== out,
  },
  {
    name: "row hover: sky -> primary",
    min: 1,
    re: /hover:bg-sky-500\/10/g,
    to: () => "hover:bg-primary/10",
  },
  {
    name: "Run-all button: sky -> primary",
    min: 1,
    re: /"bg-sky-600 hover:bg-sky-500"/g,
    to: () => '"bg-primary hover:bg-primary/90"',
  },
  {
    name: "DeviceCard wrapper",
    min: 1,
    re: /<div\s+style=\{\{\s*alignSelf:\s*"start",\s*border:\s*"1px solid rgba\(128,\s*128,\s*128,\s*\.25\)",\s*borderRadius:\s*10,\s*overflow:\s*"hidden",?\s*\}\}\s*>/g,
    to: () => '<div className="ccna-lab__device glass glass-hover">',
  },
  {
    name: "DeviceCard header",
    min: 1,
    re: /(<div className="ccna-lab__device glass glass-hover">\s*)<div(\s+)style=/g,
    to: (_m, a, ws) => `${a}<div className="ccna-lab__device-header"${ws}style=`,
  },
  {
    name: "DeviceCard body",
    min: 1,
    re: /<div(\s+)style=\{\{(?=\s*padding:\s*6,\s*display:\s*open)/g,
    to: (_m, ws) => `<div className="ccna-lab__device-commands"${ws}style={{`,
  },
  {
    name: "Outermost wrapper (.ccna-lab)",
    min: 1,
    re: /<div(\s+)style=\{\{(?=\s*display:\s*"grid",\s*gap:\s*(?:14|48),\s*(?:maxWidth|width):\s*"100%")/g,
    to: (_m, ws) => `<div className="ccna-lab"${ws}style={{`,
  },
  {
    name: "<details> panels",
    min: 1,
    re: /<details(\s+)style=/g,
    to: (_m, ws) => `<details className="ccna-lab__panel"${ws}style=`,
  },
];

// File-specific rules
const EXTRA = {
  "static-routing-lab.tsx": [
    {
      name: "SKY const",
      min: 1,
      re: /const SKY = "#38bdf8";/g,
      to: () => 'const SKY = "var(--primary)";',
    },
    {
      name: "AMBER const",
      min: 1,
      re: /const AMBER = "#f59e0b";/g,
      to: () => 'const AMBER = "var(--accent)";',
    },
    {
      name: "GREEN const",
      min: 1,
      re: /const GREEN = "#22c55e";/g,
      to: () => 'const GREEN = "#16a34a";',
    },
  ],
};

// Things that should be gone after migration
const LEFTOVERS = [
  /"#c084fc"/,
  /"#38bdf8"/,
  /hover:bg-sky-500\/10/,
  /bg-sky-600/,
  /<details\s+style=/,
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TARGETS.has(e.name)) out.push(p);
  }
  return out;
}

if (!fs.existsSync(ROOT)) {
  console.error(`Directory not found: ${ROOT}`);
  process.exit(1);
}

const files = walk(ROOT);
const missing = [...TARGETS].filter((t) => !files.some((f) => path.basename(f) === t));
let totalChanged = 0;

for (const file of files) {
  const base = path.basename(file);
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  const report = [];

  for (const rule of [...RULES, ...(EXTRA[base] || [])]) {
    let count = 0;
    src = src.replace(rule.re, (...m) => {
      const out = rule.to(...m);
      if (!rule.changed || rule.changed(m[0], out)) count++;
      return out;
    });
    report.push({ name: rule.name, count, min: rule.min });
  }

  console.log(`\n${file}`);
  for (const r of report) {
    const flag = r.count === 0 ? (r.min ? "  (0 – already done or not found)" : "") : "";
    console.log(`  ${r.count > 0 ? "✔" : "·"} ${r.name}: ${r.count}${flag}`);
  }

  const left = LEFTOVERS.filter((re) => re.test(src));
  if (left.length) console.log(`  ⚠ leftover patterns still present: ${left.map(String).join(", ")}`);

  if (src !== orig) {
    totalChanged++;
    if (!DRY) fs.writeFileSync(file, src, "utf8");
    console.log(DRY ? "  → would write" : "  → written");
  } else {
    console.log("  → no changes");
  }
}

if (missing.length) console.log(`\n⚠ Not found under ${ROOT}: ${missing.join(", ")}`);
console.log(`\n${DRY ? "[dry run] " : ""}${totalChanged}/${files.length} files ${DRY ? "would be " : ""}modified.`);