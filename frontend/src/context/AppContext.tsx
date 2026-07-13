import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// ── Core API Connection updated to point to your new global services file location ──
import api from '../services/api';

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

// ─── Default / Fallback Data ──────────────────────────────────────────────────
const FALLBACK_NAVIGATION = {
  sidebar_links: [
    { label: 'Security Logs',     path: '/events',    icon: 'shield',    required_tier: 2 },
  ],
  quick_actions: [],
  settings_modules: [
    { label: 'My Profile',      path: '/settings/profile', icon: 'user',     required_tier: 4 },
    { label: 'Company Settings', path: '/org',    icon: 'briefcase', required_tier: 1 },
  ],
};

const FALLBACK_SYSTEM = {
  organization_name: 'B-Core Nexus',
  base_currency: 'USD',
  timezone: 'UTC',
  is_initialized: false,
};

// ─── Sound Synth Helper ────────────────────────────────────────────────────────
function makeBeepDataUri(freq: number, durationMs: number) {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * (durationMs / 1000));
  const buffer = new Uint8Array(44 + numSamples);
  
  // "RIFF"
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46;
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  
  // "WAVE"
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45;
  
  // "fmt "
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  
  // chunk size (16)
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0;
  
  // PCM = 1, Mono = 1
  buffer[20] = 1; buffer[21] = 0; buffer[22] = 1; buffer[23] = 0;
  
  // Sample rate (8000)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  
  // Byte rate (8000)
  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  
  // Block align (1), Bits per sample (8)
  buffer[32] = 1; buffer[33] = 0; buffer[34] = 8; buffer[35] = 0;
  
  // "data"
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x20;
  
  // Subchunk2 size
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;
  
  // Sine wave sound data
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.round(128 + 127 * Math.sin(2 * Math.PI * freq * t));
    buffer[44 + i] = sample;
  }
  
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

const SOUNDS: Record<string, string> = {
  click: makeBeepDataUri(800, 50),
  success: makeBeepDataUri(1000, 150),
  error: makeBeepDataUri(300, 250),
};

// ─── TypeScript Interfaces ────────────────────────────────────────────────────
export interface Preferences {
  theme: string;
  mode: string;
  font: string;
  sounds: boolean;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  required_tier?: number;
}

export interface NavigationMatrix {
  sidebar_links: NavItem[];
  quick_actions: NavItem[];
  settings_modules: NavItem[];
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  permissions: string[];
  functional_roles?: string[];
  is_active: boolean;
  mfa_enabled?: boolean; // ── Track active TOTP hardware authentication status strings ──
  [key: string]: unknown;
}

export interface SystemSettings {
  organization_name: string;
  base_currency: string;
  timezone: string;
  is_initialized: boolean;
}

