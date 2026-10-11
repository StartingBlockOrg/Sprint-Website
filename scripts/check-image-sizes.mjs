// Fails when an image or video in the repo is over its size limit, so heavy assets are caught in
// review rather than on a phone. Raise a limit only with a reason in the PR.
import { readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const LIMITS = {
  image: 300 * 1024, // .avif .webp .png .jpg .jpeg .gif .svg
  video: 2 * 1024 * 1024, // .mp4 .webm
};
const KIND = {
  '.avif': 'image', '.webp': 'image', '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image', '.svg': 'image',
  '.mp4': 'video', '.webm': 'video',
};
const ROOTS = ['public', 'src'];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const failures = [];
let checked = 0;
for (const root of ROOTS) {
  for await (const path of walk(root)) {
    const kind = KIND[extname(path).toLowerCase()];
    if (!kind) continue;
    checked++;
    const { size } = await stat(path);
    if (size > LIMITS[kind]) failures.push(`${relative('.', path)}: ${(size / 1024).toFixed(0)} KB, limit ${LIMITS[kind] / 1024} KB`);
  }
}

if (failures.length) {
  console.error(`Over the size limit:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`Image sizes OK (${checked} files checked).`);
