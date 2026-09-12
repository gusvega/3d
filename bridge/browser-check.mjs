import { chromium, webkit } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
await fs.mkdir("test-results", { recursive: true });
const key = (await fs.readFile(process.env.SPECTRA_KEY_FILE, "utf8")).trim();
const browser = await (
  process.env.SPECTRA_BROWSER === "webkit" ? webkit : chromium
).launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  process.env.SPECTRA_TEST_URL || "http://localhost:3018/spectra",
);
await page.getByLabel("Your access key").fill(key);
await page.getByRole("button", { name: "Open workspace ↗" }).click();
await page.getByText("Mac connected", { exact: true }).waitFor();
await page.getByRole("button", { name: "Play", exact: true }).click();
await page.waitForTimeout(1600);
console.log(
  "playing",
  await page.getByRole("button", { name: "Pause", exact: true }).count(),
  "alerts",
  await page.getByRole("alert").allTextContents(),
);
await page.getByRole("button", { name: "Solo Drums", exact: true }).click();
console.log(
  "solo",
  await page
    .getByRole("button", { name: "Solo Drums", exact: true })
    .getAttribute("aria-pressed"),
);
await page.waitForTimeout(6000);
console.log("clock", await page.locator('[class*="time"]').textContent());
console.log(
  "overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
await page.screenshot({
  path: "test-results/spectra-mobile.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Pause", exact: true }).click();
const downloadP = page.waitForEvent("download");
await page.getByRole("button", { name: "Save Drums WAV", exact: true }).click();
const download = await downloadP;
console.log("download", download.suggestedFilename());
await download.saveAs("test-results/spectra-drums.wav");
await page.getByLabel("Seek audio").fill("12");
await page.getByRole("button", { name: "Play", exact: true }).click();
await page.waitForTimeout(1800);
console.log("seek clock", await page.locator('[class*="time"]').textContent());
assert.deepEqual(errors, []);
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
console.log("errors", errors);
await browser.close();
