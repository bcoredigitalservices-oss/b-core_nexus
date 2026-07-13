import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const WS_ENABLED = false; // backend has no WS routes yet — re-enable once implemented

export default function useGlobalWebSocket() {
  const { token } = useAppContext();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!WS_ENABLED) return;
    // ...(rest of existing connect logic stays exactly as-is)
  }, [token]);

  // Remove or gate the location-watching effect too, since it only matters for WS subscribe messages
  useEffect(() => {
    if (!WS_ENABLED) return;
    // ...(rest of existing effect)
  }, []);

  const sendMessage = (message) => {
    if (!WS_ENABLED) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage
  };
}
