// capacitor-assets rewrites the adaptive-icon XML; re-add the Android 13+ <monochrome> layer afterwards.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '../android/app/src/main/res/mipmap-anydpi-v26');
for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('<monochrome')) { s = s.replace('</adaptive-icon>', '    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>\n</adaptive-icon>'); fs.writeFileSync(p, s); }
}
console.log('monochrome layer ok');
