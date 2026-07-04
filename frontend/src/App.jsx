import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { WebSocketProvider } from './providers/WebSocketProvider';
import AppRouter from './routes/AppRouter';
import GlobalBlockerScreen from './components/ui/GlobalBlockerScreen';

function AppContent() {
  const { token, currentUser, isApiLive } = useAppContext();
  const [blockerMessage, setBlockerMessage] = useState(null);

  useEffect(() => {
    if (!token || !isApiLive) {
      setBlockerMessage(null);
      return;
    }

    let socket = null;
    let reconnectTimeout = null;

    const connect = () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const wsProto = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiBaseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProto}://${wsHost}/api/v1/events/ws/00000000-0000-0000-0000-000000000000?token=${token}`;

      console.log(`[App WS] Connecting to ${wsUrl}`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[App WS] Connected.');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[App WS Message]', data);

          // Logic 1 (Lockdown)
          if (data.type === 'blocker_beacon') {
            setBlockerMessage(data.payload?.message || 'Emergency System Lockdown active.');
          } else if (data.type === 'resolve_blocker') {
            setBlockerMessage(null);
          }

          // Logic 2 (Force Kick)
          if (data.type === 'force_logout') {
            const targetUserId = data.payload?.target_user_id;
            if (currentUser && String(currentUser.id) === String(targetUserId)) {
              console.log('[App WS] Force kick event triggered matching current user.');
              localStorage.clear();
              window.location.href = '/login';
            }
          }
        } catch (err) {
          console.error('[App WS] Message parsing error:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('[App WS] Connection error:', err);
      };

      socket.onclose = (e) => {
        console.log(`[App WS] Connection closed (code: ${e.code}). Reconnecting in 3s...`);
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [token, currentUser, isApiLive]);

  return (
    <>
      {blockerMessage && <GlobalBlockerScreen message={blockerMessage} />}
      <AppRouter />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
