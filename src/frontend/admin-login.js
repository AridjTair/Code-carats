import { API_BASE, setAdminSession } from "./admin-utils.js";

const form = document.getElementById("loginForm");
const statusBox = document.getElementById("statusBox");
const toSignupBtn = document.getElementById("toSignupBtn");

const idEl = document.getElementById("employeeId");
const passEl = document.getElementById("password");

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

toSignupBtn.addEventListener("click", () => {
  window.location.href = "./admin-signup.html";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "");

  const employeeId = idEl.value.trim();
  const password = passEl.value;

  if (!employeeId || !password) {
    setStatus("bad", "Enter employee ID and password.");
    return;
  }

  try {
    setStatus("", "Logging in...");
    const r = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Login failed");

    setAdminSession({ token: data.token, email: employeeId });
    window.location.href = "./admin-dashboard.html";
  } catch (err) {
    setStatus("bad", String(err?.message || err));
  }
});