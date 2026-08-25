# Update: flexible Regeln und Kursdetail

## Neu in dieser Version

### Einfache Steuerung des Kursgrößenausgleichs
Auf der Übersicht gibt es jetzt vier verständliche Stufen:

- **Aus (0)** – Wünsche haben praktisch allein Vorrang.
- **Leicht (10)** – Ausgleich vor allem zwischen ähnlich guten Wunschlösungen.
- **Mittel (50)** – große Kurse werden sichtbar gleichmäßiger.
- **Stark (100)** – gleichmäßige Kursgrößen bekommen deutlich mehr Gewicht.

Mit **„Ausgleich erst ab Maximalgröße“** kann festgelegt werden, welche Kurse überhaupt miteinander ausgeglichen werden. Empfehlung: **10–12**. Ein Kurs mit Maximum 5 bleibt dadurch bewusst klein.

### Erweiterte Zuteilungsregeln
Der Bereich ist standardmäßig eingeklappt. Regeln können angelegt werden als:

- Pro Klasse: 0 oder mindestens N Personen je Durchführung
- Pro Jahrgang: 0 oder mindestens N Personen je Durchführung
- Jahrgang + Bildungsgang: 0 oder mindestens N Personen je Durchführung
- Pro Jahrgang soll mindestens ein Bildungsgang mit N Personen vertreten sein

Jede Regel kann **Bevorzugt** oder **Hart** sein.

- **Bevorzugt** ist der Standard. Die Optimierung versucht die Regel zu verbessern, darf aber abweichen, wenn Wünsche/Kapazitäten sonst deutlich schlechter würden.
- **Hart** muss erfüllt werden; andernfalls wird keine scheinbar gültige Lösung ausgegeben.

### Kompakte Ergebnisübersicht
Die vielen Kohortenangaben sind aus der Kursübersicht entfernt. Angezeigt werden nur noch:

- Kurs
- Belegung
- Ziel
- Minimum / Maximum
- Wunschqualität
- Regelstatus
- Kursstatus

### Kursdetail und manuelle Nachbearbeitung
Auf **Details** klicken oder direkt eine Kurszeile anklicken. Dort gibt es:

- Zugeordnete Personen
- Alle Anwähler des Kurses inkl. Wunschstufe und tatsächlicher Zuteilung
- Regeldetails nur bei Bedarf
- Vorheriger / nächster Kurs
- Person in einen anderen zulässigen Kurs verschieben
- Aktuelle Zuordnung festsetzen
- Letzte manuelle Änderung rückgängig machen
- einfache Tauschvorschläge, wenn zwei Personen dadurch insgesamt bessere Wünsche erhalten

Bei manuellen Verschiebungen werden Mindestbelegung, Maximum, Klasse, Bildungsgang, Sperrungen und harte Regeln geprüft.

## GitHub aktualisieren
Im vorhandenen Repository den Inhalt des Patch-ZIPs **innerhalb des Ordners `dist`** ersetzen/ergänzen und committen.

Danach:

1. Unter **Actions** auf den grünen Haken warten.
2. Website öffnen.
3. Auf dem Mac einmal **⌘ + Umschalt + R** drücken.

Der Service-Worker hat eine neue Cache-Version, damit die neue Oberfläche geladen wird.
