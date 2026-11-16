import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

// Exercise the production artifact over HTTP, including real download behavior.
// The ephemeral server belongs only to this test and always closes in finally.
const root = path.resolve("dist");
const artifacts = path.resolve("artifacts");
const profileData = JSON.parse(fs.readFileSync("data/profile.json", "utf8"));
const siteData = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
fs.mkdirSync(artifacts, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
let browser;
const runtimeErrors = [];
const failedRequests = [];

async function visibleBounds(locator, label, vertical = true) {
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const r = element.getBoundingClientRect();
      const dialog = element.closest("dialog");
      const d = dialog?.getBoundingClientRect();
      return {
        text: element.textContent.trim().slice(0, 60),
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        dialogTop: d?.top ?? 0,
        dialogBottom: d?.bottom ?? innerHeight,
      };
    }),
  );
  assert.ok(boxes.length, `${label}: expected visible elements`);
  for (const box of boxes) {
    assert.ok(
      box.width > 0 && box.left >= -1 && box.right <= box.viewportWidth + 1,
      `${label}: horizontal clipping ${JSON.stringify(box)}`,
    );
    if (vertical)
      assert.ok(
        box.top >= Math.max(0, box.dialogTop) - 1 &&
          box.bottom <= Math.min(box.viewportHeight, box.dialogBottom) + 1,
        `${label}: below initial view ${JSON.stringify(box)}`,
      );
  }
}

async function closeAll(page) {
  while (await page.locator("dialog[open]").count())
    await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.body.classList.contains("modal-open"),
  );
}

async function openArchitecture(page, build) {
  const world = siteData.journey.worlds.find((item) =>
    item.architectureIds?.includes(build.id),
  );
  assert.ok(world, `${build.id} is reachable from the engineering world`);
  await page.locator(`#world [data-open="world-${world.id}"]`).click();
  await page
    .locator(`#world-${world.id} [data-open="architecture-${build.id}"]`)
    .click();
  const dialog = page.locator(`#architecture-${build.id}`);
  await dialog.waitFor({ state: "visible" });
  return dialog;
}

async function assertNodeSelection(dialog, index) {
  const nodes = dialog.locator("[data-node-target]");
  for (let i = 0; i < (await nodes.count()); i++) {
    assert.equal(
      await nodes.nth(i).getAttribute("aria-expanded"),
      String(i === index),
    );
    const target = await nodes.nth(i).getAttribute("aria-controls");
    assert.equal(
      await dialog.locator(`[id="${target}"]`).isVisible(),
      i === index,
    );
  }
}

