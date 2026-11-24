// npm run app:build  ->  web build, cap sync, signed release AAB.
// Signing is read from env: KEYSTORE_PATH, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD (placeholders in .env.app.example).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
// optional local env file (git-ignored)
const envFile = path.join(root, '.env.app');
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !l.trim().startsWith('#') && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }

const run = (cmd, args, cwd = root) => { const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32', env: process.env }); if (r.status !== 0) process.exit(r.status ?? 1); };

const missing = ['KEYSTORE_PATH', 'KEYSTORE_PASSWORD', 'KEY_ALIAS', 'KEY_PASSWORD'].filter((k) => !process.env[k]);
if (missing.length) console.warn(`\n! Missing ${missing.join(', ')}: the bundle will be UNSIGNED. Set them (see .env.app.example) for the Play upload.\n`);
else if (!fs.existsSync(process.env.KEYSTORE_PATH)) { console.error(`KEYSTORE_PATH not found: ${process.env.KEYSTORE_PATH}`); process.exit(1); }

run('npm', ['run', 'build']);
run('npx', ['cap', 'sync', 'android']);
run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['bundleRelease'], path.join(root, 'android'));
console.log('\nAAB: android/app/build/outputs/bundle/release/app-release.aab');
