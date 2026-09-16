// ©️ Mewn — Seasonal frames (extra, choosable)
export type SeasonalFrameId = 'none' | 'sakura' | 'sun' | 'maple' | 'pine' | 'holiday';

export interface SeasonalFrame {
  id: SeasonalFrameId;
  label: string;
  emoji: string;
  hint: string;
  bg: string;
  accent: string;
  captionBg: string;
}

export const SEASONAL_FRAMES: SeasonalFrame[] = [
  { id: 'none', label: 'None', emoji: '◯', hint: 'Clean wabi paper', bg: '#fafaf9', accent: '#292524', captionBg: '#f5f0e8' },
  { id: 'sakura', label: 'Sakura', emoji: '🌸', hint: 'Spring petals', bg: '#fdf6f0', accent: '#d9a0b8', captionBg: '#fde8f0' },
  { id: 'sun', label: 'Sun', emoji: '☀️', hint: 'Summer linen', bg: '#fdf8f0', accent: '#e5a84f', captionBg: '#fef3c7' },
  { id: 'maple', label: 'Maple', emoji: '🍁', hint: 'Autumn pine', bg: '#faf6f0', accent: '#c48849', captionBg: '#f5e8d5' },
  { id: 'pine', label: 'Pine', emoji: '🌲', hint: 'Winter frost', bg: '#f0f4f0', accent: '#3E4D3A', captionBg: '#edf1eb' },
  { id: 'holiday', label: 'Holiday', emoji: '✨', hint: 'Gold foil', bg: '#fdfbf7', accent: '#b45309', captionBg: '#fef3c7' },
];

export function isSeasonalFrameId(v: unknown): v is SeasonalFrameId {
  return SEASONAL_FRAMES.some(f => f.id === v);
}

export function seasonalFor(id: SeasonalFrameId): SeasonalFrame {
  return SEASONAL_FRAMES.find(f => f.id === id) ?? SEASONAL_FRAMES[0];
}
