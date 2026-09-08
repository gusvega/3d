import { test, expect } from "@playwright/test";
test("me is a separate gallery study with working assets and exploded plug-ins", async ({
  page,
}) => {
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  const response = await page.goto("/");
  expect(response.headers()["content-security-policy"]).toContain(
    "https://open.spotify.com",
  );
  await expect(
    page.getByRole("heading", { name: "GUS", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ferrofluid", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "me", exact: true }) })
    .click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page).toHaveTitle("me — Gus Vega");
  await expect(page.locator(".scene-container canvas")).toBeVisible();
  await page.getByRole("link", { name: "PLUG-INS", exact: true }).click();
  for (const name of ["UMBRA", "SPECTRA"]) {
    if (name !== "UMBRA")
      await page
        .getByRole("button", { name: `Explore ${name}`, exact: true })
        .click();
    const study = page.locator(`[data-plugin="${name}"]`).first();
    await study.evaluate((el) => {
      const dialog = el.closest("dialog");
      if (dialog)
        dialog.scrollTop +=
          el.getBoundingClientRect().top -
          dialog.getBoundingClientRect().top -
          60;
      else window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 76);
    });
    await expect(study.locator("canvas")).toBeVisible();
    await expect(
      study.getByRole("button", { name: "Download GLB" }),
    ).toBeEnabled();
    await study.evaluate((el) => {
      const dialog = el.closest("dialog");
      if (dialog)
        dialog.scrollTop +=
          el.getBoundingClientRect().top -
          dialog.getBoundingClientRect().top -
          60 +
          el.clientHeight -
          dialog.clientHeight;
      else
        window.scrollTo(
          0,
          el.getBoundingClientRect().top +
            scrollY -
            76 +
            el.clientHeight -
            innerHeight,
        );
    });
    await expect
      .poll(async () => Number(await study.getAttribute("data-spread")))
      .toBeGreaterThan(0.99);
    await expect(study.getByRole("slider")).toHaveCount(0);
    if (name !== "UMBRA") await page.keyboard.press("Escape");
  }
  await expect(
    page.locator(".plugin-model-showcase [data-plugin]"),
  ).toHaveCount(1);
  await expect(page.locator(".engineering-stories article")).toHaveCount(2);
  await expect(page.locator(".closing-actions a")).toHaveCount(3);
  expect(failures).toEqual([]);
});
