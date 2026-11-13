import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LABS_DIR = path.join(__dirname, "components", "labs");

const IMPORT = `import { normalizeKey, type LabExport } from "@/lib/lab-registry";\n`;
const EXPORT = `\nexport const LAB_EXPORT: LabExport = { answerKey: normalizeKey(ANSWER_KEY) };\n`;

if (!fs.existsSync(LABS_DIR)) {
  console.error(`❌ Directory not found: ${LABS_DIR}`);
  process.exit(1);
}

let modified = 0;
const needsManual = [];

for (const file of fs.readdirSync(LABS_DIR).filter((f) => f.endsWith(".tsx"))) {
  const filePath = path.join(LABS_DIR, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("LAB_EXPORT")) {
    console.log(`⏭️  Skipped (already has LAB_EXPORT): ${file}`);
    continue;
  }
  // only files that actually declare a top-level ANSWER_KEY
  if (!/^\s*(export\s+)?(const|let)\s+ANSWER_KEY\b/m.test(content)) {
    needsManual.push(file);
    continue;
  }

  // insert the import AFTER the "use client" directive, not before it
  const directive = /^(\s*(?:\/\*[\s\S]*?\*\/\s*)?)?(["'])use client\2;?[ \t]*\r?\n/;
  const m = content.match(directive);
  if (m) {
    const end = m[0].length;
    content = content.slice(0, end) + IMPORT + content.slice(end);
  } else {
    content = IMPORT + content;
  }

  content += EXPORT;
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Updated: ${file}`);
  modified++;
}

console.log(`\nDone! Modified ${modified} files.`);
if (needsManual.length) {
  console.log(`\n⚠️  No top-level ANSWER_KEY, handle manually:\n  ${needsManual.join("\n  ")}`);
}