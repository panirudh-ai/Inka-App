import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const AUTH_STORAGE_KEY = "inka_auth";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    const session = JSON.parse(raw);
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    if (session?.user?.tenantId) {
      config.headers["x-tenant-id"] = session.user.tenantId;
    }
    if (session?.user?.id) {
      config.headers["x-user-id"] = session.user.id;
    }
    if (session?.user?.role) {
      config.headers["x-role"] = session.user.role;
    }
  }
  return config;
});

export function getSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function safeGet(url, fallback = []) {
  try {
    const { data } = await api.get(url);
    return data;
  } catch {
    return fallback;
  }
}
