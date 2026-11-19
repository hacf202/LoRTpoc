import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('poc_admin_token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify token on mount or token change
  const verifyToken = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/verify', {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`
        }
      });

      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (res.ok && data?.success && data?.authenticated) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Clear expired or invalid token
        if (!res.ok && (res.status === 401 || res.status === 403 || !data?.authenticated)) {
          localStorage.removeItem('poc_admin_token');
          setToken(null);
        }
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken(token);
  }, [token, verifyToken]);

  // Login handler
  const login = async (password) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (res.ok && data?.success && data?.token) {
        localStorage.setItem('poc_admin_token', data.token);
        setToken(data.token);
        setIsAdmin(true);
        return { success: true };
      }
      return { success: false, message: data?.message || 'Mật khẩu không chính xác' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('poc_admin_token');
    setToken(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAdmin, loading, login, logout }}>
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
