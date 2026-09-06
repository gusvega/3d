import { test, expect } from "@playwright/test";

test("both scenes render, keyboard motion controls work, and routes stay clean", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Small experiments",
  );
  await expect
    .poll(() =>
      page
        .locator(".sketch-preview img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  for (const route of ["/gus", "/ferrofluid"]) {
    await page.goto(route);
    await expect(page.locator("[data-ready=true]")).toBeVisible();
    await page.locator("canvas").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Home");
    await page
      .getByRole("button", { name: "Pause motion", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Resume motion", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  expect(errors).toEqual([]);
});

test("demo, transport, microphone switch and navigation release work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await original(options);
      window.testMicStream = stream;
      return stream;
    };
  });
  await page.goto("/ferrofluid");
  await expect(page.locator("[data-ready=true]")).toBeVisible();
  await page.getByRole("button", { name: "Play sound demo" }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".audio-status")).toContainText("Sound is shaping");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page
    .getByRole("button", { name: "Use microphone", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop listening", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Stop listening", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      window.testMicStream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Use microphone", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop listening", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to sketch index" }).click();
  await expect(page).toHaveURL("/");
  expect(
    await page.evaluate(() =>
      window.testMicStream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
});

test("YouTube injection is rejected and no markup is inserted", async ({
  page,
}) => {
  await page.goto("/ferrofluid");
  await page.getByText("Play a YouTube video", { exact: true }).click();
  await page
    .getByLabel("YouTube link or video ID")
    .fill(
      "https://youtube.com/watch?v=" +
        encodeURIComponent(
          'abcdefghijk"></iframe><span id="injected">bad</span>',
        ),
    );
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.locator("#youtube-error")).toContainText("Use a YouTube");
  await expect(page.locator("#injected")).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("reduced motion starts paused and keyboard focus view remains recoverable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ferrofluid");
  await expect(
    page.getByRole("button", { name: "Resume motion", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Focus on scene" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Show controls" }),
  ).toBeFocused();
  await expect(page.getByRole("complementary")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toBeVisible();
  await page.getByRole("button", { name: "Choose audio file" }).focus();
  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  expect(await chooser).toBeTruthy();
});

test("unsupported WebGL has an actionable fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.startsWith("webgl")
        ? null
        : original.call(this, kind, ...args);
    };
  });
  await page.goto("/gus");
  await expect(page.locator(".scene-fallback")).toContainText(
    "could not start",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("mobile panel does not cover the scene or overflow the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ferrofluid");
  await expect(page.locator("[data-ready=true]")).toBeVisible();
  const scene = await page.locator(".fluid-stage").boundingBox();
  const panel = await page.getByRole("complementary").boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(scene.y + scene.height - 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Play sound demo" }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
});

test("uploaded WAV decodes, produces analyser data, and clears cleanly", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function (...args) {
      const analyser = original.apply(this, args);
      window.testAnalyser = analyser;
      return analyser;
    };
  });
  const rate = 8000,
    samples = rate * 10;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    wav.writeInt16LE(
      Math.round(Math.sin((i * 2 * Math.PI * 110) / rate) * 5000),
      44 + i * 2,
    );
  await page.goto("/ferrofluid");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose audio file" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "test-tone.wav",
    mimeType: "audio/wav",
    buffer: wav,
  });
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const a = window.testAnalyser;
        if (!a) return 0;
        const bins = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(bins);
        return Math.max(...bins);
      }),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Unload audio" }).click();
  await expect(page.locator(".transport")).toHaveCount(0);
  await expect(page.locator(".audio-status")).toContainText("Choose a sound");
});

test("lost WebGL context can be replaced without reloading the page", async ({
  page,
}) => {
  await page.goto("/gus");
  await expect(page.locator("[data-ready=true]")).toBeVisible();
  await page
    .locator("canvas")
    .evaluate((canvas) =>
      canvas
        .getContext("webgl2")
        .getExtension("WEBGL_lose_context")
        .loseContext(),
    );
  await expect(page.locator(".scene-fallback")).toContainText("interrupted");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("[data-ready=true]")).toBeVisible();
});
