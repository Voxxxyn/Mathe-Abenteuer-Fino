/* Optional development test; no test dependencies are loaded by the app.
   Start the static server first. Install Playwright outside the delivered app.
   PLAYWRIGHT_MODULE=/path/to/playwright APP_URL=http://localhost:8080 node tests/browser.test.cjs
   CHROME_PATH optionally points to a local Chrome. Otherwise Playwright Chromium is used.
*/
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const context = await browser.newContext({
      viewport: { width: 1366, height: 1024 },
    }),
    page = await context.newPage(),
    errors = [],
    foreign = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith(process.env.APP_URL || "http://localhost:8080"))
      foreign.push(r.url());
  });
  const url = process.env.APP_URL || "http://localhost:8080";
  await page.goto(url);
  await page
    .getByText("Bereit für dein Offline-Abenteuer", { exact: false })
    .waitFor();
  await page.waitForTimeout(500);
  if (process.env.SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR + "/start.png",
      fullPage: true,
    });
  }
  async function parents() {
    await page.locator("#parent").click();
    await page.locator("#gate-answer").fill("56");
    await page.locator("#gate-form button").click();
  }
  async function saved() {
    return page.evaluate(() =>
      JSON.parse(localStorage.getItem("funkelpfad-v1")),
    );
  }
  async function answer() {
    const s = await saved();
    for (const n of String(s.session.question.answer))
      await page.locator(`[data-digit="${n}"]`).click();
    await page.locator('[data-action="submit"]').click();
  }
  await parents();
  await page.locator('[name="length"]').selectOption("5");
  await page.locator('#settings-form button[type="submit"]').click();
  await page.locator('[data-action="home"]').click();
  await page.locator('[data-action="continue"]').click();
  await page.locator('[data-digit="1"]').click();
  await page.locator('[data-digit="2"]').click();
  await page.locator('[data-digit="3"]').click();
  await page.locator('[data-digit="4"]').click();
  assert.equal(await page.locator("#answer").textContent(), "123");
  await page.locator('[data-action="delete"]').click();
  assert.equal(await page.locator("#answer").textContent(), "12");
  await page.locator('[data-action="delete"]').click();
  await page.locator('[data-action="delete"]').click();
  assert.equal(await page.locator("#answer").textContent(), "?");
  for (let n = 0; n < 2; n++) {
    await page.locator('[data-digit="9"]').click();
    await page.locator('[data-digit="9"]').click();
    await page.locator('[data-action="submit"]').click();
  }
  assert.equal((await saved()).stats.wrong, 2);
  assert.ok((await page.locator("#feedback").textContent()).length > 20);
  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
    [820, 1180],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "no horizontal overflow in play",
    );
    const size = await page.locator('[data-digit="5"]').boundingBox();
    assert.ok(size.height >= 60 && size.width >= 44);
    if (process.env.SCREENSHOT_DIR && width === 768)
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR + "/rechnen-ipad.png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await answer();
  const first = await saved();
  await page.reload();
  await page.locator('[data-action="continue"]').click();
  assert.equal((await saved()).session.done, 1);
  assert.equal((await saved()).points, first.points);
  for (let i = 1; i < 5; i++) {
    await answer();
    if (i < 4) await page.locator('[data-action="next"]').click();
  }
  await page.locator('[data-action="result"]').click();
  assert.ok(await page.getByText("Das hast du toll gemacht.").isVisible());
  assert.equal((await saved()).completed[0], 2);
  await page.locator('[data-action="map"]').click();
  for (let level = 1; level < 3; level++) {
    await page.locator('[data-action="continue"]').click();
    for (let i = 0; i < 5; i++) {
      await answer();
      if (i < 4) await page.locator('[data-action="next"]').click();
    }
    await page.locator('[data-action="result"]').click();
    if (level === 2) {
      await page.locator('[data-action="chest"]').click();
      assert.ok(
        await page.getByRole("heading", { name: "Sonnenblume" }).isVisible(),
      );
    }
    await page.locator('[data-action="map"]').click();
  }
  assert.equal((await saved()).items.length, 1);
  assert.ok(await page.locator('[data-world="1"]').isEnabled());
  assert.ok(await page.locator('[data-world="2"]').isDisabled());
  await parents();
  await page.locator('[name="mode"]').selectOption("choice");
  await page.locator('[name="range"]').selectOption("20");
  await page.locator('[name="cross"]').uncheck();
  await page.locator('[name="sound"]').uncheck();
  await page.locator('#settings-form button[type="submit"]').click();
  await page.locator('[data-action="home"]').click();
  await page.locator('[data-action="continue"]').click();
  let s = await saved();
  const values = await page.locator("[data-choice]").allTextContents();
  assert.equal(new Set(values).size, 3);
  assert.ok(values.includes(String(s.session.question.answer)));
  await page.locator(`[data-choice="${s.session.question.answer}"]`).click();
  await page.locator('[data-action="next"]').click();
  s = await saved();
  assert.ok(s.session.question.answer <= 20);
  assert.equal(s.settings.cross, false);
  await context.setOffline(true);
  await page.reload();
  await page
    .getByText("Bereit für dein Offline-Abenteuer", { exact: false })
    .waitFor();
  assert.equal((await saved()).points, s.points);
  await page.locator('[data-action="continue"]').click();
  s = await saved();
  await page.locator(`[data-choice="${s.session.question.answer}"]`).click();
  await parents();
  assert.ok(
    await page.getByRole("heading", { name: "Lernfortschritt" }).isVisible(),
  );
  // Offline cold start in a new page within the same installed browser storage.
  const cold = await context.newPage();
  await cold.goto(url);
  await cold.locator('[data-action="continue"]').waitFor();
  assert.ok(await cold.locator(".hero").isVisible());
  assert.ok(
    await cold
      .locator(".landscape")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  await cold.close();
  await context.setOffline(false);
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="close"]').click();
  assert.equal((await saved()).items.length, 1);
  await page.locator('[data-action="reset"]').click();
  await page.locator('[name="confirmation"]').fill("LÖSCHEN");
  await page.locator("#reset-form button").click();
  assert.equal((await saved()).points, 0);
  assert.equal((await saved()).settings.range, 20);
  await page.locator('[data-action="home"]').click();
  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "no home overflow",
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(foreign, []);
  console.log(
    "PASS: keypad, delete, 3-digit limit, hints, scoring, rounds, chest, unlocking, reload, parent gate, settings, multiple choice, offline reload/cold page, reset confirmation, responsive widths and no external requests or JavaScript errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
