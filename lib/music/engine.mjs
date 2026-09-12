export const ROOTS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
export const MODES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};
export const PARTS = ["melody", "chords", "bass", "arp", "kick", "clap", "hat"];
export const DESTINATIONS = [
  "Noire Piano MIDI",
  "Lumen MIDI",
  "Tessera MIDI",
  "Moog Sub37 MIDI",
  "Software Bass",
  "Minilogue MIDI",
  "Absynth MIDI",
  "Ambient MIDI",
  "Dystopia MIDI",
  "Stradivari Cello MIDI",
  "Forma MIDI",
  "Kick",
  "Snare/Clap/Rim",
  "Perc Rack MIDI",
];
export const PRESETS = {
  minor: [
    [0, 5, 2, 6],
    [0, 3, 5, 4],
    [0, 6, 5, 6],
  ],
  major: [
    [0, 4, 5, 3],
    [0, 5, 3, 4],
    [0, 3, 1, 4],
  ],
  dorian: [
    [0, 3, 6, 0],
    [0, 6, 3, 0],
    [0, 2, 3, 0],
  ],
};
export const DEFAULT_SETUP = {
  melody: "Noire Piano MIDI",
  chords: "Absynth MIDI",
  bass: "Moog Sub37 MIDI",
  arp: "Minilogue MIDI",
  kick: "Kick",
  clap: "Snare/Clap/Rim",
  hat: "Perc Rack MIDI",
};
export const pc = (n) => ((n % 12) + 12) % 12;
export function scale(root, mode) {
  return MODES[mode].map((n) => pc(root + n));
}
export function scaleNames(root, mode) {
  const letters = ["C", "D", "E", "F", "G", "A", "B"],
    naturals = [0, 2, 4, 5, 7, 9, 11];
  const first = letters.indexOf(ROOTS[root][0]);
  return scale(root, mode).map((p, i) => {
    const l = (first + i) % 7;
    let d = pc(p - naturals[l]);
    if (d > 6) d -= 12;
    return letters[l] + (d > 0 ? "#".repeat(d) : "b".repeat(-d));
  });
}
export function name(
  n,
  root = 9,
  mode = "minor",
  octaveOffset = -2,
  withOctave = true,
) {
  const s = scale(root, mode),
    i = s.indexOf(pc(n));
  const label = i < 0 ? ROOTS[pc(n)] : scaleNames(root, mode)[i];
  const accidental = [...label.slice(1)].reduce(
    (sum, char) => sum + (char === "#" ? 1 : -1),
    0,
  );
  return (
    label + (withOctave ? Math.floor((n - accidental) / 12) + octaveOffset : "")
  );
}
export function chord(root, mode, degree, inversion = 0) {
  const ints = MODES[mode],
    at = (i) => 60 + root + ints[i % 7] + 12 * Math.floor(i / 7);
  let notes = [at(degree), at(degree + 2), at(degree + 4)];
  while (notes[0] > 65) notes = notes.map((n) => n - 12);
  for (let i = 0; i < inversion; i++) notes.push(notes.shift() + 12);
  notes.sort((a, b) => a - b);
  const third = pc(at(degree + 2) - at(degree)),
    fifth = pc(at(degree + 4) - at(degree));
  const quality = fifth === 6 ? "dim" : third === 3 ? "m" : "";
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII"][degree];
  return {
    notes,
    label: scaleNames(root, mode)[degree] + quality,
    roman:
      (third === 3 ? roman.toLowerCase() : roman) + (fifth === 6 ? "°" : ""),
    degree,
  };
}
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function createProject() {
  const p = {
    version: 1,
    title: "A little after midnight",
    root: 9,
    mode: "minor",
    bpm: 123,
    bars: 8,
    density: 4,
    seed: 17,
    progression: [0, 5, 2, 6],
    inversions: [0, 0, 0, 0],
    locked: [],
    muted: ["arp"],
    setup: { ...DEFAULT_SETUP },
    drumMap: { kick: 36, clap: 38, hat: 42 },
    octaveOffset: -2,
    notes: {},
  };
  p.notes = generate(p);
  return p;
}
export function generate(p, previous = {}) {
  const r = rng(p.seed),
    out = Object.fromEntries(PARTS.map((k) => [k, []]));
  const pool = Array.from({ length: 25 }, (_, i) => 60 + i).filter((n) =>
    scale(p.root, p.mode).includes(pc(n)),
  );
  const motif = Array.from({ length: 8 }, () => Math.floor(r() * 3) - 1);
  let last = pool.indexOf(pool.find((n) => pc(n) === p.root));
  for (let b = 0; b < p.bars; b++) {
    const c = chord(p.root, p.mode, p.progression[b % 4], p.inversions[b % 4]),
      tones = c.notes.map(pc);
    c.notes.forEach((n) =>
      out.chords.push({ pitch: n, start: b * 4, duration: 3.85, velocity: 65 }),
    );
    const bass = 36 + pc(p.root + MODES[p.mode][p.progression[b % 4]]);
    [0, 1.5, 2.5].forEach((t, i) =>
      out.bass.push({
        pitch: bass,
        start: b * 4 + t,
        duration: i === 0 ? 1.25 : 0.7,
        velocity: 82,
      }),
    );
    for (let s = 0; s < 8; s++)
      out.arp.push({
        pitch: c.notes[s % 3] + 12,
        start: b * 4 + s * 0.5,
        duration: 0.35,
        velocity: s % 2 ? 55 : 70,
      });
    const count = p.density + 1,
      starts = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
        .filter(
          (_, i) =>
            i === 0 || i === 6 || i % Math.max(1, Math.round(8 / count)) === 0,
        )
        .slice(0, count);
    starts.forEach((t, i) => {
      let idx = Math.max(
        0,
        Math.min(pool.length - 1, last + motif[(i + (b % 2)) % 8]),
      );
      if (i === 0 || t === 2 || (b === p.bars - 1 && i === starts.length - 1)) {
        const target =
          b === p.bars - 1 && i === starts.length - 1 ? [p.root] : tones;
        idx = pool.reduce(
          (best, n, j) =>
            target.includes(pc(n)) && Math.abs(j - idx) < Math.abs(best - idx)
              ? j
              : best,
          pool.findIndex((n) => target.includes(pc(n))),
        );
      }
      last = idx;
      out.melody.push({
        pitch: pool[idx],
        start: b * 4 + t,
        duration: Math.min((starts[i + 1] ?? 4) - t, 1),
        velocity: 72 + Math.floor(r() * 20),
      });
    });
    for (let s = 0; s < 16; s++) {
      if (s % 4 === 0)
        out.kick.push({
          pitch: p.drumMap.kick,
          start: b * 4 + s / 4,
          duration: 0.2,
          velocity: 105,
        });
      if (s === 4 || s === 12)
        out.clap.push({
          pitch: p.drumMap.clap,
          start: b * 4 + s / 4,
          duration: 0.15,
          velocity: 86,
        });
      if (s % 4 === 2)
        out.hat.push({
          pitch: p.drumMap.hat,
          start: b * 4 + s / 4,
          duration: 0.1,
          velocity: 65,
        });
    }
  }
  for (const b of p.locked)
    out.melody = [
      ...out.melody.filter((n) => Math.floor(n.start / 4) !== b),
      ...(previous.melody || []).filter((n) => Math.floor(n.start / 4) === b),
    ];
  out.melody.sort((a, b) => a.start - b.start);
  return out;
}
export function transpose(p, root, mode) {
  const old = scale(p.root, p.mode),
    next = scale(root, mode);
  let delta = root - p.root;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  const notes = Object.fromEntries(
    PARTS.map((k) => [
      k,
      p.notes[k].map((n) => {
        if (["kick", "clap", "hat"].includes(k)) return { ...n };
        const degree = old.indexOf(pc(n.pitch));
        let target = n.pitch + delta;
        if (degree >= 0) {
          let diff = pc(next[degree] - pc(target));
          if (diff > 6) diff -= 12;
          target += diff;
        }
        return { ...n, pitch: Math.max(0, Math.min(127, target)) };
      }),
    ]),
  );
  return { ...p, root, mode, notes };
}
export function explain(p, n) {
  const c = chord(
    p.root,
    p.mode,
    p.progression[Math.floor(n.start / 4) % 4],
    p.inversions[Math.floor(n.start / 4) % 4],
  );
  const degree = scale(p.root, p.mode).indexOf(pc(n.pitch)) + 1;
  const chordIndex = [0, 2, 4].findIndex(
    (i) => scale(p.root, p.mode)[(c.degree + i) % 7] === pc(n.pitch),
  );
  const role =
    chordIndex >= 0
      ? ["root", "third", "fifth"][chordIndex]
      : "scale tone outside this chord";
  return {
    c,
    degree,
    role,
    text:
      chordIndex >= 0
        ? `${name(n.pitch, p.root, p.mode, p.octaveOffset)} is the ${role} of ${c.label}. It belongs to both the scale and the chord, so it can provide a settled landing point.`
        : `${name(n.pitch, p.root, p.mode, p.octaveOffset)} belongs to the scale, but not to the ${c.label} triad. It adds tension against this chord. Hear it resolve to a nearby chord tone; placement and duration determine the effect.`,
  };
}
export function validateProject(value) {
  if (!value || value.version !== 1)
    throw Error("This is not a supported Music project.");
  const p = value,
    num = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  if (
    !Number.isInteger(p.root) ||
    !num(p.root, 0, 11) ||
    !Object.hasOwn(MODES, p.mode) ||
    !num(p.bpm, 40, 220) ||
    ![4, 8, 16].includes(p.bars) ||
    !Number.isInteger(p.seed) ||
    !num(p.density, 2, 7) ||
    ![-2, -1].includes(p.octaveOffset)
  )
    throw Error("Invalid musical settings.");
  if (
    typeof p.title !== "string" ||
    p.title.length > 100 ||
    !Array.isArray(p.progression) ||
    p.progression.length !== 4 ||
    p.progression.some((n) => !Number.isInteger(n) || !num(n, 0, 6)) ||
    !Array.isArray(p.inversions) ||
    p.inversions.length !== 4 ||
    p.inversions.some((n) => ![0, 1, 2].includes(n))
  )
    throw Error("Invalid progression.");
  if (
    !Array.isArray(p.locked) ||
    p.locked.some((n) => !Number.isInteger(n) || !num(n, 0, p.bars - 1)) ||
    !Array.isArray(p.muted) ||
    p.muted.some((k) => !PARTS.includes(k))
  )
    throw Error("Invalid track settings.");
  for (const k of PARTS) {
    if (
      typeof p.setup?.[k] !== "string" ||
      p.setup[k].length > 80 ||
      !Array.isArray(p.notes?.[k]) ||
      p.notes[k].length > 2048
    )
      throw Error("Invalid track data.");
    for (const n of p.notes[k])
      if (
        !Number.isInteger(n.pitch) ||
        !num(n.pitch, 0, 127) ||
        !num(n.start, 0, p.bars * 4 - 0.01) ||
        !num(n.duration, 0.01, p.bars * 4 - n.start) ||
        !num(n.velocity, 1, 127)
      )
        throw Error("Invalid MIDI note.");
  }
  for (const k of ["kick", "clap", "hat"])
    if (!Number.isInteger(p.drumMap?.[k]) || !num(p.drumMap[k], 0, 127))
      throw Error("Invalid drum mapping.");
  return structuredClone(p);
}
const bytes = (s) => Array.from(new TextEncoder().encode(s));
const be = (n, size) =>
  Array.from({ length: size }, (_, i) => (n >>> ((size - i - 1) * 8)) & 255);
