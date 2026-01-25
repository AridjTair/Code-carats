export const LS = {
  EMPLOYEES: "foundly_employees",
  SESSION: "foundly_employee_session",
  FOUND: "foundly_found_items",
  LOST: "foundly_lost_reports",
};

export function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSession() {
  return load(LS.SESSION, null);
}

export function requireEmployeeSession() {
  const s = getSession();
  if (!s || !s.employeeId) {
    window.location.href = "./admin-login.html";
  }
}

export function logout() {
  localStorage.removeItem(LS.SESSION);
  window.location.href = "./index.html";
}

export function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

export function hasAnyKeyword(haystack, keywords) {
  const h = normalize(haystack);
  return keywords.some(k => k && h.includes(normalize(k)));
}

export function keywords(str) {
  return normalize(str)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}
