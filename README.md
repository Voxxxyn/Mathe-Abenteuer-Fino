# Funkelpfad – Dein Mathe-Abenteuer · Version 2

Eine vollständige, lokal arbeitende Mathe-App für Grundschulkinder. Fino, der Fuchs, begleitet das Kind durch fünf Welten mit je drei Leveln. Die App funktioniert ohne Konto, Werbung, externe Fonts, Bibliotheken oder APIs. Alle Illustrationen und Icons sind eigens für dieses Projekt erstellt. Sounds entstehen lokal über die Web Audio API.

## Version 2.0.0 – auf der bestehenden V1 aufgebaut

Fino bleibt der Fuchs. Die Startseite, fünf Welten, Abenteuerkarte, drei Level je Welt, Sterne, Schätze und alle bisherigen Plus-/Minus-Funktionen bleiben bestehen. Die stabile V1-Basis ist Commit `f4e82ebf5670f323a6bf7196e3b417f687ee9965` in `Voxxxyn/Mathe-Abenteuer-Fino`. V2 wird auf `v2-development` entwickelt; der Pull Request wird separat vom Nutzer geprüft und gemergt.

- **Kindgerechter Wechsel:** Unter der Hauptnavigation zwischen „Plus & Minus“ und „Mal & Geteilt“ wechseln. Die Abenteuerkarte bleibt jederzeit erreichbar.
- **Einzelaufgaben:** Reihen 1–10, einzeln, mehrere oder alle gemischt. Multiplikation und Division lassen sich getrennt einschalten. Division verwendet ausschließlich ganzzahlige Aufgaben des kleinen Einmaleins, ohne Nullteiler und ohne Rest. Standard ist weiterhin die integrierte Zahlentastatur; Multiple Choice bleibt optional.
- **Reihentraining:** Zehn Aufgaben einer ausgewählten Reihe, wahlweise Mal oder Geteilt. Große echte Eingabefelder mit `inputmode="numeric"` verwenden bewusst die native Systemtastatur. Mit ✓ oder Enter bestätigen; bei richtiger Antwort wird das nächste Feld sofort fokussiert. Fehler können direkt korrigiert werden. Pausieren und Fortsetzen erhält die erledigten Zeilen.
- **Sanfte Anpassung:** Fehler und längere Bearbeitungszeiten gewichten schwierige Reihen maximal um Faktor 1,65 stärker. Bei einer einzelnen Reihe mit nur zehn verfügbaren Aufgaben werden ältere Aufgaben nach Bedarf erneut verwendet; eine unmittelbare Wiederholung wird vermieden.
- **Darstellung:** Hell, Dunkel oder System. Die eigenständige dunkle Palette erhält Fino und die Weltillustrationen. Der Wechsel wirkt sofort und bleibt gespeichert.
- **Tempo:** Ohne Zeitdruck bleibt Standard. Countdown mit 1, 2, 5 oder 10 Minuten; Aufgabenanzahl ist dabei unbegrenzt bis zum Ablauf. Stoppuhr mit der gewählten Rundenlänge, bei „unbegrenzt“ zehn Aufgaben. Ganze Reihen unterstützen normal und Stoppuhr; ein Countdown wird dort ausdrücklich ausgeschaltet.
- **Pausen:** Navigation, Elternabfrage, Hintergrund und Schließen pausieren die aktive Zeit. Fortsetzen startet die Uhr wieder. Auch die Wartezeit auf „Nächste Aufgabe“ gehört zur aktiven Runde. Nach Ablauf erscheint eine Ergebnisübersicht mit gelösten Aufgaben, Antwortversuchen, Trefferquote, bester Serie und Zeit.
- **Bestzeiten:** Nur vollständig gelöste, fehlerfreie Stoppuhr-Runden. Getrennte Profile berücksichtigen Bereich, Einzel-/Reihenmodus, konkrete Reihe, Aufgabenarten, Rundenlänge, Zahlenraum, Schwierigkeit/Welt, Zehnerübergang, Reihenwahl, Antwortmodus und Hilfen. Unterschiedliche Profile werden nicht miteinander verglichen.
- **Belohnungen:** Training sammelt dieselben Punkte und Serien. Mal-/Geteilt- und Tempo-Runden sind ergänzendes Training; sie verändern keine Abenteuerlevel, Sterne oder Schätze. Abenteuerlevel werden weiterhin im normalen Plus-/Minus-Modus abgeschlossen.

