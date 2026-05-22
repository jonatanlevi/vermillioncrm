const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  return { key, val };
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const p = parseEnvLine(line);
    if (p) out[p.key] = p.val;
  }
  return out;
}

/** תיקיית פרויקט עם .env + dev.db (פיתוח / win-unpacked ליד הפרויקט) */
function findProjectRoot(execPath) {
  const candidates = [
    path.join(__dirname, ".."),
    execPath ? path.join(path.dirname(execPath), "..", "..") : null,
    path.join(process.env.USERPROFILE || "", "Desktop", "vermillioncrm"),
  ].filter(Boolean);

  for (const root of candidates) {
    const pkg = path.join(root, "package.json");
    const env = path.join(root, ".env");
    const db = path.join(root, "prisma", "dev.db");
    if (fs.existsSync(pkg) && fs.existsSync(env) && fs.existsSync(db)) {
      return root;
    }
  }
  return null;
}

function ensureUserEnv(userDataDir, examplePath) {
  const envPath = path.join(userDataDir, ".env");
  const example =
    examplePath && fs.existsSync(examplePath)
      ? fs.readFileSync(examplePath, "utf8")
      : "";

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, example || "", "utf8");
  }

  let content = fs.readFileSync(envPath, "utf8");
  let changed = false;

  if (!/^AUTH_SECRET=.+/m.test(content)) {
    const secret = crypto.randomBytes(32).toString("base64");
    content += `\nAUTH_SECRET=${secret}\n`;
    changed = true;
  }

  if (changed) fs.writeFileSync(envPath, content, "utf8");
  return envPath;
}

function ensureUserDatabase(userDataDir, templateDbPath) {
  const prismaDir = path.join(userDataDir, "prisma");
  const dbPath = path.join(prismaDir, "dev.db");
  fs.mkdirSync(prismaDir, { recursive: true });

  if (!fs.existsSync(dbPath) && templateDbPath && fs.existsSync(templateDbPath)) {
    fs.copyFileSync(templateDbPath, dbPath);
  }

  return dbPath;
}

/**
 * נתיבי .env ו-DB — קודם פרויקט (המשתמש שלך), אחרת AppData (התקנה נקייה).
 */
function resolveDataPaths({ isPackaged, execPath, userDataDir, exampleEnv, templateDb }) {
  const projectRoot = findProjectRoot(execPath);
  if (projectRoot) {
    return {
      source: "project",
      projectRoot,
      envPath: path.join(projectRoot, ".env"),
      dbPath: path.join(projectRoot, "prisma", "dev.db"),
    };
  }

  return {
    source: "userData",
    projectRoot: null,
    envPath: ensureUserEnv(userDataDir, exampleEnv),
    dbPath: ensureUserDatabase(userDataDir, templateDb),
  };
}

module.exports = {
  loadEnvFile,
  ensureUserEnv,
  ensureUserDatabase,
  findProjectRoot,
  resolveDataPaths,
};