try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedRequests.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => {
    window.__copied = [];
    window.__clipboardReject = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          if (window.__clipboardReject)
            throw Error("Clipboard blocked for test");
          window.__copied.push(text);
        },
      },
    });
  });
  await page.goto(url);
  assert.deepEqual(
    await page
      .locator("[data-open], [data-node-target]")
      .evaluateAll((elements) =>
        elements
          .map((element) => element.dataset.open || element.dataset.nodeTarget)
          .filter((id) => !document.getElementById(id)),
      ),
    [],
    "Every configured discovery and component has a target",
  );

  // The recruiter can act without scrolling, even on a small phone.
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 700 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.locator("#quick-profile").click();
    const quick = page.locator("#profile-dialog");
    await quick.waitFor({ state: "visible" });
    assert.equal(await quick.evaluate((element) => element.scrollTop), 0);
    await visibleBounds(
      quick.locator(".profile-essentials .actions a"),
      `Resume/contact ${viewport.width}px`,
    );
    await visibleBounds(
      quick.locator(".quick-facts p"),
      `Metrics ${viewport.width}px`,
    );
    assert.ok(
      (await quick.innerText()).includes(
        profileData.journey.find(
          (job) => job.current && job.kind === "employment",
        ).company,
      ),
    );
    if (viewport.width !== 320)
      await page.screenshot({
        path: path.join(
          artifacts,
          `discovery-${viewport.width === 390 ? "mobile" : "desktop"}-profile.png`,
        ),
      });
    await page.keyboard.press("Escape");
  }

  // Nested evidence sources return focus to the exact previous discovery.
  await page.locator("#quick-profile").click();
  const impactTrigger = page.locator(
    "#profile-dialog .profile-shortcuts [data-open^=impact-]",
  );
  const impactId = await impactTrigger.getAttribute("data-open");
  await impactTrigger.click();
  const impact = page.locator(`#${impactId}`);
  assert.equal(await impact.locator(".evidence-trail > li").count(), 3);
  const careerTrigger = impact
    .locator(".source-trail [data-open^=career-]")
    .first();
  const careerId = await careerTrigger.getAttribute("data-open");
  await careerTrigger.click();
  await page.locator(`#${careerId}`).waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.locator(`#${careerId}`).waitFor({ state: "hidden" });
  assert.ok(
    await careerTrigger.evaluate(
      (element) => document.activeElement === element,
    ),
    "Career closes back to the impact source",
  );
  await page.keyboard.press("Escape");
  await impact.waitFor({ state: "hidden" });
  assert.ok(
    await impactTrigger.evaluate(
      (element) => document.activeElement === element,
    ),
    "Impact closes back to Quick Profile",
  );
  await page.keyboard.press("Escape");
  assert.ok(
    await page
      .locator("#quick-profile")
      .evaluate((element) => document.activeElement === element),
  );

  await page.locator('#world [data-open="world-security"]').click();
  assert.deepEqual(
    await page
      .locator("#world-security .architecture-entry")
      .evaluateAll((elements) =>
        elements.map((element) => element.dataset.open),
      ),
    ["architecture-secretmesh-architecture"],
    "Security shows only its associated architecture",
  );
  await closeAll(page);
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page.locator("#theme-toggle").click();
    for (const build of profileData.builds) {
      const dialog = await openArchitecture(page, build);
      const nodes = dialog.locator("[data-node-target]");
      await nodes.first().click();
      await assertNodeSelection(dialog, 0);
      await nodes.first().focus();
      await page.keyboard.press("ArrowRight");
      await assertNodeSelection(dialog, 1);
      assert.ok(
        await nodes
          .nth(1)
          .evaluate((element) => document.activeElement === element),
      );
      await page.keyboard.press("End");
      await assertNodeSelection(dialog, (await nodes.count()) - 1);
      await page.keyboard.press("Home");
      await assertNodeSelection(dialog, 0);
      await nodes.nth(1).click();
      await assertNodeSelection(dialog, 1);
      const audit = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        audit.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.target),
        })),
        [],
        `${theme} ${build.id} accessibility`,
      );
      if (build.id === "secretmesh-architecture" && theme === "light")
        await page.screenshot({
          path: path.join(artifacts, "discovery-desktop-architecture.png"),
        });
      await closeAll(page);
    }
  }
  await page.locator("#theme-toggle").click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const build of profileData.builds) {
      const dialog = await openArchitecture(page, build);
      await visibleBounds(
        dialog.locator(".system-node, .system-explanation:not([hidden])"),
        `${build.id} at ${width}px`,
        false,
      );
      assert.ok(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        "Architecture dialog has no horizontal overflow",
      );
      await dialog.locator("[data-node-target]").last().click();
      await assertNodeSelection(
        dialog,
        (await dialog.locator("[data-node-target]").count()) - 1,
      );
      if (width === 390 && build.id === "secretmesh-architecture")
        await page.screenshot({
          path: path.join(artifacts, "discovery-mobile-architecture.png"),
        });
      await closeAll(page);
    }
  }

  // Repository/demo buttons reflect configuration exactly; cache evidence is dated.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const project of profileData.work) {
    await page.locator(`#projects [data-open="project-${project.id}"]`).click();
    const dialog = page.locator(`#project-${project.id}`);
    const expected = [project.repoUrl || project.link, project.demoUrl].filter(
      Boolean,
    );
    assert.deepEqual(
      await dialog
        .locator(".project-actions a")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("href")),
        ),
      expected,
    );
    if (
      siteData.github?.repositories.includes(
        (project.repoUrl || project.link || "").replace(
          "https://github.com/",
          "",
        ),
      )
    ) {
      assert.ok(
        await dialog.locator(".repository-note time[datetime]").count(),
        "Cached repository information has a timestamp",
      );
    }
    await closeAll(page);
  }

  async function assertCopy(button, status, expected, successMessage) {
    await page.evaluate(() => {
      window.__clipboardReject = false;
    });
    await button.click();
    await page.waitForFunction(
      ({ selector, message }) =>
        document.querySelector(selector)?.textContent === message,
      { selector: status, message: successMessage },
    );
    assert.equal(await page.evaluate(() => window.__copied.at(-1)), expected);
    await page.evaluate(() => {
      window.__clipboardReject = true;
    });
    await button.click();
    await page.waitForFunction(
      ({ selector, message }) =>
        document.querySelector(selector)?.textContent === message,
      {
        selector: status,
        message: `Copy unavailable. Select and copy: ${expected}`,
      },
    );
  }
  await assertCopy(
    page.locator("#contact [data-email]"),
    "#feedback",
    profileData.contact.email,
    "Email copied. Ready for your introduction.",
  );
  await page.locator("#quick-profile").click();
  await assertCopy(
    page.locator("#profile-dialog [data-email]"),
    "#profile-dialog [data-copy-status]",
    profileData.contact.email,
    "Email copied. Ready for your introduction.",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#profile-dialog a[download]").click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), profileData.resume.filename);
  assert.equal(await download.failure(), null);
  const file = fs.readFileSync(await download.path());
  assert.equal(
    file.subarray(0, 5).toString(),
    "%PDF-",
    "The downloaded resume is an actual PDF",
  );
  await closeAll(page);
  await page.locator('#skills [data-open="briefs-dialog"]').click();
  await page.locator("#briefs-dialog summary").first().click();
  await assertCopy(
    page.locator("#briefs-dialog [data-copy]").first(),
    "#briefs-dialog [data-copy-status]",
    profileData.prompts[0].text,
    "Engineering brief copied.",
  );
  await closeAll(page);

  // An unavailable optional discovery should not crash the page.
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "missing-discovery-test";
    button.dataset.open = "not-configured";
    button.textContent = "Unavailable optional note";
    document.body.append(button);
  });
  await page.locator("#missing-discovery-test").click();
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.deepEqual(runtimeErrors, [], "No runtime errors");
  assert.deepEqual(failedRequests, [], "All local assets load successfully");
  console.log(
    "PASS: mobile recruiter actions and metrics; nested evidence focus; architecture associations, keyboard exploration, mobile bounds and both-theme accessibility; configured repository/demo URLs and timestamps; clipboard success/fallback; actual PDF download; missing discovery targets; no runtime errors. Screenshots: artifacts/discovery-*.png",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
