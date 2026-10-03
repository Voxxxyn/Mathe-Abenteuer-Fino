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
- [ ] Release-Version in version.js erhöhen und alle geänderten Dateien gemeinsam hochladen (V2).
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

## V2-Abnahme · 03.10.2026

Diese Ergänzung gilt für Version **2.0.0**. Die ursprünglichen V1-Prüfabläufe oben bleiben als Regression bestehen. V1-Basis: `f4e82ebf5670f323a6bf7196e3b417f687ee9965`. Die V2-Prüfungen verwenden ausschließlich synthetische Testdaten und isolierte Browserprofile.

### Automatisiert bestanden

- **63.148 bestehende Logikprüfungen:** unveränderte Plus-/Minus-Regeln, Zahlenräume, Level, Belohnungen, Wiederholungen, freies Üben und Speicherbereinigung.
- **14.564 V2-Logikprüfungen:** V1-Spielstand aus der originalen V1-Logik, Erhalt sämtlicher alter Fortschritts-/Einstellungswerte und laufender Aufgabe, bytegleiches Backup, einmalige Migration, blockierte Sicherung, beschädigte/unbekannte Dateien, V1-/V2-Import und vollständiger Export; Reihen 1–10, einzelne/mehrere/alle Reihen, Multiplikation/Division, ganzzahlige Division ohne Nullteiler, Multiple Choice, alle zehn Zeilen; Countdown/Stoppuhr, Ergebnisse, keine doppelten Belohnungen, getrennte Bestzeitprofile und Reload.
- **45 bestehende DOM-Prüfungen:** gesamte Reise mit 15 Leveln und fünf Schätzen, Elternbereich, Eingaben, Hinweise, Sterne, Wiederholung, Sammlung, Einstellungen, Pausen und sicherer Reset.
- **37 V2-DOM-Prüfungen:** kindgerechter Umschalter, alle zehn echten Reihenfelder, numerische Eingabeattribute, synchroner Fokuswechsel, Korrektur und Ergebnis; Navigation und Hintergrund pausieren die Zeit; Countdown-Ende, Stoppuhr und Bestzeit; gespeicherter Dark Mode; JSON-Export/Import mit Bestätigung und Sicherung; Schutz beschädigter Originaldaten.
- **Offline-Lebenszyklus:** alle 16 lokalen Cache-Ressourcen, Manifest-ID/-Start/-Scope unverändert, echte Icon-Abmessungen, Cache `v2.0.0`, alte Caches bereinigt, fremde Caches erhalten, bewusste Aktivierung und offline Navigation im Unterpfad.
- **Bestehender Chromium-Test:** reale Bedienung, Reload, Punkte, Level, Schatz, Einstellungen, Multiple Choice, offline Neustart und frische offline Seite, Reset, 1024×768 / 768×1024 / 820×1180 / 390×844; keine externen App-Anfragen und keine JavaScript-Fehler. Der alte Hinweis oben auf einen damals nicht ausführbaren Playwright-Test betrifft nur die V1-Prüfung vom 27.09.; bei der V2-Abnahme wurde dieser Test ausgeführt.
- **28 V2-Chromium-Prüfungen:** echte installierte/aktive V1-PWA → Update-Meldung → Aktivierung → V2 mit erhaltenen Punkten/Leveln und bytegleichem V1-Backup; Cachewechsel; Dark Mode und Reload; zehn Divisionseingaben mit Enter und Fokuswechsel; Offline-Reihentraining und Reload; tatsächlicher JSON-Download und Dateiimport einschließlich beschädigter Datei; Countdown-Ablauf mit kontrollierter Browserzeit; touchfähiges Browserprofil mit 768×1024 / 1024×768 / 390×844, große Felder und kein horizontales Überlaufen.
- **Visuell kontrolliert:** Screenshots des dunklen Reihenmodus im Hochformat und schmalen Format sowie der unverändert aufgebauten hellen Startseite. Fino, Weltgrafiken, Farbhierarchie und Bedienelemente sichtbar.
- **Statisch:** Syntax aller ausgelieferten JavaScript-Dateien, vollständige relative Ressourcenpfade, Manifest, unveränderte Assets/Icons und keine externen Laufzeitabhängigkeiten.

### Noch auf einem echten iPad prüfen

Browsergrößen und native HTML-Inputs wurden geprüft; iPad-Hardware, Safari-Systemtastatur und Home-Bildschirm-Installation lassen sich hier nicht als bestanden bestätigen.

- [ ] Bestehende Home-Bildschirm-App online öffnen, Update laden, Elternbereich zeigt 2.0.0. Keine Neuinstallation nötig.
- [ ] Vorherige Punkte, Sterne, Level, Schätze, Statistiken und Einstellungen vergleichen; exportierten Spielstand aufbewahren.
- [ ] App im Flugmodus vollständig schließen/neustarten; alle Bereiche und Grafiken verfügbar.
- [ ] Reihentraining: System-Zahlentastatur erscheint nach Antippen; keine Autokorrektur; ✓ und ggf. Enter bestätigen; Fokus springt zur nächsten Zeile und scrollt sichtbar über die Tastatur.
- [ ] Einmaleins-Einzelaufgaben: integrierte Tastatur bleibt Standard; keine Systemtastatur. Optional Multiple Choice prüfen.
- [ ] Portrait/Landscape und geöffnete Systemtastatur: aktive Aufgabe und Bestätigen erreichbar; kein horizontales Überlaufen.
- [ ] Multiplikation/Division und Reihenwahl einzeln, mehrere, alle prüfen. Ganze Reihen mit normal/Stoppuhr durchspielen.
- [ ] Countdown 1/2/5/10 Minuten; Ablauf, Pause über Navigation und Hintergrund, Neustart und Ergebnis prüfen.
- [ ] Stoppuhr: Bestzeit nur bei fehlerfreiem Abschluss; unterschiedliche Profile erhalten eigene Werte.
- [ ] Hell/Dunkel/System, Systemwechsel und gespeicherte Einstellung; alle fünf Welten, Elternbereich, Zahlentasten und Schätze lesbar.
- [ ] Export in Dateien speichern; Import einer gültigen Sicherung bestätigen; beschädigten Import ablehnen; Zurücksetzen weiterhin separat durch LÖSCHEN geschützt.
- [ ] Sound, reduzierte Bewegung, VoiceOver, Dialog-/Tastaturfokus und bestehende V1-Checkliste vollständig durchgehen.

### V2-Tests erneut ausführen

```sh
node tests/core.test.js
node tests/v2.test.js
node tests/offline.test.cjs
JSDOM_MODULE=/pfad/zu/jsdom node tests/ui.test.cjs
JSDOM_MODULE=/pfad/zu/jsdom node tests/v2-ui.test.cjs
PLAYWRIGHT_MODULE=/pfad/zu/playwright CHROME_PATH=/pfad/zu/chrome APP_URL=http://localhost:8080 node tests/browser.test.cjs
PLAYWRIGHT_MODULE=/pfad/zu/playwright CHROME_PATH=/pfad/zu/chrome V1_GIT_DIR=/pfad/zur/.git SCREENSHOT_DIR=work/screenshots node tests/v2-browser.test.cjs
```

JSDOM/Playwright sind reine Entwicklungswerkzeuge außerhalb der App. Der V2-Browser-Test startet einen eigenen temporären Testserver, liest V1 aus Git und liefert V2 aus dem Projektordner. Der bestehende Browser-Test benötigt einen bereits gestarteten lokalen Server. **Vor dem Merge stoppen; Merge und anschließende Pages-Veröffentlichung erfolgen separat durch den Nutzer.**
