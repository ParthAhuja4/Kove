import React, { useState, useEffect } from "react";
import type { User } from "../types/index";
import api from "../services/api.ts";
import { AuthContext } from "./allContext.tsx";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data } = await api.get("/profile");
          setUser(data.data.user);
        } catch (error) {
          console.error("Failed to fetch user", error);
          setToken(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
