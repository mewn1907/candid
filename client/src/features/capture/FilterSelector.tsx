// ©️ Mewn — Cozy + Live Filter Preview (None by default)
import React from 'react';
import { PhotoFilterId } from '../../types/room.types';
import { PHOTO_FILTERS } from './filters';

interface FilterSelectorProps {
  selected: PhotoFilterId;
  onSelect: (filter: PhotoFilterId) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({ selected, onSelect }) => {
  const normalizedSelected = selected === ('none' as PhotoFilterId) ? 'natural' : selected;
  return (
    <div className="card p-3 sm:p-4 border-paper-border/90 bg-paper-100/95 shadow-cozy animate-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 uppercase tracking-wider">
          <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
          <span>Cozy Film Presets</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-clay/10 text-clay text-[10px] font-mono tracking-wider">Live preview</span>
        </div>
        <span className="text-[11px] font-mono text-ink-500">None = no filter (default)</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Photo finish — live preview on camera">
        {PHOTO_FILTERS.map((filter) => {
          const active = filter.id === normalizedSelected;
          const isNone = filter.id === 'natural';
          return (
            <button
              key={filter.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${filter.label} — ${filter.hint}${isNone ? ' — default, no filter' : ''}`}
              onClick={() => onSelect(filter.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-organic-sm transition-all duration-200 ease-organic min-w-[56px] ${active ? 'bg-paper-200/90 ring-2 ring-clay scale-105 shadow-sm' : 'hover:bg-paper-200/50 opacity-80 hover:opacity-100'}`}
              title={`${filter.label} — ${filter.hint}${isNone ? ' (default: no filter — live preview shows original)' : ''}`}
            >
              <span
                className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-mono ${active ? 'border-clay shadow-md' : 'border-paper-border'} ${isNone ? 'border-dashed' : ''}`}
                style={{ background: filter.swatch }}
                aria-hidden="true"
              >
                {isNone ? <span className="bg-white/85 px-1 rounded-full text-ink-600 border border-paper-border">∅</span> : null}
              </span>
              <span className={`text-caption leading-none ${active ? 'text-ink-900 font-semibold' : 'text-ink-700'}`}>{filter.label}</span>
              {isNone && <span className={`text-[9px] font-mono uppercase tracking-wider ${active ? 'text-clay' : 'text-ink-500'}`}>{active ? 'Default' : 'No filter'}</span>}
              {!isNone && <span className="text-[9px] text-ink-500 leading-none">{active ? 'Active' : '\u00A0'}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-500 text-center mt-3">Live preview: selected finish is applied instantly to your camera via CSS — <span className="font-medium text-ink-700">None</span> shows the original feed; other finishes use the same canvas filter that will be baked at capture.</p>
    </div>
  );
};
