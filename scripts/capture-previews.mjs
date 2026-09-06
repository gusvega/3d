import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1000, height: 625 },
  reducedMotion: "reduce",
});
for (const [route, name] of [
  ["gus", "gus"],
  ["ferrofluid", "fluid"],
]) {
  if (process.argv[2] && route !== process.argv[2]) continue;
  await page.goto(`http://127.0.0.1:3104/${route}`);
  await page.locator("[data-ready=true]").waitFor();
  await page.addStyleTag({
    content:
      ".scene-caption,.scene-toolbar,.back-link,.focus-toggle,.sound-panel,.surface-label,.surface-hint{display:none!important}.fluid-experience{display:block!important;padding:0!important}.fluid-stage{height:100vh!important}.scene-surface canvas{width:100%!important;height:100%!important}",
  });
  await page.waitForTimeout(300);
  await page
    .locator(".scene-surface canvas")
    .screenshot({ path: `public/${name}-preview.png` });
}
await browser.close();