Die Elternstatistik ergänzt Multiplikation, Division, gelöste Aufgaben und Fehler je Reihe, gemessene durchschnittliche Zeit je Antwortversuch, Tempo-Runden und Bestzeiten. V1-Zeiten wurden nicht gespeichert und fließen nicht nachträglich in Zeitdurchschnitte ein. Lern-Einstellungen einschließlich Antwortmodus und Hilfen starten eine angefangene Runde neu; bereits verdiente Punkte bleiben erhalten. Sound, Bewegung und Farbmodus können ohne Neustart der Runde geändert werden.

## Speicherformat, Migration und Sicherungen

Das Schema trägt `version: 2`. Zusätzlich zu den bisherigen Feldern enthält es die neuen Einstellungen und `training` mit Runden, Tempo-Runden, Bestzeiten und letzter Ergebnisübersicht. Laufende V2-Runden enthalten ein festes Aufgabenprofil, aktive Zeit und Versuchsstatistik. `core.js` bleibt die reine Lern-/Speicherlogik; `app.js` steuert Oberfläche, Eingaben und Browserfunktionen. `version.js` definiert zentral die Release-Version für App und Service Worker.

Beim ersten V2-Start:

1. Vorhandenes `funkelpfad-v2` wird zuerst validiert. Ist es vorhanden, erfolgt keine erneute V1-Migration.
2. Andernfalls wird `funkelpfad-v1` vollständig auf Schema, Werte, Fortschritt, Gegenstände, Statistik, Einstellungen und ggf. laufende Runde geprüft.
3. Der **unveränderte Originaltext** wird einmalig unter `funkelpfad-v1-backup-before-v2` gesichert. Ein vorhandenes Backup wird nicht überschrieben.
4. Alle gültigen bisherigen Werte werden übernommen und neue Felder ergänzt. Eine laufende V1-Runde bleibt eine normale Plus-/Minus-Abenteuerrunde mit derselben Aufgabe und demselben Fortschritt; unbekannte frühere Zeiten erhalten null als Startwert.
5. Das Ergebnis wird separat unter `funkelpfad-v2` gespeichert. **`funkelpfad-v1` wird weder überschrieben noch gelöscht.**

Beschädigte/unbekannte Daten und fehlgeschlagene Sicherungen blockieren das Ersetzen des vorhandenen Speichers. Eine sichtbare Meldung erklärt dies; im Elternbereich können die unveränderten Originaldaten zur Rettung heruntergeladen werden. Bei blockiertem Speicher wird die aktuelle Runde nur vorübergehend im Arbeitsspeicher geführt. Cache-Updates ändern localStorage nicht.

**Export:** Im Elternbereich „Spielstand exportieren“ lädt `funkelpfad-spielstand-JJJJ-MM-TT.json` herunter: vollständiger Spielstand, Einstellungen, Statistiken, Schema, App-Version und UTC-Zeitstempel. Die Datei sicher aufbewahren, besonders vor Gerätewechsel oder Löschen von Website-Daten.

**Import:** „Spielstand importieren“ → JSON-Datei wählen → geprüfte Zusammenfassung bestätigen. Akzeptiert werden gültige V1-/V2-Spielstände oder der V2-Exportumschlag. V1 wird migriert. Unbekannte, unvollständige, widersprüchliche oder beschädigte Dateien werden abgewiesen. Vor dem Ersetzen wird der aktuelle unveränderte V2-Speicher unter `funkelpfad-backup-before-import` gesichert; die letzte Importsicherung ersetzt eine frühere Importsicherung. Schlägt das Backup fehl, wird der Import abgebrochen. Keine Daten werden übertragen.

Export und Import sind getrennt vom weiterhin durch **LÖSCHEN** geschützten Reset. Reset löscht den aktiven Fortschritt und erhält die Einstellungen; lokale Rückfallsicherungen bleiben erhalten. Für das Wiederherstellen einer V1-Sicherung kann deren JSON-Inhalt als Datei über die Importfunktion eingelesen werden.

## Bestehende iPad-App auf V2 aktualisieren

Die Repository-/Pages-Adresse und die Manifestfelder `id`, `start_url` und `scope` bleiben unverändert. Die vorhandene Home-Bildschirm-App muss normalerweise **nicht neu installiert werden**.

Nach dem geprüften Merge und vollständiger Veröffentlichung: bestehendes Fino-Symbol online öffnen, „Neue Version · jetzt laden“ antippen und die Offline-Bereitschaft abwarten. Im Elternbereich muss „Version 2.0.0“ erscheinen. Der Spielstand wird vor dem Aktivieren gespeichert und beim ersten V2-Start gesichert/migriert. Danach schließen und im Flugmodus über dasselbe Symbol wieder öffnen. App-Dateien werden zusammen vorab geladen; ein fehlgeschlagenes Installieren lässt die alte Offline-Version bestehen.

