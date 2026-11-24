// Builds the source art for @capacitor/assets (adaptive icon layers, splash) and the Android-only extras
// (monochrome themed icon, notification small icon) from public/logo.png. Run: npm run app:assets
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const logo = path.join(root, 'public/logo.png');
const out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });
const SAFFRON = '#FFA723';

const fit = (size, pct) => sharp(logo).resize(Math.round(size * pct), Math.round(size * pct), { fit: 'contain', background: '#ffffff' }).png().toBuffer();
const solid = (w, h, bg) => sharp({ create: { width: w, height: h, channels: 4, background: bg } }).png();

// icon-only (legacy square icon) and the two adaptive layers (logo inside the 66% safe zone)
await solid(1024, 1024, '#ffffff').composite([{ input: await fit(1024, 0.84), gravity: 'center' }]).png().toFile(path.join(out, 'icon-only.png'));
await solid(1024, 1024, '#ffffff').png().toFile(path.join(out, 'icon-background.png'));
await solid(1024, 1024, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: await fit(1024, 0.62), gravity: 'center' }]).png().toFile(path.join(out, 'icon-foreground.png'));

// splash: saffron with the logo on a white rounded card
const card = 1100;
const cardSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${card}" height="${card}"><rect width="${card}" height="${card}" rx="220" fill="#fff"/></svg>`);
for (const name of ['splash.png', 'splash-dark.png']) {
  await solid(2732, 2732, SAFFRON).composite([{ input: cardSvg, gravity: 'center' }, { input: await fit(card, 0.86), gravity: 'center' }]).png().toFile(path.join(out, name));
}

// Android 13+ themed (monochrome) icon: dark ink of the logo becomes an alpha mask
const MONO = 432; // 108dp at xxxhdpi
const { data, info } = await sharp(logo).resize(Math.round(MONO * 0.62), Math.round(MONO * 0.62), { fit: 'contain', background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
const mask = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) { mask[i * 4] = mask[i * 4 + 1] = mask[i * 4 + 2] = 0; mask[i * 4 + 3] = Math.min(255, Math.max(0, (255 - data[i]) * 1.6)); }
const monoLogo = await sharp(mask, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
const res = path.join(root, 'android/app/src/main/res');
if (fs.existsSync(res)) {
  fs.mkdirSync(path.join(res, 'drawable-nodpi'), { recursive: true });
  await solid(MONO, MONO, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: monoLogo, gravity: 'center' }]).png().toFile(path.join(res, 'drawable-nodpi/ic_launcher_monochrome.png'));
  // notification small icon: white silhouette
  const white = Buffer.from(mask); for (let i = 0; i < white.length; i += 4) { white[i] = white[i + 1] = white[i + 2] = 255; }
  const stat = await sharp(white, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  fs.mkdirSync(path.join(res, 'drawable-xxhdpi'), { recursive: true });
  fs.writeFileSync(path.join(res, 'drawable-xxhdpi/ic_stat_kg.png'), stat);
  console.log('android extras written');
}
console.log('assets/ ready');
