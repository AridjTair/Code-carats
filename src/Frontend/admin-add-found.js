import { LS, load, save, requireEmployeeSession, getSession } from "./admin-utils.js";

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  setStatus("", "");

  const required = ["category", "itemName", "color", "locationFound", "dateFound", "description"];
  for (const k of required) {
    if (!fields[k].value || String(fields[k].value).trim() === "") {
      setStatus("bad", "Fill category, item name, color, location, date, and description.");
      return;
    }
  }

  const s = getSession();
  const found = load(LS.FOUND, []);

  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    category: fields.category.value,
    itemName: fields.itemName.value.trim(),
    brand: fields.brand.value.trim(),
    color: fields.color.value.trim(),
    locationFound: fields.locationFound.value.trim(),
    dateFound: fields.dateFound.value,
    timeFound: fields.timeFound.value,
    uniqueMarks: fields.uniqueMarks.value.trim(),
    description: fields.description.value.trim(),
    status: "In storage",
    recordedBy: s?.employeeId || "",
  };

  found.unshift(item);
  save(LS.FOUND, found);

  setStatus("ok", `Saved. Found item ID: ${item.id}`);
  form.reset();
});
