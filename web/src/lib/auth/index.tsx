"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockUsers } from "@/features/chat/data/mock-data";
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

  const login = async (email: string, name?: string) => {
    const loggedUser: User = {
      ...mockUsers.me,
      email,
      name: name || mockUsers.me.name,
    };

    // Save cookie for middleware (7 days)
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem(AUTH_STORAGE, JSON.stringify(loggedUser));
    setUser(loggedUser);
    router.push("/messages/florencio");
  };

  const logout = () => {
    document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    localStorage.removeItem(AUTH_STORAGE);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
