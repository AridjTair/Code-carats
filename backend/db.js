const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const lostPath = path.join(dataDir, "lost_reports.json");
const foundPath = path.join(dataDir, "found_items.json");

function ensureFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(lostPath)) fs.writeFileSync(lostPath, JSON.stringify([], null, 2));
  if (!fs.existsSync(foundPath)) fs.writeFileSync(foundPath, JSON.stringify([], null, 2));
}

function readJSON(filePath) {
  ensureFiles();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw || "[]");
}

function writeJSON(filePath, data) {
  ensureFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getLostReports() {
  return readJSON(lostPath);
}

function saveLostReports(reports) {
  writeJSON(lostPath, reports);
}

function getFoundItems() {
  return readJSON(foundPath);
}

function saveFoundItems(items) {
  writeJSON(foundPath, items);
}

module.exports = {
  getLostReports,
  saveLostReports,
  getFoundItems,
  saveFoundItems,
};
