import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const FOTOS_DIR = path.resolve('public/fotos');
const MAX_WIDTH = 1400;
const WEBP_QUALITY = 82;

const files = (await readdir(FOTOS_DIR)).filter((f) => /\.jpe?g$/i.test(f));
let saved = 0;

for (const file of files) {
  const input = path.join(FOTOS_DIR, file);
  const base = file.replace(/\.jpe?g$/i, '');
  const webpOut = path.join(FOTOS_DIR, `${base}.webp`);

  const meta = await sharp(input).metadata();
  const pipeline = sharp(input).rotate();
  if ((meta.width ?? 0) > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });

  await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpOut);

  const [before, after] = await Promise.all([stat(input), stat(webpOut)]);
  saved += before.size - after.size;
  console.log(`${file} → ${base}.webp (${Math.round(before.size / 1024)}KB → ${Math.round(after.size / 1024)}KB)`);
}

console.log(`\nDone. ${files.length} WebP files created. ~${Math.round(saved / 1024)}KB saved vs originals.`);
