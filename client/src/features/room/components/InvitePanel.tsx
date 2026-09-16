// ©️ Mewn

import React, { useState } from 'react';
import QRCode from 'react-qr-code';

export function buildInviteLink(roomId: string): string {
  return `${window.location.origin}/join/${roomId}`;
}

export const InvitePanel: React.FC<{ roomId: string | null }> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);
  if (!roomId) return null;
  const inviteLink = buildInviteLink(roomId);

  const handleCopyLink = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        ok = true;
      } else {
        throw new Error('clipboard unavailable');
      }
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = inviteLink;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
    if (!ok) {
      // keep inviteLink selectable — user can long-press to copy
      console.warn('[InvitePanel] Copy failed — clipboard unavailable in this context (requires HTTPS/secure context)');
    }
  };

  const canShare = typeof navigator.share === 'function';

  const handleShare = async () => {
    try {
      await (navigator as unknown as { share: (d: ShareData) => Promise<void> }).share({
        title: 'Join my Candid room',
        text: `Join room ${roomId}`,
        url: inviteLink,
      });
    } catch {
      // user cancelled — fall back to copy
      handleCopyLink();
    }
  };

  return (
    <div className="bg-surface-100 rounded-xl p-6 max-w-md mx-auto mt-6">
      <p className="text-body-sm font-medium text-surface-700 mb-3">Invite link</p>
      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 min-w-0 truncate font-mono text-body-sm text-surface-900 bg-white px-4 py-3 rounded-lg border border-surface-200 select-all">
          {inviteLink}
        </code>
        <button
          onClick={handleCopyLink}
          className="btn-secondary btn-md flex-shrink-0"
          aria-live="polite"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        {canShare && (
          <button onClick={handleShare} className="btn-ghost btn-md flex-shrink-0">
            Share
          </button>
        )}
      </div>
      {!copied && (
        <p className="text-caption text-surface-500 mb-3">Tap Copy or Share — if Copy fails, long-press the link to copy manually (clipboard needs HTTPS).</p>
      )}
      <div className="bg-white rounded-xl border border-surface-200 p-4 inline-block">
        <QRCode
          value={inviteLink}
          size={160}
          bgColor="#ffffff"
          fgColor="#292524"
          aria-label={`QR code for invite link ${inviteLink}`}
        />
      </div>
      <p className="text-caption text-surface-500 mt-3">
        Share the link or let them scan the code — they land straight in this room.
      </p>
    </div>
  );
};
