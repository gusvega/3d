export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export type NarrativeState = {
  chapter: number;
  local: number;
  progress: number;
  reduced: boolean;
  mobile: boolean;
  visible: boolean;
  astraSelection: number;
};
export const narrative: NarrativeState = {
  chapter: 0,
  local: 0,
  progress: 0,
  reduced: false,
  mobile: false,
  visible: true,
  astraSelection: 0,
};
export const listeners = new Set<() => void>();
export function notifyScene() {
  listeners.forEach((fn) => fn());
}
// Semantic chapter poses; offsets are world-space distances along mechanical axes.
export const poses = [
  { spread: 0, turn: -0.16, lift: 0, astra: 0 },
  { spread: 1, turn: 0.08, lift: 0, astra: 0 },
  { spread: 0.72, turn: -0.14, lift: 0, astra: 0 },
  { spread: 0.48, turn: 0.12, lift: 0, astra: 0 },
  { spread: 0.1, turn: 0, lift: 0, astra: 1 },
  { spread: 0.25, turn: -0.18, lift: 0, astra: 0 },
  { spread: 0.82, turn: 0.1, lift: 0, astra: 0 },
  { spread: 1, turn: 0.2, lift: 0, astra: 0 },
  { spread: 0, turn: -0.16, lift: 0, astra: 0 },
  { spread: 0, turn: -0.16, lift: 0, astra: 0 },
];
export function getPose(chapter: number, local: number) {
  const from = poses[Math.max(0, chapter - 1)],
    to = poses[chapter];
  const t = smooth(local * 3);
  return {
    spread: from.spread + (to.spread - from.spread) * t,
    turn: from.turn + (to.turn - from.turn) * t,
    astra: chapter === 4,
  };
}
