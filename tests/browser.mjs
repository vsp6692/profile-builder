import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import path from "node:path";
const b = await chromium.launch({ channel: "chrome", headless: true });
const context = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = "file://" + path.resolve("dist/index.html");
try {
  await page.goto(url);
  await page.locator("#motion").click();
  assert.equal(await page.locator("#architecture").isVisible(), false);
  await page.locator('[data-view-button="engineering"]').click();
  assert.equal(await page.locator("#architecture").isVisible(), true);
  await page.locator(".architecture-node summary").first().click();
  assert.equal(
    await page.locator(".architecture-node").first().getAttribute("open"),
    "",
  );
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page.locator("#theme").click();
    const results = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      theme + " accessibility",
    );
    await page.screenshot({
      path: "/tmp/portfolio-" + theme + ".png",
      fullPage: true,
    });
  }
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator('[data-filter="Friendly help"]').click();
  assert.equal(await page.locator(".project:visible").count(), 1);
  assert.ok(
    (await page.locator(".project:visible").innerText()).includes("LitOverLap"),
  );
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "overflow " + width,
    );
  }
  await page.locator("#menu").click();
  assert.equal(
    await page.locator("#menu").getAttribute("aria-expanded"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#menu").getAttribute("aria-expanded"),
    "false",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  await page.goto(url + "#architecture");
  assert.equal(
    await page.locator("html").getAttribute("data-view"),
    "engineering",
  );
  assert.deepEqual(errors, []);
  const nojs = await b.newPage({ javaScriptEnabled: false });
  await nojs.goto(url);
  assert.equal(await nojs.locator("#architecture").isVisible(), true);
  assert.ok(await nojs.locator("h1").innerText());
  console.log(
    "PASS: axe both themes; perspective modes; disclosures; theme persistence; filters; 5 responsive widths; mobile keyboard navigation; reduced motion; deep links; no-JS content; no runtime errors.",
  );
} finally {
  await b.close();
}
