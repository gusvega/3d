// Stable 60 Hz simulation regardless of display refresh rate. Bound catch-up
// work after a slow frame; resuming a hidden tab starts a fresh clock.
export function createFrameClock() {
  let previous;
  let accumulator = 0;
  return {
    reset() {
      previous = undefined;
      accumulator = 0;
    },
    tick(now, step) {
      if (previous === undefined) {
        previous = now;
        step(1 / 60);
        return;
      }
      accumulator += Math.max(0, Math.min((now - previous) / 1000, 0.1));
      previous = now;
      while (accumulator + 1e-9 >= 1 / 60) {
        step(1 / 60);
        accumulator -= 1 / 60;
      }
    },
  };
}
