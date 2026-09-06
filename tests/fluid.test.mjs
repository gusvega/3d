import test from "node:test";
import assert from "node:assert/strict";
import { FluidResponse, CELL_COUNT } from "../lib/fluid-response.mjs";
import { magneticCells, bindSurface } from "../lib/fluid-surface.mjs";
const peak = (state) => Math.max(...state.heights);
const silence = new Uint8Array(512);
const bass = new Uint8Array(512);
bass.fill(230, 1, 6);
const treble = new Uint8Array(512);
treble.fill(230, 90, 180);
function settle(state, data, seconds, settings = {}, hz = 60) {
  for (let i = 0; i < seconds * hz; i++)
    state.update(data, 48000, 1 / hz, settings);
  return state;
}
test("a bass transient creates a substantial surface response within 100ms", () => {
  const state = settle(new FluidResponse(), silence, 1, { field: 0 });
  assert.equal(peak(state), 0);
  settle(state, bass, 0.1, { field: 0 });
  assert.ok(peak(state) > 0.25, `height ${peak(state)}`);
  assert.ok(state.bass > 0.25);
});
test("sustained tones remain visible instead of reacting only to the onset", () => {
  const state = settle(new FluidResponse(), treble, 2, { field: 0 });
  assert.ok(peak(state) > 0.25);
  assert.ok(state.high > 0.1);
  settle(state, silence, 3, { field: 0 });
  assert.ok(peak(state) < 0.005);
  assert.ok(state.energy < 0.005);
});
test("higher decay creates a longer release without slowing the initial attack", () => {
  const short = settle(new FluidResponse(), bass, 1, { field: 0, decay: 0 });
  const long = settle(new FluidResponse(), bass, 1, { field: 0, decay: 1 });
  settle(short, silence, 0.3, { field: 0, decay: 0 });
  settle(long, silence, 0.3, { field: 0, decay: 1 });
  assert.ok(peak(long) > peak(short) * 2);
});
test("audio envelopes remain consistent across 30, 60, and 120Hz", () => {
  const results = [30, 60, 120].map((hz) =>
    peak(settle(new FluidResponse(), bass, 1, { field: 0 }, hz)),
  );
  assert.ok(
    Math.max(...results) - Math.min(...results) < 0.035,
    JSON.stringify(results),
  );
});
test("silence remains finite and mode weighting distinguishes bass and detail", () => {
  const a = settle(new FluidResponse(), bass, 1, { field: 0, mode: "bass" });
  const b = settle(new FluidResponse(), bass, 1, { field: 0, mode: "detail" });
  assert.ok(peak(a) > peak(b));
  const idle = settle(new FluidResponse(), null, 2);
  assert.ok([...idle.heights].every(Number.isFinite));
  assert.equal(idle.energy, 0);
});
test("surface binding is normalized and stable across duplicated sphere seams", () => {
  const cells = magneticCells();
  for (let i = 0; i < CELL_COUNT; i++)
    assert.ok(
      Math.abs(Math.hypot(...cells.slice(i * 3, i * 3 + 3)) - 1) < 1e-6,
    );
  const owners = bindSurface(
    new Float32Array([1, 0, 0, 2, 0, 0, 0, 1, 0]),
    cells,
  );
  assert.deepEqual([...owners.slice(0, 4)], [...owners.slice(4, 8)]);
  assert.ok(
    [...owners].every(
      (value) => Number.isInteger(value) && value >= 0 && value < CELL_COUNT,
    ),
  );
  assert.equal(new Set(owners.slice(0, 4)).size, 4);
});

test("irregular surface support fits its four-cell binding without cut seams", () => {
  const cells = magneticCells();
  for (let i = 0; i < 20000; i++) {
    const y = 1 - (i + 0.5) / 10000;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(i * 2.3999632297) * r;
    const z = Math.sin(i * 2.3999632297) * r;
    let overlaps = 0;
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      if (
        x * cells[cell * 3] +
          y * cells[cell * 3 + 1] +
          z * cells[cell * 3 + 2] >
        1 - 0.018
      )
        overlaps++;
    }
    assert.ok(overlaps <= 4, `${overlaps} overlapping supports`);
  }
});
