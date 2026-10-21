# Einrichtung 11Sb_2627 (Frankfurt, Pseudonym-Anmeldung, Wochenplan)

## 1. Neues Firebase-Projekt (einmalig, Reihenfolge einhalten)
1. console.firebase.google.com → **Projekt hinzufügen** (z. B. „11Sb_2627“). Google Analytics **ausschalten**.
2. **Firestore Database → Datenbank erstellen**, Standort **`europe-west3` (Frankfurt)**, Produktionsmodus. Der Standort lässt sich später nicht mehr ändern.
3. **Storage → Los geht's**, Standort ebenfalls **`europe-west3`** (Blaze-Tarif nötig; Budgetwarnung unter „Nutzung und Abrechnung“ einrichten).
4. **Authentication → Anmeldemethode → E-Mail/Passwort** aktivieren (E-Mail-Link **nicht** nötig).
5. **Authentication → Einstellungen → Autorisierte Domains**: `fosbos-wm.github.io` eintragen.
6. **Firestore → Regeln**: Inhalt von `firestore.rules` einfügen, **Veröffentlichen**.
7. **Storage → Regeln**: Inhalt von `storage.rules` einfügen, **Veröffentlichen**.
8. **Projekteinstellungen → Allgemein → Meine Apps → Web-App** (</>) registrieren, „Firebase Hosting“ nicht aktivieren. Die angezeigte `firebaseConfig` kopieren.
9. **App Check** (Build → App Check): Web-App mit reCAPTCHA Enterprise/v3 registrieren, danach Erzwingung für Firestore/Storage einschalten (erst nach dem Test, siehe unten).
10. In der **Google-Cloud-Konsole → APIs & Dienste → Anmeldedaten** den Browser-API-Schlüssel auf den HTTP-Referrer `https://fosbos-wm.github.io/*` beschränken.
11. **Authentication → Einstellungen → Passwortrichtlinie**: Mindestlänge 6 (Schüler-PIN) belassen.

## 2. App mit dem Projekt verbinden
Nur die Datei **`firebase-config.js`** bearbeiten: die Werte aus Schritt 8 einsetzen (alles, was mit `HIER_` beginnt). Danach alle Dateien des Ordners ins neue GitHub-Repo hochladen (z. B. `11Sb_2627`, GitHub Pages aktivieren). Der QR-Code auf den Zugangskarten wird aus der Adresse der geöffneten Seite erzeugt – die Karten also von der echten Adresse (`https://fosbos-wm.github.io/11Sb_2627/`) aus erzeugen, nicht von einer lokalen Kopie.

## 3. Erstes Admin-Konto
1. Auf der Seite **Lehrkraft → Konto erstellen** mit dienstlicher E-Mail registrieren.
2. Firebase-Konsole → Firestore → Sammlung `users` → Dokument mit deiner UID: `role` = `admin`, `status` = `approved` setzen.
3. Neu anmelden. Weitere Lehrkräfte registrieren sich genauso und werden von dir in der Benutzerverwaltung freigeschaltet und zur Lehrkraft gemacht.

## 4. Schüler einrichten
1. Als Lehrkraft: **Benutzerverwaltung → Zugangskarten erzeugen**. Optional Namen eintragen (nur zum Ausdrucken der Lehrkraft-Liste, nichts wird gespeichert). Karten drucken und austeilen.
2. Schüler: QR-Code scannen oder Seite öffnen → **Erstmals einrichten** → Code, Pseudonym und PIN wählen.
3. Die Namensliste (CSV) vertraulich lokal aufbewahren, **nicht** in die App hochladen. Zum Anzeigen der Namen in deinem Browser in der Benutzerverwaltung **Namensliste (CSV) laden**.
4. PIN vergessen: Benutzerverwaltung → **Zurücksetzen** (Admin) löscht die Daten der Person. Danach das Anmeldekonto in Firebase → Authentication löschen (Adresse `pseudonym@11sb2627.invalid`), neue Karte ausgeben.

## 5. Schuljahresende
Als Admin in der Datenschutzerklärung: **Schuljahresende: Klasse löschen**. Danach Anmeldekonten (Authentication) und Dateien (Storage) in der Konsole löschen.