const vlq = (n) => {
  let a = [n & 127];
  while ((n >>= 7)) a.unshift((n & 127) | 128);
  return a;
};
const chunk = (id, data) => [...bytes(id), ...be(data.length, 4), ...data];
export function midi(p, parts = PARTS) {
  const tempo = Math.round(60000000 / p.bpm),
    end = p.bars * 4 * 480;
  const tracks = [
    chunk("MTrk", [
      0,
      255,
      81,
      3,
      ...be(tempo, 3),
      0,
      255,
      88,
      4,
      4,
      2,
      24,
      8,
      ...vlq(end),
      255,
      47,
      0,
    ]),
  ];
  for (const part of parts) {
    const label = bytes(`${part} - ${p.setup[part]}`),
      channel = ["kick", "clap", "hat"].includes(part)
        ? 9
        : PARTS.indexOf(part);
    const events = [];
    for (const n of p.notes[part]) {
      events.push({
        t: Math.round(n.start * 480),
        data: [144 + channel, n.pitch, n.velocity],
        off: false,
      });
      events.push({
        t: Math.round((n.start + n.duration) * 480),
        data: [128 + channel, n.pitch, 0],
        off: true,
      });
    }
    events.sort((a, b) => a.t - b.t || Number(b.off) - Number(a.off));
    let last = 0,
      data = [0, 255, 3, ...vlq(label.length), ...label];
    for (const e of events) {
      data.push(...vlq(e.t - last), ...e.data);
      last = e.t;
    }
    data.push(...vlq(Math.max(0, end - last)), 255, 47, 0);
    tracks.push(chunk("MTrk", data));
  }
  return new Uint8Array([
    ...chunk("MThd", [0, 1, ...be(tracks.length, 2), 1, 224]),
    ...tracks.flat(),
  ]);
}
