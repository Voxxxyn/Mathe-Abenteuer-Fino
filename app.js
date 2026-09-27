/* Funkelpfad — entirely local, static and dependency-free. */
"use strict";
const M = window.Mathe,
  KEY = "funkelpfad-v1",
  main = document.querySelector("#main"),
  dialog = document.querySelector("#dialog");
let state = M.fresh(),
  view = "home",
  selectedWorld = 0,
  entry = "",
  locked = false,
  started = 0,
  feedback = null,
  audio = null,
  voice = null,
  storageFailed = false;
try {
  state = M.clean(JSON.parse(localStorage.getItem(KEY)));
} catch (e) {
  storageFailed = true;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageFailed = false;
  } catch (e) {
    storageFailed = true;
  }
  storageNotice();
}
function storageNotice() {
  const p = document.querySelector("#storage-warning");
  p.hidden = !storageFailed;
  p.textContent =
    "Der Spielstand kann gerade nicht dauerhaft gespeichert werden. Bitte erlaube Website-Speicher und verwende keinen privaten Tab.";
}
function day() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const count = () => Object.keys(state.completed).length;
const unlocked = () => Math.min(4, Math.floor(count() / 3));
const starCount = () =>
  Object.values(state.completed).reduce((a, b) => a + b, 0);
const fox = (cls = "") =>
  `<img class="fox ${cls}" src="assets/fox.svg" alt="Fino, dein freundlicher Fuchs">`;
