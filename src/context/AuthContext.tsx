import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService, { LoginCredentials, RegisterData } from '../api/authService';
import { setAuthToken } from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode';

// Define the User type
export interface User {
  id: string;
  name: string;
  email: string;
}

// Define the context state
interface AuthContextState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if the token is expired
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      // Check if the expiration time is past
      return decoded.exp * 1000 < Date.now();
    } catch (err) {
      return true; // If any error in decoding, consider it expired
    }
  }, []);

  // Initialize auth state - check for existing session
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // Try to refresh the token
      const newToken = await authService.refreshToken();
      
      // If we get a token, set it and get user data
      if (newToken) {
        setAccessToken(newToken);
        setAuthToken(newToken);
        
        // Get user profile
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      // If refresh fails, we're not authenticated
      console.log('Not authenticated or session expired');
      setUser(null);
      setAccessToken(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<{ accessToken: string }>;
      setAccessToken(customEvent.detail.accessToken);
    };

    const handleLogout = () => {
      setUser(null);
      setAccessToken(null);
      navigate('/login');
    };

    // Add event listeners
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:logout', handleLogout);

    // Cleanup
    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      setUser(response.user);
      setAccessToken(response.accessToken);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
      
      setUser(response.user);
      setAccessToken(response.accessToken);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setUser(null);
      setAccessToken(null);
      
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
  const contextValue: AuthContextState = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken && !isTokenExpired(accessToken),
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
