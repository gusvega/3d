import { test, expect } from "@playwright/test";
test("me is a separate gallery study with working assets and exploded plug-ins", async ({
  page,
}) => {
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/");
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
  await page.getByRole("button", { name: "SPECTRA", exact: true }).click();
  await expect(page.locator(".plugin-model-showcase canvas")).toBeVisible();
  await page
    .getByRole("button", { name: "Explode instrument", exact: true })
    .click();
  await expect(
    page.getByRole("slider", { name: "SPECTRA assembly separation" }),
  ).toHaveValue("1");
  await expect(page.getByRole("button", { name: "04Fasteners" })).toBeVisible();
  expect(failures).toEqual([]);
});
