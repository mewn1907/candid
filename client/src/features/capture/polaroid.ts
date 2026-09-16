// ©️ Mewn — extra feature 3: polaroid + strip helpers (wabi-sabi)

export async function buildPolaroid(
  dataUrl: string,
  caption = 'Candid · wabi-sabi',
): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.width;
  const H = img.height;
  // polaroid proportions: extra bottom + slight side padding, warm paper
  const PAD = Math.round(W * 0.04);
  const BOTTOM = Math.round(H * 0.22);
  const canvas = document.createElement('canvas');
  canvas.width = W + PAD * 2;
  canvas.height = H + PAD + BOTTOM;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  // paper
  ctx.fillStyle = '#fffefb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // subtle shadow via inner stroke
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(PAD - 1, PAD - 1, W + 2, H + 2);
  ctx.drawImage(img, PAD, PAD, W, H);
  // handwritten caption area
  ctx.fillStyle = '#292524';
  ctx.font = `300 ${Math.round(W * 0.04)}px 'Inter', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(caption, canvas.width / 2, H + PAD + BOTTOM * 0.45);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = `${Math.round(W * 0.025)}px 'Inter', system-ui, sans-serif`;
  ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, H + PAD + BOTTOM * 0.72);
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
