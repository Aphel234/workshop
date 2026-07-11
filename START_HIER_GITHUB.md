# Start hier: Veröffentlichung auf GitHub Pages

## Ohne Kommandozeile

1. Auf GitHub ein neues, leeres Repository anlegen, zum Beispiel `workshop-zuteilung`.
2. In diesem Ordner **alle Dateien und Ordner außer `node_modules`** auswählen und in das Repository hochladen.
3. Darauf achten, dass der Branch `main` heißt.
4. Im Repository **Settings → Pages** öffnen.
5. Unter **Build and deployment → Source** die Auswahl **GitHub Actions** treffen.
6. Den Reiter **Actions** öffnen und warten, bis „GitHub Pages bereitstellen“ grün abgeschlossen ist.
7. Unter **Settings → Pages** erscheint anschließend die Adresse der Anwendung.

## Wichtig zum Datenschutz

- Keine ausgefüllten Excel-, JSON- oder PDF-Dateien mit echten Namen in das Repository hochladen.
- Die Anwendung speichert Eingaben im Browser des verwendeten Geräts.
- Vor einem Gerätewechsel über **JSON sichern** oder **Excel exportieren** eine Sicherung anlegen.

## Aktualisieren

Geänderte Dateien wieder in den Branch `main` hochladen. GitHub Actions baut und veröffentlicht die Seite automatisch neu.
