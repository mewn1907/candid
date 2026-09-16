// ©️ Mewn

import React from 'react';

interface RemoteVideoProps {
  stream: MediaStream | null;
  participantLabel: string;
  connectionState: string;
  className?: string;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({
  stream,
  participantLabel,
  connectionState,
  className = '',
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const isConnected = connectionState === 'connected';
  const [showGrid, setShowGrid] = React.useState(false);

  return (
    <div className={`relative w-full aspect-video bg-surface-900 rounded-xl overflow-hidden border border-surface-800 ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      {showGrid && stream && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
            <div className="border-r border-t border-white/15" />
            <div className="border-r border-t border-white/15" />
            <div className="border-t border-white/15" />
            <div className="border-r border-t border-white/15" />
            <div className="border-r border-t border-white/15" />
            <div className="border-t border-white/15" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-transparent to-transparent pointer-events-none" />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/60 animate-in">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-heading-sm font-medium text-white">{participantLabel}</p>
          <p className="text-body-sm text-white/50 mt-2">Waiting for connection...</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3">
        <span className="flex items-center gap-2 text-white text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-pine-600' : 'bg-clay-800 animate-pulse-soft'}`} aria-hidden="true" />
          {participantLabel}
        </span>
        <div className="flex items-center gap-2">
          {stream && (
            <button
              onClick={() => setShowGrid((v) => !v)}
              className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${showGrid ? 'bg-white text-surface-900' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
              aria-pressed={showGrid}
              aria-label="Toggle grid"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
              </svg>
            </button>
          )}
          {isConnected && (
            <span className="text-caption text-white/60 uppercase tracking-wider">Live</span>
          )}
        </div>
      </div>
    </div>
  );
};