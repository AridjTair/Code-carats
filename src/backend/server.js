const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");


const { getLostReports, saveLostReports, getFoundItems, saveFoundItems } = require("./db");
const { findMatches } = require("./matcher");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve frontend static files (same origin as backend)
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// Default route: show homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});


const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "foundly-backend" });
});

// USER: submit lost report
app.post("/api/lost-report", (req, res) => {
  const body = req.body || {};

  // minimal validation
  const required = ["fullName", "email", "preferredContact", "category", "itemName", "color", "locationLost", "dateLost", "description"];
  for (const k of required) {
    if (!body[k] || String(body[k]).trim() === "") {
      return res.status(400).json({ ok: false, error: `Missing required field: ${k}` });
    }
  }

  const lost = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    contact: {
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      phone: (body.phone || "").trim(),
      preferredContact: body.preferredContact,
    },
    item: {
      category: body.category,
      itemName: body.itemName.trim(),
      brand: (body.brand || "").trim(),
      color: body.color.trim(),
      locationLost: body.locationLost.trim(),
      dateLost: body.dateLost,
      timeLost: body.timeLost || "",
      uniqueMarks: (body.uniqueMarks || "").trim(),
      description: body.description.trim(),
      photoFileName: body.photoFileName || "",
    },
    status: "submitted",
  };

  const lostReports = getLostReports();
  lostReports.unshift(lost);
  saveLostReports(lostReports);

  // matching
  const foundItems = getFoundItems();
  const matches = findMatches(lost.item, foundItems, 3);

  // Decide if “high confidence”
  const best = matches[0] ? matches[0].score : 0;
  const highConfidence = best >= 80;

  res.json({
    ok: true,
    referenceId: lost.id,
    match: {
      highConfidence,
      bestScore: best,
      topMatches: matches,
      message: highConfidence
        ? "A potential high-confidence match was found. We will contact you for verification."
        : "No high-confidence match yet. Your report is saved and will be reviewed.",
    },
  });
});

// USER: check status by reference id
app.get("/api/lost-report/:id", (req, res) => {
  const id = req.params.id;
  const reports = getLostReports();
  const report = reports.find((r) => r.id === id);
  if (!report) return res.status(404).json({ ok: false, error: "Not found" });

  // Return limited data (no private found inventory)
  res.json({
    ok: true,
    report: {
      id: report.id,
      createdAt: report.createdAt,
      status: report.status,
      category: report.item.category,
      itemName: report.item.itemName,
      color: report.item.color,
      locationLost: report.item.locationLost,
      dateLost: report.item.dateLost,
    },
  });
});

// ADMIN middleware
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
  next();
}

// ADMIN: add found item (private inventory)
app.post("/api/admin/found-item", requireAdmin, (req, res) => {
  const body = req.body || {};
  const required = ["category", "itemName", "color", "locationFound", "dateFound", "description"];
  for (const k of required) {
    if (!body[k] || String(body[k]).trim() === "") {
      return res.status(400).json({ ok: false, error: `Missing required field: ${k}` });
    }
  }

  const found = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    category: body.category,
    itemName: body.itemName.trim(),
    brand: (body.brand || "").trim(),
    color: body.color.trim(),
    locationFound: body.locationFound.trim(),
    dateFound: body.dateFound,
    uniqueMarks: (body.uniqueMarks || "").trim(),
    description: body.description.trim(),
    photoFileName: body.photoFileName || "",
  };

  const foundItems = getFoundItems();
  foundItems.unshift(found);
  saveFoundItems(foundItems);

  res.json({ ok: true, foundId: found.id });
});

// ADMIN: list found items
app.get("/api/admin/found-items", requireAdmin, (req, res) => {
  res.json({ ok: true, items: getFoundItems() });
});

// ADMIN: list lost reports uwu
app.get("/api/admin/lost-reports", requireAdmin, (req, res) => {
  res.json({ ok: true, reports: getLostReports() });
});

app.listen(PORT, () => {
  console.log(`FOUNDLY backend running on http://localhost:${PORT}`);
});
