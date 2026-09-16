// ©️ Mewn — shoot-time settings, Insta-style grouped rows with switches.
// Only things that configure the capture live here. Print decorations
// (paper, tape, filters) live in PolaroidStudio at print time.
import React from 'react';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-surface-900' : 'bg-surface-200 hover:bg-surface-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function Row({
  icon,
  tint,
  title,
  hint,
  on,
  onChange,
  last,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${last ? '' : 'border-b border-surface-100'}`}>
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tint}`}>{icon}</span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-body-sm font-medium text-surface-900 leading-tight">{title}</span>
        <span className="block text-caption text-surface-500 leading-tight mt-0.5">{hint}</span>
      </span>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

interface ShootSettingsProps {
  burstCount: number;
  setBurstCount: (n: number) => void;
  durationSec: number;
  setDurationSec: (n: number) => void;
  promptEnabled: boolean;
  setPromptEnabled: (v: boolean) => void;
  bgBlur: boolean;
  setBgBlur: (v: boolean) => void;
  boomerang: boolean;
  setBoomerang: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (v: boolean) => void;
}

export const ShootSettings: React.FC<ShootSettingsProps> = (p) => {
  return (
    <div className="space-y-4">
      {/* 01 — Capture setup */}
      <section className="card p-4 sm:p-5" aria-label="Capture setup">
        <p className="text-caption font-semibold uppercase tracking-widest text-surface-400 mb-1">01 · Capture</p>
        <p className="text-body-sm font-medium text-surface-700 mb-3">Shots</p>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-100 border border-surface-200" role="radiogroup" aria-label="Number of shots">
          {[
            { count: 1, label: 'Single', hint: '1 frame', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} /></svg>
            ) },
            { count: 3, label: 'Burst ×3', hint: '3 frames', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="11" height="12" rx="2" strokeWidth={2} /><rect x="9" y="4" width="11" height="12" rx="2" strokeWidth={2} fill="currentColor" opacity={0.25} /></svg>
            ) },
          ].map((o) => {
            const active = o.count === p.burstCount;
            return (
              <button
                key={o.count}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => p.setBurstCount(o.count)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${active ? 'bg-surface-900 text-cream shadow-sm' : 'text-surface-600 hover:bg-white'}`}
              >
                {o.icon}
                <span>
                  <span className="block text-body-sm font-semibold leading-tight">{o.label}</span>
                  <span className={`block text-[11px] leading-tight ${active ? 'text-cream/70' : 'text-surface-400'}`}>{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-body-sm font-medium text-surface-700 mt-4 mb-3">Countdown</p>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-100 border border-surface-200" role="radiogroup" aria-label="Countdown length">
          {[3, 5, 10].map((s) => {
            const active = s === p.durationSec;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => p.setDurationSec(s)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold transition-all ${active ? 'bg-surface-900 text-cream shadow-sm' : 'text-surface-600 hover:bg-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 9v4l2.5 2.5M9 2h6" /></svg>
                {s}s
              </button>
            );
          })}
        </div>
      </section>

      {/* 02 — Creative tools */}
      <section className="card px-4 sm:px-5 py-2" aria-label="Creative tools">
        <p className="text-caption font-semibold uppercase tracking-widest text-surface-400 pt-3">02 · Creative tools</p>
        <Row
          tint="bg-clay-subtle text-clay-dark"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5M21 12a9 9 0 01-13.2 7.9L3 21l1.2-4.7A9 9 0 1121 12z" /></svg>}
          title="Prompt card"
          hint="Pose idea before the timer"
          on={p.promptEnabled}
          onChange={p.setPromptEnabled}
        />
        <Row
          tint="bg-pine-subtle text-pine-dark"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c3.5 4.5 6 7.7 6 11a6 6 0 11-12 0c0-3.3 2.5-6.5 6-11z" /></svg>}
          title="Cozy blur"
          hint="Soft background on preview"
          on={p.bgBlur}
          onChange={p.setBgBlur}
        />
        <Row
          tint="bg-wabi-100 text-wabi-700"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 4.5l5 5-9.5 9.5a2.1 2.1 0 01-3-3L16.5 6.5" /><path strokeLinecap="round" strokeWidth={2} d="M4 20l3-3" /></svg>}
          title="Boomerang clip"
          hint="3s clip recorded while shooting"
          on={p.boomerang}
          onChange={p.setBoomerang}
          last
        />
      </section>

      {/* 03 — Feedback */}
      <section className="card px-4 sm:px-5 py-2" aria-label="Feedback">
        <p className="text-caption font-semibold uppercase tracking-widest text-surface-400 pt-3">03 · Feedback</p>
        <Row
          tint="bg-surface-100 text-surface-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>}
          title="Shutter sounds"
          hint="Ticks + shutter click"
          on={p.soundEnabled}
          onChange={p.setSoundEnabled}
        />
        <Row
          tint="bg-surface-100 text-surface-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth={2} d="M4 9v6M8 6v12M12 3v18M16 7v10M20 10v4" /></svg>}
          title="Haptic"
          hint="Gentle buzz on capture"
          on={p.hapticEnabled}
          onChange={p.setHapticEnabled}
          last
        />
      </section>
      <p className="text-[11px] text-ink-500 text-center">Print styling — paper, tape, film — lives at print time, not here</p>
    </div>
  );
};
