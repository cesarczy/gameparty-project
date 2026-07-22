import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  api,
  clearToken,
  getToken,
  registerSessionInvalidHandler,
  setToken,
  type UserProfile,
} from '../shared/api/client';

interface AuthState {
  token: string | null;
  playerId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
  sessionReady: boolean;
  login: (payload: {
    token: string;
    playerId: string;
    displayName: string;
    role?: string;
    avatarUrl?: string | null;
  }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateSession: (partial: Partial<Pick<AuthState, 'displayName' | 'avatarUrl' | 'role'>> & { token?: string }) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function readStored(key: string): string | null {
  return localStorage.getItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [playerId, setPlayerId] = useState<string | null>(() => readStored('gameparty_player_id'));
  const [displayName, setDisplayName] = useState<string | null>(() => readStored('gameparty_display_name'));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => readStored('gameparty_avatar_url'));
  const [role, setRole] = useState<string | null>(() => readStored('gameparty_role'));
  const [sessionReady, setSessionReady] = useState(() => !getToken());

  const persistSession = useCallback(
    (data: {
      token: string;
      playerId: string;
      displayName: string;
      role: string;
      avatarUrl: string | null;
    }) => {
      setToken(data.token);
      setTokenState(data.token);
      setPlayerId(data.playerId);
      setDisplayName(data.displayName);
      setRole(data.role);
      setAvatarUrl(data.avatarUrl);
      localStorage.setItem('gameparty_player_id', data.playerId);
      localStorage.setItem('gameparty_display_name', data.displayName);
      localStorage.setItem('gameparty_role', data.role);
      if (data.avatarUrl) localStorage.setItem('gameparty_avatar_url', data.avatarUrl);
      else localStorage.removeItem('gameparty_avatar_url');
    },
    [],
  );

  const logout = useCallback(() => {
    if (getToken()) {
      api.logout().catch(() => undefined);
    }
    clearToken();
    setTokenState(null);
    setPlayerId(null);
    setDisplayName(null);
    setAvatarUrl(null);
    setRole(null);
    localStorage.removeItem('gameparty_player_id');
    localStorage.removeItem('gameparty_display_name');
    localStorage.removeItem('gameparty_role');
    localStorage.removeItem('gameparty_avatar_url');
  }, []);

  const login = useCallback(
    (payload: {
      token: string;
      playerId: string;
      displayName: string;
      role?: string;
      avatarUrl?: string | null;
    }) => {
      persistSession({
        token: payload.token,
        playerId: payload.playerId,
        displayName: payload.displayName,
        role: payload.role ?? 'PLAYER',
        avatarUrl: payload.avatarUrl ?? null,
      });
      setSessionReady(true);
    },
    [persistSession],
  );

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    const profile: UserProfile = await api.getProfile();
    persistSession({
      token: getToken()!,
      playerId: profile.playerId,
      displayName: profile.displayName,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
    });
  }, [persistSession]);

  const updateSession = useCallback(
    (partial: Partial<Pick<AuthState, 'displayName' | 'avatarUrl' | 'role'>> & { token?: string }) => {
      if (partial.token) {
        setToken(partial.token);
        setTokenState(partial.token);
      }
      if (partial.displayName !== undefined) {
        setDisplayName(partial.displayName);
        if (partial.displayName) localStorage.setItem('gameparty_display_name', partial.displayName);
        else localStorage.removeItem('gameparty_display_name');
      }
      if (partial.avatarUrl !== undefined) {
        setAvatarUrl(partial.avatarUrl);
        if (partial.avatarUrl) localStorage.setItem('gameparty_avatar_url', partial.avatarUrl);
        else localStorage.removeItem('gameparty_avatar_url');
      }
      if (partial.role !== undefined) {
        setRole(partial.role);
        if (partial.role) localStorage.setItem('gameparty_role', partial.role);
        else localStorage.removeItem('gameparty_role');
      }
    },
    [],
  );

  useEffect(() => {
    registerSessionInvalidHandler(logout);
    return () => registerSessionInvalidHandler(() => undefined);
  }, [logout]);

  useEffect(() => {
    const currentToken = getToken();
    if (!currentToken) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;
    api.getProfile()
      .then((profile) => {
        if (cancelled) return;
        persistSession({
          token: currentToken,
          playerId: profile.playerId,
          displayName: profile.displayName,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
        });
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [persistSession, logout]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      playerId,
      displayName,
      avatarUrl,
      role,
      sessionReady,
      login,
      logout,
      refreshProfile,
      updateSession,
      isAdmin: role === 'ADMIN',
    }),
    [token, playerId, displayName, avatarUrl, role, sessionReady, login, logout, refreshProfile, updateSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
