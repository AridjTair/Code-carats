const API_BASE = "http://localhost:5050";

const refId = document.getElementById("refId");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("statusBox");
const result = document.getElementById("result");

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

async function fetchStatus(id) {
  const r = await fetch(`${API_BASE}/api/inquiries/${encodeURIComponent(id)}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Not found");
  return data;
}

async function claim(inquiryId, claimCode) {
  const r = await fetch(`${API_BASE}/api/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inquiryId, claimCode }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Claim failed");
  return data;
}

function render(data) {
  const claimHtml = data.claimAvailable
    ? `
      <div class="box">
        <div class="k">Claim</div>
        <div class="v">
          Claim is available.<br/>
          <div class="pill">Claim code: ${esc(data.claimCode)}</div>
          <div class="actions" style="margin-top:10px;">
            <button class="primary" id="claimBtn" type="button">Get claim instructions</button>
          </div>
        </div>
      </div>
    `
    : `
      <div class="box">
        <div class="k">Claim</div>
        <div class="v">Not available yet.</div>
      </div>
    `;

  result.innerHTML = `
    <div class="box">
      <div class="k">Status</div>
      <div class="v">${esc(data.status)}</div>
    </div>
    <div class="row">
      <div class="pill">Confidence: ${esc(data.confidence)}</div>
      <div class="pill muted">Inquiry ID: ${esc(data.inquiryId)}</div>
    </div>
    ${claimHtml}
    <div class="hint" style="margin-top:10px;">
      Inventory stays private. If approved, you’ll receive a claim code.
    </div>
  `;

  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) {
    claimBtn.addEventListener("click", async () => {
      try {
        setStatus("", "Requesting claim instructions...");
        const out = await claim(data.inquiryId, data.claimCode);
        setStatus("ok", "Claim instructions received.");
        result.innerHTML += `
          <div class="box" style="margin-top:12px;">
            <div class="k">Next steps</div>
            <div class="v">${esc(out.nextSteps)}</div>
          </div>
        `;
      } catch (e) {
        setStatus("bad", String(e?.message || e));
      }
    });
  }
}

checkBtn.addEventListener("click", async () => {
  result.innerHTML = "";
  const id = refId.value.trim();
  if (!id) {
    setStatus("bad", "Enter a reference ID.");
    return;
  }

  try {
    setStatus("", "Checking...");
    const data = await fetchStatus(id);
    setStatus("ok", "Found.");
    render(data);
  } catch (e) {
    setStatus("bad", String(e?.message || e));
  }
});

clearBtn.addEventListener("click", () => {
  refId.value = "";
  result.innerHTML = "";
  setStatus("", "");
});

// auto-fill from URL ?id=lost_xxx
(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    refId.value = id;
    checkBtn.click();
  }
})();
