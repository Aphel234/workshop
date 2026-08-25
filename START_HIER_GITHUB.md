# Start hier – GitHub Pages Update

## Wenn die Seite bereits läuft

Für dieses Update genügt es, die Dateien aus dem Patchpaket in dein Repository hochzuladen und vorhandene Dateien zu ersetzen.

Geändert werden insbesondere:

- `dist/index.html`
- `dist/styles.css`
- `dist/sw.js`
- `dist/assets/app.js`
- `dist/Kursanwahl_Vorlage.xlsx`

Danach **Commit changes**. Der vorhandene GitHub-Pages-Workflow veröffentlicht automatisch neu.

Nach dem grünen Haken unter **Actions** die Website einmal hart neu laden:

- Mac: `⌘ + Umschalt + R`

Der neue Service-Worker verwendet einen neuen Cache-Namen, damit die alte Version ersetzt wird.

## Neue Bedienung

### Zwei gleiche Kurse

Eine Kursart hat eine gemeinsame **Kursart-ID**. Mehrere tatsächliche Gruppen haben jeweils eine eigene **Durchführungs-ID**.

Beispiel:

- Kursart-ID: `DRACH`
- Durchführungs-ID: `W10A`, Gruppe A
- Durchführungs-ID: `W10B`, Gruppe B

Die Schüler wählen nur `DRACH`. Das Programm verteilt später automatisch zwischen A und B.

Im Bereich **Kursarten & Durchführungen** erzeugt der **＋-Knopf** direkt eine weitere Gruppe derselben Kursart.

### Mindestgruppe Jahrgang + Bildungsgang

Unter **Übersicht** gibt es den globalen Parameter. Empfohlen sind z. B. `2` oder `3`.

Im Workshopbereich kann jede Durchführung den Wert überschreiben:

- leer = global
- 0 = aus
- ab 2 = eigener Mindestwert

## Datenschutz

Ausgefüllte Schülerdateien weiterhin nur über die laufende Anwendung importieren. Nicht in das GitHub-Repository hochladen.
