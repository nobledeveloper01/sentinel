// The console is one HTML file, one stylesheet and the compiled module; no
// bundler, no dependency. `tsc` wrote `dist/`, this copies the rest in.
import { cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist');
await mkdir(dist, { recursive: true });
await cp(join(here, 'public'), dist, { recursive: true });
await writeFile(join(dist, 'index.html'), await readFile(join(here, 'index.html'), 'utf8'));
console.log('apps/web/dist — open index.html from a static server');
