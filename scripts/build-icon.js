/**
 * בונה אייקונים:
 * - electron/icon.ico — אפליקציה (CRM)
 * - electron/icon-installer.ico — מתקין (INSTALLATION)
 * הרצה: npm run icon
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const root = path.join(__dirname, "..");
const electronDir = path.join(root, "electron");
const publicDir = path.join(root, "public");
const sizes = [16, 32, 48, 64, 128, 256];

function resolveSource(candidates) {
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

async function buildIco(sourcePath, icoPath, label) {
  const png512 = await sharp(sourcePath)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(png512).resize(s, s).png().toBuffer())
  );
  const ico = await toIco(pngBuffers);
  fs.writeFileSync(icoPath, ico);
  console.log(`[build-icon] ${label}:`, icoPath, `(${sizes.join("/")}px)`);
  return { png512, ico };
}

async function main() {
  const appSource = resolveSource([
    path.join(electronDir, "icon-source.png"),
    path.join(root, "assets", "vermillion-crm-icon-source.png"),
  ]);

  const installerSource = resolveSource([
    path.join(electronDir, "icon-installer-source.png"),
    path.join(root, "assets", "vermillion-installer-icon-source.png"),
  ]);

  if (!appSource) {
    console.error("[build-icon] חסר מקור לאפליקציה — electron/icon-source.png");
    process.exit(1);
  }
  if (!installerSource) {
    console.error("[build-icon] חסר מקור למתקין — electron/icon-installer-source.png");
    process.exit(1);
  }

  console.log("[build-icon] אפליקציה ←", appSource);
  console.log("[build-icon] מתקין ←", installerSource);

  const { png512: appPng, ico: appIco } = await buildIco(
    appSource,
    path.join(electronDir, "icon.ico"),
    "אפליקציה"
  );

  await buildIco(
    installerSource,
    path.join(electronDir, "icon-installer.ico"),
    "מתקין (INSTALLATION)"
  );

  fs.writeFileSync(path.join(electronDir, "icon-source.png"), appPng);
  fs.writeFileSync(path.join(publicDir, "icon-512.png"), appPng);
  fs.writeFileSync(path.join(root, "src", "app", "favicon.ico"), appIco);
  fs.copyFileSync(path.join(electronDir, "icon.ico"), path.join(publicDir, "favicon.ico"));

  const installerPng = await sharp(installerSource)
    .resize(512, 512)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(electronDir, "icon-installer-source.png"), installerPng);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
