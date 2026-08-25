# Update: Kursarten, Mehrfachdurchführungen und Kohortenregel

## Enthalten

1. **Mehrere Durchführungen derselben Kursart**
   - Wünsche beziehen sich auf Kursart-ID.
   - Gruppen A/B/C zählen als derselbe Wunsch.
   - Feste Setzungen und Sperrungen bleiben auf konkrete Durchführungen bezogen.

2. **Mindestgruppe Jahrgang + Bildungsgang**
   - globaler Parameter
   - optionaler Override je Durchführung
   - Regel: 0 Personen oder mindestens N Personen je Jahrgang/Bildungsgang und Durchführung

3. **Neue Kursanwahl-Vorlage**
   - Wunsch-Dropdowns enthalten Kursarten.
   - konkrete Durchführungen werden nur für feste Setzungen benötigt.

## Update einer bestehenden GitHub-Seite

Die Dateien im Ordner `dist` aus dem Patch in das bestehende Repository hochladen und ersetzen. Danach committen und auf den grünen GitHub-Actions-Lauf warten.

Anschließend die veröffentlichte Seite mit `⌘ + Umschalt + R` neu laden.

## Bestehende Browserdaten

Die Anwendung liest weiterhin den bisherigen lokalen Speicherstand. Alte Workshops werden automatisch so interpretiert, dass ihre bisherige Workshop-ID zugleich ihre Kursart-ID ist. Erst wenn eine zweite Durchführung angelegt wird, teilen sich beide Gruppen dieselbe Kursart-ID.
