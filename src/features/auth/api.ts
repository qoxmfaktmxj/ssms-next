import type { LoginRequest, LoginResponse, UserInfo } from "@/entities/auth/types";
import { request } from "@/shared/api/http";

export const authApi = {
  login: (payload: LoginRequest) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
    }),
  logout: () =>
    request<void>("/auth/logout", {
      method: "POST",
    }),
  refresh: () =>
    request<void>("/auth/refresh", {
      method: "POST",
    }),
  getUserInfo: () => request<UserInfo>("/user/info"),
};
