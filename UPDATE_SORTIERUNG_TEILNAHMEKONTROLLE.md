# Update V9 – Sortierung & Teilnahmekontrolle

## Sortierbare Tabellen

In den Bereichen **Workshops** und **Teilnehmer** können die Spaltenüberschriften angeklickt werden.

- erster Klick: aufsteigend
- zweiter Klick: absteigend
- die Sortierung ändert nur die Ansicht, nicht die gespeicherten Daten oder die Optimierung

## Teilnahmekontrolle Umfrage

Unter **Daten** gibt es den neuen Button **„Teilnahmekontrolle Umfrage“**.

Importiert werden eine oder mehrere XLSX-Dateien mit den drei Spalten:

- Vorname
- Nachname
- Klasse

Die Klasse wird immer direkt bei der Person angezeigt, z. B. `8aG` oder `8aR`.

Die Anwendung vergleicht diese Soll-Liste mit den aktuell in der Anwendung vorhandenen Teilnehmern und unterscheidet:

- Teilgenommen
- Zu prüfen
- Fehlt
- Nur in Umfrage/Teilnehmerliste
- Doppelte Eingaben

Kleine Schreibabweichungen innerhalb derselben Klasse werden als möglicher Treffer vorgeschlagen und müssen bestätigt oder verworfen werden.

## Dubletten

Erkannt werden:

- exakt doppelte Schüler in den Soll-Listen
- exakt doppelte Teilnehmer in der Anwendung
- sehr ähnliche Namen innerhalb derselben Klasse als mögliche Dubletten

Exakte Dubletten in der Soll-Liste erhöhen die Soll-Zahl nicht künstlich, werden aber als Warnung ausgewiesen.

## Export

Die Liste **„Fehlt“** kann direkt als `Fehlende_Schueler_Umfrage.xlsx` exportiert werden.
