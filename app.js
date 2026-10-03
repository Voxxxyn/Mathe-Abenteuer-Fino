/* Funkelpfad — entirely local, static and dependency-free. */
"use strict";
const M = window.Mathe,
  KEY = M.STORAGE.current,
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
  storageFailed = false,
  storageBlocked = false,
  clockMark = null,
  pendingTraining = null,
  pendingImport = null;
try {
  state = M.load(localStorage).state;
} catch (e) {
  if (e.state) state = e.state;
  storageFailed = true;
  storageBlocked = true;
}
function save() {
  syncClock(false);
  if (storageBlocked) { storageNotice(); return; }
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
    storageBlocked ? "Der vorhandene Spielstand konnte nicht sicher geladen oder gesichert werden. Er bleibt unverändert. Bitte exportiere die Originaldaten im Elternbereich und prüfe den Website-Speicher. Diese Runde wird noch nicht gespeichert." : "Der Spielstand kann gerade nicht dauerhaft gespeichert werden. Bitte erlaube Website-Speicher und verwende keinen privaten Tab.";
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
  `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
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
const colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
function applyTheme() {
  const dark = state.settings.theme === "dark" || (state.settings.theme === "system" && colorScheme?.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = dark ? "#17271f" : "#f6f5ee";
}
colorScheme?.addEventListener("change", applyTheme);
function updateHeader() {
  applyTheme();
  document.querySelectorAll("[data-area]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.area === state.settings.area)));
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
  if (["play", "rows"].includes(view) && state.session) { if (syncClock()) return; save(); }
  clockMark = null;
  view = next;
  const area = next === "training" ? "tables" : ["map","levels"].includes(next) ? "arithmetic" : ["play","rows"].includes(next) && state.session ? (state.session.area || "arithmetic") : state.settings.area;
  if (state.settings.area !== area) { state.settings.area = area; save(); }
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
  else if (view === "training") training();
  else if (view === "rows") rows();
}
function home() {
  const w = M.worlds[unlocked()],
    n = Math.min(count(), 14);
  main.innerHTML = `<section class="welcome-line"><span class="eyebrow">KLEINE SCHRITTE. GROSSE ABENTEUER.</span><span class="small-tag">Für kleine Entdecker · Mathe bis 100</span></section><section class="hero"><div class="hero-copy"><span class="pill">✦ Rechnen kann ein Abenteuer sein</span><h1>Ein bisschen Mathe.<br>Ganz viel <em>Magie.</em></h1><p>Entdecke mit Fino neue Welten,<br>knacke Rechenrätsel und finde deine Schätze.</p>${button(state.session ? "Abenteuer fortsetzen <span>→</span>" : count() === 15 ? "Noch eine Runde spielen <span>→</span>" : "Los geht’s, Fino! <span>→</span>", "continue")}<div class="hero-note"><span class="tiny-fox">✧</span> ${state.settings.tempo === "off" ? "In deinem Tempo. Ohne Zeitdruck." : "In deinem Tempo. Dein Tempo-Training wartet."}</div></div><div class="hero-art"><img class="landscape" src="assets/world-${unlocked()}.svg" alt="Ein geschwungener Weg durch ${w.name}"><span class="art-label">DEINE REISE BEGINNT HIER</span><div class="speech">Komm, wir entdecken<br>deine Superkraft!</div>${fox("hero-fox")}<span class="floating-star s1">✦</span><span class="floating-star s2">✧</span></div></section><section class="stats-strip" aria-label="Dein Fortschritt"><div><span class="stat-icon gold">✦</span><span><b>${starCount()} Sterne</b><small>Jeder Schritt zählt</small></span></div><div><span class="stat-icon mint">⚑</span><span><b>${count()} von 15 Leveln</b><small>Deine Entdeckungsreise</small></span></div><div><span class="stat-icon peach">◇</span><span><b>${state.items.length} Schätze</b><small>Ganz allein verdient</small></span></div><div><span class="stat-icon lilac">ϟ</span><span><b>${state.best} in Folge</b><small>Deine beste Serie</small></span></div></section><section class="section-heading"><div><span class="eyebrow">DEINE ABENTEUERKARTE</span><h2>Fünf Welten. Unzählige Aha-Momente.</h2></div>${button("Karte entdecken →", "map", "text-button")}</section><div class="world-grid">${M.worlds.map((w, i) => worldCard(w, i)).join("")}</div><div class="bottom-note"><span>♡</span> Ein sicherer Ort zum Lernen. Ohne Werbung. Ohne Anmeldung.</div>`;
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
  if (!state.session) state.session = M.startSession({...state.settings, area: "arithmetic"}, level);
  go(state.session.layout === "rows" ? "rows" : "play");
}
function nextQuestion() {
  const r = state.session;
  if (!r) return;
  if (!r.question) {
    r.question = M.generate(r.learning || {...state.settings,area:"arithmetic"}, r.level, state.stats, r.recent);
    r.questionMs = r.kind ? 0 : undefined;
    r.recent.push(r.question.key);
    r.recent = r.recent.slice(-12);
    r.attempts = 0;
  }
  entry = "";
  feedback = null;
  locked = false;
  started = performance.now();
  clockMark = performance.now();
  save();
}
function play() {
  if (!state.session) {
    go("map");
    return;
  }
  if (state.session.timer?.mode === "countdown" && state.session.timer.elapsed >= state.session.timer.limit) { endTimedRound(); return; }
  nextQuestion();
  renderPlay();
}
function renderPlay() {
  const r = state.session,
    q = r.question,
    w = M.worlds[Math.floor(r.level / 3)],
    learning = r.learning || state.settings;
  main.innerHTML = `<div class="play-top">${button("← Pause & Karte", "map", "text-button")}<span>${r.kind === "training" ? (r.area === "tables" ? "Einmaleins-Training" : "Tempo-Training · " + w.name) : w.name + " <b>· Level " + (r.level + 1) + "</b>"}</span><span class="series">ϟ ${state.streak} in Folge</span></div>${timerMarkup(r)}<section class="play-layout"><aside class="companion"><div class="companion-scene"><img src="assets/world-${Math.floor(r.level / 3)}.svg" alt="">${fox()}</div><h2>Du schaffst das!</h2><p>Ich bin bei dir.<br>Wir rechnen Schritt für Schritt.</p><div class="reward-card"><span>${r.kind === "training" ? "✧ Training mit Fino" : "✧ Deine nächste Schatztruhe"}</span><b>${r.kind === "training" ? "Punkte und Serien sammeln" : [0, 1, 2].filter((j) => state.completed[Math.floor(r.level / 3) * 3 + j]).length + " von 3 Leveln"}</b></div>${r.kind !== "training" && state.completed[r.level] ? '<p class="small">Übungsrunde: keine neuen Punkte oder Sterne.</p>' : ""}</aside><div class="exercise"><div class="exercise-heading"><span class="eyebrow">${r.total ? "AUFGABE " + (r.done + 1) + " VON " + r.total : "FREIES ÜBEN · " + r.done + " GESCHAFFT"}</span><span id="exercise-points">✦ ${state.points} Punkte</span></div><div class="progress"><i style="width:${r.total ? (r.done / r.total) * 100 : 100}%"></i></div><h1 class="equation" aria-label="${q.a} ${({add:"plus",sub:"minus",mul:"mal",div:"geteilt durch"})[q.op]} ${q.b}">${q.a} <span>${M.signs[q.op]}</span> ${q.b} <span>=</span> <output id="answer" aria-label="Deine Antwort">?</output></h1><p id="feedback" class="feedback" role="status">${r.attempts && state.settings.hints && r.attempts >= 2 ? M.hint(q, r.attempts >= 4) : r.timer?.mode !== "off" && r.timer ? "Welche Zahl fehlt? Rechne in deinem Tempo." : "Welche Zahl fehlt? Du hast alle Zeit der Welt."}</p><div id="controls">${
    learning.mode === "choice"
      ? `<div class="choices">${M.choices(q, r.area === "tables" ? 100 : learning.range)
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
  if (syncClock()) return;
  const round = state.session,
    q = state.session.question,
    level = state.session.level,
    done = state.session.done + 1,
    total = state.session.total;
  const result = M.answer(
    state,
    value === undefined ? Number(entry) : value,
    round.kind ? round.questionMs / 1000 : (performance.now() - started) / 1000,
    day(),
  );
  if (round.kind) round.questionMs = 0;
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
  feedback = { result, level, training: round.kind === "training", summary: result.finished && round.kind ? state.training.last : null };
  if (result.finished) clockMark = null;
  document.querySelector("#controls button").focus({ preventScroll: true });
}
function showResult() {
  if (!feedback) return;
  if (feedback.training) { showTrainingResult(feedback.summary || state.training.last); return; }
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
  syncClock(false);
  clockMark = null;
  dialog.innerHTML = `<button class="dialog-close icon-button" data-action="close" aria-label="Dialog schließen">×</button><h2 id="dialog-title">${title}</h2><p>${text}</p><div class="dialog-actions">${actions}</div>`;
  if (!dialog.open) dialog.showModal();
}
function gate() {
  if (syncClock()) return;
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
  main.innerHTML = `<div class="section-heading page-title"><div><span class="eyebrow">RAUM FÜR DIE GROSSEN</span><h1>Begleiten, nicht antreiben.</h1><p>Alle Einstellungen und Lerndaten bleiben auf diesem Gerät. · Version ${M.VERSION}</p></div>${button("Zurück zum Abenteuer", "home", "secondary")}</div><div class="parent-grid"><section class="panel"><h2>Lernfortschritt</h2><div class="metrics">${[
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
    ["Multiplikation gelöst", typeSolved("mul")],
    ["Division gelöst", typeSolved("div")],
    ["Tempo-Runden", state.training.tempoRounds],
  ]
    .map(([a, b]) => `<div><b>${b}</b><span>${a}</span></div>`)
    .join(
      "",
    )}</div><p class="small muted">Die Trefferquote zählt alle Antwortversuche. „Gelöst“ zählt abgeschlossene Aufgaben einschließlich Wiederholungen.</p>${trainingStats()}<h3>Das darf noch wachsen</h3>${
    errors.length
      ? errors
          .map(([k, v]) => {
            const [op, cross, range] = k.split("-");
            return `<p class="error-type">${["mul","div"].includes(op) ? (op === "mul" ? "Multiplikation" : "Division") + " · " + range + "er-Reihe" : (op === "add" ? "Addition" : "Subtraktion") + " " + (cross === "cross" ? "mit" : "ohne") + " Zehnerübergang · bis " + range}<b>${v.errors} weitere Versuche</b></p>`;
          })
          .join("")
      : "<p>Noch keine Fehlerschwerpunkte. In Ruhe entdecken!</p>"
  }<div class="privacy"><b>♡ Lernen bleibt privat.</b><p>Kein Konto, kein Tracking und keine Übertragung von Lernstatistiken. Beim Laden und bei Aktualisierungen lädt der Browser nur die App-Dateien vom gewählten Webhoster.</p></div></section><section class="panel"><h2>So passt es zu deinem Kind</h2><form id="settings-form">${v2Settings(s)}<label>Zahlenraum<select name="range">${[20, 50, 100].map((n) => option(n, "Bis " + n, s.range)).join("")}</select></label><fieldset><legend>Aufgabenarten</legend><label class="toggle"><input name="add" type="checkbox" ${s.add ? "checked" : ""}> Addition</label><label class="toggle"><input name="sub" type="checkbox" ${s.sub ? "checked" : ""}> Subtraktion</label></fieldset><label class="toggle"><input name="cross" type="checkbox" ${s.cross ? "checked" : ""}> Zehnerübergang erlauben</label><label>Antwortmodus<select name="mode">${option("keypad", "Zahlentastatur", s.mode)}${option("choice", "Multiple Choice", s.mode)}</select></label><label>Schwierigkeit<select name="difficulty">${option(0, "Automatisch – passend zur Welt", s.difficulty)}${[1, 2, 3, 4, 5].map((n) => option(n, "Manuell · Stufe " + n, s.difficulty)).join("")}</select></label><p class="small muted">Stufen: bis 10, 30, 50, 100 und gemischt bis 100. Der gewählte Zahlenraum bleibt die Obergrenze. Automatisch werden Fehlertypen und längere Lösungszeiten sanft berücksichtigt.</p><label>Rundenlänge<select name="length">${[5, 10, 20, 0].map((n) => option(n, n ? n + " Aufgaben" : "Unbegrenzt · freies Üben", s.length)).join("")}</select></label><label class="toggle"><input name="hints" type="checkbox" ${s.hints ? "checked" : ""}> Hilfestellungen</label><label class="toggle"><input name="sound" type="checkbox" ${s.sound ? "checked" : ""}> Dezente Sounds</label><label class="toggle"><input name="motion" type="checkbox" ${s.motion ? "checked" : ""}> Animationen (aus = reduziert)</label><p class="small muted">Geänderte Lern-Einstellungen starten eine angefangene Runde neu; bereits verdiente Punkte bleiben erhalten. Freies Üben schaltet keine Level frei.</p><p id="settings-status" role="status"></p><button class="primary" type="submit">Einstellungen speichern ✓</button></form><hr><h3>Spielstand sichern</h3><div class="save-actions">${button("Spielstand exportieren", "export", "secondary")}${button("Spielstand importieren", "import", "secondary")}${storageBlocked ? button("Originaldaten retten", "recover", "secondary") : ""}<input id="import-file" type="file" accept=".json,application/json" hidden></div><p id="save-status" role="status"></p><hr>${button("Fortschritt zurücksetzen", "reset", "danger")}</section></div>`;
}
function settings(form) {
  const f = new FormData(form);
  if (!f.has("add") && !f.has("sub")) {
    document.querySelector("#settings-status").textContent =
      "Bitte mindestens eine Aufgabenart aktivieren.";
    return;
  }
  if (!f.has("mul") && !f.has("div")) { document.querySelector("#settings-status").textContent = "Bitte mindestens Multiplikation oder Division aktivieren."; return; }
  const tables = f.getAll("tables").map(Number).sort((a,b) => a-b);
  if (!tables.length) { document.querySelector("#settings-status").textContent = "Bitte mindestens eine Reihe auswählen."; return; }
  const old = state.settings,
    next = {
      area: f.get("area"), mul: f.has("mul"), div: f.has("div"), tables,
      theme: f.get("theme"), tempo: f.get("tempo"), duration: Number(f.get("duration")),
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
    ["range", "add", "sub", "cross", "difficulty", "length", "area", "mul", "div", "tables", "tempo", "duration", "mode", "hints"].some(
      (k) => JSON.stringify(old[k]) !== JSON.stringify(next[k]),
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
  if (b.dataset.area) {
    state.settings.area = b.dataset.area;
    save(); go(b.dataset.area === "tables" ? "training" : "home"); return;
  }
  if (b.dataset.selectTables) {
    const boxes = b.closest("form").querySelectorAll('[name="tables"]');
    boxes.forEach(el => el.checked = b.dataset.selectTables === "all"); return;
  }
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
  if (a === "continue") {
    if (state.session) go(state.session.layout === "rows" ? "rows" : "play");
    else if (state.settings.area === "tables") go("training");
    else start(Math.min(count(), 14));
  }
  if (a === "training") go("training");
  if (a === "training-start") beginTraining();
  if (a === "training-replace") { state.session = null; dialog.close(); createTraining(pendingTraining); pendingTraining = null; }
  if (a === "export") download(M.exportSave(state), `funkelpfad-spielstand-${day()}.json`);
  if (a === "recover") {
    try { download({legacy: localStorage.getItem(M.STORAGE.legacy), current: localStorage.getItem(KEY), backup: localStorage.getItem(M.STORAGE.backup)}, `funkelpfad-originaldaten-${day()}.json`); }
    catch (e) { document.querySelector("#save-status").textContent = "Website-Speicher ist nicht lesbar."; }
  }
  if (a === "import") document.querySelector("#import-file").click();
  if (a === "import-confirm") {
    try {
      state = M.importSave(localStorage,pendingImport,state);
      pendingImport = null; storageBlocked = false; storageFailed = false;
      dialog.close(); parents(); updateHeader(); storageNotice();
      document.querySelector("#save-status").textContent = "Spielstand importiert. Der vorherige Stand wurde lokal gesichert.";
    } catch(e) { document.querySelector("#import-status").textContent = "Import abgebrochen: " + e.message; }
  }
  if (a === "resume") {
    dialog.close();
    go(state.session.layout === "rows" ? "rows" : "play");
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
  if (a === "close") { dialog.close(); pendingImport = null; clockMark = performance.now(); }
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
  if (e.target.matches("[data-row-form]")) submitRow(Number(e.target.dataset.rowForm));
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
window.addEventListener("pagehide", () => { save(); clockMark = null; });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { save(); clockMark = null; }
  else { started = performance.now(); clockMark = performance.now(); }
});
dialog.addEventListener("close", () => { clockMark = performance.now(); pendingImport = null; });
document.addEventListener("change", async e => {
  if (e.target.id !== "import-file" || !e.target.files?.[0]) return;
  const file = e.target.files[0];
  try {
    if (file.size > 2000000) throw Error("Die Datei ist zu groß.");
    const payload = JSON.parse(await file.text());
    const validated = M.validate(payload?.format === "funkelpfad-save" ? payload.state : payload);
    if (payload.format && payload.format !== "funkelpfad-save") throw Error("Unbekannte Exportdatei.");
    pendingImport = payload;
    modal("Spielstand importieren?", `Dieser Spielstand enthält ${validated.points} Punkte, ${Object.keys(validated.completed).length} Level und ${validated.items.length} Schätze. Der aktuelle Stand wird vor dem Ersetzen lokal gesichert.`, `${button("Spielstand übernehmen", "import-confirm")}${button("Abbrechen", "close", "secondary")}<p id="import-status" role="status"></p>`);
  } catch(e) { document.querySelector("#save-status").textContent = "Import abgebrochen: " + e.message; }
  e.target.value = "";
});
function download(payload, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)], {type:"application/json"}));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("#save-status").textContent = "Export bereit. Bitte die Datei sicher aufbewahren.";
}
function formatTime(ms) {
  const seconds = Math.max(0,Math.floor(ms/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}
function timerMarkup(r) {
  return r.timer?.mode !== "off" && r.timer ? `<div class="tempo-strip"><span>${r.timer.mode === "countdown" ? "✧ Deine verbleibende Zeit" : "✧ Deine Stoppuhr"}</span><b id="round-clock" role="timer">${formatTime(r.timer.mode === "countdown" ? r.timer.limit-r.timer.elapsed : r.timer.elapsed)}</b><small>Pause beim Verlassen · In deinem Tempo</small></div>` : "";
}
function syncClock(check = true) {
  const now = performance.now(), r = state.session;
  if (clockMark !== null && r?.kind && ["play","rows"].includes(view) && !dialog.open) {
    const expired = M.tick(r,now-clockMark);
    clockMark = now;
    if (expired && check) { endTimedRound(); return true; }
  }
  return false;
}
setInterval(() => {
  if (document.hidden || dialog.open || !["play","rows"].includes(view) || !state.session) return;
  if (syncClock()) return;
  const r = state.session, label = document.querySelector("#round-clock");
  if (label) label.textContent = formatTime(r.timer.mode === "countdown" ? r.timer.limit-r.timer.elapsed : r.timer.elapsed);
},250);
function endTimedRound() {
  const summary = M.finishRound(state);
  clockMark = null; locked = true;
  save(); updateHeader(); showTrainingResult(summary);
}
function showTrainingResult(summary) {
  if (!summary) return;
  view = "training-result";
  const accuracy = summary.attempts ? Math.round(summary.correct/summary.attempts*100) : 0;
  const record = state.training.records[summary.profile];
  main.innerHTML = `<section class="result"><span class="eyebrow">DEIN TRAINING MIT FINO</span>${fox()}<h1>Das hast du toll gemacht.</h1><p>${summary.correct} Aufgaben gelöst · ${summary.correct} richtige Antwortversuche von ${summary.attempts} · ${accuracy} % Trefferquote</p><div class="badge-row"><span>ϟ Beste Serie: ${summary.best}</span><span>✧ ${formatTime(summary.elapsed)}</span></div>${record ? `<p>Deine Bestzeit für genau dieses Aufgabenprofil: ${formatTime(record)} (fehlerfreie Runde)</p>` : ""}<p>Deine Punkte und Serien zählen weiter. Deine Abenteuersterne und Schätze bleiben erhalten.</p>${button("Weiter trainieren →", "training")}${button("Zur Abenteuerkarte", "map", "secondary")}</section>`;
  main.focus({preventScroll:true});
}
function tablePicker(s) {
  return `<fieldset class="table-picker"><legend>Deine Malreihen · mehrere möglich</legend><div class="table-options">${Array.from({length:10},(_,i)=>i+1).map(n=>`<label><input type="checkbox" name="tables" value="${n}" ${s.tables.includes(n)?"checked":""}><span>${n}er</span></label>`).join("")}</div><button type="button" class="text-button" data-select-tables="all">Alle Reihen · gemischt</button> <button type="button" class="text-button" data-select-tables="none">Auswahl leeren</button><p class="small muted">Einzelaufgaben mischen deine ausgewählten Reihen. Reihentraining übt eine komplette Reihe.</p></fieldset>`;
}
function tempoSettings(s) {
  return `<label>Tempo<select name="tempo">${option("off","Ohne Zeitdruck",s.tempo)}${option("countdown","Countdown",s.tempo)}${option("stopwatch","Stoppuhr",s.tempo)}</select></label><label>Countdown-Dauer<select name="duration">${[60,120,300,600].map(n=>option(n,n/60+" Minuten",s.duration)).join("")}</select></label>`;
}
function v2Settings(s) {
  return `<label>Rechenbereich<select name="area">${option("arithmetic","Plus & Minus",s.area)}${option("tables","Mal & Geteilt",s.area)}</select></label>${tablePicker(s)}<fieldset><legend>Einmaleins-Aufgabenarten</legend><label class="toggle"><input name="mul" type="checkbox" ${s.mul?"checked":""}> Multiplikation</label><label class="toggle"><input name="div" type="checkbox" ${s.div?"checked":""}> Division</label></fieldset><label>Darstellung<select name="theme">${option("light","Hell",s.theme)}${option("dark","Dunkel",s.theme)}${option("system","System / Automatisch",s.theme)}</select></label>${tempoSettings(s)}<p class="small muted">Tempo-Runden sammeln Punkte als ergänzendes Training. Abenteuerlevel werden im normalen Plus-/Minus-Modus abgeschlossen. Im Reihenmodus stehen normal und Stoppuhr zur Verfügung.</p>`;
}
function training() {
  const s = state.settings;
  main.innerHTML = `<div class="section-heading page-title"><div><span class="eyebrow">FINOS RECHENWERKSTATT</span><h1>Mal & Geteilt</h1><p>Entdecke deine Malreihen. Fino begleitet dich!</p></div>${fox()}</div><section class="panel training-panel"><form id="training-form">${tablePicker(s)}<fieldset><legend>Was möchtest du üben?</legend><label class="toggle"><input type="checkbox" name="mul" ${s.mul?"checked":""}> Mal ×</label><label class="toggle"><input type="checkbox" name="div" ${s.div?"checked":""}> Geteilt ÷</label></fieldset><label>Übungsmodus<select name="layout"><option value="single">Einzelaufgaben · gemischt</option><option value="rows">Eine ganze Reihe</option></select></label><label>Reihe für das Reihentraining<select name="row">${Array.from({length:10},(_,i)=>i+1).map(n=>option(n,n+"er-Reihe",s.tables[0])).join("")}</select></label><label>Reihentraining-Aufgaben<select name="rowOp">${option("mul","Mal ×",s.mul?"mul":"div")}${option("div","Geteilt ÷",s.mul?"mul":"div")}</select></label>${tempoSettings(s)}<p class="small muted">Einzelaufgaben nutzen deine Zahlentastatur oder Multiple Choice. Ganze Reihen nutzen die Systemtastatur. Beim Reihentraining wird ein gewählter Countdown ausgeschaltet.</p><p id="training-status" role="status"></p>${button("Mit Fino üben →","training-start")}${state.session ? button("Angefangene Runde fortsetzen","continue","secondary") : ""}</form></section>`;
}
function beginTraining() {
  const f = new FormData(document.querySelector("#training-form")), tables = f.getAll("tables").map(Number).sort((a,b)=>a-b), layout = f.get("layout"), row = Number(f.get("row")), rowOp = f.get("rowOp");
  if (!tables.length || (!f.has("mul") && !f.has("div")) || (layout === "rows" && (!tables.includes(row) || !f.has(rowOp)))) {
    document.querySelector("#training-status").textContent = "Wähle mindestens eine Reihe und Aufgabenart. Für eine ganze Reihe muss auch diese Reihe und ihre Aufgabenart ausgewählt sein."; return;
  }
  const config = {settings:{...state.settings,area:"tables",tables,mul:f.has("mul"),div:f.has("div"),tempo:f.get("tempo"),duration:Number(f.get("duration"))},layout,row,rowOp};
  if (state.session) {
    pendingTraining = config;
    modal("Deine Runde wartet", "Möchtest du deine angefangene Runde fortsetzen oder ein neues Training beginnen? Deine bisher verdienten Punkte bleiben erhalten.", `${button("Angefangene Runde fortsetzen","resume")}${button("Neues Training beginnen","training-replace","secondary")}`); return;
  }
  createTraining(config);
}
function createTraining(config) {
  state.settings = config.settings;
  state.session = M.startSession(state.settings,Math.min(count(),14),"training",config.layout,config.row,config.rowOp);
  save(); go(config.layout === "rows" ? "rows" : "play");
}
function rows() {
  const r = state.session;
  if (!r || r.layout !== "rows") { go("training"); return; }
  if (!r.question) { r.question = M.rowQuestions(r.row,r.rowOp)[r.done]; r.questionMs = 0; r.attempts = 0; }
  clockMark = performance.now(); save();
  main.innerHTML = `<div class="play-top">${button("← Pause & Karte","map","text-button")}<span>${r.row}er-Reihe · ${r.rowOp === "mul" ? "Mal" : "Geteilt"}</span><span class="series">ϟ ${state.streak} in Folge</span></div>${timerMarkup(r)}<section class="panel row-sheet"><div class="row-heading">${fox()}<div><span class="eyebrow">SCHRITT FÜR SCHRITT</span><h1>Deine ${r.row}er-Reihe</h1><p>Bestätige mit ✓ oder der Eingabetaste. Fino zeigt dir den nächsten Schritt.</p></div></div><p id="row-feedback" class="feedback" role="status">${r.done} von 10 geschafft. Du kannst jederzeit pausieren.</p>${M.rowQuestions(r.row,r.rowOp).map((q,i)=>`<form class="row-task ${i<r.done?"row-complete":""}" data-row-form="${i}"><label for="row-${i}">${q.a} ${M.signs[q.op]} ${q.b} =</label><input id="row-${i}" name="answer" type="text" inputmode="numeric" pattern="[0-9]{1,3}" maxlength="3" enterkeyhint="next" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Antwort für ${q.a} ${M.signs[q.op]} ${q.b}" ${i<r.done?`value="${q.answer}" readonly`:""} ${i>r.done?"disabled":""} required><button class="${i<r.done?"secondary":"primary"}" type="submit" ${i!==r.done?"disabled":""} aria-label="Aufgabe ${i+1} bestätigen">${i<r.done?"✓":"Bestätigen ✓"}</button></form>`).join("")}</section>`;
}
function submitRow(index) {
  const r = state.session;
  if (view !== "rows" || !r || index !== r.done || syncClock()) return;
  const input = document.querySelector(`#row-${index}`);
  if (!/^\d{1,3}$/.test(input.value)) { document.querySelector("#row-feedback").textContent = "Tippe eine ganze Zahl ein."; input.focus(); return; }
  const q = r.question, result = M.answer(state,Number(input.value),r.questionMs/1000,day());
  r.questionMs = 0;
  save(); updateHeader();
  if (!result.correct) {
    sound("error"); input.setAttribute("aria-invalid","true");
    document.querySelector("#row-feedback").textContent = r.attempts >= 2 && state.settings.hints ? M.hint(q,r.attempts>=4) : "Fast! Prüfe diese Zahl noch einmal. Fehler gehören zum Lernen.";
    input.focus(); input.select(); return;
  }
  sound(result.finished?"win":result.bonus?"bonus":"right");
  if (result.finished) { clockMark = null; showTrainingResult(state.training.last); return; }
  // Keep the focused native input interaction synchronous for iPad keyboard continuity.
  input.readOnly = true; input.removeAttribute("aria-invalid"); input.closest("form").classList.add("row-complete"); input.closest("form").querySelector("button").disabled = true;
  r.question = M.rowQuestions(r.row,r.rowOp)[r.done]; r.questionMs = 0;
  const next = document.querySelector(`#row-${r.done}`); next.disabled = false; next.closest("form").querySelector("button").disabled = false;
  document.querySelector("#row-feedback").textContent = `Prima! +${result.points} Punkte · ${r.done} von 10 geschafft.`;
  document.querySelector(".series").textContent = `ϟ ${state.streak} in Folge`;
  save(); next.focus();
}
function typeSolved(op) {
  return Object.entries(state.stats.types).filter(([k])=>k.startsWith(op+"-")).reduce((n,[,s])=>n+s.attempts-s.errors,0);
}
function trainingStats() {
  const totalSeconds = Object.values(state.stats.types).reduce((n,s)=>n+(s.seconds||0),0), measured = Object.values(state.stats.types).filter(s=>s.seconds!==undefined).reduce((n,s)=>n+s.timedAttempts,0);
  return `<h3>Deine Malreihen</h3><div class="table-statistics">${Array.from({length:10},(_,i)=>i+1).map(row=>{
    const types = ["mul","div"].map(op=>state.stats.types[`${op}-row-${row}`]).filter(Boolean), attempts = types.reduce((n,s)=>n+s.attempts,0), errors = types.reduce((n,s)=>n+s.errors,0), seconds=types.reduce((n,s)=>n+(s.seconds||0),0), timed=types.reduce((n,s)=>n+(s.timedAttempts||0),0);
    return `<p>${row}er-Reihe <b>${attempts-errors} gelöst · ${errors} Fehlversuche${timed?" · Ø "+(seconds/timed).toFixed(1)+" s":""}</b></p>`;
  }).join("")}</div><p class="small muted">Ø Bearbeitungszeit pro gemessenem Versuch: ${measured?(totalSeconds/measured).toFixed(1)+" s":"–"}. Frühere V1-Zeiten wurden nicht erfasst. Pausen werden abgezogen.</p><h3>Persönliche Bestzeiten</h3>${Object.entries(state.training.records).map(([key,value])=>{
    const p = key.split("|"); return `<p class="error-type">${p[0]==="tables"?"Mal & Geteilt":"Plus & Minus"} · ${p[1]==="rows"?p[2]+"er-Reihe "+(p[3]==="mul"?"×":"÷"):"Einzelaufgaben"} · ${p[4]} Aufgaben <b>${formatTime(value)}</b><small>Profil: Reihen ${p[15]} · ${p[16]==="choice"?"Auswahl":"Zahlentastatur"} · ${p[17]==="1"?"mit":"ohne"} Tipps · ${p[0]==="arithmetic"?"bis "+p[8]+", Stufe "+p[9]+", Welt "+(Math.floor(Number(p[7])/3)+1):"Mal "+(p[13]==="1"?"an":"aus")+", Geteilt "+(p[14]==="1"?"an":"aus")}</small></p>`;
  }).join("") || '<p class="small muted">Bestzeiten entstehen nach fehlerfreien Stoppuhr-Runden. Jedes Aufgabenprofil hat seine eigene Bestzeit.</p>'}`;
}
async function offlineSetup() {
  let hadController = !!navigator.serviceWorker?.controller;
  const label = document.querySelector("#offline");
  if (!("serviceWorker" in navigator)) {
    label.textContent = "○ Offline-Installation hier nicht verfügbar";
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("service-worker.js", {updateViaCache: "none"});
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
      hadController = !!navigator.serviceWorker.controller;
    });
  } catch (e) {
    label.textContent =
      "○ Offline-Speicher noch nicht bereit · online neu laden";
  }
}
render();
storageNotice();
offlineSetup();
