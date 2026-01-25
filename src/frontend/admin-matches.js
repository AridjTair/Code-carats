import { LS, load, save, requireEmployeeSession, normalize, keywords } from "./admin-utils.js";

requireEmployeeSession();

const listEl = document.getElementById("list");
const statusBox = document.getElementById("statusBox");
const thresholdEl = document.getElementById("threshold");
const statusFilterEl = document.getElementById("statusFilter");

const STATUS = {
  NEW: "New",
  IN_REVIEW: "In review",
  POTENTIAL: "Potential match found",
  VERIFIED: "Verified / Claim approved",
  READY: "Ready for pickup",
  CLOSED: "Closed / Returned",
};

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

function loadLost() {
  return load(LS.LOST, []);
}

function loadFound() {
  return load(LS.FOUND, []);
}

function saveLost(arr) {
  save(LS.LOST, arr);
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return Math.abs(ta - tb) / (1000 * 60 * 60 * 24);
}

// returns { score: number, breakdown: [{label, pts}] }
function scoreMatch(lost, found) {
  // 10 categories, 10 points each
  let score = 0;
  const breakdown = [];

  const L = lost.item || {};
  const F = found || {};

  // 1 Category
  let pts = 0;
  if (L.category && F.category && L.category === F.category) pts = 10;
  breakdown.push({ label: "Category", pts });
  score += pts;

  // 2 Item name keyword overlap
  pts = 0;
  {
    const lk = new Set(keywords(L.itemName));
    const fk = new Set(keywords(F.itemName));
    const inter = [...lk].filter((x) => fk.has(x));
    if (inter.length >= 2) pts = 10;
    else if (inter.length === 1) pts = 5;
  }
  breakdown.push({ label: "Item name", pts });
  score += pts;

  // 3 Color
  pts = 0;
  if (L.color && F.color) {
    const lc = normalize(L.color);
    const fc = normalize(F.color);
    if (lc === fc) pts = 10;
    else {
      const lk = keywords(lc);
      const fk = keywords(fc);
      const inter = lk.filter((x) => fk.includes(x));
      if (inter.length >= 1) pts = 5;
    }
  }
  breakdown.push({ label: "Color", pts });
  score += pts;

  // 4 Brand (partial ok)
  pts = 0;
  if (L.brand && F.brand) {
    const lb = normalize(L.brand);
    const fb = normalize(F.brand);
    if (lb === fb) pts = 10;
    else if (lb && fb && (lb.includes(fb) || fb.includes(lb))) pts = 5;
  }
  breakdown.push({ label: "Brand", pts });
  score += pts;

  // 5 Location keyword overlap
  pts = 0;
  {
    const lk = keywords(L.locationLost);
    const fk = keywords(F.locationFound);
    const inter = lk.filter((x) => fk.includes(x));
    if (inter.length >= 2) pts = 10;
    else if (inter.length === 1) pts = 5;
  }
  breakdown.push({ label: "Location", pts });
  score += pts;

  // 6 Date window (lost date close to found date)
  pts = 0;
  {
    const d = daysBetween(L.dateLost, F.dateFound);
    if (d != null) {
      if (d <= 2) pts = 10;
      else if (d <= 7) pts = 5;
    }
  }
  breakdown.push({ label: "Date window", pts });
  score += pts;

  // 7 Unique marks keyword overlap
  pts = 0;
  {
    const lk = keywords(L.uniqueMarks);
    const fk = keywords(F.uniqueMarks);
    const inter = lk.filter((x) => fk.includes(x));
    if (L.uniqueMarks && F.uniqueMarks && inter.length >= 1) pts = 10;
  }
  breakdown.push({ label: "Unique marks", pts });
  score += pts;

  // 8 Description keyword overlap (loose)
  pts = 0;
  {
    const lk = keywords(L.description).slice(0, 40);
    const fk = keywords(F.description).slice(0, 40);
    const inter = lk.filter((x) => fk.includes(x));
    if (inter.length >= 4) pts = 10;
    else if (inter.length >= 2) pts = 5;
  }
  breakdown.push({ label: "Description", pts });
  score += pts;

  // 9 Time proximity (optional, only if same date)
  pts = 0;
  {
    const lt = L.timeLost;
    const ft = F.timeFound;
    if (lt && ft && L.dateLost && F.dateFound && L.dateLost === F.dateFound) {
      const [lh, lm] = String(lt).split(":").map(Number);
      const [fh, fm] = String(ft).split(":").map(Number);
      if (![lh, lm, fh, fm].some(Number.isNaN)) {
        const diff = Math.abs((lh * 60 + lm) - (fh * 60 + fm));
        if (diff <= 60) pts = 10; // within 1 hour
        else if (diff <= 180) pts = 5; // within 3 hours
      }
    }
  }
  breakdown.push({ label: "Time (optional)", pts });
  score += pts;

  // 10 Photo present (tiny bonus)
  pts = 0;
  {
    const a = normalize(L.photoFileName);
    // found item form doesn’t have photo currently, so we just give 5 if user provided one
    if (a) pts = 5;
  }
  breakdown.push({ label: "Photo present", pts });
  score += pts;

  // clamp
  score = Math.max(0, Math.min(100, score));

  return { score, breakdown };
}

