# KONTIVOCARD – Website

Statische Website für [kontivocard.de](https://kontivocard.de), gehostet über GitHub Pages.
Kein Build-Schritt nötig: Dateien ändern, committen, pushen – fertig.

## Struktur

```
index.html            Startseite
impressum.html        Impressum
datenschutz.html      Datenschutzerklärung
404.html              Fehlerseite (GitHub Pages nutzt sie automatisch)
robots.txt            Hinweise für Suchmaschinen
sitemap.xml           Seitenliste für Suchmaschinen
CNAME                 Eigene Domain für GitHub Pages (nicht löschen!)
.nojekyll             GitHub Pages liefert die Dateien unverändert aus

assets/
  css/main.css            Alle Styles (Startseite + Rechtstexte)
  js/main.js              Mobilmenü + Kontaktformular (Formspree)
  js/review-card-3d.js    3D-Bewertungskarte im Hero-Bereich
  vendor/three.r128.min.js  three.js r128 (lokal, statt CDN)
  fonts/                  Schrift „Inter“ (lokal, statt Google Fonts)
  img/                    Logo, Favicon, App-Icons
```

## Häufige Anpassungen

- **Texte der Startseite:** direkt in `index.html`.
- **Farben/Abstände:** CSS-Variablen ganz oben in `assets/css/main.css` (`--green`, `--gold`, …).
- **3D-Karte:** Einstellungen im `CONFIG`-Block oben in `assets/js/review-card-3d.js`.
  - Echter QR-Code: Bild nach `assets/img/` legen und im Hero `data-qr-src="assets/img/qr-code.png"` ergänzen.
  - Fußzeile auf der Karte: Attribut `data-footer-text` im Hero.
- **Kontaktformular:** Ziel-URL steht im `action`-Attribut des Formulars in `index.html` (Formspree).

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Datenschutz-Hinweis

Die Seite lädt keine Ressourcen von Drittservern (Schrift und three.js liegen lokal).
Nur beim Absenden des Kontaktformulars werden Daten an Formspree übertragen.
Wer neue externe Dienste einbindet, muss die `datenschutz.html` entsprechend ergänzen.
