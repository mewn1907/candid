// ©️ Mewn — wabi-sabi collage builder for burst photos.

export type CollageLayout = 'strip' | 'grid';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Builds a wabi-sabi collage from burst shots.
 * - strip: vertical photobooth strip, full-width stack with soft gaps (wabi paper background).
 * - grid: 2-column grid; for 3 shots the last one is centered.
 * Returns a JPEG data URL at 0.92 quality.
 */
export async function buildCollage(
  dataUrls: string[],
  layout: CollageLayout = 'strip',
): Promise<string> {
  if (dataUrls.length === 0) throw new Error('No images for collage');
  const images = await Promise.all(dataUrls.map(loadImage));

  // Normalize: target strip width; wabi palette
  const OUTER_PAD = 28;
  const GAP = 16;
  const BG = '#fafaf9'; // surface-50 / wabi paper
  const CAPTION_BG = '#f5f0e8'; // wabi-100
  const TEXT = '#292524';

  if (layout === 'strip') {
    const TARGET_W = 900;
    // Use first image aspect to compute scaled sizes (all bursts share aspect).
    const scaledHeights = images.map((img) => Math.round((img.height / img.width) * TARGET_W));
    const totalH =
      OUTER_PAD * 2 + 56 + // header
      scaledHeights.reduce((a, h) => a + h, 0) +
      GAP * (images.length - 1) +
      64; // footer

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_W + OUTER_PAD * 2;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    // Paper background with subtle rounded look via filled rect
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header — CANDID in light wabi type
    ctx.fillStyle = TEXT;
    ctx.font = '300 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CANDID  ·  Burst Strip', canvas.width / 2, OUTER_PAD + 28);

    let y = OUTER_PAD + 56;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const h = scaledHeights[i];
      // Soft inner shadow / border
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(OUTER_PAD - 1, y - 1, TARGET_W + 2, h + 2);
      ctx.drawImage(img, OUTER_PAD, y, TARGET_W, h);
      y += h + GAP;
    }

    // Footer
    const footerY = canvas.height - 64;
    ctx.fillStyle = CAPTION_BG;
    ctx.fillRect(0, footerY, canvas.width, 64);
    ctx.fillStyle = TEXT;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('©️ Mewn  ·  wabi-sabi, imperfect moments', canvas.width / 2, footerY + 30);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText(`${images.length} shots · ${new Date().toLocaleDateString()}`, canvas.width / 2, footerY + 48);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // grid: 2 columns, responsive
  const COLS = 2;
  const TARGET_W = 900;
  const cols = Math.min(COLS, images.length === 3 ? 2 : COLS);
  const colW = Math.round((TARGET_W - GAP * (cols - 1)) / cols);
  const rows = Math.ceil(images.length / cols);
  // All images same aspect, so row height uniform
  const sampleH = Math.round((images[0].height / images[0].width) * colW);
  const totalH = OUTER_PAD * 2 + 56 + rows * sampleH + GAP * (rows - 1) + 64;

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_W + OUTER_PAD * 2;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = TEXT;
  ctx.font = '300 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CANDID  ·  Collage', canvas.width / 2, OUTER_PAD + 28);

  let idx = 0;
  let y = OUTER_PAD + 56;
  for (let r = 0; r < rows; r++) {
    const remaining = images.length - idx;
    const colsThisRow = Math.min(cols, remaining);
    // Center last row if it has single item
    const rowW = colsThisRow * colW + GAP * (colsThisRow - 1);
    let x = OUTER_PAD + Math.round((TARGET_W - rowW) / 2);
    for (let c = 0; c < colsThisRow; c++) {
      const img = images[idx++];
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(x - 1, y - 1, colW + 2, sampleH + 2);
      ctx.drawImage(img, x, y, colW, sampleH);
      x += colW + GAP;
    }
    y += sampleH + GAP;
  }

  const footerY = canvas.height - 64;
  ctx.fillStyle = CAPTION_BG;
  ctx.fillRect(0, footerY, canvas.width, 64);
  ctx.fillStyle = TEXT;
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('©️ Mewn  ·  wabi-sabi, imperfect moments', canvas.width / 2, footerY + 30);

  return canvas.toDataURL('image/jpeg', 0.92);
}
