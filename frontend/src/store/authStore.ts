import { useState, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("sa_token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("sa_user");
    return u ? (JSON.parse(u) as User) : null;
  });

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("sa_token", newToken);
    localStorage.setItem("sa_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_user");
    setToken(null);
    setUser(null);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, token, isAuthenticated: !!token, login, logout } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
