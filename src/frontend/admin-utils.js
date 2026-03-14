export const API_BASE = "http://localhost:5050";

export const LS = {
  ADMIN_TOKEN: "foundly_admin_token",
  ADMIN_EMAIL: "foundly_admin_email",
  EMPLOYEES: "foundly_employees",
  SESSION: "foundly_session",
  FOUND: "foundly_found_items",
  LOST: "foundly_lost_reports",
};

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getSession() {
  return load(LS.SESSION, null);
}

export function setAdminSession({ token, email }) {
  localStorage.setItem(LS.ADMIN_TOKEN, token);
  localStorage.setItem(LS.ADMIN_EMAIL, email || "");
  save(LS.SESSION, { token, email, loginAt: new Date().toISOString() });
}

export function getAdminToken() {
  return localStorage.getItem(LS.ADMIN_TOKEN) || "";
}

export function requireEmployeeSession() {
  const t = getAdminToken();
  if (!t) window.location.href = "./admin-login.html";
}

export function logout() {
  localStorage.removeItem(LS.ADMIN_TOKEN);
  localStorage.removeItem(LS.ADMIN_EMAIL);
  localStorage.removeItem(LS.SESSION);
  window.location.href = "./index.html";
}

export async function apiFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const r = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `Request failed: ${r.status}`);
  return data;
}

export function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

export function keywords(str) {
  return normalize(str).split(/[^a-z0-9]+/g).filter(Boolean);
}