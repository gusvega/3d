import { test, expect } from "@playwright/test";
test("Music redirects to its canonical site without adding a gallery card", async ({
  request,
  page,
}) => {
  const res = await request.get("/music", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toBe("https://gusvega.dev/music");
  await page.goto("/");
  await expect(page.locator('a[href="/music"]')).toHaveCount(0);
});
test("Old-domain projects remain exportable from the recovery page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "gus-music-project-v1",
      JSON.stringify({ version: 1, title: "Preserved project" }),
    );
  });
  await page.goto("/music/transfer");
  await expect(page.getByText("Preserved project")).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project" }).click();
  expect((await pending).suggestedFilename()).toBe(
    "Preserved-project.music.json",
  );
  await expect(page.getByRole("link", { name: "Open Music" })).toHaveAttribute(
    "href",
    "https://gusvega.dev/music",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("gus-music-project-v1")).title,
    ),
  ).toBe("Preserved project");
});
