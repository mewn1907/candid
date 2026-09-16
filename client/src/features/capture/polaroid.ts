// ©️ Mewn — true Polaroid 600-style export, film-graded like a real photobooth print.
//
// What makes it feel real:
// - Classic 600 proportions: thin equal sides/top, deep bottom chin for handwriting
// - Warm white paper (not pure #fff), subtle paper texture + edge shading
// - Film grade on the photo: gentle contrast, warm highlights, lifted milky
//   shadows, soft vignette, fine grain — the Polaroid "glow"
// - Recessed photo well: hairline + inner shadow so the print sits IN the card
// - Handwritten caption in Caveat (loaded before draw), tiny date/CANDID footer
// - Filter-aware: user filter is the base look, Polaroid chemistry on top
// - Print-resolution output (photo area ~1600px on the long edge)
import { canvasFilterFor } from './filters';
import type { PhotoFilterId } from '../../types/room.types';

export async function buildPolaroid(
  dataUrl: string,
  caption = 'Candid',
  seasonalId: import('./seasonal').SeasonalFrameId = 'none',
  filterId: PhotoFilterId = 'natural',
): Promise<string> {
  const { seasonalFor } = await import('./seasonal');
  const seasonal = seasonalFor(seasonalId);
  const img = await loadImage(dataUrl);

  // Ensure the handwritten font is ready before we paint the caption,
  // otherwise canvas falls back to a system font and it looks cheap.
  try {
    await Promise.all([
      (document as any).fonts?.load?.("600 80px Caveat"),
      (document as any).fonts?.load?.("500 80px Caveat"),
      (document as any).fonts?.load?.("300 24px Inter"),
    ]);
  } catch {}

  // --- geometry: real 600 card is 3.5 x 4.2", image 3.1 x 3.1" (square).
  // Our duo photos are wide landscapes, so we keep the full frame (like
  // Instax Wide) but preserve the 600 margin ratios: side ~5.7%, top ~5%,
  // chin ~22% of card height.
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Normalize photo area to a generous print size (cap for perf).
  const PHOTO_LONG = 1600;
  const scale = Math.min(1, PHOTO_LONG / Math.max(srcW, srcH));
  // Keep full source aspect — never crop faces.
  const photoW = Math.round(srcW * scale);
  const photoH = Math.round(srcH * scale);

  const side = Math.max(48, Math.round(photoW * 0.062));
  const top = Math.max(44, Math.round(photoW * 0.058));
  // Deep chin: enough room for a big handwritten line + small footer.
  const chin = Math.max(190, Math.round(photoW * 0.24));

  const cardW = photoW + side * 2;
  const cardH = photoH + top + chin;

  const canvas = document.createElement('canvas');
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // --- 1. paper base: warm white with a whisper of seasonal tint ---
  const paperBase = tintedPaper(seasonal.bg);
  ctx.fillStyle = paperBase;
  ctx.fillRect(0, 0, cardW, cardH);

  // Soft top-light on the paper (barely there, kills the flat digital look)
  const paperLight = ctx.createLinearGradient(0, 0, 0, cardH);
  paperLight.addColorStop(0, 'rgba(255,255,255,0.55)');
  paperLight.addColorStop(0.35, 'rgba(255,255,255,0)');
  paperLight.addColorStop(1, 'rgba(120,90,60,0.10)');
  ctx.fillStyle = paperLight;
  ctx.fillRect(0, 0, cardW, cardH);

  // --- 2. film-graded photo (filter applied first, then Polaroid chemistry) ---
  const graded = gradeFilm(img, photoW, photoH, filterId);
  const px = side;
  const py = top;

  // Photo well: hairline keyline + soft inner shadow = print recessed in card
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,20,0.35)';
  ctx.shadowBlur = Math.round(photoW * 0.012);
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(px - 2, py - 2, photoW + 4, photoH + 4);
  ctx.restore();

  ctx.drawImage(graded, px, py, photoW, photoH);

  // Inner edge shading (top + left light catch, bottom + right depth)
  const edge = Math.max(2, Math.round(photoW * 0.004));
  const inner = ctx.createLinearGradient(px, py, px + photoW, py + photoH);
  void inner;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, photoW - 1, photoH - 1);
  // bottom inner shadow for depth
  const depth = ctx.createLinearGradient(0, py + photoH - edge * 6, 0, py + photoH);
  depth.addColorStop(0, 'rgba(0,0,0,0)');
  depth.addColorStop(1, 'rgba(30,15,5,0.22)');
  ctx.fillStyle = depth;
  ctx.fillRect(px, py + photoH - edge * 6, photoW, edge * 6);
  // top highlight
  const lift = ctx.createLinearGradient(0, py, 0, py + edge * 4);
  lift.addColorStop(0, 'rgba(255,255,255,0.28)');
  lift.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lift;
  ctx.fillRect(px, py, photoW, edge * 4);

  // --- 3. caption: big handwritten line, slightly tilted like a pen ---
  const captionText = (caption || 'Candid').slice(0, 32);
  const cx = cardW / 2;
  const capY = py + photoH + chin * 0.48;

  ctx.save();
  ctx.translate(cx, capY);
  ctx.rotate(-0.012); // human tilt
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const capSize = Math.round(Math.min(chin * 0.34, cardW * 0.075));
  ctx.font = `600 ${capSize}px Caveat, 'Segoe Script', cursive`;
  ctx.fillStyle = '#33302b';
  // faint pen emboss for realism
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(captionText, 1, 2);
  ctx.fillStyle = '#33302b';
  ctx.fillText(captionText, 0, 0);
  ctx.restore();

  // --- 4. footer: tiny mono date + CANDID mark, letterspaced by hand ---
  const footerY = py + photoH + chin * 0.82;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const footSize = Math.round(Math.max(13, cardW * 0.022));
  ctx.font = `500 ${footSize}px 'JetBrains Mono', ui-monospace, monospace`;
  ctx.fillStyle = '#8a8478';
  const date = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const seasonalTag = seasonalId !== 'none' ? `  ·  ${seasonal.label}` : '';
  ctx.fillText(`C A N D I D   ·   ${date.toUpperCase()}${seasonalTag}`, cx, footerY);

  // Tiny logo dot
  ctx.beginPath();
  ctx.arc(cx, footerY - chin * 0.16, Math.max(3, cardW * 0.004), 0, Math.PI * 2);
  ctx.fillStyle = '#c48849';
  ctx.fill();

  // --- 5. paper grain + faint fibres over the WHOLE card (print texture) ---
  try {
    const { applyPaperGrain } = await import('./grain');
    applyPaperGrain(ctx, cardW, cardH, 0.05);
  } catch {}
  addPaperFlecks(ctx, cardW, cardH);

  // Subtle card edge vignette so it photographs like an object, not a rect
  const cardVig = ctx.createRadialGradient(
    cardW / 2, cardH / 2, Math.min(cardW, cardH) * 0.42,
    cardW / 2, cardH / 2, Math.max(cardW, cardH) * 0.75,
  );
  cardVig.addColorStop(0, 'rgba(0,0,0,0)');
  cardVig.addColorStop(1, 'rgba(80,55,30,0.10)');
  ctx.fillStyle = cardVig;
  ctx.fillRect(0, 0, cardW, cardH);

  return canvas.toDataURL('image/jpeg', 0.95);
}

