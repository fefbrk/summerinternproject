import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import apiService, { User } from '@/services/apiService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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
  };

  const clearAuthState = () => {
    setUser(null);
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

  const logout = async () => {
    setIsLoading(true);

    try {
      await apiService.logout();
      setLastAuthErrorCode(null);
      clearAuthState();
      toast({ title: 'Logged out', description: 'You have been logged out.' });
    } catch (error) {
      console.error('Logout request failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: getErrorMessage(error, 'Unable to log out right now.'),
      });
    } finally {
      setIsLoading(false);
    }
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