export interface AppContextValue {
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  currentUser: CurrentUser | null;
  navigationMatrix: NavigationMatrix;
  systemSettings: SystemSettings;
  activeWorkspace: unknown;
  setActiveWorkspace: React.Dispatch<React.SetStateAction<unknown>>;
  isApiLive: boolean;
  isBooting: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
  authFetch: (path: string, options?: Record<string, unknown>) => Promise<unknown>;
  preferences: Preferences;
  globalDefaults: Preferences;
  fetchPreferences: () => Promise<void>;
  updatePersonalPreference: (key: string, value: unknown) => Promise<void>;
  updateGlobalPreference: (key: string, value: unknown) => Promise<void>;
  playUISound: (soundType: string) => void;
  theme: string;
  setTheme: (val: string) => void;
  mode: string;
  setMode: (val: string) => void;
  font: string;
  setFont: (val: string) => void;
  refreshCurrentUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]                       = useState(() => localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token') || '');
  const [currentUser, setCurrentUser]           = useState<CurrentUser | null>(null);
  const [navigationMatrix, setNavigationMatrix] = useState<NavigationMatrix>(FALLBACK_NAVIGATION);
  const [systemSettings, setSystemSettings]     = useState<SystemSettings>(FALLBACK_SYSTEM);
  const [activeWorkspace, setActiveWorkspace]   = useState<unknown>(null);
  const [isApiLive, setIsApiLive]               = useState(false);
  const [isBooting, setIsBooting]               = useState(true);

  const [preferences, setPreferences] = useState<Preferences>(() => {
    return {
      theme: localStorage.getItem('bcore_theme') || 'Stripe Blurple',
      mode: localStorage.getItem('bcore_mode') || 'light',
      font: localStorage.getItem('bcore_font') || 'Inter',
      sounds: localStorage.getItem('bcore_sounds') === null ? true : localStorage.getItem('bcore_sounds') === 'true',
    };
  });

  const [globalDefaults, setGlobalDefaults] = useState<Preferences>({
    theme: 'Stripe Blurple',
    mode: 'light',
    font: 'Inter',
    sounds: true,
  });

  useEffect(() => {
    if (preferences) {
      if (preferences.theme) document.documentElement.setAttribute('data-theme', preferences.theme);
      if (preferences.mode) document.documentElement.setAttribute('data-mode', preferences.mode);
      if (preferences.font) document.documentElement.setAttribute('data-font', preferences.font);
    }
  }, [preferences]);

  const playUISound = useCallback((soundType: string) => {
    if (!preferences || !preferences.sounds) return;
    const soundUri = SOUNDS[soundType];
    if (soundUri) {
      try {
        const audio = new Audio(soundUri);
        audio.play().catch(err => {
          console.warn("UI Sound play blocked or failed:", err);
        });
      } catch (e) {
        console.error("Failed to play UI sound:", e);
      }
    }
  }, [preferences]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token') || '';
      if (storedToken !== token) {
        setToken(storedToken);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

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
    localStorage.removeItem('bcore_token');
    localStorage.removeItem('bcore_refresh_token');
    sessionStorage.setItem('bcore_token', data.access_token);
    if (data.refresh_token) {
      sessionStorage.setItem('bcore_refresh_token', data.refresh_token);
    }
    localStorage.removeItem('bcore_logged_out');
    setToken(data.access_token);
    return data.access_token;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bcore_token');
    localStorage.removeItem('bcore_refresh_token');
    sessionStorage.removeItem('bcore_token');
    sessionStorage.removeItem('bcore_refresh_token');
    localStorage.setItem('bcore_logged_out', '1');
    setToken('');
    setCurrentUser(null);
    setActiveWorkspace(null);
    setNavigationMatrix(FALLBACK_NAVIGATION);
    setIsApiLive(false);
  }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const authFetch = useCallback(async (path: string, options: Record<string, any> = {}) => {
    try {
      const headers = { ...options.headers };
      let data = options.body;
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {}
      }

      const response = await api({
        url: path,
        method: options.method || 'GET',
        headers,
        data,
      });

      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }
      const errDetail = err.response?.data?.detail || err.message || "API Request failed";
      throw new Error(errDetail);
    }
  }, [logout]);

  const fetchPreferences = useCallback(async () => {
    try {
      const data = await authFetch('/system/preferences');
      if (data) {
        setPreferences(data);
        localStorage.setItem('bcore_theme', data.theme || 'Stripe Blurple');
        localStorage.setItem('bcore_mode', data.mode || 'light');
        localStorage.setItem('bcore_font', data.font || 'Inter');
        localStorage.setItem('bcore_sounds', String(data.sounds !== false));
      }

      try {
        const profile = await authFetch('/system/profile');
        if (profile && profile.default_preferences) {
          setGlobalDefaults(profile.default_preferences);
        }
      } catch (_err) {}
    } catch (prefErr) {
      console.error('Failed to fetch preferences:', prefErr);
    }
  }, [authFetch]);

  const updatePersonalPreference = useCallback(async (key: string, value: unknown) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(`bcore_${key}`, String(value));
      return next;
    });

    try {
      const storedToken = localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token');
      if (storedToken) {
        await api.put('/system/preferences/personal', { [key]: value });
      }
    } catch (err) {
      console.error(`Failed to persist personal preference '${key}':`, err);
    }
  }, []);

  const theme = preferences?.theme || 'Stripe Blurple';
  const mode  = preferences?.mode  || 'light';
  const font  = preferences?.font  || 'Inter';
  const setTheme = (val: string) => updatePersonalPreference('theme', val);
  const setMode  = (val: string) => updatePersonalPreference('mode',  val);
  const setFont  = (val: string) => updatePersonalPreference('font',  val);

  const updateGlobalPreference = useCallback(async (key: string, value: unknown) => {
    try {
      const storedToken = localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token');
      if (storedToken) {
        const res = await api.put('/system/preferences/global', { [key]: value });
        if (res.data && res.data.default_preferences) {
          setGlobalDefaults(res.data.default_preferences);
        }
        await fetchPreferences();
      }
    } catch (err) {
      console.error(`Failed to persist global preference '${key}':`, err);
    }
  }, [fetchPreferences]);

  // ── Bootstrap sequence ────────────────────────────────────────────────────
  const bootstrap = useCallback(async (activeToken?: string) => {
    try {
      setIsApiLive(true);
      const bearerToken = activeToken || token;
      if (!bearerToken) return;

      try {
        const navRes = await api.get('/shell/navigation');
        setNavigationMatrix(navRes.data);
      } catch (navErr) {
        console.warn('Navigation matrix unavailable, using fallback', navErr);
      }

      const meRes = await api.get('/auth/me');
      const profileData = meRes.data;

      // Note: MFA is already enforced server-side in /auth/login - it will not
      // issue an access token to an admin/manager account until a valid TOTP
      // code has been verified. So by the time we have a token here, MFA is
      // already satisfied and no extra client-side redirect is needed.

      setCurrentUser(profileData);
      await fetchPreferences();

      try {
        const wsRes = await api.get('/workspace/config');
        setActiveWorkspace(wsRes.data);
      } catch (wsErr) {
        console.error("Failed to fetch workspace config:", wsErr);
      }

    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      } else {
        console.error('Bootstrap failed:', err);
        setIsApiLive(false);
        setCurrentUser(null);
      }
    }
  }, [token, logout, fetchPreferences]);

  useEffect(() => {
    const reBoot = async () => {
      setIsBooting(true);
      try {
        await bootstrap(token);
      } finally {
        setIsBooting(false);
      }
    };
    if (token) {
      reBoot();
    } else {
      setIsBooting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return;
    try {
      const meRes = await api.get('/auth/me');
      setCurrentUser(meRes.data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
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
    preferences,
    globalDefaults,
    fetchPreferences,
    updatePersonalPreference,
    updateGlobalPreference,
    playUISound,
    theme,
    setTheme,
    mode,
    setMode,
    font,
    setFont,
    refreshCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}