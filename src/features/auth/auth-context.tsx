"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, LoginResponse, UserInfo } from "@/entities/auth/types";
import { authApi } from "@/features/auth/api";
import { HttpError } from "@/shared/api/http";

type AuthContextValue = {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAnonymous = useCallback(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userInfo = await authApi.getUserInfo();
      setUser(userInfo);
      setIsLoading(false);
      return;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        try {
          await authApi.refresh();
          const userInfo = await authApi.getUserInfo();
          setUser(userInfo);
          setIsLoading(false);
          return;
        } catch {
          applyAnonymous();
          return;
        }
      }
      applyAnonymous();
    }
  }, [applyAnonymous]);

  const login = useCallback(
    async (payload: LoginRequest): Promise<LoginResponse> => {
      const result = await authApi.login(payload);
      if (result.statusCode === "200") {
        await refreshUser();
      }
      return result;
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Server-side logout failure should not block local sign-out.
    } finally {
      applyAnonymous();
    }
  }, [applyAnonymous]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

