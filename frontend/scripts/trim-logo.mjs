// Trims the white margin around public/logo.png into public/logo-wide.png (used in the site header and footer).
import sharp from 'sharp';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const buf = await sharp(path.join(root, 'public/logo.png')).trim({ background: '#ffffff', threshold: 18 }).extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' }).png().toBuffer();
const m = await sharp(buf).metadata();
await sharp(buf).toFile(path.join(root, 'public/logo-wide.png'));
console.log('logo-wide.png', m.width, 'x', m.height);
