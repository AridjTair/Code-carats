import { apiFetch, requireEmployeeSession } from "./admin-utils.js";

requireEmployeeSession();

const form = document.getElementById("foundForm");
const statusBox = document.getElementById("statusBox");
const clearBtn = document.getElementById("clearBtn");

const fields = {
  category: document.getElementById("category"),
  itemName: document.getElementById("itemName"),
  brand: document.getElementById("brand"),
  color: document.getElementById("color"),
  locationFound: document.getElementById("locationFound"),
  dateFound: document.getElementById("dateFound"),
  timeFound: document.getElementById("timeFound"),
  uniqueMarks: document.getElementById("uniqueMarks"),
  description: document.getElementById("description"),
};

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

clearBtn.addEventListener("click", () => {
  form.reset();
  setStatus("", "");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "");

  const required = ["category", "itemName", "color", "locationFound", "dateFound", "description"];
  for (const k of required) {
    if (!fields[k].value || String(fields[k].value).trim() === "") {
      setStatus("bad", "Fill category, item name, color, location, date, and description.");
      return;
    }
  }

  try {
    setStatus("", "Saving...");

    const body = {
      category: fields.category.value,
      itemName: fields.itemName.value.trim(),
      brand: fields.brand.value.trim(),
      color: fields.color.value.trim(),
      locationFound: fields.locationFound.value.trim(),
      dateFound: fields.dateFound.value,
      uniqueMarks: fields.uniqueMarks.value.trim(),
      description: fields.description.value.trim(),
      // timeFound exists in UI; backend currently ignores it. If you want it saved, add it in backend.
    };

    const out = await apiFetch("/api/admin/found-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setStatus("ok", `Saved. Found item ID: ${out.foundId}`);
    form.reset();
  } catch (err) {
    setStatus("bad", String(err?.message || err));
  }
});
