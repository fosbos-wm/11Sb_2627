# Einarbeitung (interaktive Seiten je Stunde)

Zu jeder Stunde gehört im Schritt „Einarbeitung ins Thema" eine interaktive Seite zum Durchklicken
(eine Seite pro Abschnitt, mit „Zurück" und „Weiter", Fortschrittsanzeige und Aufgaben).
Die Seite ist immer dieselbe (`player.html`). Nur der Inhalt liegt je Stunde in einer eigenen Datei:

    einarbeitung/inhalte/<Einheiten-ID>.json

Gibt es keine Datei, zeigt die Stunde nur den Bereich „Material" und den Button
„Ich habe die Einarbeitung abgeschlossen". Sobald die Datei im Repo liegt, erscheint
automatisch der Button „Einarbeitung starten". In der App muss dafür nichts geändert werden.

## Neue Einarbeitung anlegen

1. `inhalte/_vorlage.json` kopieren und in `<Einheiten-ID>.json` umbenennen (IDs siehe Tabelle unten).
2. Titel, Seiten, Texte und Aufgaben ersetzen.
3. `"entwurf": true` entfernen, sobald der Inhalt fertig ist (sonst steht oben ein Entwurf-Hinweis).
4. Datei ins Repo hochladen (Ordner `einarbeitung/inhalte`).

Als Beispiel für einen fertigen Inhalt dient `inhalte/pp01.json`.

## Aufbau der Datei

- `titel`, `einleitung` (optional): Überschrift und kurze Einführung.
- `abschnitte`: Liste der Seiten. Jede Seite hat `titel`, optional `kicker` (kleine Zeile darüber) und `bloecke`.
- `bloecke`: Inhalte und Aufgaben in der Reihenfolge, in der sie auf der Seite stehen.
- Text: `**fett**` mit doppelten Sternen. Ein Absatz, der mit `- ` beginnt, wird zur Liste.

## Inhaltsblöcke

| typ | Felder |
| --- | --- |
| `text` | `text` |
| `merke` | `text`, optional `label` (Standard „Merke", z. B. „Beispiel") |
| `situation` | `text`, optional `label` (Standard „Lernsituation") |
| `zitat` | `text`, optional `quelle` |
| `notizen` | `items` (Liste von Aussagen als Notizzettel), optional `beschriftung` |
| `schema` | `links`, `rechts`, `mitte` (zwei Zeilen), optional `beschriftung` |
| `fussnote` | `text` |
| `aufbau` | `zeilen`: Liste von `{label, farbe, text}`, optional `legende` (Liste von `{name, farbe}`) und `beschriftung` |

## Aufgabentypen

| typ | Felder |
| --- | --- |
| `mc` | `frage`, `optionen` (Liste), `richtig` (Nummer, Zählung ab 0), `erklaerung` |
| `lueckentext` | `titel`, `text` mit `{{Wort}}` für Lücken, `woerter` (Auswahl inkl. Ablenker) |
| `zuordnung` | `titel`, `paare`: Liste von `[Begriff, Erklärung]` |
| `sortieren` | `titel`, `kategorien`: Liste von `{name, items}`, jede Aussage wird einer Spalte zugeordnet |
| `kprim` | `stamm` (Situation und Auftrag), `aussagen`: Liste von `{text, richtig, erklaerung}` |
| `frei` | `frage`, `hinweis`, `muster` (Musterlösung erscheint nach eigener Antwort), optional `kriterien` (Liste von Selbstcheck-Punkten, die nach der Musterlösung abgehakt werden) |
| `reihenfolge` | `titel`, `hinweis`, `absaetze` (Liste in der **richtigen** Reihenfolge; die Seite mischt sie) |
| `strukturstreifen` | `titel`, `aufgabe`, `hinweis`, `felder`: Liste von `{titel, farbe, hilfe, muster}`; `farbe` = `pfirsich`, `blau`, `gelb`, `rot` oder `gruen` |

Ältere Dateien mit `text`, `merke` und `aufgaben` direkt im Abschnitt laufen weiter.

## Was gespeichert wird

- In der App: „Einarbeitung abgeschlossen" (mit Datum) und die Zahl der richtig gelösten Aufgaben, z. B. 5 von 7.
  Beides sehen die Person selbst und die Lehrkraft.
- Antworttexte (Freitext, Auswahl) bleiben nur im Browser der Person.
- Die Musterlösungen stehen in der Datei und sind damit im Quelltext lesbar. Die Aufgaben sind
  eine Übung mit Selbstkontrolle, keine Bewertung.

## Einheiten-IDs

| Lernbereich | ID | Thema |
| --- | --- | --- |
| LB 1 | `fa01` | Basiskurs Fachaufsatztraining: Aufbau eines Fachaufsatzes (am Beispiel Gegenstand der Psychologie) |
| LB 1 | `pp01` | Gegenstand der Psychologie: Erleben und Verhalten |
| LB 1 | `pp02` | Wissenschaftliche und alltagspsychologische Aussagen |
| LB 1 | `pp03` | Das Experiment als wissenschaftliche Methode |
| LB 1 | `pp1a1` | Gegenstand der Pädagogik: Erziehungswissenschaft, Erziehungspraxis, Erziehung und Bildung |
| LB 1 | `pp1a2` | Ziele und Handlungen der Erziehung |
| LB 1 | `pp1a3` | Beziehung zwischen Erziehenden und Zu-Erziehenden |
| LB 1 | `pp1a4` | Einrichtungen der Erziehung |
| LB 3 | `pp06` | Mündigkeit nach Roth |
| LB 3 | `pp07` | Bildungs- und Erziehungsbereiche des BayBEP |
| LB 2 | `pp2a1` | Speichersysteme des Langzeitgedächtnisses nach Markowitsch |
| LB 2 | `pp10` | Emotion: Begriff, Komponenten und Emotionsregulation |
| LB 2 | `pp11` | Motivation und Attributionstheorie nach Weiner |
| LB 4 | `pp15` | Sozial-kognitive Theorie nach Bandura |
| LB 4 | `pp16` | Medien als Einflussfaktor für Lernprozesse |

`fa01`, `pp01`, `pp02` und `pp03` sind die Einstiegsinhalte, alle anderen gehören zum Abschlussprüfungs-Training.
