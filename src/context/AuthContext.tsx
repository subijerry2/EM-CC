import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthSession, RolePermissions, ROLE_PERMISSIONS_MAP } from '../types/auth';
import { PRE_SEEDED_USERS } from '../data/authUsers';

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  permissions: RolePermissions;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'em_corridor_auth_session_v1';
const SESSION_DURATION_HOURS = 12;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Dispatcher for initial seamless exploration, or restore from storage
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default logged in user: Dispatcher (Captain Elena Rostova)
    const defaultUser = PRE_SEEDED_USERS[1];
    return {
      token: `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user: defaultUser,
      loginTimestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Sync session to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const user = session?.user || null;
  const isAuthenticated = !!user;
  const permissions = user ? ROLE_PERMISSIONS_MAP[user.role] : {
    canAccessDriverHUD: false,
    canAccessDispatcherCAD: false,
    canCreateDispatchCalls: false,
    canReportIncidents: false,
    canResolveIncidents: false,
    canAccessHeatmap: false,
    canAccessKpiDashboard: false,
    canExportReports: false,
    canAccessSignalInfrastructure: false,
    canToggleSignalPreemption: false
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = PRE_SEEDED_USERS.find(
      u => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
    );

    if (!matched) {
      return { success: false, error: 'Invalid agency email or access credentials.' };
    }

    const newSession: AuthSession = {
      token: `auth-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user: matched,
      loginTimestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000
    };

    setSession(newSession);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setSession(null);
    setIsLoginModalOpen(true);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = PRE_SEEDED_USERS.find(u => u.role === role) || PRE_SEEDED_USERS[0];
    const newSession: AuthSession = {
      token: `auth-switch-${Date.now()}`,
      user: targetUser,
      loginTimestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000
    };
    setSession(newSession);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        permissions,
        login,
        logout,
        switchRole,
        isLoginModalOpen,
        setIsLoginModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
