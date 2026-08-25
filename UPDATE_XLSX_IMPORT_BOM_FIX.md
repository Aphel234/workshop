# V9.2.1 – Excel-Import in Safari repariert

Beim Import über **„Ausgefüllte Vorlage importieren“** werden führende UTF-8-BOMs sowie unsichtbare Steuer- und Leerzeichen vor XML-Dateien jetzt vor dem Parsen entfernt.

Behoben wird damit insbesondere:

`workbook.xml.rels konnte nicht gelesen werden: XML declaration allowed only at the start of the document`

Zusätzlich liest der robuste Importer das Blatt **„Jahrgangsbelegung“** / **„Jahrgangsgrenzen“** mit ein, sodass harte Min-/Max-Vorgaben je Jahrgang beim Vorlagenimport erhalten bleiben.

Die Optimierungslogik wurde nicht verändert. Alle 15 Optimierer-Tests bleiben erfolgreich.
