require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { Issuer, generators } = require("openid-client");
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

// Az /admin oldal Pocket ID-n (OIDC) keresztüli védelméhez szükséges beállítások.
const SESSION_SECRET = process.env.SESSION_SECRET || null;
const POCKET_ID_ISSUER = process.env.POCKET_ID_ISSUER || null;
const POCKET_ID_CLIENT_ID = process.env.POCKET_ID_CLIENT_ID || null;
const POCKET_ID_CLIENT_SECRET = process.env.POCKET_ID_CLIENT_SECRET || null;
const BASE_URL = process.env.BASE_URL || null;

if (!SESSION_SECRET) {
  console.error("Hiányzik a SESSION_SECRET környezeti változó. A szerver nem indul el biztonságos session titok nélkül.");
  process.exit(1);
}
if (!POCKET_ID_ISSUER || !POCKET_ID_CLIENT_ID || !POCKET_ID_CLIENT_SECRET || !BASE_URL) {
  console.error(
    "Hiányzik legalább egy Pocket ID beállítás (POCKET_ID_ISSUER, POCKET_ID_CLIENT_ID, POCKET_ID_CLIENT_SECRET, BASE_URL). A szerver nem indul el nélkülük."
  );
  process.exit(1);
}

// Nginx reverse proxy mögött fut, ez kell a secure cookie-khoz és a helyes protokoll-detektáláshoz.
app.set("trust proxy", 1);

app.use(express.json({ limit: "200kb" }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

// Az OIDC discovery befejezése után kapja meg értéket (lásd a fájl végén).
let oidcClient = null;

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/auth/login");
}

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

app.get("/auth/login", (req, res) => {
  const state = generators.state();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  req.session.oidcState = state;
  req.session.oidcCodeVerifier = codeVerifier;

  const authUrl = oidcClient.authorizationUrl({
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  try {
    const params = oidcClient.callbackParams(req);
    const { oidcState, oidcCodeVerifier } = req.session;
    delete req.session.oidcState;
    delete req.session.oidcCodeVerifier;

    const tokenSet = await oidcClient.callback(`${BASE_URL}/auth/callback`, params, {
      state: oidcState,
      code_verifier: oidcCodeVerifier,
    });
    const userinfo = await oidcClient.userinfo(tokenSet);

    req.session.user = { sub: userinfo.sub, email: userinfo.email || null };
    res.redirect("/admin");
  } catch (err) {
    console.error("Sikertelen bejelentkezés a Pocket ID-n keresztül:", err);
    res.status(401).send("Sikertelen bejelentkezés.");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// A főoldal ebből tudja meg, mutasson-e admin linket — nem árul el mást a session-ről.
app.get("/api/session", (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

app.get("/admin", requireAuth, (req, res) => {
  const dates = readResponses()
    .map((entry) => entry.submittedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));

  const items = dates
    .map((iso) => `<li>${new Date(iso).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</li>`)
    .join("\n");

  res.send(`<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<title>Admin — kitöltött kérdőívek</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main style="max-width: var(--measure); margin: 2rem auto; padding: 0 1rem;">
<h1>Kitöltött kérdőívek (${dates.length})</h1>
<p><a href="/">Vissza a kérdőívhez</a> · <a href="/auth/logout">Kijelentkezés</a></p>
<ul>
${items}
</ul>
</main>
</body>
</html>`);
});

(async () => {
  try {
    const issuer = await Issuer.discover(POCKET_ID_ISSUER);
    oidcClient = new issuer.Client({
      client_id: POCKET_ID_CLIENT_ID,
      client_secret: POCKET_ID_CLIENT_SECRET,
      redirect_uris: [`${BASE_URL}/auth/callback`],
      response_types: ["code"],
    });
  } catch (err) {
    console.error("Nem sikerült elérni a Pocket ID OIDC discovery végpontját:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Elul Self-Awareness 40 kérdőív fut a ${PORT} porton.`);
  });
})();
