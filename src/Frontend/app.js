const submitLostBtn = document.getElementById("submitLostBtn");
const employeeLoginBtn = document.getElementById("employeeLoginBtn");
const checkStatusBtn = document.getElementById("checkStatusBtn");

submitLostBtn.addEventListener("click", () => {
  window.location.href = "./lost-report.html";
});

checkStatusBtn.addEventListener("click", () => {
  window.location.href = "./check-status.html";
});

employeeLoginBtn.addEventListener("click", () => {
  window.location.href = "./admin-login.html";
});
