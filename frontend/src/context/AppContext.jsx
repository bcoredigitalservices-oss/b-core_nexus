import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

// ─── Default / Fallback Data ──────────────────────────────────────────────────
const FALLBACK_NAVIGATION = {
  sidebar_links: [
    { label: 'Global Directory', path: '/directory', icon: 'directory', required_tier: 4 },
    { label: 'Universal Catalog', path: '/catalog',   icon: 'catalog',   required_tier: 4 },
    { label: 'Security Logs',     path: '/events',    icon: 'shield',    required_tier: 2 },
    { label: 'Event Engine',      path: '/event-engine', icon: 'activity', required_tier: 3 },
  ],
  quick_actions: [],
  settings_modules: [
    { label: 'My Profile',      path: '/settings/profile', icon: 'user',     required_tier: 4 },
    { label: 'Company Settings', path: '/settings/org',    icon: 'briefcase', required_tier: 1 },
  ],
};

const FALLBACK_SYSTEM = {
  organization_name: 'B-Core Nexus',
  base_currency: 'USD',
  timezone: 'UTC',
  is_initialized: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────
export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken]                       = useState(() => localStorage.getItem('bcore_token') || '');
  const [currentUser, setCurrentUser]           = useState(null);
  const [navigationMatrix, setNavigationMatrix] = useState(FALLBACK_NAVIGATION);
  const [systemSettings, setSystemSettings]     = useState(FALLBACK_SYSTEM);
  const [activeWorkspace, setActiveWorkspace]   = useState(null);
  const [isApiLive, setIsApiLive]               = useState(false);
  const [isBooting, setIsBooting]               = useState(true);
  const [inviteModalOpen, setInviteModalOpen]   = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('bcore_token', data.access_token);
    // Clear the logged-out sentinel so the session is active again
    localStorage.removeItem('bcore_logged_out');
    setToken(data.access_token);
    return data.access_token;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bcore_token');
    // Sentinel: prevents auto-login from firing on next mount/render
    localStorage.setItem('bcore_logged_out', '1');
    setToken('');
    setCurrentUser(null);
    setActiveWorkspace(null);
    setNavigationMatrix(FALLBACK_NAVIGATION);
    setIsApiLive(false);
  }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const authFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`API ${path} failed (${res.status})`);
    return res.json();
  }, [token]);

  // ── Bootstrap sequence ────────────────────────────────────────────────────
  const bootstrap = useCallback(async (activeToken) => {
    try {
      // 1. Verify connectivity
      await fetch(`${import.meta.env.VITE_API_URL}/`);
      setIsApiLive(true);

      const bearerToken = activeToken || token;
      if (!bearerToken) return;

      // 2. Fetch navigation matrix
      const navRes = await fetch(`${API_BASE}/shell/navigation`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (navRes.ok) {
        const matrix = await navRes.json();
        setNavigationMatrix(matrix);
      }

      // 3. Fetch current user profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUser(me);
      }

      // 4. Fetch workspace configuration
      try {
        const wsRes = await fetch(`${API_BASE}/workspace/config`, {
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        if (wsRes.ok) {
          const wsConfig = await wsRes.json();
          setActiveWorkspace(wsConfig);
        }
      } catch (wsErr) {
        console.error("Failed to fetch workspace config:", wsErr);
      }

    } catch {
      setIsApiLive(false);
    }
  }, [token]);

  // ── Auto-login on mount (dev credentials) ────────────────────────────────
  // Skipped when the user has explicitly logged out (sentinel flag set).
  useEffect(() => {
    const init = async () => {
      setIsBooting(true);
      try {
        let activeToken = token;
        await bootstrap(activeToken);
      } finally {
        setIsBooting(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-bootstrap whenever token changes (e.g., after manual login)
  useEffect(() => {
    const reBoot = async () => {
      setIsBooting(true);
      try {
        await bootstrap(token);
      } finally {
        setIsBooting(false);
      }
    };
    if (token) reBoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    token,
    setToken,
    currentUser,
    navigationMatrix,
    systemSettings,
    activeWorkspace,
    setActiveWorkspace,
    isApiLive,
    isBooting,
    login,
    logout,
    authFetch,
    inviteModalOpen,
    setInviteModalOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Convenience hook ──────────────────────────────────────────────────────────
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
