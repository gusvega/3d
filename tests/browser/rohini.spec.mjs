import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const inventory = JSON.parse(
  readFileSync(new URL("../../data/rohini/inventory.json", import.meta.url)),
);
const pages = JSON.parse(
  readFileSync(new URL("../../data/rohini/pages.json", import.meta.url)),
);
const routes = [
  "",
  "about",
  "mcg",
  "cuemed",
  "impinj-lab",
  "joe-coffee",
  "home-depot",
  "standard-goods",
  "spitfyre",
  "cdk",
];
test("portfolio filters and project navigation work", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/rohini");
  await expect(page.locator(".r-project-card")).toHaveCount(8);
  await page.getByRole("button", { name: "Healthcare", exact: true }).click();
  await expect(page.locator(".r-project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Consumer", exact: true }).click();
  await expect(page.locator(".r-project-card")).toHaveCount(3);
  await page.getByRole("button", { name: "All work 08", exact: true }).click();
  await page.locator('a.r-project-link[href="/rohini/impinj-lab"]').click();
  await expect(page).toHaveURL(/\/rohini\/impinj-lab$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "engineering",
  );
  const open = page.getByRole("button", { name: /Enlarge/ }).first();
  await open.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(open).toBeFocused();
  expect(errors).toEqual([]);
});
test("every page renders its complete case study on mobile without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const slug of routes) {
    const response = await page.goto(`/rohini${slug ? "/" + slug : ""}`);
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (pages[slug] && slug !== "about") {
      await expect(page.locator(".r-case-section")).toHaveCount(
        pages[slug].length,
      );
      const expected = pages[slug]
        .flatMap((s) => s.blocks)
        .filter((b) => b.type === "image").length;
      await expect(page.locator(".r-image-button")).toHaveCount(expected);
    }
  }
  expect(errors).toEqual([]);
});
test("mobile menu, accordion, protected access, and legacy paths work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/rohini");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "About me" })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  const trigger = page.getByRole("button", {
    name: "02 — Make complexity clear",
  });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.goto("/rohini/mcg");
  await expect(
    page.getByRole("link", { name: "Open protected case studies" }),
  ).toHaveAttribute("href", "https://www.mrohini.com/securepages/index.html");
  await page.goto("/rohini/joe-coffee.html");
  await expect(page).toHaveURL(/\/rohini\/joe-coffee$/);
});
test("all imported media and documents are served locally", async ({
  request,
}) => {
  const assets = inventory.assets.filter((p) => p.startsWith("images/"));
  for (let i = 0; i < assets.length; i += 12) {
    await Promise.all(
      assets.slice(i, i + 12).map(async (p) => {
        const res = await request.get(
          "/rohini/assets/" + p.split("/").map(encodeURIComponent).join("/"),
        );
        expect(res.status(), p).toBe(200);
        expect(Number(res.headers()["content-length"]), p).toBeGreaterThan(0);
      }),
    );
  }
});
