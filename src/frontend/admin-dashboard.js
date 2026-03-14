import { requireEmployeeSession, logout } from "./admin-utils.js";

requireEmployeeSession();

const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");
const addFoundBtn = document.getElementById("addFoundBtn");
const foundListBtn = document.getElementById("foundListBtn");
const matchesBtn = document.getElementById("matchesBtn");

const email = localStorage.getItem("foundly_admin_email") || "admin";
welcome.textContent = `Logged in as ${email}`;

logoutBtn.addEventListener("click", logout);
addFoundBtn.addEventListener("click", () => (window.location.href = "./admin-add-found.html"));
foundListBtn.addEventListener("click", () => (window.location.href = "./admin-found-list.html"));
matchesBtn.addEventListener("click", () => (window.location.href = "./admin-matches.html"));