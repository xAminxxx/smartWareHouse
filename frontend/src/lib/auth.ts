export type Role = "client" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  company: string;
  role: Role;
};

const AUTH_KEY = "smart_warehouse_auth";

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
