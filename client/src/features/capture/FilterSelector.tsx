// ©️ Mewn

import React from 'react';
import { PhotoFilterId } from '../../types/room.types';
import { PHOTO_FILTERS } from './filters';

interface FilterSelectorProps {
  selected: PhotoFilterId;
  onSelect: (filter: PhotoFilterId) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="animate-in">
      <p className="text-body-sm font-medium text-surface-700 mb-3 text-center">Finish</p>
      <div className="flex items-center justify-center gap-3" role="radiogroup" aria-label="Photo finish">
        {PHOTO_FILTERS.map((filter) => {
          const active = filter.id === selected;
          return (
            <button
              key={filter.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(filter.id)}
              className="flex flex-col items-center gap-1.5 group"
              title={`${filter.label} — ${filter.hint}`}
            >
              <span
                className={`w-12 h-12 rounded-full border-2 transition-all duration-fast ${
                  active
                    ? 'border-wabi-600 shadow-md scale-105'
                    : 'border-surface-200 group-hover:border-surface-400'
                }`}
                style={{ background: filter.swatch }}
                aria-hidden="true"
              />
              <span className={`text-caption ${active ? 'text-surface-900 font-medium' : 'text-surface-500'}`}>
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
