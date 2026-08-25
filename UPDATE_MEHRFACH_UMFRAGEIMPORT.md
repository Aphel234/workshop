# Update V8 – Mehrfach-Umfrageimport

Neu im Bereich **Daten**: **Umfrage-Dateien importieren**.

## Ablauf
1. Mehrere `.xlsx`-Umfrageexporte gleichzeitig auswählen.
2. Die Anwendung liest das Blatt **Antworten** und erkennt Vorname, Nachname, Klasse sowie Wunsch 1–4.
3. Workshop-Zuordnungen prüfen. Eindeutige Zuordnungen werden automatisch erkannt; unsichere Namensähnlichkeiten müssen bestätigt werden.
4. Mögliche Dubletten prüfen.
5. **Teilnehmer übernehmen**.

## Erkennung
- Klassen wie `8aG` werden zu `Klasse 8a / Gymnasial`.
- Klassen wie `8aR` werden zu `Klasse 8a / Regional`.
- Kennungen vor dem Doppelpunkt, z. B. `Pro 6: Chor (...)`, werden bevorzugt gegen die Kursart-ID des Projekts abgeglichen.
- Wenn keine eindeutige Kennung passt, wird der bereinigte Workshopname verglichen.
- Schreibähnliche Namen werden nur vorgeschlagen und nicht ungefragt als neuer Workshop angelegt.

## Dubletten
Dubletten werden über **Vorname + Nachname + Klasse** erkannt.
- Standard: überspringen
- Bei bereits vorhandener Person: vorhandene Wünsche ersetzen (Person-ID und feste Setzung bleiben erhalten)
- Alternativ: ausdrücklich zusätzlich übernehmen

## IDs
- Neue Personen erhalten automatisch freie IDs wie `P001`, `P002`, …
- Eine ausdrücklich neu angelegte Kursart erhält automatisch eine freie Kursart-ID und Durchführungs-ID.
- Neue Kursarten werden mit den Standardwerten Klasse 7–12, Bildungsgang Alle, Min. 0, Max. 12 angelegt und sollten anschließend im Bereich Workshops geprüft werden.

## Gespeicherte Zuordnungen
Bestätigte Workshop-Zuordnungen werden lokal im Browser gespeichert. Sie werden nur wiederverwendet, wenn die Ziel-Kursart im aktuellen Projekt weiterhin vorhanden ist und zum gespeicherten Kursnamen passt.
