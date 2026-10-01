import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  balance: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("iu_token"));
  // Start as false if no token exists — no need to wait for server
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem("iu_token"));

  const fetchProfile = useCallback(async (t: string): Promise<User | null> => {
    try {
      const res = await fetchWithTimeout("/api/user/profile", {
        headers: { Authorization: `Bearer ${t}` },
      }, 3000);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("iu_token");
    if (!t) return;
    const profile = await fetchProfile(t);
    if (profile) setUser(profile);
  }, [fetchProfile]);

  useEffect(() => {
    const init = async () => {
      // Handle Google OAuth redirect token
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get("google_token");
      if (googleToken) {
        window.history.replaceState({}, "", window.location.pathname + window.location.hash);
        const profile = await fetchProfile(googleToken);
        if (profile) {
          localStorage.setItem("iu_token", googleToken);
          setUser(profile);
          setToken(googleToken);
        }
        setIsLoading(false);
        return;
      }

      const t = localStorage.getItem("iu_token");
      if (!t) {
        setIsLoading(false);
        return;
      }
      const profile = await fetchProfile(t);
      if (profile) {
        setUser(profile);
        setToken(t);
      } else {
        localStorage.removeItem("iu_token");
        setToken(null);
      }
      setIsLoading(false);
    };
    init();
  }, [fetchProfile]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("iu_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("iu_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
