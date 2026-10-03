"use strict";
const vm = require("node:vm"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const dir = path.resolve(__dirname, ".."),
  source = fs.readFileSync(path.join(dir, "service-worker.js"), "utf8");
(async () => {
  const handlers = {},
    stores = new Map(),
    scope = "https://example.test/mathe-abenteuer/";
  let claimed = false,
    activated = false,
    network = 0;
  const caches = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        addAll: async (files) => {
          for (const f of files) {
            const rel = f === "./" ? "index.html" : f;
            assert.ok(
              fs.existsSync(path.join(dir, rel)),
              `Missing precache file ${f}`,
            );
            store.set(
              new URL(f, scope).href,
              fs.readFileSync(path.join(dir, rel)),
            );
          }
        },
        match: async (req, opts) => {
          const u = new URL(typeof req === "string" ? req : req.url, scope);
          if (opts?.ignoreSearch) u.search = "";
          return store.get(u.href);
        },
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (key) => stores.delete(key),
  };
  stores.set("other-app-cache", new Map());
  stores.set("funkelpfad-/mathe-abenteuer/-old", new Map());
  const sandbox = {
    importScripts: () => { sandbox.self.FINO_VERSION = require("../core.js").VERSION; },
    URL,
    caches,
    fetch: async () => {
      network++;
      throw Error("Offline");
    },
    self: {
      registration: { scope },
      location: { origin: "https://example.test" },
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
      skipWaiting: () => {
        activated = true;
      },
      addEventListener: (name, handler) => (handlers[name] = handler),
    },
  };
  vm.runInNewContext(source, sandbox);
  let job;
  handlers.install({ waitUntil: (p) => (job = p) });
  await job;
  handlers.activate({ waitUntil: (p) => (job = p) });
  await job;
  assert.ok(claimed);
  assert.ok(stores.has("other-app-cache"));
  assert.ok(!stores.has("funkelpfad-/mathe-abenteuer/-old"));
  for (const f of [
    "",
    "index.html",
    "app.js",
    "version.js",
    "core.js",
    "style.css",
    "manifest.json",
    "assets/fox.svg",
    "assets/chest.svg",
    "assets/world-0.svg",
    "assets/world-1.svg",
    "assets/world-2.svg",
    "assets/world-3.svg",
    "assets/world-4.svg",
    "icons/icon-192.png",
    "icons/icon-512.png",
  ]) {
    let response;
    handlers.fetch({
      request: { url: scope + f, method: "GET", mode: f ? "cors" : "navigate" },
      respondWith: (p) => (response = p),
    });
    assert.ok((await response).length > 0, `Cached ${f}`);
  }
  let response;
  handlers.fetch({
    request: {
      url: scope + "unknown-navigation",
      method: "GET",
      mode: "navigate",
    },
    respondWith: (p) => (response = p),
  });
  assert.ok((await response).toString().includes("<!doctype html>"));
  assert.equal(network, 0);
  let intercepted = false;
  handlers.fetch({
    request: { url: "https://another.test/image", method: "GET" },
    respondWith: () => (intercepted = true),
  });
  assert.equal(intercepted, false);
  handlers.message({ data: { type: "SKIP_WAITING" } });
  assert.ok(activated);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json")));
  assert.equal(manifest.id, "./");
  assert.ok(stores.has("funkelpfad-/mathe-abenteuer/-v2.0.0"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(dir, icon.src));
    const n = Number(icon.sizes.split("x")[0]);
    assert.equal(png.readUInt32BE(16), n);
    assert.equal(png.readUInt32BE(20), n);
  }
  console.log(
    "PASS: all 16 offline resources, subpath scope, lifecycle, old-cache cleanup, update activation, offline navigation, isolated caches, manifest paths and real PNG dimensions.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
