/**
 * ProtectedRoute
 *
 * Wraps a route to require authentication.
 * Redirects to /login if no token is present or session restore is complete.
 * Shows nothing while auth is still loading.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // brief flash prevention

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
