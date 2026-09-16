// ©️ Mewn — Cozy Wabi-Sabi (Stitch)
import React from 'react';
import { ThemeSwitcher } from '../theme';
import { StarsBackground } from './StarsBackground';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-paper-100 bg-paper-grain flex flex-col justify-between overflow-hidden">
      <StarsBackground />
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-clay-light/20 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-pine-light/15 rounded-full blur-3xl pointer-events-none" />
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-organic-sm bg-clay flex items-center justify-center text-cream shadow-cozy-sm rotate-[-2deg]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <span className="font-display font-light text-2xl tracking-tight text-ink-900">Candid</span>
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-clay animate-ping" />
          </div>
        </div>
        <nav className="flex items-center gap-3 justify-end">
          <div className="flex">
            <ThemeSwitcher compact />
          </div>
        </nav>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-4 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paper-200 border border-paper-border text-xs text-ink-700 mb-8 animate-fade-in shadow-cozy-sm">
          <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
          <span>SYNC, SMILE, SAVE</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-light text-ink-900 tracking-tight leading-[1.08] max-w-3xl mb-6 animate-slide-up">
          Miles apart. <br />
          <span className="font-semibold text-clay hand-underline inline-block mt-1">Frames together.</span>
        </h1>
        <p className="text-lg sm:text-xl text-ink-700 max-w-xl font-normal leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '150ms' as any }}>
          A cozy virtual photobooth built for two. Share a room link, line up your shot, sync your countdown, and capture fun polaroids together — from anywhere.
        </p>


        <div className="relative w-full max-w-xl mx-auto my-6 flex items-center justify-center">
          <div className="w-full max-w-[560px] polaroid-frame animate-drift-slow p-3 sm:p-4 pb-10">
            <div className="washi-tape" />
            {/* Together frame — one shutter, one photo, two cities */}
            <div className="relative bg-white rounded-organic-sm overflow-hidden shadow-inner border border-paper-200">
              <div className="bg-ink-900 text-cream text-center py-2">
                <span className="font-mono text-[11px] tracking-[0.2em] font-light">CANDID</span>
                <span className="mx-2 text-ink-400">·</span>
                <span className="font-mono text-[10px] text-cream/80">3 · 2 · 1</span>
              </div>
              <div className="relative grid grid-cols-2 gap-0">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-clay/25 via-paper-100 to-cream flex flex-col items-center justify-center p-3 border-r border-paper-200">
                  <div className="w-11 h-11 rounded-full bg-cream border border-paper-border flex items-center justify-center shadow-sm text-clay font-mono text-xs">YOU</div>
                  <span className="mt-1.5 text-[10px] font-mono text-ink-700">PARIS</span>
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/45 text-white font-mono text-[8px] backdrop-blur-sm">11:42 PM</span>
                  <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-clay animate-pulse-soft" aria-hidden="true" />
                </div>
                <div className="relative aspect-[4/3] bg-gradient-to-bl from-pine/20 via-paper-100 to-cream flex flex-col items-center justify-center p-3">
                  <div className="w-11 h-11 rounded-full bg-cream border border-paper-border flex items-center justify-center shadow-sm text-pine font-mono text-xs">THEM</div>
                  <span className="mt-1.5 text-[10px] font-mono text-ink-700">TOKYO</span>
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/45 text-white font-mono text-[8px] backdrop-blur-sm">06:42 AM</span>
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-pine animate-pulse-soft" aria-hidden="true" />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-paper-border shadow-sm flex items-center justify-center text-[10px] z-10">♥︎</div>
              </div>
              <div className="bg-ink-900 text-cream/90 text-center py-2.5 flex items-center justify-center gap-2">
                <span className="font-mono text-[10px] tracking-wider">©️ Mewn</span>
                <span className="w-1 h-1 rounded-full bg-cream/60" />
                <span className="font-handwritten text-sm leading-none opacity-90">Frames together</span>
              </div>
            </div>
            <p className="font-handwritten text-lg text-ink-700 text-center mt-3">“One shutter, two cities — one frame.”</p>
            <p className="text-[11px] text-ink-500 text-center mt-1">Real result: two live cameras composed side-by-side, not two solos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
          <div className="card p-6 border-paper-border/80">
            <div className="w-10 h-10 rounded-organic-sm bg-clay-subtle text-clay flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="font-semibold text-ink-900 text-base mb-1">Your Little World</h2>
            <p className="text-sm text-ink-700 leading-relaxed">A quiet booth that belongs only to this moment. Nothing else gets in — just your light, your countdown, your smiles.</p>
          </div>
          <div className="card p-6 border-paper-border/80">
            <div className="w-10 h-10 rounded-organic-sm bg-pine-subtle text-pine flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h2 className="font-semibold text-ink-900 text-base mb-1">Synced Shutter Snap</h2>
            <p className="text-sm text-ink-700 leading-relaxed">Trigger a 3, 5, or 10-second countdown that ticks and flashes simultaneously on both displays.</p>
          </div>
          <div className="card p-6 border-paper-border/80">
            <div className="w-10 h-10 rounded-organic-sm bg-terracotta-subtle text-terracotta flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
            </div>
            <h2 className="font-semibold text-ink-900 text-base mb-1">Cozy Vintage Filters</h2>
            <p className="text-sm text-ink-700 leading-relaxed">Warm Kodachrome, Fuji Velvia tones, and textured grain. Export as polaroids or twin photobooth strips.</p>
          </div>
        </div>

      </main>
      <footer className="relative z-10 w-full border-t border-paper-border py-6 px-6 bg-paper-50/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-ink-500 gap-3">
          <div className="flex items-center gap-2"><span>©️ Mewn</span><span>•</span><span>All rights reserved</span></div>
          <div className="flex items-center gap-1.5 text-ink-700"><span>Encrypted WebRTC P2P</span><span className="w-3.5 h-3.5 rounded-full bg-pine inline-block" /></div>
        </div>
      </footer>
    </div>
  );
};
