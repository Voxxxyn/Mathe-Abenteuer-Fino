# Funkelpfad – Tests und Abnahme

Stand: 27.09.2026. Die Checkliste unterscheidet tatsächliche Prüfungen von noch am Zielgerät auszuführenden Tests.

## Durchgeführt

- **63.148 Logikprüfungen bestanden** mit `node tests/core.test.js`: Addition/Subtraktion, Zahlenräume 20/50/100, Stufen 1–5, ein-/ausgeschaltete Aufgabenarten und Zehnerübergänge, gültige Ergebnisse, keine identischen letzten zwölf Aufgaben, plausible eindeutige Multiple-Choice-Antworten, Hinweise, Serien, Bonuspunkte, Sterne, alle Welten, Wiederholungsbegrenzung, freies Üben, Speicher-Roundtrip und ungültige gespeicherte Daten.
- **45 DOM-Integrationsprüfungen bestanden** mit `tests/ui.test.cjs`: alle wesentlichen Ansichten, Elternabfrage, Einstellungen, Mindest-Aufgabenart, Zahlentastatur, drei Stellen, Löschen, leere Eingabe, Enter nach Fokus auf einer Ziffer, vier Fehlversuche mit abgestuften Hilfen, doppelte Bestätigung, Pause/Fortsetzung, komplette Reise durch 15 Level, fünf Schätze, Wiederholung ohne neue Belohnung, Sammlung, Multiple Choice, freies Üben, reduzierte Bewegung und Zurücksetzen mit Bestätigung.
- **Im eingebauten Browser direkt geprüft:** Startseite und Rechenansicht, Tippen und Bestätigen, positive Rückmeldung, sichtbarer Punktestand, Elternabfrage und Statistik.
- **Offline direkt geprüft:** Lokalen HTTP-Server vollständig beendet; App neu geladen; 10 Punkte blieben erhalten; Aufgabe 2 fortgesetzt und gelöst; Elternstatistik zeigte zwei gelöste Aufgaben und 20 Punkte. Dazu war der Ursprung der App nicht mehr erreichbar. Danach Server für die Vorschau wieder gestartet.
- **Responsive Darstellung direkt geprüft:** 1024 × 768, 768 × 1024 und 390 × 844 Pixel; kein horizontales Überlaufen. Zifferntasten 62–65 Pixel hoch, im schmalsten Format etwa 101 Pixel breit. Visuelle Kontrolle der Start-, Erfolgs- und Rechenansicht.
- **Versionswechsel direkt geprüft:** Neue Version wurde angeboten und über „jetzt laden“ aktiviert; 20 Punkte und Aufgabe 3 blieben erhalten. Die korrigierte Punkteanzeige wurde danach mit 30 Punkten bestätigt.
- **Offline-Lebenszyklusprüfung bestanden** mit `tests/offline.test.cjs`: alle 15 Cache-Ressourcen, Unterpfad, altes Cache entfernen, fremden Cache erhalten, Updateaktivierung, Navigations-Fallback, Manifestpfade und PNG-Abmessungen.
- **Statische Prüfung:** JavaScript-Syntax, Manifest, lokale Assets, Service-Worker-Dateiliste und relative Pfade. Keine externen Ressourcen oder Laufzeitbibliotheken. Das vollständige Paket kann ohne Build auf einem statischen Hoster liegen.

Der zusätzliche Playwright-Test `tests/browser.test.cjs` ist mitgeliefert, wurde in dieser Umgebung aber **nicht ausgeführt**, weil der separate Chrome-Prozess vom Betriebssystem beendet wurde. Er darf daher nicht als bestandener Test gewertet werden. Die Browserprüfung wurde stattdessen im eingebauten Browser durchgeführt.

JSDOM ist nur eine optionale Entwicklungsabhängigkeit; weder JSDOM noch Playwright sind Bestandteil der ausgelieferten App oder werden im Browser geladen.

## Manuelle Checkliste für ein echtes iPad

Die Hardwareprüfung und die tatsächliche Home-Bildschirm-Installation konnten hier nicht durchgeführt werden. Nach dem Deployment diese Schritte prüfen:

### Installation und Offline

- [ ] HTTPS-Adresse in Safari öffnen. Alle Bilder laden; Offline-Bereitschaft erscheint.
- [ ] Über Teilen → Zum Home-Bildschirm installieren und die installierte App einmal online starten.
- [ ] Flugmodus aktivieren, WLAN ausschalten, App vollständig schließen und über das Symbol neu öffnen.
- [ ] Oberfläche, alle fünf Weltgrafiken, Rechnen, Sounds und Elternbereich funktionieren ohne Verbindung.
- [ ] Offline Punkte verdienen, App schließen und neu starten: Fortschritt bleibt erhalten.
- [ ] Mehrere Starts über das Home-Bildschirm-Symbol verwenden, um denselben Speicher zu verwenden.

