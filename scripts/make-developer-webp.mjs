import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

/**
 * One-off asset compressor (Phase 2 footer redesign / final polish):
 * fotterfPicture.jpg (1 MB) ->
 *   public/images/developer.webp          ~512px square card avatar
 *   public/images/developer-portrait.webp 768x1024 stage-portrait frame
 */
const SRC = 'public/brand/fotterfPicture.jpg';

await mkdir('public/images', { recursive: true });

const square = await sharp(SRC)
  .resize(512, 512, { fit: 'cover', position: sharp.strategy.attention })
  .webp({ quality: 82 })
  .toFile('public/images/developer.webp');
console.log(`written public/images/developer.webp — ${square.width}x${square.height}, ${Math.round(square.size / 1024)} KB`);

const portrait = await sharp(SRC)
  .resize(768, 1024, { fit: 'cover', position: sharp.strategy.attention })
  .webp({ quality: 80 })
  .toFile('public/images/developer-portrait.webp');
console.log(`written public/images/developer-portrait.webp — ${portrait.width}x${portrait.height}, ${Math.round(portrait.size / 1024)} KB`);
