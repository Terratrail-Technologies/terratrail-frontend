import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, User, AuthResponse } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  otpRequest: (data: { email?: string; phone?: string }) => Promise<any>;
  otpVerify: (data: { email?: string; phone?: string; code: string }) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (data: AuthResponse) => {
    localStorage.setItem("tt_auth", JSON.stringify(data.tokens));
    setUser(data.user);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("tt_auth");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user", err);
      // If unauthorized, logout
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = async (data: any) => {
    const res = await api.auth.login(data);
    saveAuth(res);
  };

  const register = async (data: any) => {
    await api.auth.register(data);
    // After registration, the user might need to login or verify OTP
  };

  const otpRequest = async (data: { email?: string; phone?: string }) => {
    return await api.auth.otpRequest(data);
  };

  const otpVerify = async (data: { email?: string; phone?: string; code: string }) => {
    const res = await api.auth.otpVerify(data);
    saveAuth(res);
  };

  const resetPassword = async (data: any) => {
    await api.auth.resetPassword(data);
  };

  useEffect(() => {
    const tokens = localStorage.getItem("tt_auth");
    if (tokens) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        otpRequest,
        otpVerify,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
