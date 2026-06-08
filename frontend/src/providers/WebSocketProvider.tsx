import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAppContext();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Helper to extract workspace key from current URL pathname (e.g. /workspaces/crm -> crm)
  const getActiveWorkspaceFromUrl = (): string | null => {
    const match = window.location.pathname.match(/\/workspaces\/(\w+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (!token) {
      // If user logs out, clean up existing socket connection
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let reconnectTimeoutId: any;
    
    const connect = () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        const wsProto = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = apiBaseUrl.replace(/^https?:\/\//, '');
        
        // Connect to stream endpoint with token and current workspace as initial query parameters
        const currentWorkspace = getActiveWorkspaceFromUrl();
        const wsUrl = `${wsProto}://${wsHost}/api/v1/stream?token=${token}${
          currentWorkspace ? `&workspace=${currentWorkspace}` : ''
        }`;

        console.log(`[WS] Connecting to ${wsProto}://${wsHost}/api/v1/stream...`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('[WS] Connected successfully.');
          setIsConnected(true);
          
          // Double-check if workspace subscription needs to be synced
          const workspace = getActiveWorkspaceFromUrl();
          if (workspace) {
            ws.send(JSON.stringify({ type: 'subscribe', workspace }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS Message Received]', data);

            // Handle STATE_MUTATION events
            if (data.event_type === 'STATE_MUTATION') {
              const payload = data.payload || {};
              console.log('[WS State Mutation]', payload);
              
              // Dispatch standard CustomEvent to window so grids can listen and invalidate cache/reload
              const customEvent = new CustomEvent('STATE_MUTATION', { detail: payload });
              window.dispatchEvent(customEvent);
            }
          } catch (err) {
            console.warn('[WS] Failed to parse message:', event.data, err);
          }
        };

        ws.onerror = (err) => {
          console.error('[WS] Error detected:', err);
        };

        ws.onclose = (e) => {
          console.log(`[WS] Connection closed (code: ${e.code}, reason: ${e.reason}). Reconnecting in 3s...`);
          setIsConnected(false);
          reconnectTimeoutId = setTimeout(connect, 3000);
        };

      } catch (err) {
        console.error('[WS] Connection attempt failed:', err);
        reconnectTimeoutId = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Monitor URL location mutations and auto-update subscription
  useEffect(() => {
    const handleLocationChange = () => {
      const workspace = getActiveWorkspaceFromUrl();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && workspace) {
        console.log(`[WS] Path change: Subscribing to workspace: ${workspace}`);
        socketRef.current.send(JSON.stringify({ type: 'subscribe', workspace }));
      }
    };

    // Override pushState and replaceState to catch route changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Also run an interval check to cover react-router-dom transition gaps
    const intervalId = setInterval(handleLocationChange, 1000);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(intervalId);
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message: connection not open.');
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used inside <WebSocketProvider>');
  return ctx;
};
