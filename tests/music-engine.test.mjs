import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  generate,
  scale,
  pc,
  MODES,
  transpose,
  midi,
  validateProject,
  chord,
  scaleNames,
} from "../lib/music/engine.mjs";
test("Every generated pitched part stays in key across all roots and modes", () => {
  for (let root = 0; root < 12; root++)
    for (const mode of Object.keys(MODES)) {
      const p = { ...createProject(), root, mode };
      p.notes = generate(p);
      validateProject(p);
      for (const part of ["melody", "chords", "bass", "arp"])
        for (const n of p.notes[part])
          assert.ok(
            scale(root, mode).includes(pc(n.pitch)),
            `${root} ${mode} ${part} ${n.pitch}`,
          );
    }
});
test("Locked melody bars survive regeneration and mode transposition preserves rhythm", () => {
  let p = createProject();
  p.locked = [0, 3];
  const next = generate({ ...p, seed: 53 }, p.notes);
  for (const b of p.locked)
    assert.deepEqual(
      next.melody.filter((n) => Math.floor(n.start / 4) === b),
      p.notes.melody.filter((n) => Math.floor(n.start / 4) === b),
    );
  for (let root = 0; root < 12; root++)
    for (const mode of Object.keys(MODES)) {
      const q = transpose(p, root, mode);
      for (const part of ["melody", "chords", "bass", "arp"]) {
        assert.deepEqual(
          q.notes[part].map((n) => n.start),
          p.notes[part].map((n) => n.start),
        );
        assert.ok(
          q.notes[part].every((n) => scale(root, mode).includes(pc(n.pitch))),
        );
      }
      assert.deepEqual(q.notes.kick, p.notes.kick);
    }
});
test("Diatonic spelling and chord inversions are musically correct", () => {
  assert.deepEqual(scaleNames(9, "minor"), ["A", "B", "C", "D", "E", "F", "G"]);
  assert.deepEqual(scaleNames(6, "major"), [
    "F#",
    "G#",
    "A#",
    "B",
    "C#",
    "D#",
    "E#",
  ]);
  assert.deepEqual(chord(9, "minor", 0, 1).notes, [60, 64, 69]);
});
test("MIDI has matching note offs, tempo, separate drum channel and aligned track ends", () => {
  const p = createProject(),
    data = midi(p);
  const v = new DataView(data.buffer);
  assert.equal(new TextDecoder().decode(data.slice(0, 4)), "MThd");
  assert.equal(v.getUint16(10), 8);
  assert.equal(v.getUint16(12), 480);
  let pos = 14;
  for (let track = 0; track < 8; track++) {
    assert.equal(new TextDecoder().decode(data.slice(pos, pos + 4)), "MTrk");
    const end = pos + 8 + v.getUint32(pos + 4);
    pos += 8;
    let ticks = 0,
      on = 0,
      off = 0;
    const active = new Map();
    while (pos < end) {
      let d = 0,
        b;
      do {
        b = data[pos++];
        d = (d << 7) | (b & 127);
      } while (b & 128);
      ticks += d;
      const status = data[pos++];
      if (status === 255) {
        const type = data[pos++];
        let len = 0;
        do {
          b = data[pos++];
          len = (len << 7) | (b & 127);
        } while (b & 128);
        if (type === 81)
          assert.equal(
            (data[pos] << 16) | (data[pos + 1] << 8) | data[pos + 2],
            Math.round(60000000 / p.bpm),
          );
        pos += len;
      } else {
        const pitch = data[pos++],
          velocity = data[pos++];
        if ((status & 240) === 144) {
          on++;
          active.set(pitch, (active.get(pitch) || 0) + 1);
          assert.ok(velocity > 0);
          if (track >= 5) assert.equal(status & 15, 9);
        } else {
          off++;
          assert.ok(active.get(pitch) > 0);
          active.set(pitch, active.get(pitch) - 1);
        }
      }
    }
    assert.equal(ticks, p.bars * 4 * 480);
    assert.equal(on, off);
    assert.ok([...active.values()].every((v) => v === 0));
  }
  assert.equal(pos, data.length);
});
test("Project input rejects corrupt and excessive note data", () => {
  const p = createProject();
  assert.deepEqual(validateProject(p), p);
  assert.throws(() => validateProject({ ...p, mode: "__proto__" }));
  assert.throws(() => validateProject({ ...p, bpm: 0 }));
  p.notes.melody[0].duration = 999;
  assert.throws(() => validateProject(p));
});
