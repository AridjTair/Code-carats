const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");

const { getLostReports, saveLostReports, getFoundItems, saveFoundItems } = require("./db");
const { findMatches } = require("./matcher");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const FRONTEND_DIR = path.join(__dirname, "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

const PORT = process.env.PORT || 5050;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "foundly-admin-2026";

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "foundly-backend" });
});

// USER: submit lost report (multipart/form-data)
app.post("/api/inquiries", upload.single("photo"), (req, res) => {
  const body = req.body || {};

  const required = ["category", "itemName", "color", "locationLost", "dateLost", "description"];
  for (const k of required) {
    if (!body[k] || String(body[k]).trim() === "") {
      return res.status(400).json({ ok: false, error: `Missing required field: ${k}` });
    }
  }

  const inquiryId = "lost_" + crypto.randomUUID();

  const lost = {
    id: inquiryId,
    createdAt: new Date().toISOString(),
    contact: {
      fullName: (body.fullName || "").trim(),
      email: (body.email || "").trim(),
      phone: (body.phone || "").trim(),
      preferredContact: body.preferredContact || "email",
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
      photoFileName: req.file ? req.file.originalname : "",
    },
    status: "New",
    claimAvailable: false,
    claimCode: null,
  };

  const lostReports = getLostReports();
  lostReports.unshift(lost);
  saveLostReports(lostReports);

  const foundItems = getFoundItems();
  const matches = findMatches(lost.item, foundItems, 3);
  const best = matches[0] ? matches[0].score : 0;
  const confidence = best >= 80 ? "High" : best >= 60 ? "Medium" : "Low";

  res.json({
    ok: true,
    inquiryId: lost.id,
    confidence,
    bestScore: best,
    message: best >= 60
      ? "A potential match was found. We will contact you for verification."
      : "No match yet. Your report is saved and will be reviewed.",
  });
});

// USER: check status
app.get("/api/inquiries/:id", (req, res) => {
  const id = req.params.id;
  const reports = getLostReports();
  const report = reports.find((r) => r.id === id);
  if (!report) return res.status(404).json({ ok: false, error: "Report not found" });

  const foundItems = getFoundItems();
  const matches = findMatches(report.item, foundItems, 1);
  const best = matches[0] ? matches[0].score : 0;
  const confidence = best >= 80 ? "High" : best >= 60 ? "Medium" : "Low";

  res.json({
    ok: true,
    inquiryId: report.id,
    status: report.status,
    confidence,
    bestScore: best,
    claimAvailable: report.claimAvailable || false,
    claimCode: report.claimAvailable ? report.claimCode : null,
    item: {
      category: report.item.category,
      itemName: report.item.itemName,
      color: report.item.color,
      locationLost: report.item.locationLost,
      dateLost: report.item.dateLost,
    },
  });
});

// USER: claim
app.post("/api/claim", (req, res) => {
  const { inquiryId, claimCode } = req.body || {};
  if (!inquiryId || !claimCode) return res.status(400).json({ ok: false, error: "Missing inquiryId or claimCode" });

  const reports = getLostReports();
  const report = reports.find((r) => r.id === inquiryId);
  if (!report) return res.status(404).json({ ok: false, error: "Report not found" });
  if (!report.claimAvailable) return res.status(400).json({ ok: false, error: "No claim available yet" });
  if (report.claimCode !== claimCode) return res.status(400).json({ ok: false, error: "Invalid claim code" });

  res.json({
    ok: true,
    nextSteps: "Please bring a valid photo ID to the lost & found office. Quote your claim code at the front desk.",
  });
});

// ADMIN middleware — accepts both Bearer token and x-admin-token header
function requireAdmin(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers["x-admin-token"] || "");
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
  next();
}

// ADMIN: login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Invalid password" });
  }
  res.json({ ok: true, token: ADMIN_TOKEN, email: "admin@foundly.app" });
});

