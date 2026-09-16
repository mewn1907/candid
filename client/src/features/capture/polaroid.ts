// ©️ Mewn — extra feature 3: polaroid + strip helpers (wabi-sabi)

export async function buildPolaroid(
  dataUrl: string,
  caption = 'Candid · wabi-sabi',
  seasonalId: import('./seasonal').SeasonalFrameId = 'none',
): Promise<string> {
  const { seasonalFor } = await import('./seasonal');
  const seasonal = seasonalFor(seasonalId);
  const img = await loadImage(dataUrl);
  const W = img.width;
  const H = img.height;
  const PAD = Math.round(W * 0.04);
  const BOTTOM = Math.round(H * 0.22);
  const canvas = document.createElement('canvas');
  canvas.width = W + PAD * 2;
  canvas.height = H + PAD + BOTTOM;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.fillStyle = seasonal.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // soft paper shadow
  ctx.fillStyle = '#0000000a';
  ctx.fillRect(PAD - 2, PAD - 2, W + 4, H + 4);
  ctx.fillStyle = '#fffefb';
  ctx.fillRect(PAD - 1, PAD - 1, W + 2, H + 2);
  ctx.drawImage(img, PAD, PAD, W, H);
  // seasonal corner accent (subtle)
  if (seasonalId !== 'none') {
    ctx.fillStyle = seasonal.accent + '22';
    const r = Math.round(W * 0.08);
    ctx.beginPath(); ctx.arc(PAD + r, PAD + r, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(canvas.width - PAD - r, PAD + r, r * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  // caption
  ctx.fillStyle = seasonal.accent;
  ctx.font = `300 ${Math.round(W * 0.04)}px 'Inter', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(caption, canvas.width / 2, H + PAD + BOTTOM * 0.45);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = `${Math.round(W * 0.025)}px 'Inter', system-ui, sans-serif`;
  ctx.fillText(new Date().toLocaleDateString() + (seasonalId !== 'none' ? ` · ${seasonal.label}` : ''), canvas.width / 2, H + PAD + BOTTOM * 0.72);
  return canvas.toDataURL('image/jpeg', 0.92);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
