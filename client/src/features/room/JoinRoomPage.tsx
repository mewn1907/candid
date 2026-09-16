// ©️ Mewn — Cozy
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useRoomContext } from './hooks/use-room-context';
import { StarsBackground } from '../landing/StarsBackground';
import { ThemeSwitcher } from '../theme';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId: linkRoomId } = useParams<{ roomId?: string }>();
  const { joinRoom, loading, error } = useRoomContext();
  const [roomId, setRoomId] = useState(linkRoomId ?? '');

  function extractRoomId(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const m = trimmed.match(/[A-Za-z0-9_-]{10}/g);
    if (m) return m[m.length - 1];
    const noQuery = trimmed.split('?')[0].split('#')[0];
    const segs = noQuery.split('/');
    return (segs[segs.length - 1] || trimmed).trim();
  }

  const join = async (id: string) => {
    const extracted = extractRoomId(id);
    if (!extracted) return;
    try {
      const result = await joinRoom(extracted);
      if (result.success && result.room) navigate(`/room/${result.room.id}`, { replace: true });
    } catch (err) { console.error('Failed to join room:', err); }
  };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await join(roomId); };

  const autoJoinedRef = useRef(false);
  useEffect(() => {
    if (linkRoomId && !autoJoinedRef.current) { autoJoinedRef.current = true; void join(linkRoomId); }
  }, [linkRoomId]);

  return (
    <div className="relative min-h-screen bg-paper-100 bg-paper-grain flex flex-col justify-between p-6 overflow-hidden">
      <StarsBackground />
      <div className="max-w-md w-full mx-auto pt-4 flex items-center justify-between relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-ink-700 hover:text-ink-900 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back to warm lobby</span>
        </Link>
        <div className="hidden sm:flex">
          <ThemeSwitcher compact />
        </div>
      </div>
      <div className="max-w-md w-full mx-auto my-auto py-8 relative z-10">
        <div className="card-deckle p-8 sm:p-10 relative overflow-hidden animate-scale-in">
          <div className="washi-tape !rotate-[1deg] !bg-pine-light/40" />
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-organic bg-pine text-cream mx-auto flex items-center justify-center shadow-cozy mb-4 rotate-[2deg]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-light text-ink-900 mb-2">Join the Booth</h1>
            <p className="text-sm text-ink-700 leading-relaxed">Step inside. Your friend is waiting on the other side of the lens.</p>
          </div>
          {error && (
            <div className="p-3 rounded-organic-sm bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center mb-6" role="alert">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="roomId" className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">10-Character Room Code</label>
              <div className="relative">
                <input id="roomId" type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} onPaste={(e) => { const pasted = e.clipboardData.getData('text'); const extracted = extractRoomId(pasted); if (extracted !== pasted) { e.preventDefault(); setRoomId(extracted); } }} placeholder="e.g. k9XzL2qM7p or paste link" className="input font-mono tracking-widest text-center text-lg pr-10" maxLength={200} required autoFocus={!linkRoomId} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                <svg className="w-4 h-4 text-ink-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h6" /></svg>
              </div>
              <p className="text-[11px] text-ink-500 font-mono mt-2 text-center">Paste full invite link — we’ll extract the code</p>
            </div>
            <button type="submit" disabled={loading || !roomId.trim()} className="btn-success w-full text-base py-4">
              {loading ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Connecting Lens…</span></> : <span>Step Inside Booth</span>}
            </button>
          </form>
        </div>
      </div>
      <footer className="text-center py-4 text-xs text-ink-500 relative z-10">©️ Mewn</footer>
    </div>
  );
};
