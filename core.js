/* Pure learning and progression logic. No network or browser dependencies. */
(function (root) {
  "use strict";
  const VERSION = typeof module !== "undefined" ? (require("./version.js"), globalThis.FINO_VERSION) : root.FINO_VERSION;
  const STORAGE = { current: "funkelpfad-v2", legacy: "funkelpfad-v1", backup: "funkelpfad-v1-backup-before-v2", importBackup: "funkelpfad-backup-before-import" };
  const defaults = {
    area: "arithmetic",
    mul: true,
    div: true,
    tables: [1,2,3,4,5,6,7,8,9,10],
    theme: "light",
    tempo: "off",
    duration: 120,
    range: 100,
    add: true,
    sub: true,
    cross: true,
    mode: "keypad",
    difficulty: 0,
    length: 10,
    hints: true,
    sound: true,
    motion: true,
  };
  const worlds = [
    {
      name: "Wiesendorf",
      subtitle: "Hier beginnt dein Abenteuer",
      color: "#41875e",
      item: "Sonnenblume",
      symbol: "✿",
    },
    {
      name: "Zauberwald",
      subtitle: "Zwischen Moos und Magie",
      color: "#307a75",
      item: "Waldkristall",
      symbol: "◆",
    },
    {
      name: "Wolkenburg",
      subtitle: "Rechne dich bis zu den Wolken",
      color: "#7570a8",
      item: "Zauberschlüssel",
      symbol: "⚿",
    },
    {
      name: "Vulkaninsel",
      subtitle: "Eine feurige Entdeckungsreise",
      color: "#bc684c",
      item: "Feuerstein",
      symbol: "◈",
    },
    {
      name: "Sternenmeer",
      subtitle: "Deine Reise zu den Sternen",
      color: "#55528b",
      item: "Sternenstaub",
      symbol: "✦",
    },
  ];
  const integer = (x, min, max, fallback = 0) =>
    Number.isInteger(x) && x >= min && x <= max ? x : fallback;
  const fresh = () => ({
    version: 2,
    points: 0,
    streak: 0,
    best: 0,
    completed: {},
    items: [],
    stats: { solved: 0, correct: 0, wrong: 0, today: {}, types: {} },
    settings: { ...defaults, tables: [...defaults.tables] },
    training: { rounds: 0, tempoRounds: 0, records: {}, last: null },
    session: null,
  });
  function clean(raw) {
    const s = fresh();
    if (!raw || typeof raw !== "object" || ![1, 2].includes(raw.version)) return s;
    for (const k of ["points", "streak", "best"])
      s[k] = integer(raw[k], 0, 1e9);
    const o = raw.settings || {};
    for (const k of ["add", "sub", "cross", "hints", "sound", "motion", "mul", "div"])
      if (typeof o[k] === "boolean") s.settings[k] = o[k];
    if (!s.settings.mul && !s.settings.div) s.settings.mul = true;
    if (Array.isArray(o.tables)) {
      const rows = [...new Set(o.tables.filter(n => integer(n, 1, 10)))].sort((a,b) => a-b);
      if (rows.length) s.settings.tables = rows;
    }
    if (!s.settings.add && !s.settings.sub) s.settings.add = true;
    for (const [k, values] of Object.entries({
      area: ["arithmetic", "tables"],
      theme: ["light", "dark", "system"],
      tempo: ["off", "countdown", "stopwatch"],
      duration: [60,120,300,600],
      range: [20, 50, 100],
      mode: ["keypad", "choice"],
      difficulty: [0, 1, 2, 3, 4, 5],
      length: [0, 5, 10, 20],
    }))
      if (values.includes(o[k])) s.settings[k] = o[k];
    for (let i = 0; i < 15; i++) {
      if (!raw.completed || !integer(raw.completed[i], 1, 3)) break;
      s.completed[i] = raw.completed[i];
    }
    s.items = worlds
      .filter((_, i) => s.completed[i * 3 + 2])
      .map((w) => w.item);
    const st = raw.stats || {};
    for (const k of ["solved", "correct", "wrong"])
      s.stats[k] = integer(st[k], 0, 1e9);
    for (const [k, v] of Object.entries(st.today || {}))
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) s.stats.today[k] = integer(v, 0, 1e7);
    for (const [k, v] of Object.entries(st.types || {}))
      if (
        (/^(add|sub)-(plain|cross)-(10|20|50|100)$/.test(k) || /^(mul|div)-row-(10|[1-9])$/.test(k)) &&
        v &&
        typeof v === "object"
      )
        s.stats.types[k] = {
          attempts: integer(v.attempts, 0, 1e9),
          errors: integer(v.errors, 0, 1e9),
          slow: integer(v.slow, 0, 1e9),
          ...(v.seconds !== undefined ? {seconds: finite(v.seconds, 0, 1e12), timedAttempts: integer(v.timedAttempts,0,1e9)} : {}),
        };
    const r = raw.session;
    if (
      r &&
      Number.isInteger(r.level) &&
      r.level >= 0 &&
      r.level < 15 &&
      r.level <= Object.keys(s.completed).length &&
      [0, 5, 10, 20].includes(r.total) &&
      Number.isInteger(r.done) &&
      r.done >= 0 &&
      r.done < (r.total || 1e7) &&
      Number.isInteger(r.errors) &&
      r.errors >= 0
    ) {
      s.session = {
        level: r.level,
        total: r.total,
        done: r.done,
        errors: r.errors,
        recent: Array.isArray(r.recent)
          ? r.recent.filter((v) => typeof v === "string").slice(-12)
          : [],
        question: null,
        attempts: 0,
      };
      const q = r.question;
      if (
        q &&
        Number.isInteger(q.a) &&
        Number.isInteger(q.b) &&
        q.a >= 0 &&
        q.b >= 0 &&
        q.a <= s.settings.range &&
        q.b <= s.settings.range &&
        ["add", "sub"].includes(q.op) &&
        s.settings[q.op] &&
        q.answer === (q.op === "add" ? q.a + q.b : q.a - q.b) &&
        q.answer >= 0 &&
        q.answer <= s.settings.range &&
        (s.settings.cross || !crosses(q.a, q.b, q.op))
      ) {
        s.session.question = {
          a: q.a,
          b: q.b,
          op: q.op,
          answer: q.answer,
          key: `${q.a}${q.op}${q.b}`,
          type: type(q.a, q.b, q.op),
        };
        s.session.attempts = integer(r.attempts, 0, 1e6);
      }
    }
    if (raw.version === 2 && raw.session?.kind) {
      const r = raw.session;
      if (validSession(r, s)) s.session = JSON.parse(JSON.stringify(r));
    }
    if (raw.version === 2 && raw.training) {
      const t = raw.training;
      s.training.rounds = integer(t.rounds, 0, 1e9);
      s.training.tempoRounds = integer(t.tempoRounds, 0, 1e9);
      for (const [key, value] of Object.entries(t.records || {}))
        if (validProfile(key) && Number.isFinite(value) && value > 0 && value <= 1e12) s.training.records[key] = value;
      if (validSummary(t.last)) s.training.last = JSON.parse(JSON.stringify(t.last));
    }
    return s;
  }
  const finite = (n, min, max) => Number.isFinite(n) && n >= min && n <= max ? n : 0;
  const signs = {add: "+", sub: "−", mul: "×", div: "÷"};
  const crosses = (a, b, op) =>
    op === "add" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
  function type(a, b, op) {
    const max = Math.max(a, b, op === "add" ? a + b : a - b);
    return `${op}-${crosses(a, b, op) ? "cross" : "plain"}-${max <= 10 ? 10 : max <= 20 ? 20 : max <= 50 ? 50 : 100}`;
  }
  function generate(settings, level, stats, recent = [], random = Math.random) {
    if (settings.area === "tables") return generateTables(settings, stats, recent, random);
    const stage = settings.difficulty || Math.min(5, Math.floor(level / 3) + 1);
    const cap = Math.min(settings.range, [0, 10, 30, 50, 100, 100][stage]);
    const candidates = [];
    for (let a = 0; a <= cap; a++)
      for (let b = 1; b <= cap; b++)
        for (const op of ["add", "sub"]) {
          if (!settings[op]) continue;
          const answer = op === "add" ? a + b : a - b;
          if (answer < 0 || answer > cap) continue;
          const cross = crosses(a, b, op);
          if (cross && (!settings.cross || stage === 1)) continue;
          const key = `${a}${op}${b}`;
          if (recent.includes(key)) continue;
          const t = type(a, b, op),
            st = stats.types[t] || { attempts: 0, errors: 0, slow: 0 };
          const need = st.attempts
            ? Math.min(1, (st.errors + st.slow * 0.3) / st.attempts)
            : 0;
          const weight =
            (stage >= 4 && Math.max(a, b) > 30 ? 1.4 : 1) * (1 + need * 0.65);
          candidates.push({ a, b, op, answer, key, type: t, weight });
        }
    if (!candidates.length) return generate(settings, level, stats, [], random);
    let pick = random() * candidates.reduce((sum, q) => sum + q.weight, 0);
    for (const q of candidates) {
      pick -= q.weight;
      if (pick <= 0) return q;
    }
    return candidates[candidates.length - 1];
  }
  function choices(q, range, random = Math.random) {
    const values = new Set([q.answer]);
    const plausible = [
      q.answer - 10,
      q.answer + 10,
      q.answer - 1,
      q.answer + 1,
      Math.abs(q.a - q.b),
      q.a + q.b,
    ].filter((n) => n >= 0 && n <= range && n !== q.answer);
    while (values.size < 3 && plausible.length)
      values.add(
        plausible.splice(Math.floor(random() * plausible.length), 1)[0],
      );
    for (let n = 0; values.size < 3; n++) values.add(n);
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function hint(q, full = false) {
    if (q.op === "mul") return full ? `${q.a} × ${q.b} = ${q.answer}. Zähle ${q.a} Gruppen mit je ${q.b}.` : `Zähle in ${q.b}er-Schritten, ${q.a} Mal.`;
    if (q.op === "div") return full ? `${q.answer} × ${q.b} = ${q.a}, also ${q.a} ÷ ${q.b} = ${q.answer}.` : `Wie oft passt ${q.b} in ${q.a}? Nutze die ${q.b}er-Reihe.`;
    const sign = q.op === "add" ? "+" : "−",
      tens = Math.floor(q.b / 10) * 10,
      ones = q.b % 10;
    if (tens && ones) {
      const mid = q.op === "add" ? q.a + tens : q.a - tens;
      return full
        ? `${q.a} ${sign} ${tens} = ${mid}. Dann ${mid} ${sign} ${ones} = ${q.answer}.`
        : `Rechne zuerst ${q.a} ${sign} ${tens}. Danach ${ones} ${q.op === "add" ? "dazuzählen" : "abziehen"}.`;
    }
    if (q.op === "add" && crosses(q.a, q.b, q.op)) {
      const step = 10 - (q.a % 10);
      return full
        ? `${q.a} + ${step} = ${q.a + step}. Noch ${q.b - step} dazu: ${q.answer}.`
        : `Fülle zuerst den nächsten Zehner auf: ${q.a} + ${step}. Wie viel von ${q.b} bleibt übrig?`;
    }
    return full
      ? `${q.op === "add" ? "Zähle vorwärts" : "Zähle rückwärts"}: Starte bei ${q.a} und gehe ${q.b} Schritte. So kommst du auf ${q.answer}.`
      : `Starte bei ${q.a}. Zähle ${q.b} Schritte ${q.op === "add" ? "vorwärts" : "rückwärts"}.`;
  }
  function answer(s, value, seconds, date) {
    const r = s.session,
      q = r && r.question;
    if (!q) return { ignored: true };
    const st =
      s.stats.types[q.type] ||
      (s.stats.types[q.type] = { attempts: 0, errors: 0, slow: 0 });
    st.attempts++;
    st.seconds = (st.seconds || 0) + finite(seconds, 0, 86400);
    st.timedAttempts = (st.timedAttempts || 0) + 1;
    if (r.round) r.round.attempts++;
    if (value !== q.answer) {
      s.stats.wrong++;
      st.errors++;
      s.streak = 0;
      r.attempts++;
      r.errors++;
      if (r.round) r.round.streak = 0;
      return { correct: false, attempts: r.attempts };
    }
    if (r.round) {
      r.round.correct++;
      r.round.streak++;
      r.round.best = Math.max(r.round.best, r.round.streak);
    }
    s.stats.correct++;
    s.stats.solved++;
    s.stats.today[date] = (s.stats.today[date] || 0) + 1;
    if (seconds > 25) st.slow++;
    s.streak++;
    s.best = Math.max(s.best, s.streak);
    const bonus = s.streak % 10 === 0 ? 30 : s.streak % 5 === 0 ? 15 : 0;
    const replay = r.kind !== "training" && !!s.completed[r.level];
    const points = replay ? 0 : 10 + bonus;
    s.points += points;
    r.done++;
    r.question = null;
    r.attempts = 0;
    let finished = false,
      newWorld = false,
      stars = 0;
    if (r.total && r.done >= r.total) {
      finished = true;
      stars = r.errors === 0 ? 3 : r.errors <= Math.ceil(r.total * 0.3) ? 2 : 1;
      if (!replay && r.kind !== "training") {
        s.completed[r.level] = stars;
        if (r.level % 3 === 2) {
          s.items.push(worlds[Math.floor(r.level / 3)].item);
          newWorld = true;
        }
      }
      if (r.kind) finishRound(s);
      else s.session = null;
    }
    return {
      correct: true,
      points,
      bonus: replay ? 0 : bonus,
      finished,
      newWorld,
      stars,
      replay,
    };
  }
  function tableQuestion(factor, row, op) {
    const a = op === "mul" ? factor : factor * row, b = row;
    return {a, b, op, row, answer: op === "mul" ? factor * row : factor, key: `${a}${op}${b}`, type: `${op}-row-${row}`};
  }
  function rowQuestions(row, op) {
    if (!integer(row, 1, 10) || !["mul", "div"].includes(op)) throw Error("Ungültige Reihe");
    return Array.from({length: 10}, (_, i) => tableQuestion(i + 1, row, op));
  }
  function generateTables(settings, stats, recent = [], random = Math.random) {
    const all = settings.tables.flatMap(row => ["mul","div"].filter(op => settings[op]).flatMap(op => rowQuestions(row, op)));
    if (!all.length) throw Error("Bitte eine Reihe und eine Aufgabenart wählen.");
    let candidates = all.filter(q => !recent.includes(q.key));
    if (!candidates.length) candidates = all.filter(q => q.key !== recent.at(-1));
    for (const q of candidates) {
      const st = stats.types[q.type];
      q.weight = 1 + (st?.attempts ? Math.min(1, (st.errors + st.slow * .3) / st.attempts) * .65 : 0);
    }
    let pick = random() * candidates.reduce((n,q) => n + q.weight, 0);
    return candidates.find(q => (pick -= q.weight) <= 0) || candidates.at(-1);
  }
  function profileKey(r) {
    const s = r.learning;
    return [r.area,r.layout,r.row || 0,r.rowOp || "mix",r.total,r.timer.mode,r.timer.limit,r.level,s.range,s.difficulty,+s.cross,+s.add,+s.sub,+s.mul,+s.div,s.tables.join("."),s.mode,+s.hints].join("|");
  }
  function validProfile(key) {
    return typeof key === "string" && /^(arithmetic|tables)\|(single|rows)\|[0-9]+\|(mix|mul|div)\|[0-9]+\|(off|countdown|stopwatch)\|[0-9]+\|[0-9]+\|(20|50|100)\|[0-5]\|[01]\|[01]\|[01]\|[01]\|[01]\|[0-9.]+\|(keypad|choice)\|[01]$/.test(key);
  }
  function startSession(settings, level, kind = "adventure", layout = "single", row = 1, rowOp = "mul") {
    const learning = {...settings, tables: [...settings.tables]};
    if (layout === "rows") learning.area = "tables";
    const mode = layout === "rows" && settings.tempo === "countdown" ? "off" : settings.tempo;
    const training = kind === "training" || learning.area === "tables" || mode !== "off";
    const r = {level, total: layout === "rows" ? 10 : mode === "countdown" ? 0 : mode === "stopwatch" ? (settings.length || 10) : settings.length,
      done: 0, errors: 0, recent: [], question: null, attempts: 0,
      kind: training ? "training" : "adventure", area: learning.area, layout,
      row: layout === "rows" ? row : 0, rowOp: layout === "rows" ? rowOp : "mix", learning,
      timer: {mode, limit: mode === "countdown" ? settings.duration * 1000 : 0, elapsed: 0},
      questionMs: 0, round: {attempts: 0, correct: 0, streak: 0, best: 0}};
    r.profile = profileKey(r);
    return r;
  }
  function tick(r, ms) {
    if (!r?.timer) return false;
    const delta = Math.min(finite(ms, 0, 86400000), r.timer.mode === "countdown" ? Math.max(0,r.timer.limit-r.timer.elapsed) : Infinity);
    r.timer.elapsed += delta;
    if (r.question) r.questionMs += delta;
    return r.timer.mode === "countdown" && r.timer.elapsed >= r.timer.limit;
  }
  function validSummary(x) {
    return x && x.best <= x.correct && x.errors === x.attempts - x.correct && validProfile(x.profile) && ["off","countdown","stopwatch"].includes(x.mode) &&
      ["elapsed","correct","attempts","best","errors"].every(k => Number.isFinite(x[k]) && x[k] >= 0 && x[k] <= 1e12) && x.correct <= x.attempts;
  }
  function finishRound(s) {
    const r = s.session;
    if (!r?.kind) return null;
    const summary = {profile: r.profile, mode: r.timer.mode, elapsed: r.timer.elapsed, correct: r.round.correct, attempts: r.round.attempts, best: r.round.best, errors: r.errors};
    s.training.rounds++;
    if (r.timer.mode !== "off") s.training.tempoRounds++;
    if (r.timer.mode === "stopwatch" && r.done === r.total && !r.errors && r.timer.elapsed > 0) {
      const old = s.training.records[r.profile];
      if (!old || summary.elapsed < old) s.training.records[r.profile] = summary.elapsed;
    }
    s.training.last = summary;
    s.session = null;
    return summary;
  }
  function validSession(r, s) {
    if (!["training","adventure"].includes(r.kind) || !["arithmetic","tables"].includes(r.area) || !["rows","single"].includes(r.layout)) return false;
    if (!r.learning || !r.timer || !r.round || !validProfile(r.profile) || r.profile !== profileKey(r)) return false;
    if (!Number.isInteger(r.level) || r.level < 0 || r.level > 14 || r.level > Object.keys(s.completed).length) return false;
    if (![0,5,10,20].includes(r.total) || !Number.isInteger(r.done) || r.done < 0 || r.done >= (r.total || 1e9)) return false;
    if (!["off","countdown","stopwatch"].includes(r.timer.mode) || !Number.isFinite(r.timer.elapsed) || r.timer.elapsed < 0 || r.timer.elapsed > 1e12) return false;
    if (r.timer.limit !== (r.timer.mode === "countdown" ? r.learning.duration * 1000 : 0)) return false;
    if (r.layout === "rows" && (r.total !== 10 || !integer(r.row,1,10) || !["mul","div"].includes(r.rowOp) || r.timer.mode === "countdown")) return false;
    if (r.kind === "adventure" && (r.area !== "arithmetic" || r.timer.mode !== "off" || r.layout !== "single")) return false;
    if (![r.errors,r.attempts,r.questionMs,...Object.values(r.round)].every(n => Number.isFinite(n) && n >= 0 && n <= 1e12)) return false;
    if (!Array.isArray(r.recent) || r.recent.length > 12 || !r.recent.every(k => typeof k === "string" && k.length < 40)) return false;
    const q = r.question;
    if (!q) return true;
    if (r.area === "tables") {
      return integer(q.row,1,10) && r.learning.tables.includes(q.row) && r.learning[q.op] &&
        rowQuestions(q.row,q.op).some(t => t.a === q.a && t.b === q.b && t.answer === q.answer && t.key === q.key && t.type === q.type) &&
        (r.layout !== "rows" || JSON.stringify(tableQuestion(r.done + 1,r.row,r.rowOp)) === JSON.stringify(q));
    }
    const fake = {...s,version:1,settings:r.learning,session:{...r,kind:undefined}};
    const checked = clean(fake).session?.question;
    return checked && ["a","b","op","answer","key","type"].every(k => q[k] === checked[k]);
  }
  // Strict boundary for migration/import. clean remains the tolerant pure V1 validator.
  function validate(raw) {
    if (!raw || Array.isArray(raw) || ![1,2].includes(raw.version)) throw Error("Unbekanntes Spielstandformat.");
    const scan = x => {
      if (!x || typeof x !== "object") return;
      for (const [k,v] of Object.entries(x)) {
        if (["__proto__","constructor","prototype"].includes(k)) throw Error("Ungültiger Datenschlüssel.");
        scan(v);
      }
    };
    if (JSON.stringify(raw).length > 2000000) throw Error("Spielstand ist zu groß.");
    scan(raw);
    const result = clean(raw);
    const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map(k => [k,canonical(x[k])])) : x;
    const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
    const shape = (obj, keys, required = keys) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj) || required.some(k => !(k in obj)) || Object.keys(obj).some(k => !keys.includes(k))) throw Error("Unvollständige oder unbekannte Datenfelder.");
    };
    shape(raw.stats,["solved","correct","wrong","today","types"]);
    shape(raw.settings,Object.keys(defaults),raw.version === 1 ? ["range","add","sub","cross","mode","difficulty","length","hints","sound","motion"] : Object.keys(defaults));
    for (const value of Object.values(raw.stats.types)) {
      shape(value,["attempts","errors","slow","seconds","timedAttempts"],["attempts","errors","slow"]);
      if (value.errors > value.attempts || value.slow > value.attempts || (value.seconds !== undefined && (!Number.isInteger(value.timedAttempts) || value.timedAttempts > value.attempts))) throw Error("Widersprüchliche Aufgabenstatistik.");
    }
    for (const k of ["points","streak","best","completed","items","stats","settings","session"])
      if (!(k in raw)) throw Error("Unvollständiger Spielstand: " + k);
    for (const k of ["points","streak","best","completed","items"]) if (!equal(raw[k],result[k])) throw Error("Beschädigter Fortschritt: " + k);
    if (raw.stats.correct !== raw.stats.solved || raw.streak > raw.best) throw Error("Widersprüchlicher Fortschritt.");
    for (const [k,v] of Object.entries(raw.settings)) if (!equal(v,result.settings[k])) throw Error("Ungültige Einstellung: " + k);
    for (const [k,v] of Object.entries(raw.stats)) if (!equal(v,result.stats[k])) throw Error("Ungültige Statistik: " + k);
    if (raw.session) {
      const r = raw.session;
      const baseKeys = ["level","total","done","errors","recent","question","attempts"];
      shape(r,r.kind ? [...baseKeys,"kind","area","layout","row","rowOp","learning","timer","questionMs","round","profile"] : baseKeys);
      if (r.question) shape(r.question,["a","b","op","answer","key","type","row","weight"],["a","b","op","answer","key","type"]);
      if (r.kind) {
        shape(r.learning,Object.keys(defaults));
        shape(r.timer,["mode","limit","elapsed"]);
        shape(r.round,["attempts","correct","streak","best"]);
        if (![r.done,r.errors,r.attempts,...Object.values(r.round)].every(Number.isInteger) || r.done !== r.round.correct || r.round.attempts !== r.done + r.errors || r.round.best > r.done || r.round.streak > r.round.best || r.questionMs > r.timer.elapsed) throw Error("Widersprüchliche Trainingsrunde.");
      }
      if (!result.session) throw Error("Ungültige laufende Runde.");
      const a = JSON.parse(JSON.stringify(raw.session)), b = JSON.parse(JSON.stringify(result.session));
      if (a.question) delete a.question.weight;
      if (b.question) delete b.question.weight;
      if (!equal(a,b)) throw Error("Beschädigte laufende Runde.");
      if (raw.session.kind) {
        for (const [k,v] of Object.entries(raw.session.learning)) if (!equal(v,clean({...fresh(),settings:raw.session.learning}).settings[k])) throw Error("Ungültiges Aufgabenprofil.");
      }
    }
    if (raw.training) shape(raw.training,["rounds","tempoRounds","records","last"]);
    if (raw.training?.last) shape(raw.training.last,["profile","mode","elapsed","correct","attempts","best","errors"]);
    if (raw.version === 2 && (!raw.training || raw.training.tempoRounds > raw.training.rounds || !equal(raw.training,result.training))) throw Error("Ungültige Trainingsstatistik.");
    const allowed = ["version","points","streak","best","completed","items","stats","settings","session","training"];
    if (Object.keys(raw).some(k => !allowed.includes(k))) throw Error("Unbekannte Spielstandfelder.");
    if (raw.version === 1 && result.session) {
      const old = result.session;
      const r = {...startSession({...result.settings,area:"arithmetic",tempo:"off"},old.level),...old};
      r.round = {attempts:old.done+old.errors,correct:old.done,streak:Math.min(result.streak,old.done),best:Math.min(result.streak,old.done)};
      r.profile = profileKey(r);
      result.session = r;
    }
    return result;
  }
  function load(storage) {
    const current = storage.getItem(STORAGE.current);
    if (current !== null) {
      const raw = JSON.parse(current);
      if (raw.version !== 2) throw Error("Unbekanntes V2-Speicherformat.");
      return {state: validate(raw), migrated: false};
    }
    const legacy = storage.getItem(STORAGE.legacy);
    if (legacy === null) return {state: fresh(), migrated: false};
    const state = validate(JSON.parse(legacy));
    try {
      if (storage.getItem(STORAGE.backup) === null) storage.setItem(STORAGE.backup,legacy);
      storage.setItem(STORAGE.current,JSON.stringify(state));
    } catch (error) { error.state = state; throw error; }
    return {state, migrated: true};
  }
  function exportSave(state, now = new Date()) {
    return {format: "funkelpfad-save", appVersion: VERSION, exportedAt: now.toISOString(), state: validate(state)};
  }
  function importSave(storage, payload, current) {
    if (payload?.format && payload.format !== "funkelpfad-save") throw Error("Unbekannte Exportdatei.");
    const next = validate(payload?.format === "funkelpfad-save" ? payload.state : payload);
    // Backup is written first; any storage failure aborts replacement.
    const previous = storage.getItem(STORAGE.current);
    storage.setItem(STORAGE.importBackup,previous !== null ? previous : JSON.stringify(exportSave(current)));
    storage.setItem(STORAGE.current,JSON.stringify(next));
    return next;
  }
  const api = {
    defaults,
    worlds,
    fresh,
    clean,
    generate,
    choices,
    hint,
    answer,
    crosses,
    VERSION, STORAGE, signs, validate, load, exportSave, importSave,
    generateTables, rowQuestions, startSession, tick, finishRound, profileKey,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Mathe = api;
})(typeof window !== "undefined" ? window : globalThis);
