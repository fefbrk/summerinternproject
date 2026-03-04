import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import apiService, { User } from '@/services/apiService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const setAuthState = (nextUser: User) => {
    const processedUser = {
      ...nextUser,
      isAdmin: Boolean(nextUser.isAdmin),
    };

    setUser(processedUser);
    localStorage.setItem('auth_user', JSON.stringify(processedUser));
    localStorage.removeItem('auth_token');
  };

  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('auth_user');

        if (!savedUser) {
          clearAuthState();
          return;
        }

        const parsedUser = JSON.parse(savedUser);
        const currentUser = await apiService.getCurrentUser();
        setAuthState(
          {
            ...currentUser,
            isAdmin: Boolean(currentUser.isAdmin),
            id: currentUser.id || parsedUser.id,
          }
        );
      } catch (error) {
        console.error('Error loading user from storage:', error);
        clearAuthState();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const authResponse = await apiService.login(email, password);
      setAuthState(authResponse.user);
      toast({ title: 'Login successful', description: 'You are now logged in.' });
      setIsLoading(false);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Login failed', description: getErrorMessage(error, 'Login failed!') });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const authResponse = await apiService.register(email, password, name);
      setAuthState(authResponse.user);
      toast({ title: 'Registration successful', description: 'Your account has been created.' });
      setIsLoading(false);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Registration failed', description: getErrorMessage(error, 'Registration failed!') });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    void apiService.logout().catch((error) => {
      console.error('Logout request failed:', error);
    });
    clearAuthState();
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isInitializing }}>
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
