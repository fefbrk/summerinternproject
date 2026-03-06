import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import apiService, { User } from '@/services/apiService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitializing: boolean;
  lastAuthErrorCode: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const getErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  return typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code?: string }).code || null
    : null;
};

const readCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as User;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch (_error) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastAuthErrorCode, setLastAuthErrorCode] = useState<string | null>(null);

  const setAuthState = (nextUser: User) => {
    const processedUser: User = {
      ...nextUser,
      isAdmin: Boolean(nextUser.isAdmin),
      role: nextUser.role,
    };

    setUser(processedUser);
    localStorage.setItem('auth_user', JSON.stringify(processedUser));
  };

  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        if (mounted) {
          setAuthState(currentUser);
        }
      } catch (_error) {
        if (mounted) {
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string, captchaToken?: string): Promise<boolean> => {
    setIsLoading(true);
    setLastAuthErrorCode(null);

    try {
      const authResponse = await apiService.login(email, password, captchaToken);
      setAuthState(authResponse.user);
      toast({ title: 'Login successful', description: 'You are now logged in.' });
      return true;
    } catch (error) {
      const errorCode = getErrorCode(error);
      setLastAuthErrorCode(errorCode);
      toast({ variant: 'destructive', title: 'Login failed', description: getErrorMessage(error, 'Login failed!') });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setLastAuthErrorCode(null);

    try {
      const authResponse = await apiService.register(email, password, name);
      setAuthState(authResponse.user);
      toast({ title: 'Registration successful', description: 'Your account has been created.' });
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Registration failed', description: getErrorMessage(error, 'Registration failed!') });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void apiService.logout().catch((error) => {
      console.error('Logout request failed:', error);
    });
    setLastAuthErrorCode(null);
    clearAuthState();
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, isLoading, isInitializing, lastAuthErrorCode }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