/** Film grade: user filter first, then Polaroid chemistry on top. */
function gradeFilm(
  img: HTMLImageElement,
  w: number,
  h: number,
  filterId: PhotoFilterId = 'natural',
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if (!x) return c;

  // 1. User filter as the base look (same engine as capture-time filters).
  //    Photo is already filtered at capture, but re-applying here lets the
  //    Polaroid tab preview / switch looks without re-shooting.
  let baseFilter = 'contrast(1.07) saturate(1.16) brightness(1.045) sepia(0.14)';
  const picked = canvasFilterFor(filterId);
  if (picked && picked !== 'none' && picked.trim() !== '') {
    // Stack the picked look under a light analog finish so prints stay cohesive.
    baseFilter = `${picked} contrast(1.04) brightness(1.02)`;
  }
  try {
    (x as any).filter = baseFilter;
  } catch {}
  x.drawImage(img, 0, 0, w, h);
  try {
    (x as any).filter = 'none';
  } catch {}

  const isBW = filterId === 'mono' || filterId === 'moon';

  // 2. Polaroid chemistry. B&W film skips the warm wash (stays neutral).
  if (!isBW) {
    // Warm highlight wash (golden-hour kiss)
    x.save();
    x.globalCompositeOperation = 'soft-light';
    x.fillStyle = '#ff9a3c';
    x.globalAlpha = 0.28;
    x.fillRect(0, 0, w, h);
    x.restore();
  }

  // Lifted blacks: milky Polaroid shadows
  x.save();
  x.globalCompositeOperation = 'screen';
  x.globalAlpha = isBW ? 0.08 : 0.10;
  x.fillStyle = isBW ? '#ffffff' : '#fff4e6';
  x.fillRect(0, 0, w, h);
  x.restore();

  // Richness back into mids
  x.save();
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = 0.06;
  x.fillStyle = '#2a1a10';
  x.fillRect(0, 0, w, h);
  x.restore();

  if (!isBW) {
    // Cool shadow tint for that pink-green Polaroid wobble (very subtle)
    x.save();
    x.globalCompositeOperation = 'overlay';
    const tone = x.createLinearGradient(0, 0, 0, h);
    tone.addColorStop(0, 'rgba(255,180,160,0.10)');
    tone.addColorStop(1, 'rgba(60,120,110,0.10)');
    x.fillStyle = tone;
    x.fillRect(0, 0, w, h);
    x.restore();
  }

  // Soft vignette — draws the eye to the two faces
  const vig = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.72, 'rgba(20,8,2,0.10)');
  vig.addColorStop(1, 'rgba(20,8,2,0.34)');
  x.fillStyle = vig;
  x.fillRect(0, 0, w, h);

  // Faint halation glow (Polaroid whites bloom a touch)
  x.save();
  x.globalCompositeOperation = 'screen';
  x.globalAlpha = 0.10;
  x.drawImage(c, 0, 0);
  x.restore();

  // Fine grain on the photo itself
  try {
    // dynamic import would be async — inline a light grain pass here
    const grain = document.createElement('canvas');
    grain.width = 128;
    grain.height = 128;
    const g = grain.getContext('2d');
    if (g) {
      for (let i = 0; i < 700; i++) {
        const gx = Math.random() * 128;
        const gy = Math.random() * 128;
        const gr = Math.random() * 0.9 + 0.3;
        const a = Math.random() * 0.16 + 0.04;
        const v = Math.floor(100 + Math.random() * 60);
        g.fillStyle = `rgba(${v},${v},${v},${a})`;
        g.beginPath();
        g.arc(gx, gy, gr, 0, Math.PI * 2);
        g.fill();
      }
      const pat = x.createPattern(grain, 'repeat');
      if (pat) {
        x.save();
        x.globalAlpha = 0.10;
        try {
          x.globalCompositeOperation = 'overlay';
        } catch {}
        x.fillStyle = pat;
        x.fillRect(0, 0, w, h);
        x.restore();
      }
    }
  } catch {}

  return c;
}

/** Seasonal paper tints stay whisper-quiet — paper must read as white. */
function tintedPaper(seasonalBg: string): string {
  // Blend seasonal bg 12% over warm white so frames feel seasonal, not colored.
  if (!seasonalBg || seasonalBg === '#fafaf9') return '#fdfbf6';
  return mixHex('#fdfbf6', seasonalBg, 0.14);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(pa[0], pb[0])},${m(pa[1], pb[1])},${m(pa[2], pb[2])})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Sparse paper fibres / flecks — visible only when you look closely. */
function addPaperFlecks(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  const count = Math.round((w * h) / 22000);
  for (let i = 0; i < count; i++) {
    const fx = Math.random() * w;
    const fy = Math.random() * h;
    const a = Math.random() * 0.05 + 0.015;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(120,95,70,${a})` : `rgba(255,255,255,${a + 0.04})`;
    ctx.fillRect(fx, fy, Math.random() * 1.6 + 0.4, Math.random() * 1.2 + 0.4);
  }
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
