// ©️ Mewn — Seasonal frame selector (extra choosable)
import React from 'react';
import { SEASONAL_FRAMES, SeasonalFrameId } from './seasonal';

export const SeasonalSelector: React.FC<{
  selected: SeasonalFrameId;
  onSelect: (id: SeasonalFrameId) => void;
}> = ({ selected, onSelect }) => {
  return (
    <div className="card p-3 sm:p-4 border-paper-border/90 bg-paper-100/95 shadow-cozy animate-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>❄️ Seasonal Frame</span>
          <span className="font-normal normal-case text-ink-500">(extra)</span>
        </p>
        <span className="text-[11px] font-mono text-ink-500">Choosable</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="radiogroup" aria-label="Seasonal frame">
        {SEASONAL_FRAMES.map(f => {
          const active = f.id === selected;
          return (
            <button key={f.id} onClick={() => onSelect(f.id)} role="radio" aria-checked={active} className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-organic-sm transition-all ${active ? 'bg-paper-200 ring-2 ring-clay scale-105 shadow-sm' : 'hover:bg-paper-200/50 opacity-80 hover:opacity-100'}`}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-white shadow-inner" style={{ background: f.bg, color: f.accent, borderColor: f.accent + '40' }}>{f.emoji}</span>
              <span className={`text-[11px] font-medium ${active ? 'text-ink-900' : 'text-ink-700'}`}>{f.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-500 text-center mt-2">{SEASONAL_FRAMES.find(f=>f.id===selected)?.hint} — applied to Polaroid & Collage</p>
    </div>
  );
};