## 6. Test vor dem Einsatz
- Karte erzeugen, mit einem zweiten Browser einrichten, anmelden, abmelden, erneut anmelden.
- Zweiten Versuch mit demselben Code: muss abgelehnt werden.
- Lehnt Firebase die technische Adresse ab (Fehler `auth/invalid-email`), in `firebase-config.js` `APP_MAILDOMAIN` auf eine andere Domain setzen (z. B. `11sb2627.example.com`) **vor** dem ersten Schülerkonto.
- Erst wenn alles läuft, App Check erzwingen.

## 7. Inhalte aus dem alten Projekt (optional)
Siehe Export/Import mit `gcloud firestore export/import`. Schülerdaten nicht mitnehmen.

## 8. Wochenplan (neu in 11Sb_2627)
Alles liegt in `wochenplan.js` und `wochenplan.css`; die Firestore-Regeln dafür stehen am Ende von `firestore.rules` (Sammlungen `wp…`). Nach dem Veröffentlichen der Regeln:
1. Als Lehrkraft **Mein Wochenplan → Lernbausteine**: Stundenzeiten prüfen (⚙ Stundenzeiten, Voreinstellung 08:00 … 15:45 – an den echten Stundenplan anpassen).
2. **Einführungen, Gespräche & Termine**: feste Einführungen der Fächer, **Lernstandsgespräche** (fester Termin, von der Lehrkraft gesetzt) und Sprechzeiten anlegen (als Entwurf), **Lernbausteine** (Art u. a. Einführung, Lernbaustein, Check-out) anlegen, danach im Reiter **Klassenteam & Planung** „Woche für die Klasse freigeben“.
3. Schüler:innen sehen erst, was auf *live* steht. Entwürfe, Team-Chat und Team-Notizen sind nur für Lehrkräfte lesbar.
4. Test: mit einem Schülerkonto Lernbaustein in den Plan ziehen, Termin buchen (zweites Schülerkonto darf denselben Termin nicht mehr buchen können), Tutor-Anfrage senden und annehmen.

## Vertiefungs- / Übungsbausteine (Modulart „Übungsbaustein“, noch ohne Inhalt)

Im Unterrichtsplan gibt es **＋ Modul → Vertiefungs- / Übungsbaustein**. Der Katalog `uebungsbausteine/stationen/katalog.json` enthält 22 Übungen (je Thema höchstens 2 verschiedene Arten) für die 11. Klasse, geordnet nach **LB 1 › Thema › Art der Übung** und **LB 3 › Thema › Art der Übung**.

- LB 1: Gegenstand der Psychologie, Gegenstand der Pädagogik, Alltagstheorie und wissenschaftliche Theorie, Merkmale wissenschaftlicher Aussagen, Das Experiment.
- LB 3: Merkmale der Erziehung (Lehrtexte 1–4), Erziehungsstile nach Baumrind, Der Kindergarten, BayBEP.
- Pro Thema gibt es zwei Arten (u. a. Blockfall, Zuordnung, Memory, Theorievergleich, K-Prim, Wichtel-Schubkarrenrennen für 2–8 Teams), dazu je Lernbereich „Alle Bereiche gemischt“ (Tetris, Rennen). Die Auswahl steht im Katalog und lässt sich dort ändern.
- Die K-Prim-Aufgaben zu LB 3 stammen aus den Freitagstests (mit Fallvignette und Begründungen nach dem Prüfen); bei „Merkmale der Erziehung“ wählt die Nummer einen der vier Tests.

In „Modul bearbeiten“ kann ein ganzer Ordner (z. B. „LB 1 › Das Experiment“) oder eine einzelne Übung gewählt werden. Schüler:innen markieren einen Baustein selbst als erledigt (nur im Browser des Geräts, nichts wird übertragen).

## Karteikarten (Definitionen LB 1 bis LB 4)

Im Unterrichtsplan: **＋ Modul → Karteikarten (Definitionen)**. Der Ordner `karteikarten/` enthält die Seite (`index.html`) und die 120 Karten (`karten.js`, aus „Definitionen Lernbereich 11.1 bis 11.4“). Beim Anlegen wählst du, welche Lernbereiche (LB 1 bis LB 4) freigeschaltet sind. Vorderseite: Begriff, Rückseite: Definition. Schüler:innen bewerten „Gewusst“ oder „Nochmal üben“, der Lernstand bleibt nur im Browser. Neue Karten ergänzt du in `karten.js` (Felder: id, lb, g = Thema, b = Begriff, z = Zusatz, d = Definition).
