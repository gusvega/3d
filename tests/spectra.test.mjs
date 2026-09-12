import test from "node:test";
import assert from "node:assert/strict";
import { effectiveGains, StemPlayer } from "../app/spectra/player.js";

test("mute dominates solo, multiple solos combine, and dB gain is preserved", () => {
  assert.deepEqual(
    effectiveGains([
      { db: 0, mute: false, solo: true },
      { db: 6, mute: true, solo: true },
      { db: 0, mute: false, solo: false },
    ]),
    [1, 0, 0],
  );
  const gains = effectiveGains([
    { db: -6, mute: false, solo: false },
    { db: 0, mute: false, solo: false },
  ]);
  assert.ok(Math.abs(gains[0] - 0.501187) < 0.000001);
  assert.equal(gains[1], 1);
});

test("playback clock stops at buffered edge rather than drifting during network stalls", () => {
  const p = new StemPlayer(
    () => {},
    () => {},
  );
  p.playing = true;
  p.ctx = { currentTime: 20 };
  p.base = 0;
  p.position = 0;
  p.scheduledUntil = 6;
  p.job = { duration: 60 };
  assert.equal(p.now(), 6);
});

test("pause cancels pending audio and disconnects every scheduled source", () => {
  const p = new StemPlayer(
    () => {},
    () => {},
  );
  let stopped = 0,
    disconnected = 0,
    aborted = 0;
  p.playing = true;
  p.ctx = { currentTime: 4 };
  p.base = 0;
  p.position = 0;
  p.scheduledUntil = 6;
  p.job = { duration: 60 };
  p.abort = {
    abort() {
      aborted++;
    },
  };
  p.sources.add({
    stop() {
      stopped++;
    },
    disconnect() {
      disconnected++;
    },
  });
  p.stop();
  assert.equal(p.position, 4);
  assert.equal(p.playing, false);
  assert.equal(stopped, 1);
  assert.equal(disconnected, 1);
  assert.equal(aborted, 1);
  assert.equal(p.sources.size, 0);
});