function getMatches() {
  const lost = loadLost();
  const found = loadFound();

  const threshold = Number(thresholdEl.value || 70);
  const statusFilter = statusFilterEl.value;

  // only active found items
  const activeFound = found.filter((f) => f.status !== "Returned");

  const matches = [];

  for (const lr of lost) {
    if (statusFilter && lr.status !== statusFilter) continue;
    if (lr.status === STATUS.CLOSED) continue;

    for (const fi of activeFound) {
      const { score, breakdown } = scoreMatch(lr, fi);
      if (score >= threshold) {
        matches.push({
          lostId: lr.id,
          foundId: fi.id,
          score,
          breakdown,
          lost: lr,
          found: fi,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusOptions(current) {
  const all = [
    STATUS.NEW,
    STATUS.IN_REVIEW,
    STATUS.POTENTIAL,
    STATUS.VERIFIED,
    STATUS.READY,
    STATUS.CLOSED,
  ];
  return all
    .map((s) => `<option ${s === current ? "selected" : ""}>${escapeHtml(s)}</option>`)
    .join("");
}

function render() {
  setStatus("", "");
  const matches = getMatches();

  if (!matches.length) {
    listEl.innerHTML = `
      <div class="item">
        <div class="itemHeader">
          <div>
            <div class="itemTitle">No matches</div>
            <div class="itemMeta">Try lowering the threshold or add more found items.</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = matches
    .map((m) => {
      const L = m.lost.item || {};
      const F = m.found || {};

      const breakdownHtml = m.breakdown
        .map((b) => `<div class="itemMeta">${escapeHtml(b.label)}: <b>${b.pts}/10</b></div>`)
        .join("");

      return `
        <div class="item" data-lost="${escapeHtml(m.lostId)}" data-found="${escapeHtml(m.foundId)}">
          <div class="itemHeader">
            <div>
              <div class="itemTitle">${m.score}% match</div>
              <div class="itemMeta">
                <b>Lost:</b> ${escapeHtml(L.category)} — ${escapeHtml(L.itemName)} (Color: ${escapeHtml(L.color)})<br/>
                <b>Found:</b> ${escapeHtml(F.category)} — ${escapeHtml(F.itemName)} (Color: ${escapeHtml(F.color)})<br/>
                <b>Case status:</b> ${escapeHtml(m.lost.status || STATUS.NEW)}
              </div>
            </div>
            <div class="row" style="gap:10px; align-items:center;">
              <select class="compact statusSelect">
                ${statusOptions(m.lost.status || STATUS.NEW)}
              </select>
              <button class="primary assignBtn" type="button">Assign</button>
              <button class="ghost verifyBtn" type="button">Request verification</button>
              <button class="ghost closeBtn" type="button">Close</button>
            </div>
          </div>

          <details style="margin-top:10px;">
            <summary class="smallLink">Show breakdown</summary>
            <div style="margin-top:10px;">
              ${breakdownHtml}
              <div class="itemMeta" style="margin-top:8px;">
                <b>Lost report ID:</b> ${escapeHtml(m.lostId)}<br/>
                <b>Found item ID:</b> ${escapeHtml(m.foundId)}
              </div>
            </div>
          </details>
        </div>
      `;
    })
    .join("");
}

function updateLostById(lostId, updater) {
  const lost = loadLost();
  const idx = lost.findIndex((x) => x.id === lostId);
  if (idx === -1) return;

  const updated = updater({ ...lost[idx] });
  lost[idx] = updated;
  saveLost(lost);
}

listEl.addEventListener("click", (e) => {
  const card = e.target.closest(".item");
  if (!card) return;

  const lostId = card.getAttribute("data-lost");
  const foundId = card.getAttribute("data-found");

  const assignBtn = e.target.closest(".assignBtn");
  const verifyBtn = e.target.closest(".verifyBtn");
  const closeBtn = e.target.closest(".closeBtn");

  // status dropdown change
  const statusSelect = e.target.closest(".statusSelect");
  if (statusSelect && statusSelect.tagName === "SELECT") {
    statusSelect.addEventListener("change", () => {
      updateLostById(lostId, (r) => {
        r.status = statusSelect.value;
        return r;
      });
      setStatus("ok", "Status updated.");
      render();
    }, { once: true });
  }

  if (assignBtn) {
    // compute score again for stored matchScore
    const lost = loadLost().find((x) => x.id === lostId);
    const found = loadFound().find((x) => x.id === foundId);
    const s = lost && found ? scoreMatch(lost, found).score : null;

    updateLostById(lostId, (r) => {
      r.assignedFoundItemId = foundId;
      r.matchScore = s;
      if (!r.status || r.status === STATUS.NEW) r.status = STATUS.IN_REVIEW;
      return r;
    });

    setStatus("ok", "Match assigned to lost report.");
    render();
  }

  if (verifyBtn) {
    updateLostById(lostId, (r) => {
      r.assignedFoundItemId = foundId;
      r.status = STATUS.POTENTIAL;
      r.verification = r.verification || { question: "", answer: "", approved: false };
      if (!r.verification.question) {
        r.verification.question =
          "Please describe 1–2 unique details only the owner would know (stickers, scratches, contents, etc.).";
      }
      return r;
    });

    setStatus("ok", "Verification request prepared (user can see it on Check Status).");
    render();
  }

  if (closeBtn) {
    updateLostById(lostId, (r) => {
      r.status = STATUS.CLOSED;
      return r;
    });
    setStatus("ok", "Case closed.");
    render();
  }
});

thresholdEl.addEventListener("change", render);
statusFilterEl.addEventListener("change", render);

render();
