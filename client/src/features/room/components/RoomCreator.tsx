// ©️ Mewn

import React from 'react';
import { useRoomContext } from '../hooks/use-room-context';

export const RoomCreator: React.FC<{ onClose?: () => void; onCreate?: () => void }> = ({ onClose, onCreate }) => {
  const { createRoom, loading, error } = useRoomContext();

  const handleCreateRoom = async () => {
    try {
      await createRoom();
      onCreate?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className="animate-in">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-wabi-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-wabi-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-heading-md font-semibold text-surface-900">Create a Room</h3>
        <p className="text-body-sm text-surface-600 mt-1">A unique room ID will be generated. Share it with the other participant.</p>
      </div>

      {error && (
        <div className="mb-4 animate-in" role="alert">
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

      <button
        onClick={handleCreateRoom}
        disabled={loading}
        className="btn-primary btn-lg w-full"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Creating...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Room</span>
          </>
        )}
      </button>
    </div>
  );
};

export const RoomJoiner: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { joinRoom, loading, error } = useRoomContext();
  const [roomId, setRoomId] = React.useState('');

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      return;
    }

    try {
      await joinRoom(roomId.trim());
      setRoomId('');
      onClose?.();
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  return (
    <div className="animate-in">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-pine-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-pine-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" />
          </svg>
        </div>
        <h3 className="text-heading-md font-semibold text-surface-900">Join a Room</h3>
        <p className="text-body-sm text-surface-600 mt-1">Enter the room ID shared with you</p>
      </div>

      {error && (
        <div className="mb-4 animate-in" role="alert">
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

      <form onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }} className="space-y-4">
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
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            required
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
    </div>
  );
};