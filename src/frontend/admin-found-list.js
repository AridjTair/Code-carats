import { apiFetch, requireEmployeeSession, normalize } from "./admin-utils.js";

requireEmployeeSession();

const listEl = document.getElementById("list");
const statusBox = document.getElementById("statusBox");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");
const search = document.getElementById("search");

let allItems = [];

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
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
  if (s === "dateDesc") copy.sort((a, b) => (b.dateFound || "").localeCompare(a.dateFound || ""));
  if (s === "dateAsc") copy.sort((a, b) => (a.dateFound || "").localeCompare(b.dateFound || ""));
  if (s === "categoryAsc") copy.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  if (s === "colorAsc") copy.sort((a, b) => (a.color || "").localeCompare(b.color || ""));
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
            Found: ${i.locationFound} | ${i.dateFound}<br/>
            Status: ${i.status || "In storage"}
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
          <div><b>ID:</b> ${i.id}</div>
        </div>
      </details>
    </div>
  `).join("");
}

function refresh() {
  const filtered = applySort(applyFilters(allItems));
  render(filtered);
}

async function loadItems() {
  try {
    setStatus("", "Loading...");
    const out = await apiFetch("/api/admin/found-items");
    allItems = out.items || [];

    const cats = [...new Set(allItems.map(i => i.category).filter(Boolean))].sort();
    filterCategory.innerHTML = `<option value="">All</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");

    setStatus("ok", `${allItems.length} item(s) loaded.`);
    refresh();
  } catch (err) {
    setStatus("bad", String(err?.message || err));
  }
}

listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action || !id) return;

  try {
    if (action === "delete") {
      await apiFetch(`/api/admin/found-items/${encodeURIComponent(id)}`, { method: "DELETE" });
      setStatus("ok", "Deleted.");
    }
    if (action === "returned") {
      await apiFetch(`/api/admin/found-items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Returned" }),
      });
      setStatus("ok", "Marked as returned.");
    }
    await loadItems();
  } catch (err) {
    setStatus("bad", String(err?.message || err));
  }
});

filterCategory.addEventListener("change", refresh);
filterStatus.addEventListener("change", refresh);
sortBy.addEventListener("change", refresh);
search.addEventListener("input", refresh);

loadItems();