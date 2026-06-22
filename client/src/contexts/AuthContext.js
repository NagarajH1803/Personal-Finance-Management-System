import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { user: newUser, token: authToken } = response.data.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
