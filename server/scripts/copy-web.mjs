import { cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', '..', 'web', 'dist');
const dest = join(__dirname, '..', 'dist', 'public');

if (existsSync(src)) {
  cpSync(src, dest, { recursive: true });
  console.log(`Copied web/dist → server/dist/public`);
} else {
  console.warn('web/dist not found — skipping copy. Run pnpm --filter web build first.');
}
