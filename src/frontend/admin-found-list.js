import { LS, load, save, requireEmployeeSession, normalize } from "./admin-utils.js";

requireEmployeeSession();

const listEl = document.getElementById("list");
const statusBox = document.getElementById("statusBox");

const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");
const search = document.getElementById("search");

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

function allFound() {
  return load(LS.FOUND, []);
}

function saveFound(arr) {
  save(LS.FOUND, arr);
}

function uniqueCategories(items) {
  const set = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function applyFilters(items) {
  const cat = filterCategory.value;
  const st = filterStatus.value;
  const q = normalize(search.value);

  return items.filter(i => {
    if (cat && i.category !== cat) return false;
    if (st && i.status !== st) return false;
    if (q) {
      const blob = normalize([i.itemName, i.color, i.locationFound, i.description, i.brand, i.uniqueMarks].join(" "));
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

function applySort(items) {
  const s = sortBy.value;
  const copy = [...items];

  if (s === "dateDesc") copy.sort((a,b) => (b.dateFound || "").localeCompare(a.dateFound || ""));
  if (s === "dateAsc") copy.sort((a,b) => (a.dateFound || "").localeCompare(b.dateFound || ""));
  if (s === "categoryAsc") copy.sort((a,b) => (a.category || "").localeCompare(b.category || ""));
  if (s === "colorAsc") copy.sort((a,b) => (a.color || "").localeCompare(b.color || ""));
  return copy;
}

function render(items) {
  if (!items.length) {
    listEl.innerHTML = `<div class="item"><div class="itemMeta">No items found.</div></div>`;
    return;
  }

  listEl.innerHTML = items.map(i => `
    <div class="item">
      <div class="itemHeader">
        <div>
          <div class="itemTitle">${i.category} — ${i.itemName}</div>
          <div class="itemMeta">
            Color: ${i.color}${i.brand ? ` | Brand: ${i.brand}` : ""}<br/>
            Found: ${i.locationFound} | ${i.dateFound}${i.timeFound ? ` ${i.timeFound}` : ""}<br/>
            Status: ${i.status}
          </div>
        </div>
        <div class="row">
          ${i.status !== "Returned" ? `<button class="ghost" data-action="returned" data-id="${i.id}">Mark returned</button>` : ""}
          <button class="ghost" data-action="delete" data-id="${i.id}">Delete</button>
        </div>
      </div>

      <details style="margin-top:10px;">
        <summary class="smallLink">Details</summary>
        <div class="itemMeta" style="margin-top:10px;">
          <div><b>Description:</b> ${i.description || "-"}</div>
          <div><b>Unique marks:</b> ${i.uniqueMarks || "-"}</div>
          <div><b>Recorded by:</b> ${i.recordedBy || "-"}</div>
          <div><b>ID:</b> ${i.id}</div>
        </div>
      </details>
    </div>
  `).join("");
}

function refresh() {
  setStatus("", "");
  const items = allFound();
  const filtered = applySort(applyFilters(items));
  render(filtered);
}

function populateCategories() {
  const items = allFound();
  const cats = uniqueCategories(items);
  filterCategory.innerHTML = `<option value="">All</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action || !id) return;

  const items = allFound();
  const idx = items.findIndex(x => x.id === id);
  if (idx === -1) return;

  if (action === "delete") {
    items.splice(idx, 1);
    saveFound(items);
    setStatus("ok", "Deleted.");
    populateCategories();
    refresh();
  }

  if (action === "returned") {
    items[idx].status = "Returned";
    saveFound(items);
    setStatus("ok", "Marked as returned.");
    refresh();
  }
});

filterCategory.addEventListener("change", refresh);
filterStatus.addEventListener("change", refresh);
sortBy.addEventListener("change", refresh);
search.addEventListener("input", refresh);

populateCategories();
refresh();
