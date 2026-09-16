// ©️ Mewn

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../hooks/use-room-context';
import { RoomCreator, RoomJoiner } from '../components/RoomCreator';

export const RoomSelector: React.FC = () => {
  const navigate = useNavigate();
  const { currentRoom, currentParticipantId, createRoom, error } = useRoomContext();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleCreateRoom = async () => {
    const result = await createRoom();
    if (result.success && result.roomId) {
      navigate(`/room/${result.roomId}`, { replace: true });
    }
  };

  return (
    <div className="card max-w-2xl mx-auto p-6 sm:p-8 animate-in">
      <div className="text-center mb-8">
        <h2 className="text-heading-lg font-semibold text-surface-900">Room Management</h2>
        <p className="text-body-md text-surface-600 mt-1">Create or join a Candid room</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary btn-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Room</span>
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="btn-secondary btn-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" />
          </svg>
          <span>Join Room</span>
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 animate-in">
          <RoomCreator onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} />
        </div>
      )}

      {showJoin && (
        <div className="mb-6 animate-in">
          <RoomJoiner onClose={() => setShowJoin(false)} />
        </div>
      )}

      {currentRoom && (
        <div className="pt-6 border-t border-surface-200 animate-in">
          <h3 className="text-heading-sm font-semibold text-surface-900 mb-4">Current Room</h3>
          <div className="bg-surface-50 rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-caption text-surface-500 uppercase tracking-wider mb-1">Room ID</p>
                <p className="font-mono text-heading-sm text-surface-900">{currentRoom.id}</p>
              </div>
              <div>
                <p className="text-caption text-surface-500 uppercase tracking-wider mb-1">Status</p>
                <span className="badge badge-success">{currentRoom.status}</span>
              </div>
              <div>
                <p className="text-caption text-surface-500 uppercase tracking-wider mb-1">Your ID</p>
                <p className="font-mono text-body-md text-wabi-700">{currentParticipantId}</p>
              </div>
              <div>
                <p className="text-caption text-surface-500 uppercase tracking-wider mb-1">Participants</p>
                <p className="font-mono text-body-md text-surface-900">{currentRoom.participants.length} / 2</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};