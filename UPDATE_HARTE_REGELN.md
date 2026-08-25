# Update: Harte Regeln haben Vorrang

Diese Version verbessert die Reparatur harter Zuteilungsregeln.

## Was sich ändert

- Eine Regel mit **Modus „Hart“** wird als zwingende Nebenbedingung behandelt.
- Bei Regeln vom Typ **0 oder mindestens N** versucht die Optimierung zuerst, die betroffene Gruppe zu verstärken.
- Ist das nicht möglich, versucht sie, die zu kleine Gruppe vollständig aus der Durchführung zu entfernen.
- Bereits vorhandene weitere harte Verletzungen im selben Kurs blockieren die Reparatur nicht mehr automatisch. Die Optimierung darf Zwischenschritte durchführen, solange die harte Gesamtsituation nachweislich besser und kein abgebender Kurs schlechter wird.
- Mindest- und Maximalbelegung bleiben harte Grenzen.
- Feste Setzungen, Sperrungen sowie Klassen-/Bildungsgang-Zulässigkeit bleiben verbindlich.
- **Bevorzugte** Regeln dürfen eine Lösung weiterhin nicht blockieren.
- Kann eine harte Regel nach den Reparaturversuchen tatsächlich nicht erfüllt werden, wird die Optimierung abgebrochen und eine konkrete Fehlermeldung ausgegeben. Die Regel wird nicht stillschweigend ignoriert.

## Beispiel

Bei „Jahrgang – mindestens 2 – Hart“ gilt je Kurs und Jahrgang weiterhin:

- 0 Personen: erlaubt
- 1 Person: nicht erlaubt
- 2 oder mehr Personen: erlaubt

Hat ein Kurs gleichzeitig je eine Einzelperson aus Jahrgang 10 und 11, versucht die neue Logik beide Gruppen nacheinander zu reparieren. Die zweite Verletzung verhindert nicht mehr die Reparatur der ersten.

## Tests

Die Optimierer-Tests umfassen jetzt 12 Fälle. Alle 12 Tests laufen erfolgreich, darunter ein Regressionstest mit zwei gleichzeitig verletzten, aber reparierbaren harten Jahrgangsregeln.
