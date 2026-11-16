import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Test the deployed static artifact. No development server or external account is required.
const url = pathToFileURL(path.resolve("dist/index.html")).href;
const artifactDirectory = path.resolve("artifacts");
fs.mkdirSync(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));
page.setDefaultTimeout(12000);
const sceneIds = [
  "home",
  "about",
  "career",
  "impact",
  "world",
  "projects",
  "skills",
  "contact",
];

async function assertNoOverflow(width) {
  await page.setViewportSize({ width, height: 900 });
  const overflow = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    offenders: [
      ...document.querySelectorAll("main a, main button, main h1, main h2"),
    ]
      .filter((element) => {
        const r = element.getBoundingClientRect();
        return r.width && (r.right > innerWidth + 1 || r.left < -1);
      })
      .map((element) => element.textContent.trim().slice(0, 70)),
  }));
  assert.ok(
    overflow.document <= overflow.viewport + 1,
    `Horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`,
  );
  assert.deepEqual(
    overflow.offenders,
    [],
    `Interactive content is not clipped at ${width}px`,
  );
}

async function audit(label) {
  const result = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    })),
    [],
    `${label}: automated accessibility findings`,
  );
}

async function openAndClose(trigger) {
  const dialogId = (await trigger.getAttribute("data-open")).replace(/^#/, "");
  assert.ok(dialogId, "A landmark must identify its dialog");
  const dialog = page.locator(`dialog[id="${dialogId}"]`);
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  assert.equal(await dialog.evaluate((element) => element.open), true);
  assert.ok(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
    `Opening ${dialogId} places keyboard focus inside`,
  );
  assert.ok(
    (await dialog.innerText()).trim().length > 20,
    "Dialog has useful detail",
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.ok(
    await trigger.evaluate((element) => document.activeElement === element),
    `Closing ${dialogId} restores focus to its landmark`,
  );
}

try {
  await page.goto(url);
  for (const id of sceneIds) {
    assert.equal(await page.locator(`[data-scene][id="${id}"]`).count(), 1, id);
  }
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("#traveler").count(), 1);
  assert.ok(await page.locator("#quick-profile").isVisible());
  await page.locator("#quick-profile").click();
  const profile = page.locator("#profile-dialog");
  await profile.waitFor({ state: "visible" });
  assert.ok((await profile.innerText()).includes("13+"));
  assert.ok((await profile.innerText()).includes("$1M+"));
  assert.ok(await profile.locator('a[href^="mailto:"]').count());
  assert.ok(await profile.locator('a[download], a[href$=".pdf"]').count());
  await profile.locator("[data-close]").click();
  await profile.waitFor({ state: "hidden" });
  assert.ok(
    await page
      .locator("#quick-profile")
      .evaluate((element) => document.activeElement === element),
    "Quick Profile restores trigger focus",
  );

  for (const section of ["career", "projects", "world", "skills"]) {
    const landmarks = page.locator(`#${section} [data-open]`);
    assert.ok(await landmarks.count(), `${section} has explorable landmarks`);
    await openAndClose(landmarks.first());
  }

  // The character must actually travel and animate in response to scrolling.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  if ((await page.locator("html").getAttribute("data-motion")) === "off") {
    await page.locator("#motion-toggle").click();
  }
  const initialTransform = await page
    .locator("#traveler")
    .evaluate((element) => element.style.transform);
  const walking = await page.evaluate(
    () =>
      new Promise((resolve) => {
        window.addEventListener(
          "scroll",
          () =>
            requestAnimationFrame(() => {
              const traveler = document.getElementById("traveler");
              resolve({
                walking: traveler.classList.contains("walking"),
                transform: traveler.style.transform,
                limbAnimation: getComputedStyle(
                  traveler.querySelector(".leg-left"),
                ).animationName,
              });
            }),
          { once: true },
        );
        window.scrollTo({
          top: document.getElementById("career").offsetTop + 100,
          behavior: "instant",
        });
      }),
  );
  assert.ok(walking.walking, "Scrolling starts the walking animation");
  assert.notEqual(
    walking.transform,
    initialTransform,
    "Scrolling moves the traveler",
  );
  assert.notEqual(
    walking.limbAnimation,
    "none",
    "The walk animates character limbs",
  );
  await page.waitForFunction(
    () => !document.getElementById("traveler").classList.contains("walking"),
  );

  const mapTrigger = page.locator(".journey-controls [data-open]");
  const mapId = await mapTrigger.getAttribute("data-open");
  await mapTrigger.click();
  const mapDialog = page.locator(`dialog[id="${mapId}"]`);
  await mapDialog.waitFor({ state: "visible" });
  await mapDialog.locator('[data-map-link][href="#projects"]').click();
  await mapDialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      location.hash === "#projects" &&
      Math.abs(
        document.getElementById("projects").getBoundingClientRect().top,
      ) < 3,
  );

  // Paused mode makes screenshots deterministic and is itself a user-facing control.
  if ((await page.locator("html").getAttribute("data-motion")) !== "off") {
    await page.locator("#motion-toggle").click();
  }
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  // Fresh contexts avoid compositor artifacts from repeated viewport resizing.
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const screenshotContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const screenshotPage = await screenshotContext.newPage();
    await screenshotPage.goto(url);
    for (const scene of ["home", "career", "projects"]) {
      await screenshotPage
        .locator(`#${scene}`)
        .evaluate((element) =>
          element.scrollIntoView({ block: "start", behavior: "instant" }),
        );
      await screenshotPage.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
      await screenshotPage.screenshot({
        path: path.join(
          artifactDirectory,
          `journey-${viewport.name}${scene === "home" ? "" : `-${scene}`}.png`,
        ),
      });
    }
    await screenshotContext.close();
  }
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.locator("#theme-toggle").click();
    }
    await audit(`${theme} journey`);
    await page.locator("#quick-profile").click();
    await audit(`${theme} Quick Profile`);
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: path.join(artifactDirectory, `journey-desktop-${theme}.png`),
    });
  }
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator("#theme-toggle").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");

  for (const width of [1440, 1024, 768, 390, 320]) {
    await assertNoOverflow(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await openAndClose(page.locator("#career [data-open]").first());
  await page.locator("#quick-profile").click();
  await profile.waitFor({ state: "visible" });
  assert.ok(
    await profile.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    "Mobile Quick Profile has no horizontal overflow",
  );
  await page.keyboard.press("Escape");

  // Check the no-script experience separately; scenes and essential contact links remain available.
  const noScriptContext = await browser.newContext({
    javaScriptEnabled: false,
  });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(url);
  for (const id of sceneIds)
    assert.ok(await noScriptPage.locator(`#${id}`).isVisible(), id);
  assert.ok(await noScriptPage.locator('a[href^="mailto:"]').count());
  assert.ok(await noScriptPage.locator('a[href$=".pdf"]').count());
  await noScriptContext.close();
  assert.deepEqual(runtimeErrors, [], "No runtime errors");
  console.log(
    "PASS: eight illustrated destinations; Quick Profile; landmark dialogs; keyboard Escape and focus restoration; both themes and modal accessibility; saved theme; animated walking and map navigation; five responsive widths; mobile dialogs; reduced motion; no-script scenes/contact; no runtime errors. Screenshots: artifacts/journey-*.png",
  );
} finally {
  await browser.close();
}
