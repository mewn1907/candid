// ©️ Mewn — Cozy
import React from 'react';
import { PhotoFilterId } from '../../types/room.types';
import { PHOTO_FILTERS } from './filters';

interface FilterSelectorProps {
  selected: PhotoFilterId;
  onSelect: (filter: PhotoFilterId) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="card p-3 sm:p-4 border-paper-border/90 bg-paper-100/95 shadow-cozy animate-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 uppercase tracking-wider">
          <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
          <span>Cozy Film Presets</span>
        </div>
        <span className="text-[11px] font-mono text-ink-500">Live preview</span>
      </div>
      <div className="flex items-center justify-center gap-3" role="radiogroup" aria-label="Photo finish">
        {PHOTO_FILTERS.map((filter) => {
          const active = filter.id === selected;
          return (
            <button key={filter.id} type="button" role="radio" aria-checked={active} onClick={() => onSelect(filter.id)} className={`flex flex-col items-center gap-1.5 p-2 rounded-organic-sm transition-all duration-200 ease-organic ${active ? 'bg-paper-200/90 ring-2 ring-clay scale-105 shadow-sm' : 'hover:bg-paper-200/50 opacity-80 hover:opacity-100'}`} title={`${filter.label} — ${filter.hint}`}>
              <span className={`w-12 h-12 rounded-full border-2 transition-all ${active ? 'border-clay shadow-md' : 'border-paper-border group-hover:border-clay/30'}`} style={{ background: filter.swatch }} aria-hidden="true" />
              <span className={`text-caption ${active ? 'text-ink-900 font-semibold' : 'text-ink-700'}`}>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
