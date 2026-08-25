V8.1 – automatisches Kursangebot aus Umfragen

- Umfrageimport funktioniert auch in einem leeren Projekt ohne vorher angelegte Workshops.
- Kursangebote werden aus Wunsch 1–4 gesammelt.
- Kennungen wie „Pro 6“ werden als stabiler Schlüssel verwendet und automatisch als Kursart-ID übernommen.
- Gleiche Pro-Kennung wird auch bei abweichender Schreibweise des Namens als ein Kurs behandelt.
- Ohne eindeutige Kennung muss eine neue Kursart bestätigt werden.
- Vorhandene Projekt-Kursarten werden weiterhin per ID, Name oder Namensähnlichkeit abgeglichen.
- UTF-8-BOM in workbook.xml.rels wird vor dem XML-Parsing entfernt (Safari-Fix).
- 8aG/8aR bleibt als Klassenbezeichnung erhalten; Bildungsgang wird zusätzlich erkannt.

Für GitHub Pages den gesamten Inhalt von dist ersetzen, committen, Actions abwarten und dann Cmd+Shift+R.
