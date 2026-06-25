import React, { createContext, useContext } from 'react';
// @ts-ignore
import useGlobalWebSocket from './useGlobalWebSocket';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsState = useGlobalWebSocket();

  return (
    <WebSocketContext.Provider value={wsState}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used inside <WebSocketProvider>');
  return ctx;
};
