import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password, role) => {
    const response = await api.post('/auth/login', {
      identifier,
      password,
      role
    });

    const { token, user: loggedUser } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const getRoleDashboard = (userRole) => {
    const r = (userRole || user?.role || '').toUpperCase();
    if (r === 'OWNER') return '/owner/dashboard';
    if (r === 'STAFF') return '/staff/dashboard';
    if (r === 'DEALER') return '/dealer/dashboard';
    return '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getRoleDashboard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