### Eingabe und Navigation

- [ ] Hochformat und Querformat: keine horizontale Scrollleiste; alle Bedienelemente erreichbar.
- [ ] Zahlentasten lassen sich sicher mit einem Finger bedienen; die Systemtastatur erscheint beim Rechnen nicht.
- [ ] Maximal drei Ziffern. Löschen entfernt genau eine Ziffer. Leere Bestätigung gibt einen Hinweis.
- [ ] Mit externer Tastatur Ziffern, Backspace und Enter prüfen.
- [ ] Schnelle doppelte Bestätigung gibt keine doppelte Belohnung.
- [ ] Startseite, Abenteuerkarte, Levelauswahl, Sammlung, Elternbereich und Rückwege funktionieren.
- [ ] Runde pausieren und fortsetzen; Aufgabe und Fortschritt bleiben bestehen.

### Lernlogik und Belohnungen

- [ ] Addition ergibt nie mehr als den eingestellten Zahlenraum; Subtraktion bleibt mindestens null.
- [ ] Addition und Subtraktion einzeln deaktivieren; beide gleichzeitig werden abgewiesen.
- [ ] Ohne Zehnerübergang enthalten neue Aufgaben keine Überträge bzw. Entleihen.
- [ ] Fehlversuch 1 ermutigt; 2 zeigt einen Tipp; 4 erklärt die Lösung. Hilfen lassen sich abschalten.
- [ ] Multiple Choice enthält drei unterschiedliche Werte einschließlich der richtigen Lösung.
- [ ] Fünf korrekte Antworten in Folge: 15 Bonuspunkte. Zehn in Folge: 30 statt 15 Bonuspunkte.
- [ ] Level mit 5, 10 und 20 Aufgaben abschließen; Sternzahl stimmt mit der beschriebenen Regel überein.
- [ ] Drei neue Level schließen eine Welt ab, öffnen die Schatztruhe und schalten die nächste Welt frei.
- [ ] Wiederholte Level geben keine neuen Punkte, Sterne oder Gegenstände.
- [ ] Freies Üben läuft über 20 Aufgaben hinaus und schaltet keine Level frei.

### Eltern, Speicherung und Bedienhilfen

- [ ] Elternbereich verlangt die Abfrage; falsche Antwort öffnet ihn nicht.
- [ ] Einstellungen speichern und neu starten: Werte bleiben erhalten.
- [ ] Angefangene Runde wird bei geänderter Schwierigkeit/Rundenlänge zurückgesetzt, verdiente Punkte bleiben.
- [ ] Statistik: gelöste Aufgaben vs. Antwortversuche nachvollziehbar; Datum entspricht der Gerätezeit.
- [ ] Sound aus/an prüfen. Ton startet erst nach Interaktion, keine unangenehme Überlagerung.
- [ ] Reduzierte Animationen in der App und in den Systemeinstellungen prüfen.
- [ ] VoiceOver und Tastaturfokus prüfen: Buttons benannt, Rückmeldungen verständlich, Dialog erreichbar.
- [ ] Zurücksetzen abbrechen: keine Änderung. Erst LÖSCHEN und Bestätigen entfernt Fortschritt.
- [ ] Blockierter Website-Speicher führt zu sichtbarer Meldung, nicht zum Absturz.

### Update und Veröffentlichung

- [ ] Projekt unter einem Unterpfad veröffentlichen; Grafiken, Manifest und Service Worker laden relativ.
- [ ] VERSION in service-worker.js erhöhen und alle geänderten Dateien gemeinsam hochladen.
- [ ] Alte App erneut online öffnen; angebotene neue Version laden; Spielstand bleibt erhalten.
- [ ] App danach erneut offline öffnen; neue Version ist vollständig verfügbar.

## Tests erneut ausführen

```sh
node tests/core.test.js
node tests/offline.test.cjs
JSDOM_MODULE=/absoluter/pfad/zu/jsdom node tests/ui.test.cjs
PLAYWRIGHT_MODULE=/absoluter/pfad/zu/playwright APP_URL=http://localhost:8080 node tests/browser.test.cjs
```

Für den letzten Test muss der lokale Server laufen. Optional `CHROME_PATH` auf eine installierte Chrome-Datei und `SCREENSHOT_DIR` auf einen gewünschten Ausgabeordner setzen. Tests möglichst in einem frischen Testprofil ausführen; der Browser-Test erstellt einen isolierten Kontext und verändert keinen normalen Browser-Spielstand.
