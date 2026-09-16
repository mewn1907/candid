// ©️ Mewn

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomContext } from './hooks/use-room-context';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId: linkRoomId } = useParams<{ roomId?: string }>();
  const { joinRoom, loading, error } = useRoomContext();
  const [roomId, setRoomId] = useState(linkRoomId ?? '');

  const join = async (id: string) => {
    if (!id.trim()) return;
    try {
      const result = await joinRoom(id.trim());
      if (result.success && result.room) {
        navigate(`/room/${result.room.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await join(roomId);
  };

  // Invite-link flow: /join/:roomId auto-joins once (guarded for StrictMode).
  const autoJoinedRef = useRef(false);
  useEffect(() => {
    if (linkRoomId && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      void join(linkRoomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkRoomId]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 animate-in">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-pine-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pine-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" />
            </svg>
          </div>
          <h2 className="text-heading-lg font-semibold text-surface-900">Join Room</h2>
          <p className="text-body-md text-surface-600 mt-1">Enter the room ID shared with you</p>
        </div>

        {error && (
          <div className="mb-6 animate-in" role="alert">
            <div className="flex items-start gap-3 p-4 bg-stone-100 border border-surface-300 rounded-xl">
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
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomId" className="block text-body-sm font-medium text-surface-700 mb-2">
              Room ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="input text-center text-heading-sm tracking-widest"
              maxLength={20}
              autoFocus
              required
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !roomId.trim()}
            className="btn-success btn-lg w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" />
                </svg>
                <span>Join Room</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-caption text-surface-400">
          ©️ Mewn
        </p>
      </div>
    </div>
  );
};