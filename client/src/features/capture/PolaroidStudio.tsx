// ©️ Mewn — result tabs: Regular (clean save) vs Polaroid (film-graded print).
// Flow: photo lands as a normal picture -> two options on top ->
// Polaroid tab auto-develops the print -> download the newly created polaroid.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { buildPolaroid } from './polaroid';
import { copyImageToClipboard, shareImage } from './share';
import { SEASONAL_FRAMES, SeasonalFrameId } from './seasonal';
import { PHOTO_FILTERS, cssFilterFor } from './filters';
import type { PhotoFilterId } from '../../types/room.types';

interface PolaroidStudioProps {
  photoSrc: string;
  filenameBase: string; // e.g. 'candid-photo' — polaroid gets '-polaroid' suffix
  seasonalId?: SeasonalFrameId;
  onSeasonalChange?: (id: SeasonalFrameId) => void;
  caption: string;
  onCaptionChange: (next: string) => void;
  washiColor?: string;
  onWashiChange?: (c: string) => void;
  note?: (msg: string) => void;
  baseFilter?: PhotoFilterId; // capture-time filter — studio starts from here
}

export const PolaroidStudio: React.FC<PolaroidStudioProps> = ({
  photoSrc,
  filenameBase,
  seasonalId = 'none',
  onSeasonalChange,
  caption,
  onCaptionChange,
  washiColor = '#E5BF94',
  onWashiChange,
  note,
  baseFilter = 'natural',
}) => {
  const [tab, setTab] = useState<'regular' | 'polaroid'>('regular');
  const [polaroidUrl, setPolaroidUrl] = useState<string | null>(null);
  const [developing, setDeveloping] = useState(false);
  const [revealed, setRevealed] = useState(false); // develop-in animation
  const [printFilter, setPrintFilter] = useState<PhotoFilterId>(baseFilter);
  const buildId = useRef(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const develop = useCallback(
    async (src: string, text: string, seasonal: SeasonalFrameId, filter: PhotoFilterId) => {
      const id = ++buildId.current;
      setDeveloping(true);
      setRevealed(false);
      // Minimum dwell so it feels like chemistry, not a spinner.
      const started = Date.now();
      try {
        const url = await buildPolaroid(src, text || 'Candid', seasonal, filter);
        if (buildId.current !== id) return;
        const wait = Math.max(0, 1100 - (Date.now() - started));
        await new Promise((r) => setTimeout(r, wait));
        if (buildId.current !== id) return;
        setPolaroidUrl(url);
        // Reveal: milky white -> sharp, like a real print emerging.
        requestAnimationFrame(() => setRevealed(true));
      } catch {
        note?.('Polaroid failed — try again');
      } finally {
        if (buildId.current === id) setDeveloping(false);
      }
    },
    [note],
  );

  // Reset when a new photo lands; auto-develop on first Polaroid visit.
  useEffect(() => {
    setPolaroidUrl(null);
    setRevealed(false);
    setPrintFilter(baseFilter);
    if (tab === 'polaroid') develop(photoSrc, caption, seasonalId, baseFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSrc]);

  // Seasonal paper change re-develops if we're already looking at the print.
  useEffect(() => {
    if (tab === 'polaroid' && polaroidUrl && !developing) develop(photoSrc, caption, seasonalId, printFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonalId]);

  const switchTab = (next: 'regular' | 'polaroid') => {
    setTab(next);
    if (next === 'polaroid' && !polaroidUrl && !developing) {
      develop(photoSrc, caption, seasonalId, printFilter);
    }
  };

  // Live caption: debounce a re-develop so handwriting updates like magic.
  const handleCaption = (next: string) => {
    onCaptionChange(next);
    if (tab !== 'polaroid') return;
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => develop(photoSrc, next, seasonalId, printFilter), 650);
  };

  const pickPrintFilter = (next: PhotoFilterId) => {
    setPrintFilter(next);
    if (tab !== 'polaroid') return;
    if (filterTimer.current) clearTimeout(filterTimer.current);
    // Tiny delay so the pill activates first, then chemistry runs.
    filterTimer.current = setTimeout(() => develop(photoSrc, caption, seasonalId, next), 250);
  };

  useEffect(() => () => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    if (filterTimer.current) clearTimeout(filterTimer.current);
  }, []);

  const download = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-5">
      {/* Top switch: Regular save vs Polaroid print */}
      <div
        className="flex items-center justify-center gap-1 p-1 rounded-full bg-surface-100 border border-surface-200 w-fit mx-auto"
        role="tablist"
        aria-label="Photo finish"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'regular'}
          onClick={() => switchTab('regular')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-body-sm transition-all ${
            tab === 'regular'
              ? 'bg-white text-surface-900 font-semibold shadow-sm border border-surface-200'
              : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'polaroid'}
          onClick={() => switchTab('polaroid')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-body-sm transition-all ${
            tab === 'polaroid'
              ? 'bg-surface-900 text-cream font-semibold shadow-sm'
              : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="1.5" strokeWidth={2} />
            <rect x="7" y="6" width="10" height="9" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M9 18.5h6" />
          </svg>
          Polaroid
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-clay/20 text-clay-dark">600</span>
        </button>
      </div>

      {tab === 'regular' ? (
        <div className="space-y-4 animate-in">
          <div className="relative w-full max-w-lg mx-auto aspect-auto bg-surface-900 rounded-xl overflow-hidden shadow-lg border border-surface-700/30">
            <img src={photoSrc} alt="Your Candid photo" className="w-full h-auto object-cover" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <a
              href={photoSrc}
              download={`${filenameBase}.jpg`}
              className="btn-success btn-lg flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={async () => {
                const r = await shareImage(photoSrc, `${filenameBase}.jpg`, 'Candid');
                note?.(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied to clipboard ✓' : 'Download instead');
              }}
              className="btn-ghost btn-sm border border-surface-200"
            >
              Share
            </button>
            <button
              onClick={async () => {
                const ok = await copyImageToClipboard(photoSrc);
                note?.(ok ? 'Copied image ✓' : 'Copy failed — try Download');
              }}
              className="btn-ghost btn-sm border border-surface-200"
            >
              Copy image
            </button>
          </div>
          <p className="text-caption text-center text-surface-500">
            Clean digital file — switch to <button className="underline font-medium" onClick={() => switchTab('polaroid')}>Polaroid</button> for the photobooth print
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in">
          <input
            value={caption}
            onChange={(e) => handleCaption(e.target.value)}
            placeholder="Write on the white border…"
            maxLength={32}
            className="input text-center max-w-sm mx-auto"
            style={{ fontFamily: "Caveat, cursive", fontSize: '1.35rem' }}
            aria-label="Polaroid caption"
          />

          {/* Print filter — same film family as capture, re-developed live */}
          <div className="max-w-sm mx-auto">
            <p className="text-caption font-medium text-surface-500 text-center mb-2">
              Print film {printFilter !== 'natural' && <span className="text-surface-700">· {PHOTO_FILTERS.find((f) => f.id === printFilter)?.label}</span>}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 justify-start sm:justify-center" role="radiogroup" aria-label="Polaroid print filter">
              {PHOTO_FILTERS.map((f) => {
                const active = f.id === printFilter;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={`${f.label} — ${f.hint}`}
                    onClick={() => pickPrintFilter(f.id)}
                    className={`flex flex-col items-center gap-1 shrink-0 transition-all ${active ? 'scale-105' : 'opacity-75 hover:opacity-100'}`}
                  >
                    <span
                      className={`w-11 h-11 rounded-full border-2 overflow-hidden relative ${active ? 'border-surface-900 shadow-md' : 'border-surface-200'}`}
                      style={{ background: f.swatch }}
                    >
                      {/* live mini-preview of the actual photo through this filter */}
                      <img
                        src={photoSrc}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: cssFilterFor(f.id) }}
                      />
                    </span>
                    <span className={`text-[10px] font-medium ${active ? 'text-surface-900' : 'text-surface-500'}`}>
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card paper — seasonal tint, picked at print time */}
          <div className="max-w-sm mx-auto">
            <p className="text-caption font-medium text-surface-500 text-center mb-2">
              Card paper {seasonalId !== 'none' && <span className="text-surface-700">· {SEASONAL_FRAMES.find((s) => s.id === seasonalId)?.label}</span>}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 px-1 justify-start sm:justify-center" role="radiogroup" aria-label="Seasonal card paper">
              {SEASONAL_FRAMES.map((s) => {
                const active = s.id === seasonalId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={s.hint}
                    onClick={() => onSeasonalChange?.(s.id)}
                    className={'flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all ' + (active ? 'bg-surface-900 text-cream border-surface-900 shadow-sm' : 'bg-white text-surface-600 border-surface-200 hover:border-surface-400')}
                  >
                    <span>{s.emoji} {s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tape — print decoration, picked at print time */}
          <div className="max-w-sm mx-auto flex items-center justify-center gap-2">
            <span className="text-caption text-surface-500">Tape</span>
            {['#E5BF94','#3E4D3A','#BD5338','#4A6B82','#F5EFEB'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onWashiChange?.(c)}
                aria-label={'Tape ' + c}
                className={'w-6 h-6 rounded-full border transition-all ' + (washiColor === c ? 'ring-2 ring-offset-2 ring-surface-900 scale-110' : 'hover:scale-105')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {developing || !polaroidUrl ? (
            <div className="max-w-sm mx-auto">
              <div className="relative bg-[#fdfbf6] rounded-[4px] p-4 pb-20 shadow-[0_24px_60px_-12px_rgba(30,20,10,0.35)] rotate-[-1.5deg]">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 backdrop-blur-[1px] border-t border-b border-white/40 rotate-[-1.5deg] shadow-sm pointer-events-none z-10"
                  style={{ backgroundColor: `${washiColor}99`, clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)' }}
                />
                <div className="aspect-[3/2] bg-gradient-to-br from-white via-[#f3ede2] to-[#e7dccb] animate-pulse rounded-[2px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full border-[3px] border-clay border-t-transparent animate-spin" />
                    <p className="mt-3 text-caption font-mono text-surface-500">Developing…</p>
                    <p className="text-[11px] text-surface-400">don&apos;t shake it 🎞️</p>
                  </div>
                </div>
                <p className="text-center mt-4 text-caption font-mono text-surface-400">POLAROID · 600 FILM</p>
              </div>
            </div>
          ) : (
            <div className="max-w-sm mx-auto">
              <div className="relative rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 backdrop-blur-[1px] border-t border-b border-white/40 rotate-[-1.5deg] shadow-sm pointer-events-none z-10"
                  style={{ backgroundColor: `${washiColor}99`, clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)' }}
                />
                <img
                  src={polaroidUrl}
                  alt="Polaroid print"
                  className="w-full h-auto rounded-[4px] shadow-[0_24px_60px_-12px_rgba(30,20,10,0.45),0_4px_16px_rgba(30,20,10,0.15)] border border-black/5 transition-all duration-[1400ms]"
                  style={
                    revealed
                      ? { filter: 'blur(0) brightness(1)', opacity: 1 }
                      : { filter: 'blur(14px) brightness(1.6)', opacity: 0.4 }
                  }
                />
              </div>
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => download(polaroidUrl, `${filenameBase}-polaroid.jpg`)}
                  className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Polaroid
                </button>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={async () => {
                      const r = await shareImage(polaroidUrl, `${filenameBase}-polaroid.jpg`, 'Candid polaroid');
                      note?.(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied ✓' : 'Download instead');
                    }}
                    className="btn-ghost btn-sm border border-surface-200"
                  >
                    Share polaroid
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await copyImageToClipboard(polaroidUrl);
                      note?.(ok ? 'Copied ✓' : 'Copy failed');
                    }}
                    className="btn-ghost btn-sm border border-surface-200"
                  >
                    Copy image
                  </button>
                  <button
                    onClick={() => develop(photoSrc, caption, seasonalId, printFilter)}
                    className="btn-ghost btn-sm border border-surface-200"
                    title="Re-develop with fresh chemistry"
                  >
                    ↻ Re-develop
                  </button>
                </div>
                <p className="text-caption text-center text-surface-500">Film-graded · {PHOTO_FILTERS.find((f) => f.id === printFilter)?.label ?? 'None'} print · handwritten caption · print-ready JPEG</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
