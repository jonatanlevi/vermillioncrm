/**
 * אחרי `next build` — מכין את תיקיית standalone ל-Electron (העתקה ל-extraResources).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn("[prepare-electron] missing:", src);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(standaloneDir)) {
  console.error("[prepare-electron] Run `next build` first (output: standalone).");
  process.exit(1);
}

console.log("[prepare-electron] Copy .next/static …");
fs.mkdirSync(path.dirname(staticDest), { recursive: true });
copyDir(staticSrc, staticDest);

console.log("[prepare-electron] Copy public …");
copyDir(publicSrc, publicDest);

const prismaInStandalone = path.join(standaloneDir, "prisma");
fs.mkdirSync(prismaInStandalone, { recursive: true });
fs.copyFileSync(
  path.join(root, "prisma", "schema.prisma"),
  path.join(prismaInStandalone, "schema.prisma")
);

// Prisma query engine — לעיתים לא נכלל ב-trace של Next
const prismaClient = path.join(root, "node_modules", ".prisma");
const prismaEngines = path.join(root, "node_modules", "@prisma", "engines");
const destModules = path.join(standaloneDir, "node_modules");
if (fs.existsSync(prismaClient)) {
  console.log("[prepare-electron] Copy .prisma client …");
  copyDir(prismaClient, path.join(destModules, ".prisma"));
}
if (fs.existsSync(prismaEngines)) {
  console.log("[prepare-electron] Copy @prisma/engines …");
  copyDir(prismaEngines, path.join(destModules, "@prisma", "engines"));
}

// DB ריק עם סכמה — יועתק ל-AppData בהתקנה ראשונה
const templateDb = path.join(root, "electron", "template.db");
const templateUrl = `file:${templateDb.replace(/\\/g, "/")}`;
console.log("[prepare-electron] Create template.db …");
if (fs.existsSync(templateDb)) fs.unlinkSync(templateDb);
execSync("npx prisma db push --skip-generate", {
  cwd: root,
  env: { ...process.env, DATABASE_URL: templateUrl },
  stdio: "inherit",
});

console.log("[prepare-electron] Done. Standalone at:", standaloneDir);
