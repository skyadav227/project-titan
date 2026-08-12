/**
 * AuthContext
 *
 * Provides current user state and auth actions across the app.
 * Checks localStorage for an existing token on mount.
 * Components use useAuth() to access user and isAuthenticated.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/authService";
import { getToken, clearToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())          // token expired/invalid — clear it
      .finally(() => setLoading(false));
  }, []);

  function signIn(userData) {
    setUser(userData);
  }

  function signOut() {
    clearToken();
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