// ADMIN: add found item
app.post("/api/admin/found-items", requireAdmin, (req, res) => {
  const body = req.body || {};
  const required = ["category", "itemName", "color", "locationFound", "dateFound", "description"];
  for (const k of required) {
    if (!body[k] || String(body[k]).trim() === "") {
      return res.status(400).json({ ok: false, error: `Missing required field: ${k}` });
    }
  }

  const found = {
    id: "found_" + crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "In storage",
    category: body.category,
    itemName: body.itemName.trim(),
    brand: (body.brand || "").trim(),
    color: body.color.trim(),
    locationFound: body.locationFound.trim(),
    dateFound: body.dateFound,
    uniqueMarks: (body.uniqueMarks || "").trim(),
    description: body.description.trim(),
    recordedBy: body.recordedBy || "admin",
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

// ADMIN: list lost reports
app.get("/api/admin/lost-reports", requireAdmin, (req, res) => {
  res.json({ ok: true, reports: getLostReports() });
});

// ADMIN: get matches
app.get("/api/admin/matches", requireAdmin, (req, res) => {
  const lostReports = getLostReports();
  const foundItems = getFoundItems();
  const threshold = parseInt(req.query.threshold || "60", 10);

  const results = [];

  for (const lost of lostReports) {
    if (lost.status === "Closed / Returned") continue;
    const matches = findMatches(lost.item, foundItems, 1);
    if (!matches.length) continue;
    const top = matches[0];
    if (top.score < threshold) continue;

    const foundItem = foundItems.find((f) => f.id === top.foundId);
    if (!foundItem) continue;

    results.push({
      id: `match__${lost.id}__${top.foundId}`,
      lostId: lost.id,
      topScore: top.score,
      confidence: top.score >= 80 ? "High" : "Medium",
      lost: {
        category: lost.item.category,
        itemName: lost.item.itemName,
        color: lost.item.color,
        description: lost.item.description,
        uniqueMarks: lost.item.uniqueMarks,
        contactEmail: lost.contact.email,
        contactName: lost.contact.fullName,
      },
      found: {
        category: foundItem.category,
        itemName: foundItem.itemName,
        color: foundItem.color,
        locationFound: foundItem.locationFound,
        dateFound: foundItem.dateFound,
        description: foundItem.description,
        uniqueMarks: foundItem.uniqueMarks,
      },
      topCandidate: top,
    });
  }

  res.json(results);
});

// ADMIN: approve match
app.post("/api/admin/matches/:id/approve", requireAdmin, (req, res) => {
  const matchId = req.params.id;
  const parts = matchId.split("__");
  const lostId = parts[1];

  const reports = getLostReports();
  const report = reports.find((r) => r.id === lostId);
  if (!report) return res.status(404).json({ ok: false, error: "Report not found" });

  const claimCode = "CLAIM-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  report.status = "Verified / Claim approved";
  report.claimAvailable = true;
  report.claimCode = claimCode;
  saveLostReports(reports);

  res.json({ ok: true, claimCode });
});

// ADMIN: reject match
app.post("/api/admin/matches/:id/reject", requireAdmin, (req, res) => {
  const matchId = req.params.id;
  const parts = matchId.split("__");
  const lostId = parts[1];

  const reports = getLostReports();
  const report = reports.find((r) => r.id === lostId);
  if (!report) return res.status(404).json({ ok: false, error: "Report not found" });

  report.status = "In review";
  saveLostReports(reports);

  res.json({ ok: true });
});

// ADMIN: update found item status
app.patch("/api/admin/found-items/:id", requireAdmin, (req, res) => {
  const id = req.params.id;
  const items = getFoundItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

  if (req.body.status) items[idx].status = req.body.status;
  saveFoundItems(items);
  res.json({ ok: true });
});

// ADMIN: delete found item
app.delete("/api/admin/found-items/:id", requireAdmin, (req, res) => {
  const id = req.params.id;
  let items = getFoundItems();
  items = items.filter((i) => i.id !== id);
  saveFoundItems(items);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`FOUNDLY backend running on http://localhost:${PORT}`);
});