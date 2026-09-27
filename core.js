/* Pure learning and progression logic. No network or browser dependencies. */
(function (root) {
  "use strict";
  const defaults = {
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
    version: 1,
    points: 0,
    streak: 0,
    best: 0,
    completed: {},
    items: [],
    stats: { solved: 0, correct: 0, wrong: 0, today: {}, types: {} },
    settings: { ...defaults },
    session: null,
  });
  function clean(raw) {
    const s = fresh();
    if (!raw || typeof raw !== "object" || raw.version !== 1) return s;
    for (const k of ["points", "streak", "best"])
      s[k] = integer(raw[k], 0, 1e9);
    const o = raw.settings || {};
    for (const k of ["add", "sub", "cross", "hints", "sound", "motion"])
      if (typeof o[k] === "boolean") s.settings[k] = o[k];
    if (!s.settings.add && !s.settings.sub) s.settings.add = true;
    for (const [k, values] of Object.entries({
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
        /^(add|sub)-(plain|cross)-(10|20|50|100)$/.test(k) &&
        v &&
        typeof v === "object"
      )
        s.stats.types[k] = {
          attempts: integer(v.attempts, 0, 1e9),
          errors: integer(v.errors, 0, 1e9),
          slow: integer(v.slow, 0, 1e9),
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
    return s;
  }
  const crosses = (a, b, op) =>
    op === "add" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
  function type(a, b, op) {
    const max = Math.max(a, b, op === "add" ? a + b : a - b);
    return `${op}-${crosses(a, b, op) ? "cross" : "plain"}-${max <= 10 ? 10 : max <= 20 ? 20 : max <= 50 ? 50 : 100}`;
  }
  function generate(settings, level, stats, recent = [], random = Math.random) {
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
    if (value !== q.answer) {
      s.stats.wrong++;
      st.errors++;
      s.streak = 0;
      r.attempts++;
      r.errors++;
      return { correct: false, attempts: r.attempts };
    }
    s.stats.correct++;
    s.stats.solved++;
    s.stats.today[date] = (s.stats.today[date] || 0) + 1;
    if (seconds > 25) st.slow++;
    s.streak++;
    s.best = Math.max(s.best, s.streak);
    const bonus = s.streak % 10 === 0 ? 30 : s.streak % 5 === 0 ? 15 : 0;
    const replay = !!s.completed[r.level];
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
      if (!replay) {
        s.completed[r.level] = stars;
        if (r.level % 3 === 2) {
          s.items.push(worlds[Math.floor(r.level / 3)].item);
          newWorld = true;
        }
      }
      s.session = null;
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
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Mathe = api;
})(typeof window !== "undefined" ? window : globalThis);
