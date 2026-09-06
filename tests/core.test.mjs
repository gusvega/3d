import test from "node:test";
import assert from "node:assert/strict";
import { AudioSession, MAX_FILE_BYTES } from "../lib/audio-session.mjs";
import { parseYouTubeId } from "../lib/youtube.mjs";
import { createFrameClock } from "../lib/frame-clock.mjs";
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
function harness(options = {}) {
  const sources = [];
  const node = () => ({
    connect() {},
    disconnect() {},
    stop() {
      this.stopped = true;
    },
    start() {},
  });
  const ctx = {
    currentTime: 0,
    sampleRate: 48000,
    resume: async () => {},
    close: async () => {
      ctx.closed = true;
    },
    createAnalyser: () => ({ ...node(), frequencyBinCount: 1024 }),
    createGain: () => ({ ...node(), gain: { value: 1, setTargetAtTime() {} } }),
    createBufferSource: () => {
      const source = node();
      sources.push(source);
      return source;
    },
    createMediaStreamSource: () => node(),
    decodeAudioData: async () => ({ duration: 60 }),
  };
  const track = {
    stopped: false,
    stop() {
      this.stopped = true;
    },
  };
  const stream = { getTracks: () => [track] };
  const session = new AudioSession({
    createContext: () => ctx,
    getUserMedia: async () => stream,
    ...options,
  });
  return { session, ctx, sources, track, stream };
}
const file = (name) => ({
  name,
  size: 24,
  arrayBuffer: async () => new ArrayBuffer(24),
});

test("YouTube parser accepts supported forms and rejects injection and deceptive origins", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [
    id,
    `https://youtu.be/${id}?t=20`,
    `https://www.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://youtube.com/shorts/${id}`,
  ])
    assert.equal(parseYouTubeId(url), id);
  for (const url of [
    `https://evil.example/?v=${id}`,
    `https://youtu.be.evil.example/${id}`,
    `javascript:${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`,
    `garbage ${id} garbage`,
    "https://youtube.com/watch?v=abc",
    `https://youtube.com/watch?v=${encodeURIComponent('abcdefghijk"></iframe><img src=x onerror=alert(1)>')}`,
    `https://youtu.be/${id}/extra`,
  ])
    assert.equal(parseYouTubeId(url), null, url);
});
test("microphone replaces playing file and explicit stop releases all tracks", async () => {
  const { session, sources, track } = harness();
  await session.loadFile(file("first.wav"));
  assert.equal(session.active, true);
  await session.microphone();
  assert.equal(sources[0].stopped, true);
  assert.equal(session.state.mode, "mic");
  session.stop();
  assert.equal(track.stopped, true);
  assert.equal(session.active, false);
});
test("permission resolving after dispose cannot leave a microphone running", async () => {
  const pending = deferred();
  const { session, stream, track, ctx } = harness({
    getUserMedia: () => pending.promise,
  });
  const request = session.microphone();
  await flush();
  session.dispose();
  pending.resolve(stream);
  await request;
  assert.equal(track.stopped, true);
  assert.equal(ctx.closed, true);
  assert.equal(session.state.mode, "idle");
});
test("late microphone permission cannot replace a newer file", async () => {
  const pending = deferred();
  const { session, stream, track } = harness({
    getUserMedia: () => pending.promise,
  });
  const request = session.microphone();
  await flush();
  await session.loadFile(file("new.wav"));
  pending.resolve(stream);
  await request;
  assert.equal(track.stopped, true);
  assert.equal(session.state.name, "new.wav");
  assert.equal(session.active, true);
});
test("late file decode cannot override a newer source", async () => {
  const { session, ctx } = harness();
  const pending = deferred();
  ctx.decodeAudioData = () => pending.promise;
  const first = session.loadFile(file("old.wav"));
  await flush();
  ctx.decodeAudioData = async () => ({ duration: 20 });
  await session.loadFile(file("new.wav"));
  pending.resolve({ duration: 60 });
  await first;
  assert.equal(session.state.name, "new.wav");
  assert.equal(session.state.duration, 20);
});
test("transport preserves paused position and clamps seek/end/restart", async () => {
  const { session, ctx } = harness();
  await session.loadFile(file("song.wav"));
  ctx.currentTime = 12;
  session.pause();
  ctx.currentTime = 22;
  assert.equal(session.currentTime, 12);
  session.seek(-10);
  assert.equal(session.currentTime, 0);
  session.seek(70);
  assert.equal(session.currentTime, 60);
  await session.play();
  assert.equal(session.currentTime, 0);
  session.seek(100);
  assert.equal(session.state.playing, false);
  assert.equal(session.currentTime, 60);
});
test("invalid files and permission errors return to a recoverable idle state", async () => {
  const { session } = harness({
    getUserMedia: async () => {
      throw { name: "NotAllowedError" };
    },
  });
  await session.loadFile({ ...file("huge.wav"), size: MAX_FILE_BYTES + 1 });
  assert.match(session.state.error, /64 MB/);
  await session.microphone();
  assert.match(session.state.error, /not allowed/);
  assert.equal(session.state.mode, "idle");
  await session.loadFile(file("valid.wav"));
  assert.equal(session.state.error, "");
  assert.equal(session.active, true);
});
test("fixed-step motion advances equally at 30, 60 and 120 Hz", () => {
  const durations = [30, 60, 120].map((hz) => {
    const clock = createFrameClock();
    let time = 0;
    for (let i = 0; i <= hz * 5; i++)
      clock.tick((i * 1000) / hz, (dt) => (time += dt));
    return time;
  });
  assert.ok(Math.max(...durations) - Math.min(...durations) < 0.00001);
});
test("clock bounds catch-up after backgrounding and resets cleanly", () => {
  const clock = createFrameClock();
  let steps = 0;
  clock.tick(0, () => steps++);
  clock.tick(60000, () => steps++);
  assert.ok(steps <= 7);
  clock.reset();
  steps = 0;
  clock.tick(120000, () => steps++);
  assert.equal(steps, 1);
});