const button = (label, action, cls = "primary", attrs = "") =>
  `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
function sound(kind) {
  if (!state.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    if (voice) {
      try {
        voice.stop();
      } catch (e) {}
    }
    const o = audio.createOscillator(),
      g = audio.createGain();
    voice = o;
    o.connect(g);
    g.connect(audio.destination);
    o.type = "sine";
    const notes =
      kind === "error"
        ? [280, 240]
        : kind === "win"
          ? [523, 659, 784, 1047]
          : kind === "bonus"
            ? [659, 784, 988]
            : [523, 659];
    const t = audio.currentTime;
    notes.forEach((n, i) => o.frequency.setValueAtTime(n, t + i * 0.09));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + notes.length * 0.09 + 0.08);
    o.start(t);
    o.stop(t + notes.length * 0.09 + 0.1);
  } catch (e) {}
}
function updateHeader() {
  document.querySelector("#points").textContent =
    state.points.toLocaleString("de-DE");
  document.body.classList.toggle("reduced", !state.settings.motion);
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.dataset.nav === view ||
          (view === "levels" && b.dataset.nav === "map"),
      ),
    );
}
function go(next) {
  if (view === "play" && state.session) {
    save();
  }
  view = next;
  feedback = null;
  locked = false;
  entry = "";
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
function render() {
  updateHeader();
  if (view === "home") home();
  else if (view === "map") map();
  else if (view === "levels") levels();
  else if (view === "collection") collection();
  else if (view === "play") play();
  else if (view === "parents") parents();
}
function home() {
  const w = M.worlds[unlocked()],
    n = Math.min(count(), 14);
  main.innerHTML = `<section class="welcome-line"><span class="eyebrow">KLEINE SCHRITTE. GROSSE ABENTEUER.</span><span class="small-tag">Für kleine Entdecker · Mathe bis 100</span></section><section class="hero"><div class="hero-copy"><span class="pill">✦ Rechnen kann ein Abenteuer sein</span><h1>Ein bisschen Mathe.<br>Ganz viel <em>Magie.</em></h1><p>Entdecke mit Fino neue Welten,<br>knacke Rechenrätsel und finde deine Schätze.</p>${button(state.session ? "Abenteuer fortsetzen <span>→</span>" : count() === 15 ? "Noch eine Runde spielen <span>→</span>" : "Los geht’s, Fino! <span>→</span>", "continue")}<div class="hero-note"><span class="tiny-fox">✧</span> In deinem Tempo. Ohne Zeitdruck.</div></div><div class="hero-art"><img class="landscape" src="assets/world-${unlocked()}.svg" alt="Ein geschwungener Weg durch ${w.name}"><span class="art-label">DEINE REISE BEGINNT HIER</span><div class="speech">Komm, wir entdecken<br>deine Superkraft!</div>${fox("hero-fox")}<span class="floating-star s1">✦</span><span class="floating-star s2">✧</span></div></section><section class="stats-strip" aria-label="Dein Fortschritt"><div><span class="stat-icon gold">✦</span><span><b>${starCount()} Sterne</b><small>Jeder Schritt zählt</small></span></div><div><span class="stat-icon mint">⚑</span><span><b>${count()} von 15 Leveln</b><small>Deine Entdeckungsreise</small></span></div><div><span class="stat-icon peach">◇</span><span><b>${state.items.length} Schätze</b><small>Ganz allein verdient</small></span></div><div><span class="stat-icon lilac">ϟ</span><span><b>${state.best} in Folge</b><small>Deine beste Serie</small></span></div></section><section class="section-heading"><div><span class="eyebrow">DEINE ABENTEUERKARTE</span><h2>Fünf Welten. Unzählige Aha-Momente.</h2></div>${button("Karte entdecken →", "map", "text-button")}</section><div class="world-grid">${M.worlds.map((w, i) => worldCard(w, i)).join("")}</div><div class="bottom-note"><span>♡</span> Ein sicherer Ort zum Lernen. Ohne Werbung. Ohne Anmeldung.</div>`;
}
function worldCard(w, i) {
  const available = i <= unlocked(),
    done = [0, 1, 2].filter((j) => state.completed[i * 3 + j]).length;
  return `<button class="world-card ${available ? "" : "locked-world"}" data-world="${i}" ${available ? "" : `disabled aria-label="${w.name}, noch gesperrt"`}><div class="world-image"><img src="assets/world-${i}.svg" alt=""><span class="world-number">${available ? String(i + 1).padStart(2, "0") : "♧"}</span>${i === unlocked() ? '<span class="here">DU BIST HIER</span>' : ""}</div><div class="world-info"><h3>${w.name}</h3><p>${available ? done + " / 3 Level entdeckt" : "Nach " + M.worlds[i - 1].name}</p><div class="mini-progress"><i style="width:${(done / 3) * 100}%;background:${w.color}"></i></div></div></button>`;
}
function map() {
  main.innerHTML = `<div class="section-heading page-title"><div><span class="eyebrow">SCHRITT FÜR SCHRITT WEITER</span><h1>Dein Abenteuerpfad</h1><p>In jeder Welt warten drei Level und ein besonderer Schatz.</p></div><span class="badge">✦ ${starCount()} / 45 Sterne</span></div><div class="map-banner"><img src="assets/world-${unlocked()}.svg" alt="Deine aktuelle Abenteuerwelt"><div><span class="pill">WELT ${unlocked() + 1} VON 5</span><h2>${M.worlds[unlocked()].name}</h2><p>${M.worlds[unlocked()].subtitle}</p>${button("Weiter auf dem Pfad →", "continue")}</div>${fox()}</div><div class="world-grid">${M.worlds.map(worldCard).join("")}</div>`;
}
function levels() {
  const w = M.worlds[selectedWorld];
  main.innerHTML = `${button("← Alle Welten", "map", "text-button")}<section class="level-banner"><img src="assets/world-${selectedWorld}.svg" alt="${w.name}"><div><span class="eyebrow">WELT ${selectedWorld + 1}</span><h1>${w.name}</h1><p>${w.subtitle}</p></div></section><div class="level-list">${[
    0, 1, 2,
  ]
    .map((j) => {
      const n = selectedWorld * 3 + j,
        done = state.completed[n],
        available = n <= count();
      return `<button class="level-card" data-level="${n}" ${available ? "" : "disabled"}><span class="level-orb ${done ? "complete" : ""}">${done ? "✓" : n + 1}</span><h2>${["Der erste Schritt", "Auf Entdeckungstour", "Der Schatz wartet"][j]}</h2><p>${done ? "Geschafft · Wiederholen ohne neue Punkte" : available ? (state.settings.length || "Beliebig viele") + " Aufgaben · " + (state.settings.length ? "Dein nächstes Abenteuer" : "Freies Üben") : "Schließe zuerst Level " + n + " ab"}</p><span class="level-stars">${done ? "★".repeat(done) + "☆".repeat(3 - done) : "☆ ☆ ☆"}</span></button>`;
    })
    .join(
      "",
    )}</div><p class="center muted">${state.settings.length === 0 ? "Im freien Üben sammelst du Punkte. Wähle eine feste Rundenlänge, um Level und Welten freizuschalten." : "Drei Level öffnen die Schatztruhe dieser Welt."}</p>`;
}
function collection() {
  main.innerHTML = `<div class="page-title"><span class="eyebrow">KLEINE ERINNERUNGEN AN GROSSE ERFOLGE</span><h1>Deine Schatzkammer</h1><p>Für jede abgeschlossene Welt schenkt dir Fino einen besonderen Fund.</p></div><div class="collection-grid">${M.worlds
    .map((w, i) => {
      const has = state.items.includes(w.item);
      return `<article class="collect-card ${has ? "found" : ""}"><div class="collect-symbol" style="--item:${w.color}">${has ? w.symbol : "?"}</div><span class="eyebrow">${w.name}</span><h2>${has ? w.item : "Ein geheimer Schatz"}</h2><p>${has ? "Entdeckt! Dieser Schatz gehört dir." : "Entdecke alle drei Level dieser Welt."}</p></article>`;
    })
    .join(
      "",
    )}</div><div class="badge-row"><span>✦ ${starCount()} Sterne gesammelt</span><span>ϟ Beste Serie: ${state.best}</span><span>⚑ ${count()} Level geschafft</span></div>`;
}
function start(level) {
  if (level > count() || level < 0 || level > 14) return;
  if (state.session && state.session.level !== level) {
    modal(
      "Deine Runde wartet",
      "Du hast noch eine angefangene Runde. Möchtest du sie fortsetzen oder dieses Level neu beginnen?",
      `${button("Angefangene Runde fortsetzen", "resume")}${button("Dieses Level beginnen", "replace", "secondary", `data-level-target="${level}"`)}`,
    );
    return;
  }
  if (!state.session)
    state.session = {
      level,
      total: state.settings.length,
      done: 0,
      errors: 0,
      recent: [],
      question: null,
      attempts: 0,
    };
  go("play");
}
function nextQuestion() {
  const r = state.session;
  if (!r) return;
  if (!r.question) {
    r.question = M.generate(state.settings, r.level, state.stats, r.recent);
    r.recent.push(r.question.key);
    r.recent = r.recent.slice(-12);
    r.attempts = 0;
  }
  entry = "";
  feedback = null;
  locked = false;
  started = performance.now();
  save();
}
function play() {
  if (!state.session) {
    go("map");
    return;
  }
  nextQuestion();
  renderPlay();
}
function renderPlay() {
  const r = state.session,
    q = r.question,
    w = M.worlds[Math.floor(r.level / 3)];
  main.innerHTML = `<div class="play-top">${button("← Pause & Karte", "map", "text-button")}<span>${w.name} <b>· Level ${r.level + 1}</b></span><span class="series">ϟ ${state.streak} in Folge</span></div><section class="play-layout"><aside class="companion"><div class="companion-scene"><img src="assets/world-${Math.floor(r.level / 3)}.svg" alt="">${fox()}</div><h2>Du schaffst das!</h2><p>Ich bin bei dir.<br>Wir rechnen Schritt für Schritt.</p><div class="reward-card"><span>✧ Deine nächste Schatztruhe</span><b>${[0, 1, 2].filter((j) => state.completed[Math.floor(r.level / 3) * 3 + j]).length} von 3 Leveln</b></div>${state.completed[r.level] ? '<p class="small">Übungsrunde: keine neuen Punkte oder Sterne.</p>' : ""}</aside><div class="exercise"><div class="exercise-heading"><span class="eyebrow">${r.total ? "AUFGABE " + (r.done + 1) + " VON " + r.total : "FREIES ÜBEN · " + r.done + " GESCHAFFT"}</span><span id="exercise-points">✦ ${state.points} Punkte</span></div><div class="progress"><i style="width:${r.total ? (r.done / r.total) * 100 : 100}%"></i></div><h1 class="equation" aria-label="${q.a} ${q.op === "add" ? "plus" : "minus"} ${q.b}">${q.a} <span>${q.op === "add" ? "+" : "−"}</span> ${q.b} <span>=</span> <output id="answer" aria-label="Deine Antwort">?</output></h1><p id="feedback" class="feedback" role="status">${r.attempts && state.settings.hints && r.attempts >= 2 ? M.hint(q, r.attempts >= 4) : "Welche Zahl fehlt? Du hast alle Zeit der Welt."}</p><div id="controls">${
    state.settings.mode === "choice"
      ? `<div class="choices">${M.choices(q, state.settings.range)
          .map((n) => `<button data-choice="${n}">${n}</button>`)
          .join("")}</div>`
      : `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-digit="${n}">${n}</button>`).join("")}<button class="delete" data-action="delete" aria-label="Letzte Ziffer löschen">⌫ <small>Löschen</small></button><button data-digit="0">0</button><button class="confirm" data-action="submit" aria-label="Antwort bestätigen">✓ <small>Bestätigen</small></button></div>`
  }</div><div class="exercise-bottom"><span>♡ Fehler gehören zum Lernen.</span>${state.settings.hints ? button("Kleiner Tipp", "hint", "text-button") : ""}</div></div></section>`;
}
function digit(n) {
  if (locked || !state.session || view !== "play") return;
  if (entry.length < 3) {
    entry = entry === "0" ? String(n) : entry + n;
    document.querySelector("#answer").textContent = entry;
  }
}
function submit(value) {
  if (locked || view !== "play" || !state.session) return;
  if (value === undefined && entry === "") {
    document.querySelector("#feedback").textContent =
      "Tippe zuerst deine Antwort ein.";
    return;
  }
  const q = state.session.question,
    level = state.session.level,
    done = state.session.done + 1,
    total = state.session.total;
  const result = M.answer(
    state,
    value === undefined ? Number(entry) : value,
    (performance.now() - started) / 1000,
    day(),
  );
  save();
  updateHeader();
  if (!result.correct) {
    sound("error");
    document.querySelector("#feedback").textContent =
      result.attempts >= 2 && state.settings.hints
        ? M.hint(q, result.attempts >= 4)
        : "Fast! Schau noch einmal genau hin. Du kannst es noch einmal versuchen.";
    document.querySelector("#feedback").className = "feedback gentle";
    entry = "";
    document.querySelector("#answer").textContent = "?";
    document.querySelector(".series").textContent = "ϟ 0 in Folge";
    return;
  }
  locked = true;
  document.querySelector("#exercise-points").textContent =
    `✦ ${state.points} Punkte`;
  sound(result.finished ? "win" : result.bonus ? "bonus" : "right");
  document.querySelector("#answer").textContent = q.answer;
  document.querySelector("#answer").classList.add("correct");
  document.querySelector("#feedback").textContent = result.bonus
    ? `Super Serie! +${result.points} Punkte. Fino freut sich mit dir!`
    : result.replay
      ? "Prima gerechnet! Übung macht dich stärker."
      : `Genau richtig! +${result.points} Punkte. Gut gemacht!`;
  document.querySelector("#feedback").className = "feedback success";
  document.querySelector(".progress i").style.width = total
    ? (done / total) * 100 + "%"
    : "100%";
  document.querySelector(".series").textContent = `ϟ ${state.streak} in Folge`;
  document.querySelector("#controls").innerHTML =
    `<div class="correct-panel"><div class="celebrate">✦</div><h2>${result.finished ? "Du hast es geschafft!" : "Ein Schritt weiter!"}</h2>${button(result.finished ? "Deine Belohnung ansehen →" : "Nächste Aufgabe →", result.finished ? "result" : "next")}</div>`;
  feedback = { result, level };
  document.querySelector("#controls button").focus({ preventScroll: true });
}
function showResult() {
  if (!feedback) return;
  const { result: r, level } = feedback,
    w = M.worlds[Math.floor(level / 3)];
  main.innerHTML = `<section class="result"><span class="eyebrow">${r.newWorld ? "WELT GESCHAFFT!" : "LEVEL " + (level + 1) + " GESCHAFFT!"}</span><div class="result-stars">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</div>${r.newWorld ? '<img class="chest-art" src="assets/chest.svg" alt="Deine goldene Schatztruhe">' : fox()}<h1>${r.newWorld ? "Ein ganz besonderer Fund!" : "Das hast du toll gemacht."}</h1><p>${r.newWorld ? w.name + " ist geschafft. Deine Schatztruhe wartet auf dich!" : r.replay ? "Du hast fleißig geübt. Dein ursprünglicher Sternestand bleibt erhalten." : "Jeder Rechenschritt macht dich stärker. Fino ist stolz auf dich!"}</p>${button(r.newWorld ? "Schatztruhe öffnen ✧" : "Weiter auf dem Pfad →", r.newWorld ? "chest" : "map")}${button("Meine Schätze", "collection", "text-button")}</section>`;
}
function chest() {
  const i = feedback ? Math.floor(feedback.level / 3) : unlocked(),
    w = M.worlds[i];
  sound("win");
  main.innerHTML = `<section class="result"><span class="eyebrow">DEIN NEUER SCHATZ</span><div class="treasure">${w.symbol}</div><h1>${w.item}</h1><p>Ein kleines Erinnerungsstück an dein Abenteuer in ${w.name}.</p><div class="unlock-message">${i < 4 ? "✦ " + M.worlds[i + 1].name + " ist jetzt freigeschaltet!" : "✦ Alle fünf Welten entdeckt! Du bist ein echter Mathe-Abenteurer."}</div>${button("Weiter entdecken →", "map")}${button("Zur Schatzkammer", "collection", "text-button")}</section>`;
}
function modal(title, text, actions) {
  dialog.innerHTML = `<button class="dialog-close icon-button" data-action="close" aria-label="Dialog schließen">×</button><h2 id="dialog-title">${title}</h2><p>${text}</p><div class="dialog-actions">${actions}</div>`;
  if (!dialog.open) dialog.showModal();
}
function gate() {
  modal(
    "Ein Moment für die Großen",
    "Für Einstellungen und Lernfortschritt: Wie viel ist 7 × 8?",
    `<form id="gate-form"><label for="gate-answer">Antwort</label><input id="gate-answer" type="number" inputmode="numeric" required autocomplete="off"><p id="gate-error" role="status"></p><button class="primary" type="submit">Elternbereich öffnen</button></form>`,
  );
  document.querySelector("#gate-answer").focus();
}
const option = (value, label, current) =>
  `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`;
