"use strict";
const assert = require("node:assert/strict"),
  M = require("../core.js");
let seed = 93731;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
}
for (const range of [20, 50, 100])
  for (const stage of [1, 2, 3, 4, 5])
    for (const cross of [true, false])
      for (const ops of [
        [true, true],
        [true, false],
        [false, true],
      ]) {
        const settings = {
            ...M.defaults,
            range,
            difficulty: stage,
            cross,
            add: ops[0],
            sub: ops[1],
          },
          recent = [];
        for (let i = 0; i < 70; i++) {
          const q = M.generate(settings, 12, { types: {} }, recent, random);
          check(q.answer >= 0 && q.answer <= range, "answer range");
          check(q.a <= range && q.b <= range, "operand range");
          check(
            q.answer === (q.op === "add" ? q.a + q.b : q.a - q.b),
            "arithmetic",
          );
          check(settings[q.op], "enabled operation");
          check(
            (cross && stage !== 1) || !M.crosses(q.a, q.b, q.op),
            "crossing restriction",
          );
          check(!recent.includes(q.key), "avoid recent repeats");
          const choices = M.choices(q, range, random);
          check(
            choices.length === 3 && new Set(choices).size === 3,
            "unique choices",
          );
          check(choices.includes(q.answer), "correct answer included");
          check(
            choices.every((n) => n >= 0 && n <= range),
            "choices in range",
          );
          check(
            M.hint(q).length > 10 && M.hint(q, true).includes(String(q.answer)),
            "rule based help",
          );
          recent.push(q.key);
          if (recent.length > 12) recent.shift();
        }
      }
let s = M.fresh();
function session(level, total = 5) {
  s.session = {
    level,
    total,
    done: 0,
    errors: 0,
    recent: [],
    question: null,
    attempts: 0,
  };
}
function q() {
  s.session.question = {
    a: 8,
    b: 2,
    op: "add",
    answer: 10,
    key: "8add2",
    type: "add-cross-10",
  };
}
for (let level = 0; level < 15; level++) {
  session(level);
  for (let n = 0; n < 5; n++) {
    q();
    const r = M.answer(s, 10, 10, "2026-09-27");
    check(r.correct, "correct");
    if (n === 4) check(r.finished, "level complete");
  }
  check(s.completed[level] === 3, "three stars");
  check(s.items.length === Math.floor((level + 1) / 3), "world chest");
}
check(s.stats.solved === 75 && s.stats.correct === 75, "statistics");
check(s.best === 75 && s.streak === 75, "streak");
check(s.points === 1080, "point bonuses");
check(s.items.length === 5, "all worlds complete");
const points = s.points;
session(0);
for (let n = 0; n < 5; n++) {
  q();
  M.answer(s, 10, 10, "2026-09-27");
}
check(points === s.points, "no replay reward");
check(s.items.length === 5, "no duplicate items");
s = M.fresh();
session(0);
q();
let r = M.answer(s, 11, 10, "2026-09-27");
check(!r.correct && r.attempts === 1, "first mistake");
r = M.answer(s, 11, 10, "2026-09-27");
check(!r.correct && r.attempts === 2, "second mistake");
check(
  s.points === 0 && s.streak === 0 && s.stats.wrong === 2,
  "no penalty and reset streak",
);
r = M.answer(s, 10, 30, "2026-09-27");
check(s.stats.types["add-cross-10"].slow === 1, "slow answer");
check(s.stats.solved === 1 && s.session.done === 1, "count once");
check(M.answer(s, 10, 0, "2026-09-27").ignored, "duplicate answer ignored");
for (let i = 0; i < 4; i++) {
  q();
  M.answer(s, 10, 1, "2026-09-27");
}
check(s.completed[0] === 2, "stars reflect hints/mistakes");
s = M.fresh();
session(0, 0);
for (let i = 0; i < 30; i++) {
  q();
  M.answer(s, 10, 1, "2026-09-27");
}
check(
  !Object.keys(s.completed).length && s.session.done === 30,
  "endless practice",
);
const restored = M.clean(JSON.parse(JSON.stringify(s)));
check(JSON.stringify(restored) === JSON.stringify(s), "save roundtrip");
for (const bad of [
  null,
  {},
  [],
  {
    version: 1,
    points: -5,
    settings: { add: false, sub: false, range: 7 },
    stats: { types: { "add-cross-10": null } },
    completed: { 14: 3 },
    session: { level: 13, total: 10, done: 0, errors: 0 },
  },
  { version: 2 },
  {
    version: 1,
    session: { question: { a: 1 } },
    stats: { today: { bad: 23 }, types: { evil: {} } },
  },
]) {
  const safe = M.clean(bad);
  check(
    (safe.points >= 0 && safe.settings.add) || safe.settings.sub,
    "safe storage",
  );
  check(safe.settings.range === 100, "range fallback");
}
const invalid = M.fresh();
invalid.completed = { 0: 3, 2: 2 };
invalid.session = {
  level: 0,
  total: 5,
  done: 1,
  errors: 0,
  question: { a: 5, b: 8, op: "sub", answer: -3 },
};
const safe = M.clean(invalid);
check(!safe.completed[2] && !safe.session.question, "reject impossible state");
console.log(
  `PASS: ${checks.toLocaleString("en-US")} assertions. Generator, ranges, no negative results, modes, rewards, streaks, worlds, practice, storage and malformed data.`,
);
