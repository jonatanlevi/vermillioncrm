// Creates a proper multi-size ICO file using only built-in Node.js
// Sizes: 16, 32, 48, 256

const fs = require('fs');
const path = require('path');

function createBitmap(size) {
  // Colors
  const BG     = [5,  5,  15];   // dark near-black (RGB)
  const RED    = [35, 35, 200];  // BGR order for BMP
  const GOLD   = [55, 175, 212]; // BGR
  const RING   = [30, 30, 180];  // BGR border ring

  const pixels = Buffer.alloc(size * size * 4); // BGRA

  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Default: transparent
      pixels[idx]     = 0;
      pixels[idx + 1] = 0;
      pixels[idx + 2] = 0;
      pixels[idx + 3] = 0;

      if (dist > r) continue;

      // Background circle
      pixels[idx]     = BG[2];
      pixels[idx + 1] = BG[1];
      pixels[idx + 2] = BG[0];
      pixels[idx + 3] = 255;

      // Border ring
      const ringW = Math.max(1, size * 0.03);
      if (dist > r - ringW) {
        pixels[idx]     = RING[0];
        pixels[idx + 1] = RING[1];
        pixels[idx + 2] = RING[2];
        pixels[idx + 3] = 255;
        continue;
      }

      // V shape — defined as fractions of size
      const nx = x / size;
      const ny = y / size;

      // Left arm of V:  from (0.20,0.22) to (0.35,0.22) down to (0.50,0.65)
      // Right arm of V: from (0.65,0.22) to (0.80,0.22) down to (0.50,0.65)
      // Thickness proportional to size

      const thick = 0.13;

      // Left arm: line from (0.275, 0.22) to (0.50, 0.72)
      const lx1 = 0.275, ly1 = 0.22, lx2 = 0.50, ly2 = 0.72;
      const lLen = Math.sqrt((lx2-lx1)**2 + (ly2-ly1)**2);
      const lDx = (lx2-lx1)/lLen, lDy = (ly2-ly1)/lLen;
      const lT = (nx-lx1)*lDx + (ny-ly1)*lDy;
      const lDist = Math.abs((nx-lx1)*lDy - (ny-ly1)*lDx);
      const onLeft = lT >= 0 && lT <= lLen*size/size && lDist < thick/2;

      // Right arm: line from (0.725, 0.22) to (0.50, 0.72)
      const rx1 = 0.725, ry1 = 0.22, rx2 = 0.50, ry2 = 0.72;
      const rLen = Math.sqrt((rx2-rx1)**2 + (ry2-ry1)**2);
      const rDx = (rx2-rx1)/rLen, rDy = (ry2-ry1)/rLen;
      const rT = (nx-rx1)*rDx + (ny-ry1)*rDy;
      const rDist = Math.abs((nx-rx1)*rDy - (ny-ry1)*rDx);
      const onRight = rT >= 0 && rT <= rLen*size/size && rDist < thick/2;

      if (onLeft || onRight) {
        // Gold highlight on upper part of left arm
        const isGold = onLeft && ny < 0.42;
        const c = isGold ? GOLD : RED;
        pixels[idx]     = c[0];
        pixels[idx + 1] = c[1];
        pixels[idx + 2] = c[2];
        pixels[idx + 3] = 255;
      }
    }
  }
  return pixels;
}

function buildDIB(size, pixelsBGRA) {
  // BITMAPINFOHEADER (40 bytes) + pixel data (bottom-up, no palette for 32bpp)
  const header = Buffer.alloc(40);
  header.writeInt32LE(40, 0);         // biSize
  header.writeInt32LE(size, 4);       // biWidth
  header.writeInt32LE(size * 2, 8);   // biHeight * 2 (XOR + AND masks)
  header.writeUInt16LE(1, 12);        // biPlanes
  header.writeUInt16LE(32, 14);       // biBitCount
  header.writeUInt32LE(0, 16);        // biCompression (BI_RGB)
  header.writeUInt32LE(0, 20);        // biSizeImage
  header.writeInt32LE(0, 24);
  header.writeInt32LE(0, 28);
  header.writeUInt32LE(0, 32);
  header.writeUInt32LE(0, 36);

  // Flip vertically (BMP is bottom-up)
  const flipped = Buffer.alloc(pixelsBGRA.length);
  for (let y = 0; y < size; y++) {
    const srcRow = pixelsBGRA.slice((size - 1 - y) * size * 4, (size - y) * size * 4);
    srcRow.copy(flipped, y * size * 4);
  }

  // AND mask (1 bit per pixel, bottom-up) — all zeros = fully opaque
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const andMask = Buffer.alloc(size * maskRowBytes, 0);

  return Buffer.concat([header, flipped, andMask]);
}

function writeICO(sizes, outPath) {
  const dibs = sizes.map(s => buildDIB(s, createBitmap(s)));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * sizes.length;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);           // reserved
  header.writeUInt16LE(1, 2);           // type: icon
  header.writeUInt16LE(sizes.length, 4);

  const dirs = sizes.map((s, i) => {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(s >= 256 ? 0 : s, 0);  // width (0 = 256)
    dir.writeUInt8(s >= 256 ? 0 : s, 1);  // height
    dir.writeUInt8(0, 2);                  // color count
    dir.writeUInt8(0, 3);                  // reserved
    dir.writeUInt16LE(1, 4);              // planes
    dir.writeUInt16LE(32, 6);             // bit count
    dir.writeUInt32LE(dibs[i].length, 8);
    dir.writeUInt32LE(offset, 12);
    offset += dibs[i].length;
    return dir;
  });

  const out = Buffer.concat([header, ...dirs, ...dibs]);
  fs.writeFileSync(outPath, out);
  console.log('ICO written:', outPath, out.length, 'bytes');
}

const icoPath = path.join(__dirname, 'icon.ico');
writeICO([16, 32, 48, 256], icoPath);
