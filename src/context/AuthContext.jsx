import { createContext, useContext, useState, useEffect } from "react";
import { getUser, setUser as saveUser, removeUser } from "../utils/helper";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (payload) => {
    // Normalize backend payload { token, user: {...} } to flat shape
    const normalized = payload?.user
      ? { token: payload.token, ...payload.user }
      : payload;
    setUser(normalized);
    saveUser(normalized);
  };

  const logout = () => {
    setUser(null);
    removeUser();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
