const refId = document.getElementById("refId");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("statusBox");
const result = document.getElementById("result");

function loadReports() {
  return JSON.parse(localStorage.getItem("foundly_lost_reports") || "[]");
}
function saveReports(arr) {
  localStorage.setItem("foundly_lost_reports", JSON.stringify(arr));
}

function setStatus(type, msg) {
  statusBox.className = "status " + (type || "");
  statusBox.textContent = msg || "";
}

function renderReport(r) {
  const matchInfo =
    r.matchScore != null
      ? `<div class="pill">Match score: ${r.matchScore}%</div>`
      : `<div class="pill muted">Match score: N/A</div>`;

  const assigned =
    r.assignedFoundItemId
      ? `<div class="pill">Assigned found item: ${r.assignedFoundItemId}</div>`
      : `<div class="pill muted">Assigned found item: None</div>`;

  const hasVerification = !!r.verification?.question;
  const hasAnswer = !!r.verification?.answer;

  const verBlock = hasVerification
    ? `
      <div class="box">
        <div class="k">Verification</div>
        <div class="v">${r.verification.question}</div>

        <div class="field" style="margin-top:12px;">
          <label for="verAnswer">Your answer</label>
          <input id="verAnswer" type="text" placeholder="Write your proof (e.g., sticker on left side)" value="${hasAnswer ? r.verification.answer : ""}">
        </div>

        <div class="actions" style="margin-top:10px;">
          <button class="primary" id="submitVerificationBtn" type="button">Submit verification</button>
        </div>

        <div class="hint" style="margin-top:8px;">
          After you submit, staff will review and update your status.
        </div>
      </div>
    `
    : "";

  result.innerHTML = `
    <div class="box">
      <div class="k">Status</div>
      <div class="v">${r.status}</div>
    </div>
    <div class="row">
      ${matchInfo}
      ${assigned}
    </div>
    ${verBlock}
    <div class="box">
      <div class="k">Your report</div>
      <div class="v">
        <div><b>${r.item.category}</b> — ${r.item.itemName}</div>
        <div>Color: ${r.item.color}${r.item.brand ? ` | Brand: ${r.item.brand}` : ""}</div>
        <div>Lost at: ${r.item.locationLost} | Date: ${r.item.dateLost}</div>
      </div>
    </div>
  `;

  // Hook submit button if present
  const btn = document.getElementById("submitVerificationBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const answerEl = document.getElementById("verAnswer");
      const answer = (answerEl?.value || "").trim();
      if (!answer) {
        setStatus("bad", "Please write an answer for verification.");
        return;
      }

      const reports = loadReports();
      const idx = reports.findIndex((x) => x.id === r.id);
      if (idx === -1) return;

      reports[idx].verification = reports[idx].verification || {};
      reports[idx].verification.answer = answer;
      reports[idx].verification.submittedAt = new Date().toISOString();

      saveReports(reports);
      setStatus("ok", "Verification submitted. Staff will review.");
      // re-render updated
      renderReport(reports[idx]);
    });
  }
}

checkBtn.addEventListener("click", () => {
  result.innerHTML = "";
  const id = refId.value.trim();
  if (!id) {
    setStatus("bad", "Enter a reference ID.");
    return;
  }

  const reports = loadReports();
  const r = reports.find((x) => x.id === id);

  if (!r) {
    setStatus("bad", "No report found for that reference ID.");
    return;
  }

  setStatus("ok", "Report found.");
  renderReport(r);
});

clearBtn.addEventListener("click", () => {
  refId.value = "";
  result.innerHTML = "";
  setStatus("", "");
});
