import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

// Helper to extract workspace key from current URL pathname (e.g. /workspaces/crm -> crm)
const getActiveWorkspaceFromUrl = () => {
  const match = window.location.pathname.match(/\/workspaces\/(\w+)/);
  return match ? match[1] : null;
};

export default function useGlobalWebSocket() {
  const { token } = useAppContext();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let reconnectTimeoutId;
    
    const connect = () => {
      try {
        // Derive WebSocket URL dynamically based on the current browser URL
        const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        
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
          
          const workspace = getActiveWorkspaceFromUrl();
          if (workspace) {
            ws.send(JSON.stringify({ type: 'subscribe', workspace }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS Message Received]', data);

            if (data.event_type === 'STATE_MUTATION') {
              const payload = data.payload || {};
              console.log('[WS State Mutation]', payload);
              
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
    const intervalId = setInterval(handleLocationChange, 1000);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(intervalId);
    };
  }, []);

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message: connection not open.');
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage
  };
}
