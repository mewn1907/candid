// ©️ Mewn

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from './hooks/use-room-context';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, error, isConnected, apiUrl } = useRoomContext();
  const [attempt, setAttempt] = useState(0);
  // Guard against double-invocation (React StrictMode remounts effects in
  // dev): without this, two rooms are created and one is orphaned.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    // Wait for socket to connect first (critical on deployed sites where
    // connect takes longer / VITE_API_URL may be misconfigured).
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
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 animate-in">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-wabi-500 border-t-transparent animate-spin mx-auto mb-6" aria-label="Creating room" />
        <h2 className="text-heading-lg font-semibold text-surface-900 mb-2">Creating Room...</h2>
        <p className="text-body-md text-surface-600 mb-6">{isConnected ? 'Generating your unique room ID' : `Connecting to server… (${apiUrl})`}</p>
        {error && (
          <div className="flex items-start gap-3 p-4 bg-stone-100 border border-surface-300 rounded-xl animate-in" role="alert">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-stone-700">Error</p>
              <p className="text-sm text-stone-600 mt-1">{error}</p>
            </div>
          </div>
        )}
        {error && (
          <button
            onClick={() => { startedRef.current = false; setAttempt((a) => a + 1); }}
            className="btn-secondary btn-md w-full mt-4"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};