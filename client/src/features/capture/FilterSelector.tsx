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
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-clay/10 border border-clay/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
          </span>
          <div>
            <p className="text-xs font-semibold text-ink-900 tracking-wider uppercase leading-none">Cozy Film Presets</p>
            <p className="text-[11px] text-ink-500 font-mono leading-none">14 finishes · tap to preview live</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clay text-cream text-[11px] font-medium shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cream animate-pulse-soft" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none" role="radiogroup" aria-label="Photo finish — live preview on camera">
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
              className={`flex-shrink-0 snap-center flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all duration-200 ease-organic min-w-[76px] sm:min-w-[84px] ${active ? 'bg-white border-clay shadow-cozy ring-1 ring-clay scale-[1.03]' : 'bg-paper-50/70 border-paper-border/60 hover:bg-white hover:border-paper-border hover:shadow-sm opacity-90 hover:opacity-100'}`}
              title={`${filter.label} — ${filter.hint}${isNone ? ' (default: no filter — live preview shows original)' : ''}`}
            >
              <span
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all ${active ? 'border-clay shadow-md' : 'border-white'} ${isNone ? 'border-dashed' : ''}`}
                style={{ background: filter.swatch }}
                aria-hidden="true"
              >
                {isNone ? (
                  <span className="bg-white/90 px-1.5 py-0.5 rounded-full text-ink-700 text-[10px] font-mono border border-paper-border shadow-sm">∅ None</span>
                ) : (
                  <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                )}
                {active && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-clay text-cream flex items-center justify-center text-[10px] shadow-sm">✓</span>}
              </span>
              <span className={`text-xs font-semibold leading-none ${active ? 'text-ink-900' : 'text-ink-700'}`}>{filter.label}</span>
              <span className={`text-[10px] leading-none text-center max-w-[72px] ${active ? 'text-clay font-medium' : 'text-ink-500'}`}>{filter.hint}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-clay text-cream' : isNone ? 'bg-ink-900 text-cream' : 'bg-paper-200 text-ink-500'}`}>{isNone ? 'Default' : active ? 'Active' : 'Tap'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-paper-border/50 gap-2">
        <p className="text-[11px] text-ink-500 leading-tight">
          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse-soft" />Live preview</span> on your camera — <span className="font-medium text-ink-700">None</span> is original, others bake at capture
        </p>
        <span className="hidden sm:inline text-[10px] font-mono text-ink-400 whitespace-nowrap">← swipe →</span>
      </div>
    </div>
  );
};
