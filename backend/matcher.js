function normalize(str = "") {
  return String(str).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(str = "") {
  const t = normalize(str).split(" ").filter(Boolean);
  return new Set(t);
}

function jaccard(aSet, bSet) {
  if (!aSet.size && !bSet.size) return 0;
  let inter = 0;
  for (const x of aSet) if (bSet.has(x)) inter++;
  const union = aSet.size + bSet.size - inter;
  return union ? inter / union : 0;
}

function daysBetween(aISO, bISO) {
  if (!aISO || !bISO) return null;
  const a = new Date(aISO);
  const b = new Date(bISO);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

function scoreMatch(lost, found) {
  let score = 0;

  // category
  if (lost.category && found.category && normalize(lost.category) === normalize(found.category)) score += 30;

  // color (loose)
  if (lost.color && found.color) {
    const lc = normalize(lost.color);
    const fc = normalize(found.color);
    if (lc === fc) score += 20;
    else if (lc.includes(fc) || fc.includes(lc)) score += 12;
  }

  // location (loose)
  if (lost.locationLost && found.locationFound) {
    const lLoc = tokens(lost.locationLost);
    const fLoc = tokens(found.locationFound);
    const sim = jaccard(lLoc, fLoc);
    if (sim >= 0.6) score += 20;
    else if (sim >= 0.3) score += 12;
  }

  // description similarity
  const lostText = `${lost.itemName || ""} ${lost.brand || ""} ${lost.description || ""} ${lost.uniqueMarks || ""}`;
  const foundText = `${found.itemName || ""} ${found.brand || ""} ${found.description || ""} ${found.uniqueMarks || ""}`;
  const sim = jaccard(tokens(lostText), tokens(foundText));
  if (sim >= 0.5) score += 25;
  else if (sim >= 0.3) score += 15;
  else if (sim >= 0.15) score += 8;

  // date window
  const d = daysBetween(lost.dateLost, found.dateFound);
  if (d !== null) {
    if (d <= 1) score += 10;
    else if (d <= 3) score += 7;
    else if (d <= 7) score += 4;
  }

  if (score > 100) score = 100;
  return score;
}

function findMatches(lost, foundItems, limit = 3) {
  const scored = foundItems.map((f) => ({
    foundId: f.id,
    score: scoreMatch(lost, f),
    // keep private details minimal for user response:
    summary: {
      category: f.category,
      color: f.color,
      locationFound: f.locationFound,
      dateFound: f.dateFound,
    },
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = { findMatches };