Bei jeder weiteren Veröffentlichung die zentrale Version in `version.js` erhöhen. Der Service Worker erzeugt daraus `v2.0.0` als Cache-Version und lädt `version.js` zusätzlich offline. Die Registrierung verwendet `updateViaCache: "none"`; die bestehende Update-Meldung und die bewusste Aktivierung bleiben bestehen.

## Schnell starten

Am einfachsten den Inhalt dieses Ordners bei einem statischen Webhoster hochladen und die HTTPS-Adresse öffnen. Es gibt keinen Build-Schritt und keinen Servercode. Nicht die ZIP-Datei hochladen, sondern vorher entpacken.

Für eine lokale Vorschau bei installiertem Python im Projektordner ein Terminal öffnen und ausführen:

```sh
python3 -m http.server 8080
```

Dann `http://localhost:8080` im Browser öffnen. Python dient nur der lokalen Vorschau und wird für Deployment oder Benutzung nicht gebraucht. Direktes Doppelklicken auf `index.html` ist kein verlässlicher PWA-Test: Service Worker benötigen HTTPS oder localhost. Ein iPad kann den localhost des Computers nicht erreichen; für den iPad-Test die veröffentlichte HTTPS-Adresse verwenden.

## Veröffentlichung im bestehenden GitHub-Repository

Für `Voxxxyn/Mathe-Abenteuer-Fino` die vorhandene Pages-Konfiguration und Adresse beibehalten. Den Pull Request von `v2-development` gegen `main` prüfen und separat mergen. Danach den bestehenden Pages-Veröffentlichungsjob abwarten und die aktuelle HTTPS-Adresse öffnen. Unten muss **Bereit für dein Offline-Abenteuer** erscheinen; der Elternbereich zeigt **Version 2.0.0**.

Unter **Settings → Pages** nur prüfen, dass die bisherige Veröffentlichungsquelle weiterhin stimmt. Falls Pages aus `main` und `/(root)` veröffentlicht, bleibt diese Einstellung bestehen. Den Repositorynamen, URL-Pfad oder Veröffentlichungsordner für dieses Update nicht ändern. Die Dateien werden gemeinsam mit dem Merge veröffentlicht; kein neuer Build-Schritt ist nötig.

Die mitgelieferte leere `.nojekyll` deaktiviert Jekyll-Verarbeitung. Andere statische HTTPS-Hoster können ebenfalls den bestehenden Projektordner unverändert veröffentlichen; alle App-Pfade bleiben relativ.

## Auf dem iPad installieren

1. Veröffentlichte Adresse in Safari öffnen, solange Internet verfügbar ist.
2. Warten, bis unten **Bereit für dein Offline-Abenteuer** steht.
3. **Teilen → Zum Home-Bildschirm** wählen. Falls nötig zunächst weitere Aktionen anzeigen. Wenn angeboten, **Als Web-App öffnen** aktivieren.
4. Namen bestätigen und **Hinzufügen** antippen.
5. Funkelpfad über das neue Symbol öffnen, solange das iPad noch online ist. Noch einmal auf die Offline-Bereitschaft warten. Dadurch wird auch der Speicher der installierten Web-App vorbereitet.
6. Danach kann die App ohne Verbindung gestartet und gespielt werden.

Safari und die installierte Web-App können getrennte Speicher verwenden. Deshalb möglichst immer über dasselbe Home-Bildschirm-Symbol lernen. Auch ein anderer Browser, ein anderes Gerät oder eine andere Domain hat einen eigenen Spielstand.

## Offline-Test

1. App online öffnen, Offline-Bereitschaft abwarten und eine Aufgabe lösen.
2. Punktestand notieren, die App vollständig schließen.
3. Flugmodus einschalten, zusätzlich WLAN deaktivieren.
4. App über das Home-Bildschirm-Symbol neu starten.
5. Prüfen: Bilder sichtbar, Punkte vorhanden, Aufgabe lösbar, Navigation und Elternbereich erreichbar.
6. App erneut schließen und öffnen: Auch die offline erreichten Punkte müssen erhalten bleiben.

Ein Browser kann Website-Speicher unter Speicherdruck entfernen. Das Löschen der Website-Daten löscht auch den Spielstand. Keine privaten Tabs verwenden. Wenn localStorage nicht verfügbar ist, zeigt die App eine sichtbare Meldung; die aktuelle Sitzung bleibt bedienbar, aber nicht dauerhaft gespeichert.

