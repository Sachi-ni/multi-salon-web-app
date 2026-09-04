import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles prop accepts a single string or an array of strings
// e.g. role="super-admin" or roles={["super-admin", "manager"]}
export default function RoleBasedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
}