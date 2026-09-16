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
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface-100 rounded-xl p-6 max-w-md mx-auto mt-6">
      <p className="text-body-sm font-medium text-surface-700 mb-3">Invite link</p>
      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 min-w-0 truncate font-mono text-body-sm text-surface-900 bg-white px-4 py-3 rounded-lg border border-surface-200">
          {inviteLink}
        </code>
        <button
          onClick={handleCopyLink}
          className="btn-secondary btn-md flex-shrink-0"
          aria-live="polite"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
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
