# Update: Wunschpriorität, kleine Kurse und Word-Listen

## 1. Wunschpriorität deutlich verschärft

Die Optimierung behandelt die vier Wünsche jetzt bewusst als abgestufte Qualitätsklassen:

1. Erst- und Zweitwünsche stehen im Mittelpunkt.
2. Drittwünsche werden nur als Notlösung verwendet.
3. Viertwünsche sind die absolute Notkategorie.
4. Zuteilungen außerhalb der Wünsche bleiben noch schlechter und sind nur möglich, wenn dies ausdrücklich aktiviert wurde.

Ein zusätzlicher Viertwunsch kann nicht mehr durch viele kleine Vorteile beim Kursgrößenausgleich „billig“ werden. Bei mehreren Qualitätsläufen wird außerdem die Lösung bevorzugt, die zuerst weniger Viert- und Drittwünsche hat.

Unvermeidbare Dritt- und Viertwünsche erhalten zusätzlich eine Verteilungsstrafe. Dadurch werden sie bei ansonsten gleichwertigen Lösungen möglichst nicht auf einzelne Kurse konzentriert.

In der Ergebnisübersicht werden jetzt zusätzlich angezeigt:
- Max. Drittwünsche / Kurs
- Max. Viertwünsche / Kurs

## 2. Kleine Kurse erhalten ihre Maximalgröße als Ziel

Die vorhandene Ausgleichsschwelle wird weiterverwendet. Sie heißt in der Oberfläche jetzt:

**Kleine Kurse bis Maximalgröße (Ausgleichsschwelle)**

Beispiel bei Schwelle 10:
- Max. 5 -> Ziel 5
- Max. 8 -> Ziel 8
- Max. 10 -> Ziel 10
- größere Kurse werden mit den verbleibenden Teilnehmern untereinander nach absoluter Kursgröße ausgeglichen.

Mindest- und Maximalbelegung bleiben harte Grenzen. Reichen insgesamt nicht genügend Teilnehmer aus, werden zuerst die Mindestbelegungen aller stattfindenden Kurse gesichert.

## 3. Word-Export

Unter **Listen** gibt es zusätzlich:
- Kurslisten als Word-ZIP
- Klassenlisten als Word-ZIP

Jeder Kurs bzw. jede Klasse wird als eigene `.docx`-Datei erzeugt und anschließend als ZIP heruntergeladen.

### Kursliste
Nr. · Nachname · Vorname · Klasse · Zuteilungsart

### Klassenliste
Nr. · Nachname · Vorname · Workshop · Zuteilungsart

Die DOCX-Dateien werden vollständig lokal im Browser erzeugt. Word muss für die Erzeugung nicht installiert sein.

## Technische Prüfung

- 11 Optimierer-Tests erfolgreich.
- Expliziter Test: Drittwunsch wird gegenüber Viertwunsch bevorzugt.
- Expliziter Test: kleiner Kurs Max. 5 erhält Ziel 5, obwohl die größeren Kurse rechnerisch nur Ziel 2 erhalten.
- 300-Personen-Test: bisher 23 Viertwünsche -> neue Optimierung 2 Viertwünsche; alle 300 Personen bleiben zugeteilt.
- DOCX-Struktur mit Word/LibreOffice-kompatiblem OOXML erzeugt und visuell gerendert geprüft.
