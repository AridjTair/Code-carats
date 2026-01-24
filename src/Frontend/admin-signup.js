import { LS, load, save } from "./admin-utils.js";

const form = document.getElementById("signupForm");
const statusBox = document.getElementById("statusBox");
const toLoginBtn = document.getElementById("toLoginBtn");

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const idEl = document.getElementById("employeeId");
const passEl = document.getElementById("password");
const confEl = document.getElementById("confirm");

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

toLoginBtn.addEventListener("click", () => {
  window.location.href = "./admin-login.html";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  setStatus("", "");

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const employeeId = idEl.value.trim();
  const password = passEl.value;
  const confirm = confEl.value;

  if (!name || !email || !employeeId || !password) {
    setStatus("bad", "Fill name, email, employee ID, and password.");
    return;
  }
  if (password.length < 6) {
    setStatus("bad", "Password must be at least 6 characters.");
    return;
  }
  if (password !== confirm) {
    setStatus("bad", "Passwords do not match.");
    return;
  }

  const employees = load(LS.EMPLOYEES, []);
  const exists = employees.some(e => String(e.employeeId).toLowerCase() === employeeId.toLowerCase());
  if (exists) {
    setStatus("bad", "Employee ID already exists.");
    return;
  }

  employees.push({
    name,
    email,
    employeeId,
    password, // demo only
    createdAt: new Date().toISOString(),
  });

  save(LS.EMPLOYEES, employees);
  setStatus("ok", "Account created. You can login now.");
  setTimeout(() => (window.location.href = "./admin-login.html"), 600);
});
