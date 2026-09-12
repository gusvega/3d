import { test, expect } from "@playwright/test";
const STORE = "gus-music-project-v1";
test("Music composes, edits, practices, persists, and exports on desktop", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/music");
  await expect(
    page.getByRole("heading", { name: "Make a little music." }),
  ).toBeVisible();
  await page
    .getByLabel("WHAT DO YOU WANT TO WRITE?")
    .fill("A sparse melody in D minor, 4 bars, 118 BPM");
  await page.getByRole("button", { name: "Create composition" }).click();
  await expect(page.getByLabel("Tempo BPM")).toHaveValue("118");
  const project = () =>
    page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
  await expect.poll(async () => (await project()).root).toBe(2);
  let before = await project();
  expect(before.bars).toBe(4);
  await page
    .getByRole("button", { name: "○ Lock melody", exact: true })
    .click();
  await page.getByRole("button", { name: "New melody variation" }).click();
  let after = await project();
  expect(after.notes.melody.filter((n) => n.start < 4)).toEqual(
    before.notes.melody.filter((n) => n.start < 4),
  );
  await page
    .getByRole("button", { name: "Play composition", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop playback", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.locator(".transport-position small").textContent())
    .toContain("PLAYING");
  await page
    .getByRole("button", { name: "Stop playback", exact: true })
    .click();
  await page.getByLabel("Draw notes", { exact: true }).check();
  const firstCell = page
    .getByRole("button", { name: /Place .* at beat 1$/ })
    .first();
  await firstCell.click();
  after = await project();
  expect(after.notes.melody).not.toEqual(before.notes.melody);
  await page.getByRole("button", { name: "Play & learn" }).click();
  await page.getByRole("button", { name: "Practice this bar" }).click();
  const expected = (await project()).notes.melody
    .filter((n) => n.start < 4)
    .sort((a, b) => a.start - b.start)[0];
  const noteName = await page.locator(".lesson-banner h3").textContent();
  await page.getByRole("button", { name: noteName, exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/Yes|Phrase complete/);
  await page.getByRole("button", { name: "My Ableton" }).click();
  await expect(page.getByText("Destinations below come from")).toBeVisible();
  await page.getByRole("button", { name: "Projects & export" }).click();
  await page.getByLabel("Project name").fill("Browser test");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download all tracks .mid" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /Browser-test-D-minor-118bpm.mid/,
  );
  await page
    .getByRole("button", { name: "Save a version", exact: true })
    .click();
  await expect(page.locator(".saved-version")).toHaveCount(1);
  await page.reload();
  await expect.poll(async () => (await project()).title).toBe("Browser test");
  expect(errors).toEqual([]);
});
test("Phone layout supports composition, keyboard practice, and project transfer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/music");
  await expect(
    page.getByRole("heading", { name: "Make a little music." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Create composition" }).click();
  await page.getByRole("button", { name: "Mute Melody", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute Melody", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play & learn" }).click();
  await page.getByRole("button", { name: "Practice this bar" }).click();
  await page
    .getByRole("button", {
      name: await page.locator(".lesson-banner h3").textContent(),
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText(/Yes|Phrase complete/);
  await page.getByRole("button", { name: "Projects & export" }).click();
  const d = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download project", exact: true })
    .click();
  expect((await d).suggestedFilename()).toMatch(/\.music.json$/);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1}'),
  });
  await expect(page.getByRole("status")).toContainText("Invalid");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Offline reload retains a working saved composition", async ({
  page,
  context,
}) => {
  await page.goto("/music");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open("gus-music-offline-v1");
        return (await cache.keys()).filter((r) =>
          r.url.includes("/_next/static/"),
        ).length;
      }),
    )
    .toBeGreaterThan(2);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make a little music." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "KEY", exact: true })
    .selectOption("7");
  await expect
    .poll(() =>
      page.evaluate((k) => JSON.parse(localStorage.getItem(k)).root, STORE),
    )
    .toBe(7);
  await context.setOffline(false);
});

test("Browser synthesizer produces signal and Stop silences playback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function (...args) {
      const compressor = original.apply(this, args),
        analyser = this.createAnalyser();
      analyser.fftSize = 2048;
      compressor.connect(analyser);
      window.musicTestAnalyser = analyser;
      return compressor;
    };
  });
  await page.goto("/music");
  await page
    .getByRole("button", { name: "Play composition", exact: true })
    .click();
  const peak = () =>
    page.evaluate(() => {
      const a = window.musicTestAnalyser;
      if (!a) return 0;
      const d = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(d);
      return Math.max(...d.map(Math.abs));
    });
  await expect.poll(peak).toBeGreaterThan(0.001);
  await page
    .getByRole("button", { name: "Stop playback", exact: true })
    .click();
  await expect.poll(peak).toBeLessThan(0.00001);
});
