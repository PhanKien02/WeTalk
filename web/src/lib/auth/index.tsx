"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockUsers } from "@/features/chat/data/mock-data";
import { COOKIES } from "@/lib/cookieName";
import { removeCookie, setCookie } from "@/utils/cookies";
import type { AuthContextType, User } from "@/type";

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_COOKIE = "wetalk_token";
const AUTH_STORAGE = "wetalk_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage & cookie on load
    try {
      const stored = localStorage.getItem(AUTH_STORAGE);
      if (stored) {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
      } else {
        // Check if cookie exists
        const hasCookie = document.cookie
          .split("; ")
          .some((row) => row.startsWith(`${AUTH_COOKIE}=`));
        if (hasCookie) {
          setUser(mockUsers.me);
        }
      }
    } catch {
      // ignore JSON parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    loginOrEmail: string,
    name?: string,
    token?: string,
    userData?: Partial<User>
  ) => {
    const loggedUser: User = {
      ...mockUsers.me,
      id: userData?.id || mockUsers.me.id,
      email: userData?.email || (loginOrEmail.includes("@") ? loginOrEmail : mockUsers.me.email),
      phone: userData?.phone || (!loginOrEmail.includes("@") ? loginOrEmail : undefined),
      name: name || userData?.name || mockUsers.me.name,
    };

    if (token) {
      setCookie(COOKIES.ACCESSTOKEN, token);
    }
    // Save cookie for middleware (7 days)
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem(AUTH_STORAGE, JSON.stringify(loggedUser));
    setUser(loggedUser);
    router.push("/messages/florencio");
  };

  const logout = () => {
    removeCookie(COOKIES.ACCESSTOKEN);
    document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    localStorage.removeItem(AUTH_STORAGE);
    setUser(null);
    router.push("/login");
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...userData };
      try {
        localStorage.setItem(AUTH_STORAGE, JSON.stringify(updated));
      } catch {
        // ignore localStorage error
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
