// ©️ Mewn

import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './features/theme';
import { RoomProvider } from './features/room/hooks';
import { LandingPage } from './features/landing';
import { RoomView, CreateRoomPage, JoinRoomPage } from './features/room';

function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <RoomProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/join/:roomId" element={<JoinRoomPage />} />
          <Route path="/room/:roomId" element={<RoomView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoomProvider>
    </ThemeProvider>
  );
}

export default App;