"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

interface AuthContextType {
  user: any;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Verify token and get user
      api.getCurrentUser().then(setUser).catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    console.log("Attempting login with:", username, password);
    try {
      const response = await api.login(username, password);
      console.log("Login response:", response);
      // Try both formats: Django (access) and FastAPI (access_token)
      const token = response.access || response.access_token;
      if (!token) {
        throw new Error("No token in response");
      }
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", response.refresh || response.refresh_token || "");
      const userData = await api.getCurrentUser();
      console.log("User data:", userData);
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}