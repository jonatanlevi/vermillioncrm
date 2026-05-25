/**
 * pack-safe.js — builds the installer in 3 steps:
 * 1. electron-builder --dir  → creates win-unpacked (no pruning of extraResources)
 * 2. robocopy standalone     → copies .next/standalone (with full node_modules) into win-unpacked
 * 3. electron-builder nsis --prepackaged → wraps win-unpacked into Setup.exe
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const STANDALONE  = path.join(ROOT, '.next', 'standalone');
const WIN_UNPACKED = path.join(ROOT, 'dist-electron', 'win-unpacked');
const DEST_RES    = path.join(WIN_UNPACKED, 'resources', 'standalone');

function run(cmd, args, opts = {}) {
  console.log(`\n[pack-safe] > ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT, ...opts });
  if (r.status !== 0 && r.status !== null) {
    console.error(`[pack-safe] FAILED (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
  return r.status;
}

function robocopy(src, dst) {
  console.log(`\n[pack-safe] robocopy ${src} → ${dst}`);
  const r = spawnSync(
    'robocopy',
    [src, dst, '/E', '/R:5', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS'],
    { stdio: 'inherit', shell: true }
  );
  // robocopy: 0=no files, 1=copied OK, >=8 = error
  if (r.status >= 8) {
    console.error(`[pack-safe] robocopy failed (exit ${r.status})`);
    process.exit(1);
  }
}

// ── Step 0: verify standalone exists ─────────────────────────────────────────
if (!fs.existsSync(STANDALONE)) {
  console.error('[pack-safe] .next/standalone missing — run npm run build:standalone first');
  process.exit(1);
}

// ── Step 0b: verify static files were copied into standalone ─────────────────
const STANDALONE_STATIC = path.join(STANDALONE, '.next', 'static');
const staticOk = fs.existsSync(STANDALONE_STATIC) &&
  fs.readdirSync(STANDALONE_STATIC).some(e =>
    ['chunks', 'css', 'media'].includes(e)
  );
if (!staticOk) {
  console.error('[pack-safe] ERROR: .next/static was not copied into standalone — run `npm run build:standalone` first, not just `electron:pack`');
  process.exit(1);
}

// ── Step 1: build win-unpacked (no NSIS, no pruning) ─────────────────────────
console.log('\n[pack-safe] Step 1 — electron-builder --dir');
run('npx', ['electron-builder', '--win', '--x64', '--dir']);

// ── Step 1b: embed app icon via rcedit (signAndEditExecutable:false skips it) ─
const exePath   = path.join(WIN_UNPACKED, 'VerMillion CRM.exe');
const iconPath  = path.join(ROOT, 'electron', 'icon.ico');
const rcEditExe = path.join(ROOT, 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe');
if (fs.existsSync(exePath) && fs.existsSync(iconPath) && fs.existsSync(rcEditExe)) {
  console.log('\n[pack-safe] Step 1b — embedding icon with rcedit');
  // electron-builder may hold the file briefly after exiting — retry up to 5 times
  let rceditOk = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { execSync } = require('child_process');
    try { execSync('ping -n 2 127.0.0.1 > nul', { shell: true }); } catch (_) {} // ~1s wait
    const r = spawnSync(rcEditExe, [exePath, '--set-icon', iconPath], { stdio: 'inherit', shell: false });
    if (r.status === 0) { rceditOk = true; break; }
    console.warn(`[pack-safe] rcedit attempt ${attempt} failed (exit ${r.status}), retrying...`);
  }
  if (!rceditOk) {
    console.error('[pack-safe] rcedit FAILED after all retries');
    process.exit(1);
  }
} else {
  console.warn('[pack-safe] Skipping rcedit — exe or icon not found');
}

// ── Step 2: robocopy standalone into resources ───────────────────────────────
console.log('\n[pack-safe] Step 2 — copy standalone into win-unpacked');
robocopy(STANDALONE, DEST_RES);

// copy .next subfolder (starts with dot — robocopy skips it by default)
const nextSrc  = path.join(STANDALONE, '.next');
const nextDest = path.join(DEST_RES, '.next');
if (fs.existsSync(nextSrc)) robocopy(nextSrc, nextDest);

// copy .prisma client
const prismaSrc  = path.join(STANDALONE, 'node_modules', '.prisma');
const prismaDest = path.join(DEST_RES, 'node_modules', '.prisma');
if (fs.existsSync(prismaSrc)) robocopy(prismaSrc, prismaDest);

// ── Step 3: build NSIS installer from the prepackaged dir ────────────────────
console.log('\n[pack-safe] Step 3 — build NSIS from prepackaged win-unpacked');
run('npx', ['electron-builder', '--win', 'nsis', '--x64',
            '--prepackaged', path.join('dist-electron', 'win-unpacked')]);

console.log('\n[pack-safe] Done — installer ready in dist-electron/');
