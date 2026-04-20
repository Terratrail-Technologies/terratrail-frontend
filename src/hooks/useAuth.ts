/**
 * useAuth — Thin hook wrapping api.auth.* calls.
 * Stores JWT tokens in localStorage under "tt_auth".
 * Stores workspace slug under "tt_workspace_slug".
 *
 * Also exports AuthProvider — a thin pass-through wrapper required by App.tsx
 * (reserved for future React Context expansion).
 */

import { type ReactNode, createElement, Fragment } from "react";
import { api } from "../services/api";

// ── AuthProvider ─────────────────────────────────────────────────────────────
// App.tsx wraps everything in <AuthProvider>. Pass-through shell; exists so
// the import never breaks and can be fleshed out with Context later.

export function AuthProvider({ children }: { children: ReactNode }) {
  return createElement(Fragment, null, children);
}

// ── Error message mapping ────────────────────────────────────────────────────

function humaniseError(err: unknown): never {
  const raw = err instanceof Error ? err.message : String(err);

  const map: Array<[RegExp, string]> = [
    [/invalid credentials|no active account|unable to log in/i,
      "Incorrect email or password. Please try again."],
    [/email.*already.*exist|unique.*email/i,
      "An account with this email already exists. Try logging in instead."],
    [/password.*too short|password.*min/i,
      "Your password must be at least 8 characters."],
    [/otp.*invalid|invalid.*code|otp.*expired|expired.*otp/i,
      "That code is invalid or has expired. Request a new one."],
    [/otp.*not.*found|no otp/i,
      "No active verification code found. Please request a new one."],
    [/network|fetch|failed to fetch/i,
      "Unable to reach the server. Check your internet connection."],
    [/HTTP 400/i,
      "Some of the information you entered is invalid. Please check and try again."],
    [/HTTP 401/i,
      "You are not authorised. Please log in again."],
    [/HTTP 403/i,
      "You don't have permission to perform this action."],
    [/HTTP 404/i,
      "The requested resource was not found."],
    [/HTTP 429/i,
      "Too many requests. Please wait a moment before trying again."],
    [/HTTP 5/i,
      "Something went wrong on our end. Please try again shortly."],
  ];

  for (const [pattern, message] of map) {
    if (pattern.test(raw)) {
      throw new Error(message);
    }
  }

  throw new Error(raw || "An unexpected error occurred. Please try again.");
}

// ── Token helpers ────────────────────────────────────────────────────────────

function storeAuth(tokens: { access: string; refresh: string } | undefined | null) {
  if (!tokens?.access) return; // never write undefined/null
  localStorage.setItem("tt_auth", JSON.stringify(tokens));
}

function storeUser(user: any) {
  if (user && typeof user === "object") localStorage.setItem("tt_user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("tt_auth");
  localStorage.removeItem("tt_workspace_slug");
}

function hasTokens(): boolean {
  const stored = localStorage.getItem("tt_auth");
  if (!stored) return false;
  try {
    const t = JSON.parse(stored);
    return !!t?.access;
  } catch {
    return false;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  /**
   * Log in with email + password. Stores tokens.
   */
  const login = async (data: { email: string; password: string }) => {
    try {
      const response = await api.auth.login(data);
      storeAuth(response.tokens);
      storeUser(response.user);

      // Resolve workspace slug — login response doesn't include it,
      // so fetch /workspaces/mine/ and use the first workspace.
      try {
        const workspaces = await api.workspaces.mine();
        const first = Array.isArray(workspaces) ? workspaces[0] : (workspaces as any)?.results?.[0];
        if (first?.slug) {
          localStorage.setItem("tt_workspace_slug", first.slug);
        }
      } catch {
        // non-fatal — user can still navigate; slug may be set later
      }

      return response;
    } catch (err) {
      humaniseError(err);
    }
  };

  /**
   * Register new account, create workspace, request OTP.
   */
  const register = async (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    workspace_name?: string;
  }) => {
    try {
      const { workspace_name, ...userData } = data;

      // 1. Create user account
      const regResponse = await api.auth.register(userData);

      // 2. Store tokens if returned
      if (regResponse?.tokens) {
        storeAuth(regResponse.tokens);
      }

      // Backend already sends OTP during registration — no second request needed.
      return regResponse;
    } catch (err) {
      humaniseError(err);
    }
  };

  /**
   * Verify a 6-digit OTP. Stores tokens returned by the server.
   */
  const otpVerify = async (data: { email: string; code: string }) => {
    try {
      const response = await api.auth.otpVerify({ email: data.email, code: data.code });
      if (response?.tokens) {
        storeAuth(response.tokens);
      }
      if (response?.user) {
        storeUser(response.user);
      }
      const slug = (response as any).workspace_slug ?? (response as any).workspace?.slug;
      if (slug) {
        localStorage.setItem("tt_workspace_slug", slug);
      }
      return response;
    } catch (err) {
      humaniseError(err);
    }
  };

  /**
   * Request an OTP (for login or password reset).
   */
  const otpRequest = async (data: { email?: string; phone?: string }) => {
    try {
      return await api.auth.otpRequest(data);
    } catch (err) {
      humaniseError(err);
    }
  };

  /**
   * Reset password.
   * Expects tokens to already be stored (from otpVerify in the reset flow).
   * Falls back to re-verifying OTP if email + otp are supplied.
   */
  const resetPassword = async (data: {
    password: string;
    email?: string;
    otp?: string;
  }) => {
    try {
      // If tokens not yet stored, try to verify OTP first
      if (!hasTokens() && data.email && data.otp) {
        await otpVerify({ email: data.email, code: data.otp });
      }

      if (!hasTokens()) {
        throw new Error("Session expired. Please start the password reset again.");
      }

      // Update password via PATCH /auth/me/
      return await api.auth.updateMe({ password: data.password } as any);
    } catch (err) {
      humaniseError(err);
    }
  };

  /**
   * Clear stored credentials.
   */
  const logout = () => {
    clearAuth();
  };

  return { login, register, otpVerify, otpRequest, resetPassword, logout };
}
