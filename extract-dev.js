// extract-devicecard.js
// Usage: node extract-devicecard.js [outputFile]
// Default: node extract-devicecard.js devicecards.txt
const fs = require("fs");
const path = require("path");

// Hardcoded list of files based on the requested selection
const filesToProcess = [
  "components/access-port-lab.tsx",
  "components/asymmetric-lab-3.tsx",
  "components/asymmetriclab2.tsx",
  "components/mls-ring-lab.tsx",
  "components/netsim.tsx",
  "components/static-routing-lab.tsx"
];

const out = process.argv[2] || "devicecards.txt";

const START = /^(export\s+)?function DeviceCard\s*\(/; // function at column 0
const END = /^}\s*;?\s*$/; // closing brace at column 0 (prettier formatting)

let found = 0;
const chunks = [];
const missing = [];

// Filter out files that don't exist to prevent crashes
const validFiles = filesToProcess.filter(file => {
  if (!fs.existsSync(file)) {
    console.warn(`Warning: File not found - ${file}`);
    return false;
  }
  return true;
});

for (const file of validFiles.sort()) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => START.test(l));
  if (start === -1) continue;

  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (END.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    missing.push(file);
    continue;
  }

  found++;
  chunks.push(
    [
      "=".repeat(80),
      `FILE: ${file}   (lines ${start + 1}-${end + 1})`,
      "=".repeat(80),
      lines.slice(start, end + 1).join("\n"),
      "",
    ].join("\n"),
  );
}

fs.writeFileSync(out, chunks.join("\n"), "utf8");
console.log(`Extracted DeviceCard from ${found} file(s) → ${out}`);
if (missing.length) console.log("Could not find the end of the function in:\n  " + missing.join("\n  "));