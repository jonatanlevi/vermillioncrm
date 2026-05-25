/**
 * backup-db.js — daily SQLite backup for VerMillion CRM
 * Usage: node scripts/backup-db.js
 * Env overrides: BACKUP_DB_SOURCE, BACKUP_DEST
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── Resolve source ────────────────────────────────────────────────────────────
function resolveSource() {
  const candidates = [
    process.env.BACKUP_DB_SOURCE,
    path.join('C:', 'Users', '97254', 'Desktop', 'vermillioncrm', 'prisma', 'dev.db'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'vermillioncrm', 'data', 'dev.db'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Resolve destination ───────────────────────────────────────────────────────
// Backup stays local — no cloud sync paths.
// Override with BACKUP_DEST env var to point to an external drive or network share.
function resolveDest() {
  if (process.env.BACKUP_DEST) return process.env.BACKUP_DEST;

  const docs = path.join('C:', 'Users', '97254', 'Documents', 'vermillion-backups');
  fs.mkdirSync(docs, { recursive: true });
  return docs;
}

// ── Date stamp ───────────────────────────────────────────────────────────────
function todayStamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Prune old backups (keep last 7) ──────────────────────────────────────────
function pruneOld(destDir) {
  const files = fs.readdirSync(destDir)
    .filter(f => f.startsWith('dev.db.') && f.endsWith('.bak'))
    .sort(); // lexicographic = chronological for YYYY-MM-DD

  while (files.length > 7) {
    const oldest = files.shift();
    fs.unlinkSync(path.join(destDir, oldest));
  }
  return files.length;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const src = resolveSource();
  if (!src) {
    console.error('[backup] ERROR: לא נמצא קובץ dev.db בשום מסלול');
    process.exit(1);
  }
  console.log(`[backup] Source: ${src}`);

  let destDir;
  try {
    destDir = resolveDest();
  } catch (e) {
    console.error(`[backup] ERROR: לא ניתן ליצור תיקיית backup — ${e.message}`);
    process.exit(1);
  }
  console.log(`[backup] Destination: ${destDir}`);

  const destFile = path.join(destDir, `dev.db.${todayStamp()}.bak`);
  try {
    fs.copyFileSync(src, destFile);
  } catch (e) {
    console.error(`[backup] ERROR: העתקה נכשלה — ${e.message}`);
    process.exit(1);
  }

  const kept = pruneOld(destDir);
  console.log(`[backup] Done ✓ — kept ${kept} backups`);
}

main();
