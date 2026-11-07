const fs = require("fs");
const path = require("path");

const dir = process.argv[2] || "components";

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(p);
    return /\.(tsx?|jsx?)$/.test(e.name) ? [p] : [];
  });
}

const START = /^(export\s+)?function DeviceCard\s*\(/;
const END = /^}\s*;?\s*$/;

const EDITS = [
  [
    "const [ran, setRan] = useState(false);",
    "const [ran, setRan] = useState(false);\n  const [open, setOpen] = useState(false); // collapsed by default",
  ],
  [
    "{device.id}",
    `<span
          onClick={() => setOpen((o) => !o)}
          style={{ flex: 1, cursor: "pointer", userSelect: "none" }}
        >
          {open ? "▾" : "▸"} {device.id}
        </span>`,
  ],
  ["padding: 6,", 'padding: 6, display: open ? "block" : "none",'],
];

for (const file of walk(dir).sort()) {
  const raw = fs.readFileSync(file, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);

  const start = lines.findIndex((l) => START.test(l));
  if (start === -1) continue;
  let end = -1;
  for (let i = start; i < lines.length; i++) if (END.test(lines[i])) { end = i; break; }
  if (end === -1) { console.log(`SKIP (no end found): ${file}`); continue; }

  let seg = lines.slice(start, end + 1).join("\n");
  if (seg.includes("setOpen")) { console.log(`already patched: ${file}`); continue; }

  const missed = [];
  for (const [from, to] of EDITS) {
    if (!seg.includes(from)) { missed.push(from); continue; }
    seg = seg.replace(from, () => to); // function form: no $ patterns
  }

  lines.splice(start, end - start + 1, ...seg.split("\n"));
  fs.writeFileSync(file, lines.join(eol), "utf8");
  console.log(`${missed.length ? "PARTIAL" : "patched"}: ${file}${missed.length ? "  (missing: " + missed.join(" | ") + ")" : ""}`);
}