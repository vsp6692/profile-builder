import fs from "node:fs";
import { chromium } from "playwright";
import { scenery, engineer } from "./art.mjs";
const p = JSON.parse(fs.readFileSync("data/profile.json")),
  s = JSON.parse(fs.readFileSync("data/site.json"));
const e = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.setContent(
    `<html><head><style>:root{${Object.entries(s.journey.palette.light)
      .map(([k, v]) => `--scene-${k}:${v}`)
      .join(
        ";",
      )}}body{margin:0;background:var(--scene-sky);color:var(--scene-ink)}.landscape{position:absolute;inset:0;width:1200px;height:630px}.copy{position:absolute;left:520px;top:90px;width:600px}h1{font:68px/1.1 Georgia;letter-spacing:-3px;margin:12px 0}em{color:var(--scene-red)}p{font:24px/1.5 Arial;max-width:500px}.label{font:12px monospace;letter-spacing:2px}.engineer-avatar{position:absolute;width:85px;left:360px;bottom:70px}</style></head><body>${scenery("home")}${engineer(s.journey.character)}<div class="copy"><span class="label">WALK THROUGH MY ENGINEERING JOURNEY</span><h1>Hi, I’m <em>${e(p.shortName)}.</em></h1><p>${e(s.journey.heroLine)}</p><span class="label">${e(s.displayName)}</span></div></body></html>`,
  );
  await page.screenshot({ path: s.socialImage });
} finally {
  await browser.close();
}
