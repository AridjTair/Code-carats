const API_BASE = "http://localhost:5050";

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validate()) {
    statusBox.className = "status bad";
    statusBox.textContent = "Please fix the required fields.";
    return;
  }

  try {
    statusBox.className = "status";
    statusBox.textContent = "Submitting...";

    const fd = new FormData();

    // your backend currently expects these:
    fd.append("category", document.getElementById("category").value);
    fd.append("itemName", document.getElementById("itemName").value.trim());
    fd.append("brand", document.getElementById("brand").value.trim());
    fd.append("color", document.getElementById("color").value.trim());
    fd.append("locationLost", document.getElementById("locationLost").value.trim());
    fd.append("dateLost", document.getElementById("dateLost").value);
    fd.append("uniqueMarks", document.getElementById("uniqueMarks").value.trim());
    fd.append("description", document.getElementById("description").value.trim());

    // optional photo
    const f = photo.files && photo.files[0];
    if (f) fd.append("photo", f);

    // OPTIONAL: these are not stored by your backend right now,
    // but harmless to send (you can add them later to backend if you want).
    fd.append("fullName", document.getElementById("fullName").value.trim());
    fd.append("email", document.getElementById("email").value.trim());
    fd.append("phone", document.getElementById("phone").value.trim());
    fd.append("preferredContact", document.getElementById("preferredContact").value);

    const r = await fetch(`${API_BASE}/api/inquiries`, {
      method: "POST",
      body: fd,
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Submit failed");

    statusBox.className = "status ok";
    statusBox.textContent = `Submitted. Reference ID: ${data.inquiryId}. Confidence: ${data.confidence}.`;

    // convenience: redirect to check status page with the id
    setTimeout(() => {
      window.location.href = `./check-status.html?id=${encodeURIComponent(data.inquiryId)}`;
    }, 600);

    form.reset();
    fileHint.textContent = "No file selected";
  } catch (err) {
    statusBox.className = "status bad";
    statusBox.textContent = String(err?.message || err);
  }
});
