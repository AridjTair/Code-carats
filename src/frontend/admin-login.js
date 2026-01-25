import { LS, load, save } from "./admin-utils.js";

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  setStatus("", "");

  const employeeId = idEl.value.trim();
  const password = passEl.value;

  if (!employeeId || !password) {
    setStatus("bad", "Enter employee ID and password.");
    return;
  }

  const employees = load(LS.EMPLOYEES, []);
  const emp = employees.find(e => String(e.employeeId).toLowerCase() === employeeId.toLowerCase());

  if (!emp || emp.password !== password) {
    setStatus("bad", "Invalid credentials.");
    return;
  }

  save(LS.SESSION, {
    employeeId: emp.employeeId,
    name: emp.name,
    email: emp.email,
    loginAt: new Date().toISOString(),
  });

  window.location.href = "./admin-dashboard.html";
});