## Spiel und Belohnungen

- Fünf Welten: Wiesendorf, Zauberwald, Wolkenburg, Vulkaninsel, Sternenmeer.
- Drei Level je Welt, standardmäßig zehn Aufgaben je Level.
- Richtige Antwort: 10 Punkte. Jede Fünferserie bringt 15 Zusatzpunkte, jede Zehnerserie stattdessen 30 Zusatzpunkte.
- Ein Fehler unterbricht die Serie, zieht jedoch keine Punkte ab.
- 3 Sterne ohne Fehler, 2 Sterne bei höchstens 30 % zusätzlichen Fehlversuchen (aufgerundet), sonst 1 Stern. Jedes gelöste Level zählt als geschafft.
- Nach dem dritten Level einer Welt gibt es einen Sammelgegenstand und die nächste Welt wird freigeschaltet.
- Abgeschlossene Level können wiederholt werden. Wiederholungen zählen zur Lernstatistik, bringen jedoch keine neuen Punkte, Sterne oder Gegenstände.
- Freies Üben ist unbegrenzt und bringt bei noch nicht abgeschlossenen Leveln Punkte, aber keine Levelabschlüsse. Für die Abenteuerreise eine feste Rundenlänge wählen.
- Eine neue Aufgabe wird erst nach „Nächste Aufgabe“ aktiviert. Doppelte Bestätigungen können keine zweite Belohnung auslösen.
- Der Spielstand wird nach jedem Antwortversuch gespeichert. Eine pausierte Runde kann fortgesetzt werden. Wird direkt nach einer richtigen Antwort neu geladen, ist ihr Fortschritt bereits gesichert.

## Elternbereich

Zahnrad oben rechts antippen und **7 × 8 = 56** beantworten. Das ist ein Schutz vor versehentlichem Öffnen, keine Benutzeranmeldung.

Einstellbar sind Zahlenraum (20/50/100), Addition, Subtraktion, Zehnerübergänge, Zahlentastatur oder Multiple Choice, automatische bzw. manuelle Schwierigkeit, Rundenlänge (5/10/20/unbegrenzt), Hinweise, Sound und reduzierte Animationen. Mindestens eine Aufgabenart muss aktiv bleiben. Systemeinstellungen für reduzierte Bewegung werden ebenfalls berücksichtigt.

Die fünf Schwierigkeitsstufen begrenzen die Aufgaben auf 10, 30, 50, 100 und gemischte Aufgaben bis 100. Stufe 1 vermeidet Zehnerübergänge. Die elterliche Zahlenraumgrenze gilt immer zusätzlich. Automatisch richtet sich die Stufe nach der Welt. Aufgabenarten mit häufigen Fehlern oder Lösungszeiten über 25 Sekunden werden leicht höher gewichtet (maximal Faktor 1,65); auch bei manueller Stufe bleibt diese sanfte Wiederholung innerhalb der Stufe aktiv. Es gibt keinen sichtbaren Zeitdruck. Die letzten zwölf Aufgaben werden nicht identisch wiederholt.

Nach dem ersten Fehler wird erneut ermutigt; ab dem zweiten gibt es einen Rechenweg, ab dem vierten eine Erklärung mit Lösung. Diese Hilfen lassen sich abschalten. Die Hinweise verwenden Zehnerzerlegung, Zehnerauffüllen oder Vorwärts-/Rückwärtszählen.

Die Statistik zeigt heute und insgesamt gelöste Aufgaben, richtige und weitere Antwortversuche, Trefferquote, beste Serie, Punkte, Level, Welten und Fehlerschwerpunkte. „Heute“ verwendet das lokale Datum. Die Trefferquote umfasst sämtliche Antwortversuche.

**Zurücksetzen:** Im Elternbereich „Fortschritt zurücksetzen“ wählen, im zweiten Dialog **LÖSCHEN** eingeben und bestätigen. Einstellungen bleiben erhalten. Vorher den Spielstand exportieren; eine gesicherte JSON-Datei kann später wieder importiert werden.

## Dateien und Änderungen

