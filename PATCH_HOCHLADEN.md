# V9.2 auf GitHub aktualisieren

Für die bestehende GitHub-Pages-Version müssen nur diese Dateien aus dem Patch in `dist` ersetzt werden:

- `dist/index.html`
- `dist/styles.css`
- `dist/sw.js`
- `dist/assets/app.js`
- `dist/assets/table-sort.js`

Der Workflow unter `.github/workflows/pages.yml` muss nicht geändert werden.

Danach:

1. **Commit changes**
2. unter **Actions** warten, bis der Lauf grün ist
3. die Seite auf dem Mac mit **⌘ + Umschalt + R** neu laden

Neu ist **Jahrgangsbelegung pro Kurs** über den Knopf **„Jahrgänge …“** in der Workshop-Tabelle.
