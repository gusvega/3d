import { readFileSync, writeFileSync } from "node:fs";
// Scope the published library's complete styles to this portfolio, preserving other experiments.
const css = readFileSync(
  "node_modules/@gusvega/ui/dist/style.css",
  "utf8",
).replaceAll(":root", ":scope");
writeFileSync(
  "app/rohini/gus-ui.css",
  `/* Generated from @gusvega/ui@1.0.0. Run node scripts/rohini-styles.mjs. */\n@scope (.rohini-site) {\n${css}\n}\n`,
);
