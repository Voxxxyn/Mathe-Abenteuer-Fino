# Funkelpfad – Dein Mathe-Abenteuer

Eine vollständige, lokal arbeitende Mathe-App für Grundschulkinder. Fino, der Fuchs, begleitet das Kind durch fünf Welten mit je drei Leveln. Die App funktioniert ohne Konto, Werbung, externe Fonts, Bibliotheken oder APIs. Alle Illustrationen und Icons sind eigens für dieses Projekt erstellt. Sounds entstehen lokal über die Web Audio API.

## Schnell starten

Am einfachsten den Inhalt dieses Ordners bei einem statischen Webhoster hochladen und die HTTPS-Adresse öffnen. Es gibt keinen Build-Schritt und keinen Servercode. Nicht die ZIP-Datei hochladen, sondern vorher entpacken.

Für eine lokale Vorschau bei installiertem Python im Projektordner ein Terminal öffnen und ausführen:

```sh
python3 -m http.server 8080
```

Dann `http://localhost:8080` im Browser öffnen. Python dient nur der lokalen Vorschau und wird für Deployment oder Benutzung nicht gebraucht. Direktes Doppelklicken auf `index.html` ist kein verlässlicher PWA-Test: Service Worker benötigen HTTPS oder localhost. Ein iPad kann den localhost des Computers nicht erreichen; für den iPad-Test die veröffentlichte HTTPS-Adresse verwenden.

## GitHub Pages – Schritt für Schritt

1. Bei GitHub anmelden und ein neues Repository, zum Beispiel `mathe-abenteuer`, anlegen. Bei einem kostenlosen Konto ein öffentliches Repository wählen. Der Quellcode ist dann öffentlich, die lokal gespeicherten Lerndaten werden nicht hochgeladen.
2. Im Repository **Add file → Upload files** öffnen.
3. Alle Dateien und Unterordner aus `mathe-abenteuer` hochladen. `index.html` muss direkt im Hauptverzeichnis des Repositorys liegen. Nicht nur den äußeren Ordner oder das ZIP hochladen.
4. Mit **Commit changes** speichern.
5. **Settings → Pages** öffnen. Unter **Build and deployment** als Quelle **Deploy from a branch** wählen.
6. Branch **main**, Ordner **/(root)** auswählen und **Save** drücken.
7. Warten, bis GitHub die Veröffentlichung abgeschlossen hat. Die Adresse wird unter Pages angezeigt und hat üblicherweise die Form `https://DEIN-NAME.github.io/mathe-abenteuer/`.
8. Adresse öffnen. Unten muss **Bereit für dein Offline-Abenteuer** erscheinen.

Die mitgelieferte leere Datei `.nojekyll` deaktiviert Jekyll-Verarbeitung; die App benötigt sie technisch nicht zwingend. GitHub kann für die Veröffentlichung intern einen Job ausführen, die App selbst muss nicht gebaut werden.

Andere statische HTTPS-Hoster funktionieren ebenfalls: Projektordner als Veröffentlichungsordner wählen, kein Framework und keinen Build-Befehl konfigurieren. Alle Pfade sind relativ, sodass auch ein Unterordner funktioniert.

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

**Zurücksetzen:** Im Elternbereich „Fortschritt zurücksetzen“ wählen, im zweiten Dialog **LÖSCHEN** eingeben und bestätigen. Einstellungen bleiben erhalten. Ein Zurücksetzen lässt sich nicht rückgängig machen.

## Dateien und Änderungen

```text
mathe-abenteuer/
  index.html             Einstieg und App-Rahmen
  style.css              Gestaltung, responsive Layouts, reduzierte Bewegung
  core.js                Rechenlogik, Speicherung validieren, Belohnungen
  app.js                 Ansichten, Eingaben, Elternbereich, Audio
  manifest.json          PWA-Metadaten
  service-worker.js      Offline-Dateien und Updates
  assets/                Eigene SVG-Welten und Fuchs
  icons/                 Lokale PNG-Icons (192 und 512 Pixel)
  tests/core.test.js      Reproduzierbare Logiktests
  tests/browser.test.cjs  Browser-Prüfung mit Playwright
  tests/ui.test.cjs       DOM-Integrationstests mit JSDOM
  tests/offline.test.cjs  Cache-, Manifest- und Asset-Prüfungen
  TESTCHECKLISTE.md       Prüfabläufe und getesteter Umfang
  README.md              Diese Anleitung
  .nojekyll              Statische Veröffentlichung
```

Texte und Spielansichten: `app.js`. Farben, Größen und Layout: `style.css`. Aufgabenerzeugung und Belohnungen: `core.js`. Weltnamen und Gegenstände stehen in `core.js`. SVG-Dateien sind direkt editierbar.

Bei jeder Veröffentlichung mit geänderten App-Dateien in `service-worker.js` auch `VERSION` erhöhen, beispielsweise von `v1.0.3` auf `v1.0.4`. Neue lokale Assets zusätzlich in die Liste `FILES` aufnehmen. Alle Dateien gemeinsam veröffentlichen. Eine neue Version wird nur installiert, wenn alle benötigten Dateien geladen werden konnten. Die alte Version funktioniert bis dahin weiter offline. Sobald eine neue Version wartet, erscheint unten „Neue Version · jetzt laden“. Antippen sichert den Spielstand und aktiviert die neue Version. Ohne diesen Schritt wird sie aktiviert, wenn keine alte App-Instanz mehr offen ist. Lernfortschritt liegt unabhängig vom Cache in localStorage.

Bei Änderungen am Speicherformat das Schema `version` und eine passende Migration in `core.js` planen. Ungültige Daten werden auf sichere Standardwerte zurückgeführt; fremde Inhalte aus localStorage werden nicht ungeprüft in die Oberfläche übernommen.

## Tests

Die App selbst benötigt weder Node noch npm. Für die optionalen Entwicklungstests:

```sh
node tests/core.test.js
node tests/offline.test.cjs
```

Für den Browser-Test Playwright in einer separaten Entwicklungsumgebung installieren. `PLAYWRIGHT_MODULE` kann auf das installierte Modul verweisen. Ein lokaler Server muss laufen. Details im Kopf der Testdatei. Die manuelle Checkliste deckt auch echte iPads ab.

## Datenschutz

Lernstatistik und Einstellungen bleiben in localStorage auf diesem Gerät. Keine Telemetrie, Cookies, Analyse-Skripte oder externen Laufzeitdienste. Der gewählte Webhoster erhält technisch notwendige Abrufe der statischen App-Dateien und kann eigene Serverzugriffsprotokolle führen; Lernantworten oder Spielstände werden nicht übertragen. Es gibt keinen automatischen Geräteabgleich.

## Offizielle Anleitungen

- [GitHub: Veröffentlichungsquelle für Pages konfigurieren](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Apple: Website auf dem iPad als App hinzufügen](https://support.apple.com/guide/ipad/ipad8f1f7a29/ipados)
