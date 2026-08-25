# Update V9.2 – Jahrgangsbelegung pro Kurs

Neu kann jede Durchführung eigene **harte Min-/Max-Grenzen je Jahrgang** erhalten.

## Bedienung

Unter **Workshops** auf **„Jahrgänge …“** klicken. Für jeden zugelassenen Jahrgang stehen zwei Felder zur Verfügung:

- **Minimum** – leer = keine Mindestvorgabe
- **Maximum** – leer = keine Höchstvorgabe

Beispiele:

- Jg. 8: Minimum `7`, Maximum leer → mindestens 7 Achtklässler
- Jg. 8: Minimum leer, Maximum `4` → höchstens 4 Achtklässler
- Jg. 8: Minimum `2`, Maximum `5` → zwischen 2 und 5 Achtklässler
- alle Felder leer → keine zusätzliche Jahrgangsvorgabe

## Optimierung

Eingetragene Jahrgangsgrenzen sind **harte Regeln**. Sie stehen vor Wunschqualität, weichen Regeln und Kursgrößenausgleich. Die gesamte Kurs-Minimal-/Maximalbelegung gilt zusätzlich. Unmögliche Vorgaben führen zu einer konkreten Fehlermeldung statt zu einer stillen Regelverletzung.

Auch manuelle Verschiebungen/Tauschvorschläge werden gegen die Jahrgangsgrenzen geprüft.

## Excel

Die dynamische Importvorlage und der Excel-Export enthalten zusätzlich das Blatt **`Jahrgangsbelegung`**:

`Durchführungs-ID | Jahrgang | Minimum | Maximum`

Leere Minimum-/Maximum-Zellen bedeuten keine Vorgabe. Das Blatt ist beim Import optional; ältere Dateien bleiben damit kompatibel.

## Tests

**15/15 Optimierer-Tests erfolgreich**, darunter:

- harte Min-/Max-Grenzen pro Jahrgang
- leere Grenzen ohne Zusatzregel
- verständliche Fehlermeldung bei nicht erfüllbarem Jahrgangsminimum
