# Update: Kursanwahl-Vorlage

## Neu

Unter **Daten** gibt es jetzt:

- **Kursanwahl-Vorlage herunterladen**
- **Ausgefüllte Vorlage importieren**

Die Vorlage enthält:

- das Blatt `Anleitung`,
- das Blatt `Kursanwahl` mit 500 Eingabezeilen,
- das Blatt `Workshop-IDs` mit W01 bis W30,
- Dropdowns für Schulform und vier Wünsche.

Beim Import einer reinen Kursanwahl-Datei bleiben die bereits in der Anwendung eingetragenen Workshops und Sperrungen erhalten. Die Workshop-IDs in der Datei müssen mit den IDs der Anwendung übereinstimmen.

## Bestehende GitHub-Seite aktualisieren

Im Repository diese Dateien aus dem Updatepaket ersetzen bzw. neu hochladen:

- `dist/index.html`
- `dist/styles.css`
- `dist/sw.js`
- `dist/assets/app.js`
- `dist/Kursanwahl_Vorlage.xlsx`

Danach startet GitHub Pages automatisch eine neue Veröffentlichung. Wegen des Offline-Caches die Seite anschließend einmal vollständig neu laden:

- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`
