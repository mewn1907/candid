// ©️ Mewn — Cozy
import React, { useState } from 'react';
import QRCode from 'react-qr-code';

export function buildInviteLink(roomId: string): string {
  return `${window.location.origin}/join/${roomId}`;
}

export const InvitePanel: React.FC<{ roomId: string | null }> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  if (!roomId) return null;
  const inviteLink = buildInviteLink(roomId);

  const handleCopy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(inviteLink); ok = true; }
      else throw new Error('clipboard unavailable');
    } catch {
      try {
        const ta = document.createElement('textarea'); ta.value = inviteLink; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, ta.value.length); ok = document.execCommand('copy'); document.body.removeChild(ta);
      } catch { ok = false; }
    }
    setCopied(ok); setTimeout(()=>setCopied(false),2400);
  };
  const canShare = typeof (navigator as any).share === 'function';
  const handleNativeShare = async () => {
    if ((navigator as any).share) { try { await (navigator as any).share({ title:'Join me in Candid', text:'Miles apart. Frames together.', url: inviteLink }); } catch {} } else handleCopy();
  };

  return (
    <div className="card-deckle p-6 sm:p-8 max-w-lg w-full mx-auto relative text-center shadow-cozy-lg border-paper-border">
      <div className="washi-tape" />
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clay/10 text-clay text-xs font-medium mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 4.8L20 9.2l-4 3.9.9 5.4L12 16l-4.9 2.5.9-5.4L4 9.2l5.6-1.4L12 2z" /></svg>
        <span>Waiting for your +1</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-display font-light text-ink-900 mb-1">Invite Your Partner</h2>
      <p className="text-xs sm:text-sm text-ink-700 max-w-xs mx-auto mb-6">Share this code or link. As soon as they join, the camera preview will unlock together.</p>
      <div className="relative mb-6">
        <div className="p-4 rounded-organic-sm bg-paper-50 border border-paper-border/90 flex items-center justify-between shadow-inner gap-3">
          <div className="text-left min-w-0 flex-1">
            <span className="block text-[10px] uppercase font-mono tracking-widest text-ink-500">Private Room Code</span>
            <span className="font-mono text-2xl sm:text-3xl font-semibold tracking-wider text-ink-900 select-all break-all">{roomId}</span>
            <code className="block text-[11px] font-mono text-ink-500 truncate mt-1 select-all">{inviteLink}</code>
          </div>
          <button onClick={handleCopy} className={`px-4 py-2.5 rounded-organic-sm text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${copied ? 'bg-pine text-cream animate-bounce-soft' : 'bg-clay text-cream hover:bg-clay-hover shadow-cozy-sm'}`} aria-live="polite">
            {copied ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>Copied!</span></> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>Copy Link</span></>}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={()=>setShowQR(!showQR)} className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2H2v10h10V2zM20 2h-8v8h8V2zM20 14H12v8h8v-8zM2 14h10v8H2v-8z" /></svg><span>{showQR ? 'Hide QR' : 'Show QR'}</span></button>
        {canShare && <button onClick={handleNativeShare} className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg><span>Share</span></button>}
      </div>
      {showQR && (
        <div className="mt-6 p-4 bg-cream rounded-organic border border-paper-border inline-block animate-scale-in shadow-cozy">
          <QRCode value={inviteLink} size={160} bgColor="#FFFDF9" fgColor="#1C1B18" aria-label={`QR code for ${inviteLink}`} />
          <p className="text-[11px] text-ink-500 font-mono mt-2">Scan with phone camera</p>
        </div>
      )}
    </div>
  );
};
