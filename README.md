# Elul Self-Awareness 40 — kattintható kérdőív

Egyszerű Node.js/Express alkalmazás: kiszolgálja a kérdőívet, és minden
kitöltést anonim módon hozzáfűz egy `data/responses.json` fájlhoz
(időbélyeg + válaszok). Nem ment nevet, e-mailt, IP-t vagy más azonosítót.

## 1. Feltöltés a VPS-re

```bash
scp -r elul-survey felhasznalo@szerver-cim:/home/felhasznalo/
ssh felhasznalo@szerver-cim
cd elul-survey
```

## 2. Telepítés és indítás

Az alkalmazás a környezeti változókat egy `.env` fájlból olvassa be (a
[`dotenv`](https://www.npmjs.com/package/dotenv) csomaggal), így nem kell
minden indításkor hosszú parancsokat gépelni.

```bash
npm install
cp .env.example .env
```

Ezután nyisd meg a `.env` fájlt, és töltsd ki az értékeket (lásd lent a
részletes leírást). A `.env` fájl SOSE kerüljön a Git repóba — a
`.gitignore` már kizárja.

```bash
npm start
```

Az `EXPORT_KEY` a `.env`-ben egy titkos kulcs, amivel később letöltheted
az összes választ. Jegyezd fel valahova biztonságos helyre — ha üresen
hagyod, az export végpont egyszerűen ki lesz kapcsolva, és a fájlt
SSH-n/SCP-n keresztül tudod csak leszedni.

### Admin felület (`/admin`) — Pocket ID bejelentkezés

Az `/admin` oldal a kitöltések dátum-idejét listázza, és csak Pocket ID-n
(`auth.binjomin.hu`) keresztüli bejelentkezés után érhető el.

1. Hozz létre egy új OIDC kliens alkalmazást a Pocket ID admin felületén.
2. Állítsd be a **Callback URL**-t: `https://elul.binjomin.hu/auth/callback`.
3. Engedélyezd a `openid`, `email` és `profile` scope-okat.
4. A kapott Client ID-t és Client Secret-et írd be a `.env` fájl
   `POCKET_ID_CLIENT_ID` és `POCKET_ID_CLIENT_SECRET` sorába.
5. A `SESSION_SECRET` egy tetszőleges, hosszú, véletlenszerű string (a
   bejelentkezési session titkosításához) — generáld le
   (`openssl rand -hex 32`), és írd be a `.env`-be.
6. A `BASE_URL` mindig a nyilvánosan elérhető domain legyen (`https://elul.binjomin.hu`),
   ez alapján áll össze a callback URL.

Ezen `.env` változók (`SESSION_SECRET`, `POCKET_ID_ISSUER`,
`POCKET_ID_CLIENT_ID`, `POCKET_ID_CLIENT_SECRET`, `BASE_URL`) nélkül a
szerver induláskor hibával leáll — ez szándékos, hogy az admin felület ne
maradhasson véletlenül védelem nélkül.

Bejelentkezés után bármely, a Pocket ID-n sikeresen authentikált
felhasználó hozzáfér az `/admin` oldalhoz (nincs külön email-alapú
szűrés). Kijelentkezni a `/auth/logout` linkkel lehet.

## 3. Módosítások megjelenítése, újraindítás

Ehhez az alkalmazáshoz nincs buildlépés, ezért az `npm run build` nem
használható. A Node.js közvetlenül a `server.js` fájlt futtatja, és az
Express közvetlenül a `public/` mappából szolgálja ki a felületet.

### Kézi indítás esetén

Állítsd le a futó folyamatot a terminálban `Ctrl+C` billentyűkkel, majd
indítsd újra ugyanazzal a paranccsal:

```bash
npm start
```

Ha a terminál bezárása után is futtatni szeretnéd, használd inkább a PM2-t
(lásd a következő fejezetet).

### PM2 használata esetén

```bash
cd /home/felhasznalo/elul-survey
pm2 restart elul-survey
pm2 status
```

Mivel a `.env` fájlt maga az alkalmazás olvassa be induláskor, egy sima
`pm2 restart elul-survey` elég ahhoz, hogy a `.env`-ben módosított
értékek érvénybe lépjenek — nincs szükség `--update-env`-re.

Ezután töltsd újra az oldalt a böngészőben (`Ctrl+R`). Ha a régi felület
marad látható, próbáld meg a kényszerített frissítést (`Ctrl+Shift+R`).

## 4. Tartós futtatás (PM2)

```bash
npm install -g pm2
pm2 start server.js --name elul-survey
pm2 save
pm2 startup   # a kiírt parancsot futtasd le, hogy reboot után is induljon
```

## 5. Nginx reverse proxy + HTTPS

Ha van már domained/aldomained a szerveren, tegyél elé egy Nginx configot:

```nginx
server {
    listen 80;
    server_name kerdoiv.pelda.hu;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Utána Certbot-tal egy paranccsal jön a HTTPS:

```bash
sudo certbot --nginx -d kerdoiv.pelda.hu
```

## 6. Válaszok letöltése kitöltés után

Két lehetőség:

**A) Export végponttal (ha be van kapcsolva):**

```bash
curl "https://kerdoiv.pelda.hu/api/export?key=A_.ENV_FAJLBAN_LEVO_EXPORT_KEY" -o responses.json
```

**B) Közvetlenül a szerverről:**

```bash
scp felhasznalo@szerver-cim:/home/felhasznalo/elul-survey/data/responses.json .
```

## Adatformátum

Minden kitöltés így néz ki a `responses.json`-ban:

```json
{
  "submittedAt": "2026-08-31T14:22:03.512Z",
  "answers": { "q1": 7, "q2": 9, "...": "...", "q40": "NA" },
  "background": {
    "relationship": "közeli barát",
    "relationshipOther": null,
    "duration": "3–5 éve",
    "frequency": "hetente"
  },
  "openAnswers": { "q41": "...", "q42": "...", "q43": "..." }
}
```

## Megjegyzés az anonimitásról

Az alkalmazás maga nem ment semmilyen azonosítót. Ha teljesen biztos
akarsz lenni benne, hogy a szerver access logja se tartalmazzon
IP-címeket, kapcsold ki vagy anonimizáld az Nginx access logot
(`access_log off;`, vagy `$remote_addr` maszkolása).
