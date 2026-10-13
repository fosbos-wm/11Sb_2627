# Lernübersichten (Whiteboard mit fünf Bausteinen)

`lernuebersichten.json` enthält alle Lernübersichten als Liste. In der App (Lernressourcen → Ordner „Lernübersichten“)
legt der Knopf „⬇ Lernübersichten aus Datei bereitstellen“ jeden Eintrag als Whiteboard an (bereits vorhandene werden überschrieben).

## Felder je Eintrag

| Feld | Pflicht | Bedeutung |
| --- | --- | --- |
| `id` | ja | eindeutiger Schlüssel, z. B. `f12-freud-instanzenmodell` (nie ändern, sonst entsteht ein neues Whiteboard) |
| `thema` | ja | Titel |
| `unter` | nein | Untertitel (Lernbereich, Theorie) |
| `datum` | nein | nur F12Sb: Datum der Stunde im Zeitstrahl (`2026-10-02`), an die die Lernübersicht gehängt wird |
| `modul` | nein | nur Module: Titel des Moduls (oder Liste von Titeln), an das die Lernübersicht gehängt wird |
| `frage` | ja | ① Kernfrage |
| `wissen` | ja | ② Kernwissen: 1 bis 3 Karten `{c: Farbe, text}`; Farben: gelb, orange, rosa, lila, blau, tuerkis, gruen, grau |
| `mitte`, `begriffe` | nein | ③ Zusammenhänge: Begriff in der Mitte (Standard „Ich“) und drei Begriffe außen |
| `zusammen` | ja | ③ Zusammenhang in einem Satz |
| `fall` | ja | ④ Beispiel oder Fall |
| `anker` | ja | ⑤ Lernanker: bis zu 3 Sätze „Ich kann …“ |

## Zuordnung ändern ohne Datei

Lehrkräfte können auf jeder Stunden- bzw. Modulkarte über „⇄ zuordnen“ eine vorhandene Lernübersicht auswählen oder die Zuordnung lösen.
