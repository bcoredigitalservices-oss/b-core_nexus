import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import { AppProvider } from './context/AppContext';
import { WebSocketProvider } from './providers/WebSocketProvider';
import AppRouter from './routes/AppRouter';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <WebSocketProvider>
          <AppRouter />
        </WebSocketProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
