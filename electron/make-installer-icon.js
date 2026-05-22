const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function makeIco(srcFile, outFile) {
  const sizes = [16, 32, 48, 256];

  const bmpBuffers = await Promise.all(sizes.map(async (s) => {
    const { data } = await sharp(srcFile)
      .resize(s, s, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // data is RGBA top-to-bottom; ICO BMP needs BGRA bottom-to-top
    const pixelData = Buffer.alloc(s * s * 4);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const src = (y * s + x) * 4;
        const dst = ((s - 1 - y) * s + x) * 4; // flip vertically
        pixelData[dst + 0] = data[src + 2]; // B
        pixelData[dst + 1] = data[src + 1]; // G
        pixelData[dst + 2] = data[src + 0]; // R
        pixelData[dst + 3] = data[src + 3]; // A
      }
    }

    // AND mask: 1 bit/pixel padded to DWORD rows, all 0 = opaque (alpha in XOR mask)
    const andRowBytes = Math.ceil(s / 32) * 4;
    const andMask = Buffer.alloc(andRowBytes * s, 0);

    // BITMAPINFOHEADER — biHeight doubled to signal inclusion of AND mask
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(s, 4);
    header.writeInt32LE(s * 2, 8); // doubled
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    header.writeUInt32LE(0, 16);
    header.writeUInt32LE(0, 20);
    header.writeInt32LE(0, 24);
    header.writeInt32LE(0, 28);
    header.writeUInt32LE(0, 32);
    header.writeUInt32LE(0, 36);

    return Buffer.concat([header, pixelData, andMask]);
  }));

  // Build ICO container
  const count = sizes.length;
  let offset = 6 + 16 * count;
  const offsets = bmpBuffers.map(buf => { const o = offset; offset += buf.length; return o; });

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(count, 4);

  const dirs = Buffer.alloc(16 * count);
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const b = i * 16;
    dirs.writeUInt8(s === 256 ? 0 : s, b + 0);
    dirs.writeUInt8(s === 256 ? 0 : s, b + 1);
    dirs.writeUInt8(0, b + 2);
    dirs.writeUInt8(0, b + 3);
    dirs.writeUInt16LE(1, b + 4);
    dirs.writeUInt16LE(32, b + 6);
    dirs.writeUInt32LE(bmpBuffers[i].length, b + 8);
    dirs.writeUInt32LE(offsets[i], b + 12);
  }

  const ico = Buffer.concat([icoHeader, dirs, ...bmpBuffers]);
  fs.writeFileSync(outFile, ico);
  console.log(`written: ${outFile} (${ico.length} bytes)`);
}

const dir = __dirname;
Promise.all([
  makeIco(path.join(dir, "icon-source.png"),           path.join(dir, "icon.ico")),
  makeIco(path.join(dir, "icon-installer-source.png"), path.join(dir, "installer-icon.ico")),
]).catch(e => { console.error(e); process.exit(1); });
