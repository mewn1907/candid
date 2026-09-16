// ©️ Mewn

import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100/50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle wabi-sabi texture - imperfect, natural */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />
      
      <div className="max-w-2xl w-full space-y-12 animate-in relative">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-wabi-400/80 to-wabi-600/80 shadow-lg shadow-wabi-500/20 mb-8 transform transition-transform hover:scale-105">
            <svg className="w-16 h-16 text-surface-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-display-lg font-light text-surface-900 tracking-tight">Candid</h1>
          <p className="text-heading-md text-surface-700 max-w-lg mx-auto font-light leading-relaxed">Two people. One virtual frame.</p>
          <p className="text-body-lg text-surface-600 max-w-md mx-auto font-light leading-relaxed">Connect with someone far away and capture a shared moment together in an imperfect, beautiful way.</p>
        </header>

        <main className="space-y-6">
          <Link
            to="/create"
            className="btn-secondary btn-lg w-full group relative overflow-hidden transition-all duration-slow hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-wabi-500/10 to-wabi-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-slow" />
            <svg className="w-6 h-6 transition-transform group-hover:translate-x-1 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="relative">Create Room</span>
          </Link>

          <Link
            to="/join"
            className="btn-ghost btn-lg w-full group border border-surface-300 hover:border-surface-400 transition-all duration-slow"
          >
            <svg className="w-6 h-6 transition-transform group-hover:scale-110 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" />
            </svg>
            <span className="relative">Join Room</span>
          </Link>
        </main>

        <footer className="pt-12">
          <div className="space-y-4 text-center text-body-sm text-surface-500">
            <p className="flex items-center justify-center gap-2">
              <span>©️ Mewn</span>
              <span className="w-1 h-1 rounded-full bg-surface-300" aria-hidden="true" />
              <span>Built with imperfection</span>
              <span className="w-1 h-1 rounded-full bg-surface-300" aria-hidden="true" />
              <span>Wabi Sabi design</span>
            </p>
            <p className="text-caption text-surface-400 max-w-lg mx-auto">
              Embracing the beauty of imperfections, transience, and simplicity in human connection.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};