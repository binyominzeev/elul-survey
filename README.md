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

```bash
npm install
EXPORT_KEY=$(openssl rand -hex 16) PORT=3000 npm start
```

Az `EXPORT_KEY` egy titkos kulcs, amivel később letöltheted az összes
választ. Jegyezd fel valahova biztonságos helyre — ha kihagyod, az
export végpont egyszerűen ki lesz kapcsolva, és a fájlt SSH-n/SCP-n
keresztül tudod csak leszedni.

## 3. Módosítások megjelenítése, újraindítás

Ehhez az alkalmazáshoz nincs buildlépés, ezért az `npm run build` nem
használható. A Node.js közvetlenül a `server.js` fájlt futtatja, és az
Express közvetlenül a `public/` mappából szolgálja ki a felületet.

### Kézi indítás esetén

Állítsd le a futó folyamatot a terminálban `Ctrl+C` billentyűkkel, majd
indítsd újra ugyanazzal a paranccsal:

```bash
EXPORT_KEY=IDE_A_SAJAT_KULCSOD PORT=3000 npm start
```

Ha a terminál bezárása után is futtatni szeretnéd, használd inkább a PM2-t
(lásd a következő fejezetet).

### PM2 használata esetén

```bash
cd /home/felhasznalo/elul-survey
pm2 restart elul-survey
pm2 status
```

Ha az `EXPORT_KEY` vagy más környezeti változó is módosult, indítsd újra
az új értékek átadásával:

```bash
EXPORT_KEY=IDE_A_SAJAT_KULCSOD PORT=3000 pm2 restart elul-survey --update-env
```

Ezután töltsd újra az oldalt a böngészőben (`Ctrl+R`). Ha a régi felület
marad látható, próbáld meg a kényszerített frissítést (`Ctrl+Shift+R`).

## 4. Tartós futtatás (PM2)

```bash
npm install -g pm2
EXPORT_KEY=ide-a-sajat-kulcsod pm2 start server.js --name elul-survey
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
curl "https://kerdoiv.pelda.hu/api/export?key=IDE_A_SAJAT_KULCSOD" -o responses.json
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
