import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

/**
 * Route protégée par rôle
 * Vérifie l'authentification ET les rôles autorisés
 */
export const RoleBasedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo 
}: RoleBasedRouteProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRole();

  const isLoading = authLoading || rolesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has at least one of the allowed roles
  const hasAllowedRole = roles.some(role => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    // Determine redirect based on user type
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    // Default redirect
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
