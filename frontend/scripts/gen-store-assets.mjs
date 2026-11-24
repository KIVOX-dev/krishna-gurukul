// npm run store:assets -> frontend/store-assets/{icon-512.png, feature-graphic-1024x500.png}
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'store-assets');
fs.mkdirSync(out, { recursive: true });
const logo = path.join(root, 'public/logo.png');

// 512x512 Play icon (32-bit PNG, Google applies the mask itself, so keep it square)
await sharp(logo).resize(512, 512).png().toFile(path.join(out, 'icon-512.png'));

// 1024x500 feature graphic: saffron to blue sweep, logo card on the left, promise on the right
const W = 1024, H = 500;
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFA723"/><stop offset=".55" stop-color="#EC6206"/><stop offset="1" stop-color="#00457F"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="930" cy="80" r="150" fill="#fff" opacity=".08"/><circle cx="650" cy="470" r="110" fill="#fff" opacity=".08"/>
  <rect x="50" y="60" width="380" height="380" rx="56" fill="#fff"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#fff">
    <text x="470" y="200" font-size="46" font-weight="800">Abacus &amp; Vedic Maths</text>
    <text x="470" y="260" font-size="46" font-weight="800">Practice that feels</text>
    <text x="470" y="320" font-size="46" font-weight="800" fill="#FFE3A6">like a game.</text>
    <text x="470" y="385" font-size="26" font-weight="600" opacity=".95">Tests, attendance and fees for parents</text>
  </g></svg>`);
const card = await sharp(logo).resize(340, 340, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
await sharp(bg).composite([{ input: card, left: 70, top: 80 }]).png().toFile(path.join(out, 'feature-graphic-1024x500.png'));
console.log('store-assets written');