```text
mathe-abenteuer/
  index.html             Einstieg und App-Rahmen
  style.css              Gestaltung, responsive Layouts, reduzierte Bewegung
  version.js             Gemeinsame Release-Version
  core.js                Rechenlogik, Migration, Validierung, Belohnungen
  app.js                 Ansichten, Eingaben, Elternbereich, Audio
  manifest.json          PWA-Metadaten
  service-worker.js      Offline-Dateien und Updates
  assets/                Eigene SVG-Welten und Fuchs
  icons/                 Lokale PNG-Icons (192 und 512 Pixel)
  tests/core.test.js      Reproduzierbare Logiktests
  tests/browser.test.cjs  Browser-Prüfung mit Playwright
  tests/ui.test.cjs       DOM-Integrationstests mit JSDOM
  tests/offline.test.cjs  Cache-, Manifest- und Asset-Prüfungen
  tests/v2.test.js        Migration, Einmaleins, Reihen und Tempo
  tests/v2-ui.test.cjs    V2-DOM, Fokus, Pausen, Export/Import
  tests/v2-browser.test.cjs  Echter V1-zu-V2-PWA-Wechsel im Chromium
  tests/fixtures/        Von originaler V1 erzeugter Testspielstand
  TESTCHECKLISTE.md       Prüfabläufe und getesteter Umfang
  README.md              Diese Anleitung
  .nojekyll              Statische Veröffentlichung
```

Texte und Spielansichten: `app.js`. Farben, Größen und Layout: `style.css`. Aufgabenerzeugung und Belohnungen: `core.js`. Weltnamen und Gegenstände stehen in `core.js`. SVG-Dateien sind direkt editierbar.

Bei jeder Veröffentlichung mit geänderten App-Dateien die Release-Version in `version.js` erhöhen. Neue lokale Assets zusätzlich in die Liste `FILES` aufnehmen. Alle Dateien gemeinsam veröffentlichen. Eine neue Version wird nur installiert, wenn alle benötigten Dateien geladen werden konnten. Die alte Version funktioniert bis dahin weiter offline. Sobald eine neue Version wartet, erscheint unten „Neue Version · jetzt laden“. Antippen sichert den Spielstand und aktiviert die neue Version. Ohne diesen Schritt wird sie aktiviert, wenn keine alte App-Instanz mehr offen ist. Lernfortschritt liegt unabhängig vom Cache in localStorage.

Bei Änderungen am Speicherformat das Schema `version` und eine passende Migration in `core.js` erweitern. An Speicher- und Importgrenzen werden ungültige Daten abgewiesen, statt vorhandenen Fortschritt durch Standardwerte zu ersetzen. Fremde Inhalte gelangen nicht ungeprüft in die Oberfläche.

## Tests

Die App selbst benötigt weder Node noch npm. Für die optionalen Entwicklungstests:

```sh
node tests/core.test.js
node tests/offline.test.cjs
node tests/v2.test.js
JSDOM_MODULE=/pfad/zu/jsdom node tests/ui.test.cjs
JSDOM_MODULE=/pfad/zu/jsdom node tests/v2-ui.test.cjs
PLAYWRIGHT_MODULE=/pfad/zu/playwright APP_URL=http://localhost:8080 node tests/browser.test.cjs
PLAYWRIGHT_MODULE=/pfad/zu/playwright V1_GIT_DIR=/pfad/zur/.git node tests/v2-browser.test.cjs
```

JSDOM und Playwright ausschließlich in einer separaten Entwicklungsumgebung installieren. Der V2-Browser-Test startet einen eigenen lokalen Testserver und liest die originale V1 über Git; er verändert keine veröffentlichten Dateien. `V1_REF` kann einen anderen geprüften V1-Basiscommit angeben. `CHROME_PATH` kann auf einen installierten Chrome und `SCREENSHOT_DIR` auf einen lokalen Bilderordner zeigen. Für den bisherigen Browser-Test muss ein lokaler statischer Server laufen. Für den Browser-Test Playwright in einer separaten Entwicklungsumgebung installieren. `PLAYWRIGHT_MODULE` kann auf das installierte Modul verweisen. Ein lokaler Server muss laufen. Details im Kopf der Testdatei. Die manuelle Checkliste deckt auch echte iPads ab.

## Datenschutz

Lernstatistik und Einstellungen bleiben in localStorage auf diesem Gerät. Keine Telemetrie, Cookies, Analyse-Skripte oder externen Laufzeitdienste. Der gewählte Webhoster erhält technisch notwendige Abrufe der statischen App-Dateien und kann eigene Serverzugriffsprotokolle führen; Lernantworten oder Spielstände werden nicht übertragen. Es gibt keinen automatischen Geräteabgleich.

## Offizielle Anleitungen

- [GitHub: Veröffentlichungsquelle für Pages konfigurieren](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Apple: Website auf dem iPad als App hinzufügen](https://support.apple.com/guide/ipad/ipad8f1f7a29/ipados)
