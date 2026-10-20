import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nestora_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('nestora_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('nestora_user', JSON.stringify(response.data));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for 401 token expiration from axios interceptor
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('nestora_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('nestora_auth_expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token) {
        localStorage.setItem('nestora_token', response.token);
        localStorage.setItem('nestora_user', JSON.stringify(response.data));
        setToken(response.token);
        setUser(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Authentication failed');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.request && !err.response
          ? 'Unable to connect to the backend server. Please verify the server is running on port 5000.'
          : err.message) ||
        'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response.success && response.token) {
        localStorage.setItem('nestora_token', response.token);
        localStorage.setItem('nestora_user', JSON.stringify(response.data));
        setToken(response.token);
        setUser(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('nestora_token');
    localStorage.removeItem('nestora_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('nestora_user', JSON.stringify(response.data));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
    }
  };

  // Helper to determine destination route by role
  const getRoleHomeRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'staff':
        return '/staff';
      case 'resident':
      default:
        return '/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        refreshUser,
        getRoleHomeRoute
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
