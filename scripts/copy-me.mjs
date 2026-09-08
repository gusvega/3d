import { cp, rm } from "node:fs/promises";
await rm("public/me", { recursive: true, force: true });
await cp("experiments/me/out", "public/me", { recursive: true });
