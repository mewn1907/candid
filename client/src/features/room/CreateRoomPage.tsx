// ©️ Mewn — Cozy
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRoomContext } from './hooks/use-room-context';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, error, isConnected, apiUrl } = useRoomContext();
  const [attempt, setAttempt] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (!isConnected && attempt === 0) return;
    startedRef.current = true;
    let mounted = true;
    createRoom().then((result) => {
      if (mounted && result.success && result.roomId) {
        navigate(`/room/${result.roomId}`, { replace: true });
      }
    });
    return () => { mounted = false; };
  }, [createRoom, navigate, attempt, isConnected]);

  return (
    <div className="relative min-h-screen bg-paper-100 bg-paper-grain flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto pt-4">
        <Link to="/" className="inline-flex items-center gap-2 text-ink-700 hover:text-ink-900 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back to warm lobby</span>
        </Link>
      </div>
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="card-deckle p-8 sm:p-10 relative overflow-hidden animate-scale-in text-center">
          <div className="washi-tape" />
          <div className="w-16 h-16 rounded-full border-4 border-clay border-t-transparent animate-spin mx-auto mb-6" aria-label="Creating room" />
          <h2 className="text-2xl font-display font-light text-ink-900 mb-2">Lighting the Booth…</h2>
          <p className="text-sm text-ink-700 mb-6">{isConnected ? 'Generating your unique room ID' : `Connecting to server… (${apiUrl})`}</p>
          {error && (
            <div className="flex items-start gap-3 p-4 bg-terracotta-subtle border border-terracotta/20 rounded-organic-sm text-left animate-in mb-4" role="alert">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-terracotta" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <p className="font-medium text-terracotta text-sm">Error</p>
                <p className="text-xs text-ink-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          {error && (
            <button onClick={() => { startedRef.current = false; setAttempt((a) => a + 1); }} className="btn-secondary w-full">Try again</button>
          )}
          <div className="mt-8 pt-6 border-t border-paper-border/80 flex items-center justify-center gap-2 text-xs text-ink-500">
            <span className="w-2 h-2 rounded-full bg-clay animate-pulse-soft" />
            <span>Encrypted WebRTC P2P • No images stored</span>
          </div>
        </div>
      </div>
      <footer className="text-center py-4 text-xs text-ink-500">©️ Mewn</footer>
    </div>
  );
};
