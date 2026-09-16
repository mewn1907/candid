// ©️ Mewn

import { PhotoFilterId } from '../../types/room.types';

export interface PhotoFilter {
  id: PhotoFilterId;
  label: string;
  hint: string;
  // CanvasRenderingContext2D.filter value applied at capture time.
  canvasFilter: string;
  // Approximate CSS swatch for the selector UI.
  swatch: string;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  {
    id: 'natural',
    label: 'Natural',
    hint: 'Untouched light',
    canvasFilter: '',
    swatch: 'linear-gradient(135deg, #e7e5e4, #a1a1aa)',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    hint: 'Aged warmth',
    canvasFilter: 'sepia(0.55) contrast(0.96) brightness(1.01)',
    swatch: 'linear-gradient(135deg, #e2dcc8, #8e6e42)',
  },
  {
    id: 'mono',
    label: 'Mono ink',
    hint: 'Quiet grayscale',
    canvasFilter: 'grayscale(1) contrast(1.06) brightness(1.02)',
    swatch: 'linear-gradient(135deg, #fafaf9, #27272a)',
  },
  {
    id: 'warm',
    label: 'Warm fade',
    hint: 'Soft afternoon',
    canvasFilter: 'sepia(0.28) saturate(1.15) brightness(1.03)',
    swatch: 'linear-gradient(135deg, #f5d8ab, #c48849)',
  },
];

export function isPhotoFilterId(value: unknown): value is PhotoFilterId {
  return PHOTO_FILTERS.some((f) => f.id === value);
}

export function canvasFilterFor(filter: PhotoFilterId): string {
  return PHOTO_FILTERS.find((f) => f.id === filter)?.canvasFilter ?? '';
}
