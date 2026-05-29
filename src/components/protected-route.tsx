import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Role = "admin" | "employer" | "employee" | "agency";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Require any one of these roles. If omitted, only requires authenticated user. */
  requiredRoles?: Role[];
  /** Where to send unauthenticated users. Defaults to /auth */
  loginPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  loginPath = "/auth",
}: ProtectedRouteProps) {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();

  const hasRequiredRole =
    !requiredRoles || requiredRoles.length === 0
      ? true
      : requiredRoles.some((r) => roles.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: loginPath });
      return;
    }
    if (!hasRequiredRole) {
      navigate({ to: "/unauthorized" });
    }
  }, [loading, user, hasRequiredRole, navigate, loginPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
