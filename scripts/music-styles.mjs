import { readFileSync, writeFileSync } from "node:fs";
// Use the published GUS UI stylesheet, scoped to Music so sibling experiences retain their themes.
const css = readFileSync(
  "node_modules/@gusvega/ui/dist/style.css",
  "utf8",
).replaceAll(":root", ":scope");
writeFileSync(
  "app/music/gus-ui.css",
  `/* Generated from @gusvega/ui@1.0.0. Run node scripts/music-styles.mjs. */\n@scope (.music-app) {\n${css}\n}\n`,
);
