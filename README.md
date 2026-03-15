# Foundly

Lost and found web app with secure, confidence-based item matching.

**Live demo:** https://code-carats.onrender.com

---

## What it does

Foundly lets users submit lost item reports through a public form. A private admin inventory of found items is cross-referenced using a keyword similarity algorithm (Jaccard scoring). Item details are never exposed publicly — only after a high-confidence match is confirmed by an admin does the user receive a claim code to retrieve their item.

**User flow:**

1. User submits a lost item report with description, category, color, and location
2. System scores the report against the private found inventory
3. If a match is found above the confidence threshold, the admin is notified
4. Admin reviews, approves or rejects the match
5. On approval, user receives a claim code to pick up their item

**Admin flow:**

- Register found items into the private inventory
- View and filter the inventory
- Review potential matches scored by the system
- Approve or reject matches and issue claim codes

---

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Matching:** Jaccard similarity algorithm (overlap scoring)
- **Storage:** JSON flat files (no database required)
- **Auth:** Token-based admin authentication
- **Deployed on:** Render

---

## Project structure
```
src/
├── backend/
│   ├── server.js       # Express API server
│   ├── matcher.js      # Jaccard scoring algorithm
│   ├── db.js           # JSON file read/write
│   └── package.json
└── frontend/
    ├── index.html              # Homepage
    ├── lost-report.html        # User submission form
    ├── check-status.html       # Status lookup by reference ID
    ├── admin-login.html        # Admin login
    ├── admin-dashboard.html    # Admin home
    ├── admin-add-found.html    # Register found item
    ├── admin-found-list.html   # View/filter inventory
    └── admin-matches.html      # Review matches
```

---

## Running locally
```
cd src/backend
npm install
node server.js
```

Open `http://localhost:5050` in your browser.

Or visit the **[live demo](https://code-carats.onrender.com)** — no setup required.

**Default admin password:** `foundly-admin-2026`

To change it, set the environment variable:
```
ADMIN_TOKEN=your-secure-password node server.js
```

---

## Matching algorithm

Each lost report is scored against every found item in the private inventory using a weighted Jaccard similarity across four dimensions:

| Signal | Max points |
| --- | --- |
| Category match | 30 |
| Color match | 20 |
| Location similarity | 20 |
| Description / name / brand overlap | 25 |
| Date proximity | 10 |

A score of 60+ surfaces the match for admin review. A score of 80+ is flagged as high confidence.

---

## Built at

ConUHacks X — Concordia University, Montreal
Team: Code Carats
## Built at

ConUHacks X — Concordia University, Montreal  
Team: Code Carats
