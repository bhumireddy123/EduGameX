import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  /** If true, only users with role="admin" can access this route */
  adminOnly?: boolean;
}

/**
 * ProtectedRoute — enforces authentication (and optionally admin role).
 *
 * Behaviour:
 *  - Loading            → full-screen spinner
 *  - Not authenticated  → redirect to /login
 *  - adminOnly + student → redirect to /dashboard
 *  - OK                 → render child routes via <Outlet />
 */
export default function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && session.user.user_metadata?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * AdminRoute — convenience wrapper that requires the admin role.
 * Use this as a named component in the router so React Router
 * never creates a new component type on re-render.
 */
export function AdminRoute() {
  return <ProtectedRoute adminOnly />;
}
