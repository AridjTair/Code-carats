import { apiFetch, requireEmployeeSession } from "./admin-utils.js";

requireEmployeeSession();

const listEl = document.getElementById("list");
const statusBox = document.getElementById("statusBox");

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPending() {
  // backend returns high-confidence pending matches with lost + found expanded
  return await apiFetch("/api/admin/matches");
}

async function approve(matchId) {
  return await apiFetch(`/api/admin/matches/${encodeURIComponent(matchId)}/approve`, {
    method: "POST",
  });
}

async function reject(matchId) {
  return await apiFetch(`/api/admin/matches/${encodeURIComponent(matchId)}/reject`, {
    method: "POST",
  });
}

function render(items) {
  if (!items.length) {
    listEl.innerHTML = `
      <div class="item">
        <div class="itemHeader">
          <div>
            <div class="itemTitle">No pending matches</div>
            <div class="itemMeta">Only high-confidence matches appear here.</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = items
    .map((m) => {
      const L = m.lost || {};
      const F = m.found || {};
      const top = m.topCandidate || {};
      return `
        <div class="item" data-id="${esc(m.id)}">
          <div class="itemHeader">
            <div>
              <div class="itemTitle">${esc(m.confidence)} confidence — score ${Math.round(m.topScore || 0)}%</div>
              <div class="itemMeta">
                <b>Lost:</b> ${esc(L.category)} — ${esc(L.itemName)} (Color: ${esc(L.color)})<br/>
                <b>Found:</b> ${esc(F.category)} — ${esc(F.itemName)} (Color: ${esc(F.color)})<br/>
                <b>Found at:</b> ${esc(F.locationFound)} | ${esc(F.dateFound)}<br/>
              </div>
            </div>
            <div class="row">
              <button class="primary approveBtn" type="button">Approve</button>
              <button class="ghost rejectBtn" type="button">Reject</button>
            </div>
          </div>

          <details style="margin-top:10px;">
            <summary class="smallLink">Show details</summary>
            <div class="itemMeta" style="margin-top:10px;">
              <div><b>Lost description:</b> ${esc(L.description)}</div>
              <div><b>Lost unique marks:</b> ${esc(L.uniqueMarks)}</div>
              <div style="margin-top:6px;"><b>Found description:</b> ${esc(F.description)}</div>
              <div><b>Found unique marks:</b> ${esc(F.uniqueMarks)}</div>
              <div style="margin-top:6px;"><b>Match ID:</b> ${esc(m.id)}</div>
              <div><b>Lost ID:</b> ${esc(m.lostId)}</div>
              <div><b>Found ID:</b> ${esc(top.foundId)}</div>
            </div>
          </details>
        </div>
      `;
    })
    .join("");
}

async function refresh() {
  try {
    setStatus("", "Loading...");
    const items = await loadPending();
    setStatus("ok", `Loaded ${items.length} pending match(es).`);
    render(items);
  } catch (e) {
    setStatus("bad", String(e?.message || e));
  }
}

listEl.addEventListener("click", async (e) => {
  const card = e.target.closest(".item");
  if (!card) return;

  const id = card.getAttribute("data-id");
  if (!id) return;

  if (e.target.closest(".approveBtn")) {
    try {
      setStatus("", "Approving...");
      const out = await approve(id);
      setStatus("ok", `Approved. Claim code: ${out.claimCode}`);
      await refresh();
    } catch (err) {
      setStatus("bad", String(err?.message || err));
    }
  }

  if (e.target.closest(".rejectBtn")) {
    try {
      setStatus("", "Rejecting...");
      await reject(id);
      setStatus("ok", "Rejected.");
      await refresh();
    } catch (err) {
      setStatus("bad", String(err?.message || err));
    }
  }
});

refresh();
