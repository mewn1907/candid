// ©️ Mewn — Cozy Wabi-Sabi (Stitch)
import React from 'react';
import { Link } from 'react-router-dom';
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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mb-16 animate-slide-up" style={{ animationDelay: '250ms' as any }}>
          <Link to="/create" className="btn-primary w-full sm:w-auto flex-1 text-base group">
            <span>Create a Room</span>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <Link to="/join" className="btn-secondary w-full sm:w-auto flex-1 text-base">Join with Code</Link>
        </div>

        <div className="relative w-full max-w-2xl h-80 sm:h-96 my-4 flex items-center justify-center">
          <div className="absolute left-4 sm:left-12 top-6 w-52 sm:w-64 polaroid-frame animate-drift-slow z-10">
            <div className="washi-tape" />
            <div className="aspect-[4/3] bg-paper-300 rounded overflow-hidden relative shadow-inner">
              <div className="w-full h-full bg-gradient-to-tr from-clay/30 via-paper-200 to-cream flex items-center justify-center relative overflow-hidden">
                {/* wabi doodle fill — YOU */}
                <svg className="absolute top-3 left-3 w-10 h-10 text-clay/20" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 6 C12 6 8 12 12 18 C14 22 18 24 20 28 C22 24 26 22 28 18 C32 12 28 6 20 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14 C14 14 16 16 20 16 C24 16 26 14 26 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><circle cx="16" cy="12" r="1.2" fill="currentColor"/><circle cx="24" cy="12" r="1.2" fill="currentColor"/></svg>
                <svg className="absolute bottom-2 right-3 w-14 h-8 text-ink-700/15" viewBox="0 0 56 32" fill="none" aria-hidden="true"><path d="M4 16 C10 8 18 12 22 16 C26 20 34 22 42 16 C46 12 50 14 52 16" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M22 16 C22 10 28 6 34 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M12 18 L10 22 M20 20 L18 24 M34 18 L36 22" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
                <svg className="absolute top-1/2 right-2 w-6 h-6 text-pine/15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4 C8 8 6 12 12 20 C18 12 16 8 12 4Z" stroke="currentColor" strokeWidth="1"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
                <div className="text-center p-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center shadow-sm text-clay font-mono text-sm border border-white">YOU</div>
                </div>
              </div>
            </div>
            <p className="font-handwritten text-lg text-ink-700 text-center mt-3">"Wish you were sitting right here"</p>
          </div>
          <div className="absolute right-4 sm:right-12 top-12 w-52 sm:w-64 polaroid-frame animate-drift-alt z-20">
            <div className="washi-tape !rotate-[2deg] !bg-pine-light/40" />
            <div className="aspect-[4/3] bg-paper-300 rounded overflow-hidden relative shadow-inner">
              <div className="w-full h-full bg-gradient-to-tl from-pine/25 via-paper-200 to-cream flex items-center justify-center relative overflow-hidden">
                <svg className="absolute top-2 right-3 w-10 h-10 text-pine/20" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 32 C20 24 12 18 10 12 C12 8 16 6 20 10 C24 6 28 8 30 12 C28 18 20 24 20 32Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 10 L20 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                <svg className="absolute bottom-3 left-3 w-12 h-7 text-clay/15" viewBox="0 0 48 28" fill="none" aria-hidden="true"><path d="M6 14 C12 6 20 10 24 14 C28 18 36 20 42 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><circle cx="24" cy="14" r="2" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M4 16 L2 20 M14 18 L12 22" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
                <svg className="absolute top-3 left-2 w-5 h-5 text-ink-700/12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2"/><path d="M12 5 L12 9 M12 15 L12 19 M5 12 L9 12 M15 12 L19 12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/></svg>
                <div className="text-center p-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center shadow-sm text-pine font-mono text-sm border border-white">THEM</div>
                </div>
              </div>
            </div>
            <p className="font-handwritten text-lg text-ink-700 text-center mt-3">"Frames together forever."</p>
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
