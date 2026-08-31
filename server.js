const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "responses.json");
// Set this in your environment before starting the server, e.g.:
//   EXPORT_KEY=valami-hosszu-titkos-string node server.js
// Without it, the /api/export endpoint is disabled.
const EXPORT_KEY = process.env.EXPORT_KEY || null;

const QUESTION_COUNT = 40;

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

function readResponses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Nem sikerült beolvasni a responses.json fájlt:", err);
    return [];
  }
}

function writeResponses(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

// Fogadja a kitöltött kérdőívet, és hozzáfűzi a JSON fájlhoz.
// Szándékosan NEM ment semmilyen azonosítót (IP, user-agent, cookie).
app.post("/api/submit", (req, res) => {
  const body = req.body || {};
  const answers = body.answers;

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Hiányzó vagy hibás 'answers' mező." });
  }

  for (let i = 1; i <= QUESTION_COUNT; i++) {
    const val = answers[`q${i}`];
    const isValid =
      val === "NA" || (Number.isInteger(val) && val >= 1 && val <= 10);
    if (!isValid) {
      return res
        .status(400)
        .json({ error: `A(z) ${i}. kérdésre adott válasz hiányzik vagy érvénytelen.` });
    }
  }

  const entry = {
    submittedAt: new Date().toISOString(),
    answers,
    background: {
      relationship: body.background?.relationship || null,
      relationshipOther: body.background?.relationshipOther || null,
      duration: body.background?.duration || null,
      frequency: body.background?.frequency || null,
    },
    openAnswers: {
      q41: body.openAnswers?.q41 || "",
      q42: body.openAnswers?.q42 || "",
      q43: body.openAnswers?.q43 || "",
    },
  };

  const all = readResponses();
  all.push(entry);
  writeResponses(all);

  res.status(201).json({ ok: true });
});

// Egyszerű exportvégpont a tulajdonosnak, titkos kulccsal védve.
// Példa: GET /api/export?key=valami-hosszu-titkos-string
app.get("/api/export", (req, res) => {
  if (!EXPORT_KEY) {
    return res.status(404).json({ error: "Az exportvégpont nincs bekapcsolva (nincs EXPORT_KEY beállítva)." });
  }
  if (req.query.key !== EXPORT_KEY) {
    return res.status(403).json({ error: "Érvénytelen kulcs." });
  }
  res.json(readResponses());
});

app.listen(PORT, () => {
  console.log(`Elul Self-Awareness 40 kérdőív fut a ${PORT} porton.`);
});
