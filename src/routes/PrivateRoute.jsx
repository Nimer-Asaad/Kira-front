import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const isAllowed = allowedRoles.includes(user?.role);
    if (!isAllowed) {
      const fallbackMap = {
        admin: "/admin/dashboard",
        hr: "/hr/dashboard",
        trainee: "/trainee/tasks",
        personal: "/personal/dashboard",
      };
      const fallback = fallbackMap[user?.role] || "/user/dashboard";
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

export default PrivateRoute;