function parents() {
  const s = state.settings,
    st = state.stats,
    attempts = st.correct + st.wrong;
  const errors = Object.entries(st.types)
    .filter(([, v]) => v.errors)
    .sort((a, b) => b[1].errors - a[1].errors)
    .slice(0, 4);
  main.innerHTML = `<div class="section-heading page-title"><div><span class="eyebrow">RAUM FÜR DIE GROSSEN</span><h1>Begleiten, nicht antreiben.</h1><p>Alle Einstellungen und Lerndaten bleiben auf diesem Gerät.</p></div>${button("Zurück zum Abenteuer", "home", "secondary")}</div><div class="parent-grid"><section class="panel"><h2>Lernfortschritt</h2><div class="metrics">${[
    ["Heute gelöst", st.today[day()] || 0],
    ["Insgesamt gelöst", st.solved],
    ["Richtige Antworten", st.correct],
    ["Weitere Versuche", st.wrong],
    [
      "Trefferquote",
      attempts ? Math.round((st.correct / attempts) * 100) + " %" : "–",
    ],
    ["Beste Serie", state.best],
    ["Punktestand", state.points],
    ["Level geschafft", count() + "/15"],
    ["Welten geöffnet", unlocked() + 1],
  ]
    .map(([a, b]) => `<div><b>${b}</b><span>${a}</span></div>`)
    .join(
      "",
    )}</div><p class="small muted">Die Trefferquote zählt alle Antwortversuche. „Gelöst“ zählt abgeschlossene Aufgaben einschließlich Wiederholungen.</p><h3>Das darf noch wachsen</h3>${
    errors.length
      ? errors
          .map(([k, v]) => {
            const [op, cross, range] = k.split("-");
            return `<p class="error-type">${op === "add" ? "Addition" : "Subtraktion"} ${cross === "cross" ? "mit" : "ohne"} Zehnerübergang · bis ${range}<b>${v.errors} weitere Versuche</b></p>`;
          })
          .join("")
      : "<p>Noch keine Fehlerschwerpunkte. In Ruhe entdecken!</p>"
  }<div class="privacy"><b>♡ Lernen bleibt privat.</b><p>Kein Konto, kein Tracking und keine Übertragung von Lernstatistiken. Beim Laden und bei Aktualisierungen lädt der Browser nur die App-Dateien vom gewählten Webhoster.</p></div></section><section class="panel"><h2>So passt es zu deinem Kind</h2><form id="settings-form"><label>Zahlenraum<select name="range">${[20, 50, 100].map((n) => option(n, "Bis " + n, s.range)).join("")}</select></label><fieldset><legend>Aufgabenarten</legend><label class="toggle"><input name="add" type="checkbox" ${s.add ? "checked" : ""}> Addition</label><label class="toggle"><input name="sub" type="checkbox" ${s.sub ? "checked" : ""}> Subtraktion</label></fieldset><label class="toggle"><input name="cross" type="checkbox" ${s.cross ? "checked" : ""}> Zehnerübergang erlauben</label><label>Antwortmodus<select name="mode">${option("keypad", "Zahlentastatur", s.mode)}${option("choice", "Multiple Choice", s.mode)}</select></label><label>Schwierigkeit<select name="difficulty">${option(0, "Automatisch – passend zur Welt", s.difficulty)}${[1, 2, 3, 4, 5].map((n) => option(n, "Manuell · Stufe " + n, s.difficulty)).join("")}</select></label><p class="small muted">Stufen: bis 10, 30, 50, 100 und gemischt bis 100. Der gewählte Zahlenraum bleibt die Obergrenze. Automatisch werden Fehlertypen und längere Lösungszeiten sanft berücksichtigt.</p><label>Rundenlänge<select name="length">${[5, 10, 20, 0].map((n) => option(n, n ? n + " Aufgaben" : "Unbegrenzt · freies Üben", s.length)).join("")}</select></label><label class="toggle"><input name="hints" type="checkbox" ${s.hints ? "checked" : ""}> Hilfestellungen</label><label class="toggle"><input name="sound" type="checkbox" ${s.sound ? "checked" : ""}> Dezente Sounds</label><label class="toggle"><input name="motion" type="checkbox" ${s.motion ? "checked" : ""}> Animationen (aus = reduziert)</label><p class="small muted">Geänderte Lern-Einstellungen starten eine angefangene Runde neu; bereits verdiente Punkte bleiben erhalten. Freies Üben schaltet keine Level frei.</p><p id="settings-status" role="status"></p><button class="primary" type="submit">Einstellungen speichern ✓</button></form><hr>${button("Fortschritt zurücksetzen", "reset", "danger")}</section></div>`;
}
function settings(form) {
  const f = new FormData(form);
  if (!f.has("add") && !f.has("sub")) {
    document.querySelector("#settings-status").textContent =
      "Bitte mindestens eine Aufgabenart aktivieren.";
    return;
  }
  const old = state.settings,
    next = {
      range: Number(f.get("range")),
      add: f.has("add"),
      sub: f.has("sub"),
      cross: f.has("cross"),
      mode: f.get("mode"),
      difficulty: Number(f.get("difficulty")),
      length: Number(f.get("length")),
      hints: f.has("hints"),
      sound: f.has("sound"),
      motion: f.has("motion"),
    };
  if (
    ["range", "add", "sub", "cross", "difficulty", "length"].some(
      (k) => old[k] !== next[k],
    )
  )
    state.session = null;
  state.settings = next;
  save();
  updateHeader();
  document.querySelector("#settings-status").textContent = storageFailed
    ? "Speichern auf diesem Gerät derzeit nicht möglich."
    : "Gespeichert. Viel Freude beim nächsten Abenteuer!";
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.nav) {
    go(b.dataset.nav);
    return;
  }
  if (b.id === "parent") {
    gate();
    return;
  }
  if (b.dataset.world !== undefined) {
    selectedWorld = Number(b.dataset.world);
    go("levels");
    return;
  }
  if (b.dataset.level !== undefined) {
    start(Number(b.dataset.level));
    return;
  }
  if (b.dataset.digit !== undefined) {
    digit(b.dataset.digit);
    return;
  }
  if (b.dataset.choice !== undefined) {
    submit(Number(b.dataset.choice));
    return;
  }
  const a = b.dataset.action;
  if (["home", "map", "collection"].includes(a)) {
    go(a);
    return;
  }
  if (a === "continue")
    start(state.session ? state.session.level : Math.min(count(), 14));
  if (a === "resume") {
    dialog.close();
    go("play");
  }
  if (a === "replace") {
    state.session = null;
    dialog.close();
    start(Number(b.dataset.levelTarget));
  }
  if (a === "delete" && !locked) {
    entry = entry.slice(0, -1);
    document.querySelector("#answer").textContent = entry || "?";
  }
  if (a === "submit") submit();
  if (a === "next") {
    nextQuestion();
    renderPlay();
  }
  if (a === "hint" && state.session?.question && !locked)
    document.querySelector("#feedback").textContent = M.hint(
      state.session.question,
    );
  if (a === "result") showResult();
  if (a === "chest") chest();
  if (a === "close") dialog.close();
  if (a === "reset")
    modal(
      "Fortschritt wirklich löschen?",
      "Punkte, Sterne, Schätze und Statistiken werden auf diesem Gerät gelöscht. Tippe LÖSCHEN ein, um das zu bestätigen. Deine Einstellungen bleiben erhalten.",
      `<form id="reset-form"><label for="reset-text">Bestätigung</label><input id="reset-text" name="confirmation" autocomplete="off" required><p id="reset-error" role="status"></p><button class="danger" type="submit">Jetzt Fortschritt löschen</button></form>`,
    );
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "settings-form") settings(e.target);
  if (e.target.id === "gate-form") {
    if (Number(document.querySelector("#gate-answer").value) === 56) {
      dialog.close();
      go("parents");
    } else
      document.querySelector("#gate-error").textContent =
        "Das passt noch nicht. Bitte noch einmal prüfen.";
  }
  if (e.target.id === "reset-form") {
    if (
      new FormData(e.target).get("confirmation").trim().toUpperCase() !==
      "LÖSCHEN"
    ) {
      document.querySelector("#reset-error").textContent =
        "Bitte LÖSCHEN eingeben.";
      return;
    }
    const settings = state.settings;
    state = M.fresh();
    state.settings = settings;
    save();
    dialog.close();
    parents();
    updateHeader();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    dialog.open ||
    view !== "play" ||
    /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (locked) return;
  if (/^\d$/.test(e.key) && state.settings.mode === "keypad") {
    e.preventDefault();
    digit(e.key);
  } else if (e.key === "Backspace" && state.settings.mode === "keypad") {
    e.preventDefault();
    entry = entry.slice(0, -1);
    document.querySelector("#answer").textContent = entry || "?";
  } else if (
    e.key === "Enter" &&
    state.settings.mode === "keypad" &&
    (!e.target.closest("button") ||
      e.target.closest(
        "[data-digit], [data-action=submit], [data-action=delete]",
      ))
  ) {
    e.preventDefault();
    submit();
  }
});
document.querySelector(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  go("home");
});
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
  else started = performance.now();
});
async function offlineSetup() {
  const hadController = !!navigator.serviceWorker?.controller;
  const label = document.querySelector("#offline");
  if (!("serviceWorker" in navigator)) {
    label.textContent = "○ Offline-Installation hier nicht verfügbar";
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("service-worker.js");
    await navigator.serviceWorker.ready;
    label.textContent = "● Bereit für dein Offline-Abenteuer";
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      if (worker)
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            label.innerHTML =
              '<button class="text-button" id="update-app">Neue Version · jetzt laden</button>';
            document.querySelector("#update-app").onclick = () => {
              save();
              worker.postMessage({ type: "SKIP_WAITING" });
            };
          }
        });
    });
    if (reg.waiting) {
      label.innerHTML =
        '<button class="text-button" id="update-app">Neue Version · jetzt laden</button>';
      document.querySelector("#update-app").onclick = () => {
        save();
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      };
    }
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && !reloading && navigator.serviceWorker.controller) {
        reloading = true;
        location.reload();
      }
    });
  } catch (e) {
    label.textContent =
      "○ Offline-Speicher noch nicht bereit · online neu laden";
  }
}
render();
storageNotice();
offlineSetup();
