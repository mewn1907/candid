// ©️ Mewn — textured film grain (wabi, lightweight)

export function applyTexturedGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.055
): void {
  // Tiled grain pattern — cheap to generate, no per-pixel ImageData loop on large canvases.
  const grainSize = 128;
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const g = grainCanvas.getContext('2d');
  if (!g) return;

  // Base transparent
  g.clearRect(0, 0, grainSize, grainSize);

  // Seed random dots — monochrome grain, varying alpha for depth
  const dots = 900; // ~5% coverage of 128x128
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * grainSize;
    const y = Math.random() * grainSize;
    const r = Math.random() * 0.9 + 0.3; // radius 0.3-1.2
    const alpha = Math.random() * 0.18 + 0.04; // 0.04-0.22
    const v = Math.floor(90 + Math.random() * 60); // gray 90-150
    g.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // Add a few slightly larger speckle for film texture
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * grainSize;
    const y = Math.random() * grainSize;
    const r = Math.random() * 1.6 + 0.8;
    const alpha = Math.random() * 0.08 + 0.02;
    g.fillStyle = `rgba(60,60,60,${alpha})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  const pattern = ctx.createPattern(grainCanvas, 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.2, intensity));
  // Overlay gives film lift without washing blacks; soft-light is subtler.
  // Use 'overlay' for visible texture, fallback to default if unsupported.
  try {
    ctx.globalCompositeOperation = 'overlay';
  } catch {}
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Second pass with soft-light at lower alpha for subtle depth
  ctx.save();
  ctx.globalAlpha = intensity * 0.45;
  try {
    ctx.globalCompositeOperation = 'soft-light';
  } catch {}
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Lightweight luminance-aware grain for polaroid/collage where paper texture matters more
export function applyPaperGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.04
): void {
  applyTexturedGrain(ctx, width, height, intensity);
}
