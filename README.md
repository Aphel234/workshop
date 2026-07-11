# Workshop-Zuteilung für GitHub Pages

Eine vollständig statische Browseranwendung für die Verteilung von bis zu **500 Teilnehmern auf 30 Workshops**. Sie benötigt keinen Python-Server und kann direkt über GitHub Pages veröffentlicht werden.

## Funktionen

- vier Wünsche pro Teilnehmer
- Klassenstufen und Schulformen
- Pflicht- und optionale Kurse
- Mindest- und Maximalbelegung
- automatische Zielbelegung für möglichst ausgeglichene absolute Kursgrößen
- feste Setzungen und Sperrungen
- Excel-Import und Excel-Export
- JSON-Sicherung und Wiederherstellung
- Kurslisten und Klassenlisten als PDF-ZIP
- lokale Speicherung im Browser
- nach dem ersten Laden offline nutzbar

## Datenschutz

GitHub Pages veröffentlicht **nur den Programmcode**. Teilnehmerdaten werden in `localStorage` des jeweiligen Browsers gespeichert und bei der Berechnung nicht an einen Server übertragen.

**Keine echten Schülerdaten in dieses Repository committen.** Beispieldaten im Repository müssen immer fiktiv bleiben. GitHub-Pages-Websites sind öffentlich erreichbar, auch wenn bestimmte kostenpflichtige GitHub-Pläne private Repositories erlauben.

Für dauerhafte Sicherungen regelmäßig **JSON sichern** oder **Excel exportieren**.

## Auf GitHub veröffentlichen

1. Auf GitHub ein neues Repository anlegen, beispielsweise `workshop-zuteilung`.
2. Den gesamten Inhalt dieses Ordners in das Repository hochladen.
3. Als Standardbranch `main` verwenden.
4. Im Repository **Settings → Pages** öffnen.
5. Unter **Build and deployment → Source** die Option **GitHub Actions** auswählen.
6. Den Workflow unter **Actions** abwarten.
7. Danach erscheint die Website typischerweise unter:
   `https://BENUTZERNAME.github.io/workshop-zuteilung/`

Der enthaltene Workflow führt Tests aus, baut die Anwendung und veröffentlicht den Ordner `dist`.

## Lokal testen

Benötigt Node.js 22 oder neuer.

```bash
npm ci
npm test
npm run build
npm run preview
```

Die bereits gebaute Version liegt zusätzlich im Ordner `dist`.

## Excel-Import

Die Anwendung erkennt die Blätter:

- `Workshops`
- `Personen`
- `Sperrungen`

Die Spaltenbezeichnungen entsprechen der bisherigen Excel-Vorlage, darunter `Workshop-ID`, `Klasse von`, `Durchführung`, `Person-ID`, `Erstwunsch` und `Feste Setzung`.

## Grenzen des Prototyps

Die Berechnung wird vollständig auf dem verwendeten Gerät ausgeführt. Bei 500 Teilnehmern und 30 Workshops kann sie je nach Gerät einige Sekunden dauern. Mehrbenutzerbetrieb und zentrale Speicherung sind in einer reinen GitHub-Pages-Version nicht enthalten.

## Lizenz

MIT
