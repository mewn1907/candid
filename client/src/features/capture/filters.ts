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
    canvasFilter: 'sepia(0.85) contrast(1.08) brightness(1.06) saturate(1.1)',
    swatch: 'linear-gradient(135deg, #e2dcc8, #8e6e42)',
  },
  {
    id: 'mono',
    label: 'Mono ink',
    hint: 'Quiet grayscale',
    canvasFilter: 'grayscale(1) contrast(1.25) brightness(1.08)',
    swatch: 'linear-gradient(135deg, #fafaf9, #27272a)',
  },
  {
    id: 'warm',
    label: 'Warm fade',
    hint: 'Soft afternoon',
    canvasFilter: 'sepia(0.45) saturate(1.6) brightness(1.08) hue-rotate(-6deg)',
    swatch: 'linear-gradient(135deg, #f5d8ab, #c48849)',
  },
  {
    id: 'clarendon',
    label: 'Clarendon',
    hint: 'High contrast pop',
    canvasFilter: 'contrast(1.2) saturate(1.35) brightness(1.02)',
    swatch: 'linear-gradient(135deg, #f5d8ab 0%, #6b7a5c 50%, #c48849 100%)',
  },
  {
    id: 'gingham',
    label: 'Gingham',
    hint: 'Faded vintage',
    canvasFilter: 'sepia(0.3) contrast(0.9) brightness(1.08) hue-rotate(-10deg) saturate(0.85)',
    swatch: 'linear-gradient(135deg, #ede7d9 0%, #d4c9ad 100%)',
  },
  {
    id: 'moon',
    label: 'Moon',
    hint: 'Cold B&W',
    canvasFilter: 'grayscale(1) contrast(1.15) brightness(1.1) sepia(0.1) hue-rotate(180deg)',
    swatch: 'linear-gradient(135deg, #a1a1aa 0%, #09090b 100%)',
  },
  {
    id: 'lark',
    label: 'Lark',
    hint: 'Bright & airy',
    canvasFilter: 'contrast(0.92) brightness(1.12) saturate(1.18) sepia(0.08)',
    swatch: 'linear-gradient(135deg, #faf8f5 0%, #e2dcc8 100%)',
  },
  {
    id: 'reyes',
    label: 'Reyes',
    hint: 'Dusty vintage',
    canvasFilter: 'sepia(0.22) brightness(1.1) contrast(0.88) saturate(0.9)',
    swatch: 'linear-gradient(135deg, #e7e5e4 0%, #a1a1aa 100%)',
  },
  {
    id: 'juno',
    label: 'Juno',
    hint: 'Vivid warm',
    canvasFilter: 'sepia(0.2) contrast(1.1) brightness(1.08) saturate(1.45) hue-rotate(-6deg)',
    swatch: 'linear-gradient(135deg, #f5d8ab 0%, #BD5338 100%)',
  },
  {
    id: 'valencia',
    label: 'Valencia',
    hint: 'Faded warm',
    canvasFilter: 'sepia(0.3) contrast(1.08) brightness(1.08) saturate(1.25) hue-rotate(-4deg)',
    swatch: 'linear-gradient(135deg, #eFE7DE 0%, #c48849 100%)',
  },
  {
    id: 'xpro',
    label: 'X-Pro II',
    hint: 'Cross-process',
    canvasFilter: 'sepia(0.3) contrast(1.28) brightness(0.98) saturate(1.45) hue-rotate(-10deg)',
    swatch: 'linear-gradient(135deg, #705a33 0%, #18181b 100%)',
  },
];

export function isPhotoFilterId(value: unknown): value is PhotoFilterId {
  return PHOTO_FILTERS.some((f) => f.id === value);
}

export function canvasFilterFor(filter: PhotoFilterId): string {
  return PHOTO_FILTERS.find((f) => f.id === filter)?.canvasFilter ?? '';
}
