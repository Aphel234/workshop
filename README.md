# Workshop-Zuteilung für GitHub Pages

Statische Browseranwendung für bis zu **500 Teilnehmer und 30 Durchführungen**. Die Berechnung läuft vollständig im Browser; ein Python-Server ist nicht erforderlich.

## Neu in dieser Version

### Kursart und Durchführung sind getrennt

Ein Wunsch bezieht sich auf eine **Kursart**. Mehrere Gruppen derselben Kursart verwenden dieselbe Kursart-ID.

Beispiel:

- Durchführungs-ID `W10A` · Kursart-ID `DRACH` · Drachenboot · Gruppe A
- Durchführungs-ID `W10B` · Kursart-ID `DRACH` · Drachenboot · Gruppe B

In der Kursanwahl erscheint nur `DRACH · Drachenboot`. Wird ein Teilnehmer anschließend Gruppe A oder B zugeteilt, zählt beides als derselbe Erst-/Zweit-/Dritt-/Viertwunsch.

Im Workshopbereich erzeugt der **＋-Knopf** eine weitere Durchführung derselben Kursart.

### Mindestgruppe Jahrgang + Bildungsgang

Unter **Übersicht → Mindestgruppe Jahrgang + Bildungsgang** kann global z. B. `2`, `3` oder mehr eingestellt werden.

Regel pro Durchführung:

- eine Kombination wie `Jahrgang 9 / Regional` kommt gar nicht vor, **oder**
- sie muss mindestens die eingestellte Personenzahl erreichen.

Jede Durchführung kann den globalen Wert überschreiben:

- leeres Feld = globalen Wert verwenden
- `0` = Regel für diese Durchführung ausschalten
- `2`, `3`, `4` … = eigener Wert

Wenn die Regel mit Wünschen, Kapazitäten, festen Setzungen und Sperrungen nicht erfüllt werden kann, erzeugt die Anwendung keine stillschweigend falsche Lösung, sondern eine verständliche Fehlermeldung.

## Weitere Funktionen

- vier Wünsche pro Teilnehmer
- Klassenstufen und Bildungsgänge
- Pflicht- und optionale Durchführungen
- Mindest- und Maximalbelegung
- automatische Zielbelegung und Belastungsausgleich
- feste Setzungen auf eine konkrete Durchführung
- Sperrungen für konkrete Durchführungen
- dynamische Excel-Kursanwahl-Vorlage mit den aktuell angelegten Kursarten
- Excel-Import und Excel-Export
- JSON-Sicherung und Wiederherstellung
- Kurslisten und Klassenlisten als PDF-ZIP
- lokale Speicherung im Browser
- Offline-Nutzung nach dem ersten Laden

## Excel-Kursanwahl

Unter **Daten → Vorlage mit aktuellen Kursarten herunterladen** wird eine Excel-Datei erzeugt.

Die vier Wunschspalten enthalten **Kursart-IDs**, keine Durchführungs-IDs. Eine feste Setzung darf dagegen eine konkrete Durchführungs-ID enthalten.

Alte Dateien bleiben kompatibel: Überschriften wie `Schulform` und `Workshop-ID` werden weiterhin erkannt.

## Datenschutz

GitHub Pages veröffentlicht nur den Programmcode. Teilnehmerdaten werden im Browser gespeichert und für die Berechnung nicht an GitHub übertragen.

**Keine echten Schülerdaten als Excel-, JSON- oder PDF-Dateien in das GitHub-Repository hochladen.**

## Auf GitHub veröffentlichen

1. Repository anlegen bzw. vorhandenes Repository öffnen.
2. Den Inhalt dieses Ordners hochladen.
3. Unter **Settings → Pages → Source** `GitHub Actions` auswählen.
4. Der enthaltene Workflow veröffentlicht den bereits gebauten Ordner `dist` direkt.
5. Unter **Actions** auf den grünen Abschluss warten.

Es ist auf GitHub keine `npm`-Installation notwendig.

## Technischer Hinweis

Der Optimierer verwendet eine schnelle Flussoptimierung für Wünsche, Mindestbelegungen und Kapazitäten. Die Kohortenregel wird anschließend unter Erhalt der Kursmindestgrößen repariert und abschließend geprüft. Kann keine regelkonforme Verteilung hergestellt werden, wird die Berechnung mit einer konkreten Meldung abgebrochen.

Die Tests decken u. a. ab:

- zwei Durchführungen derselben Kursart,
- identische Wunschwertung für Gruppe A/B,
- Kohortenminimum,
- nicht erfüllbare Kohortenregeln,
- Pflicht- und optionale Durchführungen.

## Lizenz

MIT

## Berechnungsqualität

Unter **Übersicht → Einstellungen** kann zwischen drei Qualitätsstufen gewählt werden:

- **Schnell** – 1 Berechnung
- **Standard** – 6 unterschiedliche Startvarianten; empfohlen
- **Gründlich** – 24 unterschiedliche Startvarianten

Die Anwendung behält automatisch die beste gültige Verteilung. Harte Regeln sowie Mindest- und Maximalbelegungen werden in jeder Variante zwingend eingehalten.

## Harte Regeln (Version 2.2)

Als **Hart** markierte Zuteilungsregeln werden vor Wunschqualität und Belastungsausgleich behandelt. Die Optimierung versucht kleine Regelgruppen aktiv zu verstärken oder vollständig umzuverteilen. Eine wirklich nicht erfüllbare harte Regel führt zu einer verständlichen Fehlermeldung und wird nicht automatisch ignoriert.

## Mehrfach-Umfrageimport
Unter **Daten → Umfrage-Dateien importieren** können mehrere Excel-Umfrageexporte gemeinsam eingelesen werden. Die App gleicht Workshopkennungen und Namen mit den Kursarten im aktuellen Projekt ab, zeigt unsichere Treffer zur Prüfung und erkennt mögliche Dubletten über Vorname + Nachname + Klasse. Person-IDs werden automatisch vergeben.

## Jahrgangsbelegung pro Kurs (Version 2.3)

In **Workshops** gibt es pro Durchführung den Knopf **„Jahrgänge …“**. Dort können für jeden zugelassenen Jahrgang getrennte harte Mindest- und Höchstzahlen festgelegt werden.

- Minimum leer = keine Mindestvorgabe
- Maximum leer = keine Höchstvorgabe
- Minimum `7`, Maximum leer = mindestens 7 Schüler dieses Jahrgangs müssen in diesen Kurs
- Minimum leer, Maximum `4` = höchstens 4 Schüler dieses Jahrgangs dürfen in diesen Kurs
- Minimum `2`, Maximum `5` = zwischen 2 und 5 Schüler dieses Jahrgangs

Diese Grenzen sind **hart** und gelten zusätzlich zur gesamten Mindest-/Maximalbelegung, zu Sperrungen, festen Setzungen und anderen harten Regeln. Ist eine Vorgabe unmöglich, wird keine regelwidrige Lösung akzeptiert; die Anwendung zeigt eine konkrete Fehlermeldung.

Die Excel-Vorlage sowie Excel-Import/-Export unterstützen dafür das Blatt **`Jahrgangsbelegung`** mit den Spalten `Durchführungs-ID | Jahrgang | Minimum | Maximum`.
