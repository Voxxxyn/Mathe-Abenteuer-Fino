/* Optional DOM integration tests: JSDOM_MODULE=/path/to/jsdom node tests/ui.test.cjs */
const { JSDOM } = require(process.env.JSDOM_MODULE || "jsdom"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const dir = path.resolve(__dirname, ".."),
  dom = new JSDOM(fs.readFileSync(path.join(dir, "index.html"), "utf8"), {
    url: "http://localhost:8080/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  }),
  w = dom.window,
  d = w.document;
w.scrollTo = () => {};
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
const errors = [];
w.addEventListener("error", (e) => errors.push(e.message));
w.eval(fs.readFileSync(path.join(dir, "core.js"), "utf8"));
w.eval(fs.readFileSync(path.join(dir, "app.js"), "utf8"));
let checks = 0;
const check = (v, m) => {
  assert.ok(v, m);
  checks++;
};
const click = (s) => {
  const el = d.querySelector(s);
  assert.ok(el, "Missing " + s);
  el.click();
};
const text = (s) => d.querySelector(s)?.textContent;
const saved = () => JSON.parse(w.localStorage.getItem("funkelpfad-v1"));
const submit = (s) =>
  d
    .querySelector(s)
    .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
function parents() {
  click("#parent");
  d.querySelector("#gate-answer").value = "55";
  submit("#gate-form");
  check(d.querySelector("#dialog").open, "incorrect gate blocked");
  d.querySelector("#gate-answer").value = "56";
  submit("#gate-form");
}
function solve(useEnter = false) {
  const q = saved().session.question;
  for (const n of String(q.answer)) click(`[data-digit="${n}"]`);
  if (useEnter)
    d.querySelector('[data-digit="1"]').dispatchEvent(
      new w.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
  else click('[data-action="submit"]');
}
parents();
d.querySelector("[name=add]").checked = false;
d.querySelector("[name=sub]").checked = false;
submit("#settings-form");
check(text("#settings-status").includes("mindestens"), "operation validation");
d.querySelector("[name=add]").checked = true;
d.querySelector("[name=sub]").checked = true;
d.querySelector("[name=length]").value = "5";
d.querySelector("[name=sound]").checked = false;
submit("#settings-form");
click("[data-action=home]");
click("[data-action=continue]");
for (const n of ["1", "2", "3", "4"]) click(`[data-digit="${n}"]`);
check(text("#answer") === "123", "three digits");
click("[data-action=delete]");
check(text("#answer") === "12", "delete last");
click("[data-action=delete]");
click("[data-action=delete]");
click("[data-action=submit]");
check(text("#feedback").includes("zuerst"), "empty blocked");
for (let i = 0; i < 4; i++) {
  click('[data-digit="9"]');
  click('[data-digit="9"]');
  click("[data-action=submit]");
  check(saved().stats.wrong === i + 1, "wrong count");
  if (i === 0) check(!text("#feedback").includes(" = "), "no first solution");
  if (i === 1) check(text("#feedback").length > 20, "second hint");
}
check(
  text("#feedback").includes(String(saved().session.question.answer)),
  "fourth explanation",
);
solve(true);
check(saved().stats.correct === 1, "external Enter on keypad");
const p = saved().points;
d.dispatchEvent(
  new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
);
check(saved().points === p, "duplicate lock");
click("[data-action=map]");
click("[data-action=continue]");
check(saved().session.done === 1, "resume");
for (let i = 1; i < 5; i++) {
  solve();
  if (i < 4) click("[data-action=next]");
}
click("[data-action=result]");
check(text("h1").includes("toll"), "result");
check(saved().completed[0] === 1, "one star after 4 errors");
click("[data-action=map]");
for (let level = 1; level < 15; level++) {
  click("[data-action=continue]");
  for (let i = 0; i < 5; i++) {
    solve();
    if (i < 4) click("[data-action=next]");
  }
  click("[data-action=result]");
  if (level % 3 === 2) {
    click("[data-action=chest]");
    check(text(".treasure").length > 0, "chest");
  }
  click("[data-action=map]");
}
check(saved().items.length === 5, "all items");
check(Object.keys(saved().completed).length === 15, "all levels");
const before = saved().points;
click('[data-world="0"]');
click('[data-level="0"]');
for (let i = 0; i < 5; i++) {
  solve();
  if (i < 4) click("[data-action=next]");
}
check(saved().points === before, "repeat reward blocked");
click("[data-nav=collection]");
check(d.querySelectorAll(".collect-card.found").length === 5, "collection");
parents();
for (const [name, value] of [
  ["range", "20"],
  ["difficulty", "5"],
  ["mode", "choice"],
  ["length", "0"],
])
  d.querySelector(`[name=${name}]`).value = value;
d.querySelector("[name=cross]").checked = false;
d.querySelector("[name=motion]").checked = false;
submit("#settings-form");
check(
  saved().settings.mode === "choice" && !saved().settings.cross,
  "settings",
);
check(d.body.classList.contains("reduced"), "motion");
click("[data-action=home]");
click("[data-action=continue]");
for (let i = 0; i < 5; i++) {
  const q = saved().session.question,
    buttons = [...d.querySelectorAll("[data-choice]")];
  check(
    buttons.length === 3 &&
      new Set(buttons.map((b) => b.textContent)).size === 3,
    "MC uniqueness",
  );
  check(
    q.answer <= 20 && !w.Mathe.crosses(q.a, q.b, q.op),
    "manual constraints",
  );
  click(`[data-choice="${q.answer}"]`);
  click("[data-action=next]");
}
check(saved().session.done === 5, "endless");
parents();
const beforeReset = saved().points;
click("[data-action=reset]");
click("[data-action=close]");
check(saved().points === beforeReset, "cancel reset");
click("[data-action=reset]");
d.querySelector("[name=confirmation]").value = "no";
submit("#reset-form");
check(saved().points === beforeReset, "reset protected");
d.querySelector("[name=confirmation]").value = "LÖSCHEN";
submit("#reset-form");
check(
  saved().points === 0 && saved().settings.range === 20,
  "reset retains settings",
);
check(errors.length === 0, errors.join("\n"));
console.log(
  `PASS: ${checks} DOM integration checks: navigation, gate, keypad, Enter, hints, full 15-level journey, stars, 5 chests, replay, MC, settings, endless practice, reset.`,
);
dom.window.close();
