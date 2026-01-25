const form = document.getElementById("lostForm");
const statusBox = document.getElementById("statusBox");
const clearBtn = document.getElementById("clearBtn");
const photo = document.getElementById("photo");
const fileHint = document.getElementById("fileHint");

function setError(fieldId, message) {
  const el = document.querySelector(`.error[data-for="${fieldId}"]`);
  if (el) el.textContent = message || "";
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((e) => (e.textContent = ""));
  statusBox.className = "status";
  statusBox.textContent = "";
}

function validate() {
  clearErrors();
  let ok = true;

  const requiredText = [
    "fullName",
    "email",
    "preferredContact",
    "category",
    "itemName",
    "color",
    "locationLost",
    "dateLost",
    "description",
  ];

  for (const id of requiredText) {
    const input = document.getElementById(id);
    if (!input.value || String(input.value).trim() === "") {
      setError(id, "Required");
      ok = false;
    }
  }

  const email = document.getElementById("email").value.trim();
  const emailLooksOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (email && !emailLooksOk) {
    setError("email", "Enter a valid email");
    ok = false;
  }

  const consent = document.getElementById("consent");
  if (!consent.checked) {
    setError("consent", "Required");
    ok = false;
  }

  return ok;
}

photo.addEventListener("change", () => {
  const f = photo.files && photo.files[0];
  fileHint.textContent = f ? `Selected: ${f.name}` : "No file selected";
});

clearBtn.addEventListener("click", () => {
  form.reset();
  fileHint.textContent = "No file selected";
  clearErrors();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validate()) {
    statusBox.className = "status bad";
    statusBox.textContent = "Please fix the required fields.";
    return;
  }

  const payload = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  contact: {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    preferredContact: document.getElementById("preferredContact").value,
  },
  item: {
    category: document.getElementById("category").value,
    itemName: document.getElementById("itemName").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    color: document.getElementById("color").value.trim(),
    locationLost: document.getElementById("locationLost").value.trim(),
    dateLost: document.getElementById("dateLost").value,
    timeLost: document.getElementById("timeLost").value,
    uniqueMarks: document.getElementById("uniqueMarks").value.trim(),
    description: document.getElementById("description").value.trim(),
    photoFileName:
      (photo.files && photo.files[0] && photo.files[0].name) || "",
  },

  status: "New",
  assignedFoundItemId: "",
  matchScore: null,
  verification: {
    question: "",
    answer: "",
    approved: false,
  },
};

  const existing = JSON.parse(localStorage.getItem("foundly_lost_reports") || "[]");
  existing.unshift(payload);
  localStorage.setItem("foundly_lost_reports", JSON.stringify(existing));

  statusBox.className = "status ok";
  statusBox.textContent =
    `Report submitted. Reference: ${payload.id}. If a match is found, we’ll contact you for verification.`;

  form.reset();
  fileHint.textContent = "No file selected";
});
