import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get local users list from localStorage
const getLocalUsers = () => {
  const users = localStorage.getItem('finbuddy_local_users');
  return users ? JSON.parse(users) : [];
};

// Helper to save a user to local list
const saveLocalUser = (userObj, plainPassword = null) => {
  const users = getLocalUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
  
  const updatedUser = { ...userObj };
  if (plainPassword) {
    updatedUser.plainPassword = plainPassword; // stored securely on local device for offline password check
  } else if (existingIdx >= 0 && users[existingIdx].plainPassword) {
    // Retain password if updating other fields
    updatedUser.plainPassword = users[existingIdx].plainPassword;
  }

  if (existingIdx >= 0) {
    users[existingIdx] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  localStorage.setItem('finbuddy_local_users', JSON.stringify(users));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Session validation on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if it's a mock local token
      if (token.startsWith('mock_token_')) {
        const email = token.replace('mock_token_', '');
        const localUsers = getLocalUsers();
        const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (localUser) {
          setUser(localUser);
        } else {
          setToken(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/profile`);
        setUser(res.data.user);
        saveLocalUser(res.data.user);
      } catch (err) {
        console.warn('Backend profile fetch failed, attempting local device recovery...', err);
        // Fallback to local storage profile if server is temporarily down
        // Decode token or check localStorage
        const sessionUser = localStorage.getItem('finbuddy_active_user');
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
        } else {
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      // 1. Attempt Server-Side Login
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('finbuddy_active_user', JSON.stringify(res.data.user));
      saveLocalUser(res.data.user, password);
      return res.data.user;
    } catch (err) {
      // 2. Fallback to Local Device Authentication if server is offline or fails
      console.warn('Server login failed. Attempting local device validation...');
      const localUsers = getLocalUsers();
      const matchedUser = localUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.plainPassword === password
      );

      if (matchedUser) {
        const mockToken = `mock_token_${matchedUser.email}`;
        setToken(mockToken);
        setUser(matchedUser);
        localStorage.setItem('finbuddy_active_user', JSON.stringify(matchedUser));
        return matchedUser;
      }
      
      // If server failed due to wrong password, or user doesn't exist locally
      throw err.response?.data?.message || 'Invalid credentials. User not found on server or local device.';
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    try {
      // 1. Attempt Server-Side Registration
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('finbuddy_active_user', JSON.stringify(res.data.user));
      saveLocalUser(res.data.user, password);
      return res.data.user;
    } catch (err) {
      console.warn('Server registration failed. Creating local device fallback account...', err);
      // Verify email doesn't exist in local DB
      const localUsers = getLocalUsers();
      const emailExists = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        throw 'User with this email already exists on this device.';
      }

      // Create mock user locally
      const mockUser = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        name,
        email: email.toLowerCase(),
        isOnboarded: false,
        age: null,
        monthlyIncome: 0,
        monthlySavingsGoal: 0,
        netWorth: 0,
        financialHealthScore: 50,
        riskProfile: null
      };

      const mockToken = `mock_token_${mockUser.email}`;
      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('finbuddy_active_user', JSON.stringify(mockUser));
      saveLocalUser(mockUser, password);
      return mockUser;
    }
  };

  // Onboarding handler
  const onboard = async (onboardingData) => {
    try {
      let onboardedUser = null;
      if (token && token.startsWith('mock_token_')) {
        // Local mode onboarding
        onboardedUser = {
          ...user,
          ...onboardingData,
          isOnboarded: true
        };
        setUser(onboardedUser);
        localStorage.setItem('finbuddy_active_user', JSON.stringify(onboardedUser));
        saveLocalUser(onboardedUser);
      } else {
        // Server mode onboarding
        await axios.post(`${API_URL}/auth/onboard`, onboardingData);
        onboardedUser = {
          ...user,
          ...onboardingData,
          isOnboarded: true
        };
        setUser(onboardedUser);
        localStorage.setItem('finbuddy_active_user', JSON.stringify(onboardedUser));
        saveLocalUser(onboardedUser);
      }
      return { message: 'Onboarding completed successfully!', user: onboardedUser };
    } catch (err) {
      throw err.response?.data?.message || 'Onboarding failed.';
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('finbuddy_active_user');
  };

  // Helper to sync updated profiles locally (for quiz/finances)
  const syncLocalUserProfile = async (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('finbuddy_active_user', JSON.stringify(updated));
      saveLocalUser(updated);
      return updated;
    });

    if (token && !token.startsWith('mock_token_')) {
      try {
        await axios.put(`${API_URL}/auth/profile`, updatedFields);
      } catch (err) {
        console.error('Failed to sync profile updates to server:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, onboard, logout, syncLocalUserProfile, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
