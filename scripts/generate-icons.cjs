const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function createPng(width, height) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with scanline filter bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  // Background #0B1215: r=11, g=18, b=21
  // Teal accent #2DD4BF: r=45, g=212, b=191
  // White: r=255, g=255, b=255
  const bgR = 11, bgG = 18, bgB = 21;
  const tealR = 45, tealG = 212, tealB = 191;

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  const innerRadius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter type 0: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside ZL emblem
      // Normalized coordinates from -1 to 1
      const nx = (x - cx) / (width * 0.35);
      const ny = (y - cy) / (height * 0.35);

      let isZ = false;
      let isL = false;

      // Draw 'Z' on left half: nx from -0.7 to -0.05, ny from -0.6 to 0.6
      if (nx >= -0.7 && nx <= -0.05 && ny >= -0.55 && ny <= 0.55) {
        // top bar
        if (ny <= -0.32) isZ = true;
        // bottom bar
        else if (ny >= 0.32) isZ = true;
        // diagonal bar
        else {
          const expectedNx = -0.7 + (ny - (-0.32)) / (0.32 - (-0.32)) * ((-0.05) - (-0.7));
          if (Math.abs(nx - expectedNx) < 0.16) isZ = true;
        }
      }

      // Draw 'L' on right half: nx from 0.05 to 0.7, ny from -0.55 to 0.55
      if (nx >= 0.05 && nx <= 0.7 && ny >= -0.55 && ny <= 0.55) {
        // vertical stem
        if (nx <= 0.26) isL = true;
        // bottom horizontal bar
        else if (ny >= 0.32 && nx <= 0.65) isL = true;
      }

      if (isZ || isL) {
        rawData[pxOffset] = tealR;
        rawData[pxOffset + 1] = tealG;
        rawData[pxOffset + 2] = tealB;
        rawData[pxOffset + 3] = 255;
      } else if (dist <= radius && dist >= innerRadius) {
        // Outer ring accent
        rawData[pxOffset] = tealR;
        rawData[pxOffset + 1] = tealG;
        rawData[pxOffset + 2] = tealB;
        rawData[pxOffset + 3] = 255;
      } else if (dist < innerRadius) {
        // Inner circle
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      } else {
        // Background rounded corners
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist < width * 0.48) {
          rawData[pxOffset] = bgR;
          rawData[pxOffset + 1] = bgG;
          rawData[pxOffset + 2] = bgB;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = bgR;
          rawData[pxOffset + 1] = bgG;
          rawData[pxOffset + 2] = bgB;
          rawData[pxOffset + 3] = 0; // transparent corner
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

sizes.forEach((s) => {
  const filePath = path.join(outDir, `icon-${s}.png`);
  const pngBuf = createPng(s, s);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated: ${filePath} (${pngBuf.length} bytes)`);
});
