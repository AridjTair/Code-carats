const submitLostBtn = document.getElementById("submitLostBtn");
const employeeLoginBtn = document.getElementById("employeeLoginBtn");

submitLostBtn.addEventListener("click", () => {
  window.location.href = "./lost-report.html";
});

employeeLoginBtn.addEventListener("click", () => {
  // Your friends can create this later
  window.location.href = "./admin-login.html";
});