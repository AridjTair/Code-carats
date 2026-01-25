export const API_BASE = "http://localhost:5050";

export const LS = {
  ADMIN_TOKEN: "foundly_admin_token",
  ADMIN_EMAIL: "foundly_admin_email",
};

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function setAdminSession({ token, email }) {
  localStorage.setItem(LS.ADMIN_TOKEN, token);
  localStorage.setItem(LS.ADMIN_EMAIL, email || "");
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
  window.location.href = "./index.html";
}

export async function apiFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = { ...(options.headers || {}) };

  // Your backend authMiddleware should accept Bearer tokens
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
  return normalize(str)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}