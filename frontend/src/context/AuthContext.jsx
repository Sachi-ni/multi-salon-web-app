import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  });

  // Sync user to localStorage & sessionStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    }
  }, [user]);

  // Sync token to localStorage & sessionStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      sessionStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }, [token]);

  // Keep state synchronized across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      if (e.key === "token") {
        setToken(e.newValue || null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // LOGIN — stores user + token, caller handles navigation
  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
    if (jwtToken) {
      localStorage.setItem("token", jwtToken);
      sessionStorage.setItem("token", jwtToken);
    }
  }, []);

  // LOGOUT — clears everything, caller handles navigation
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
