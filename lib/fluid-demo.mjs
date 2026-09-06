// An original stereo study with audible midrange, rounded bass and percussive
// detail. Deterministic synthesis keeps the demo local and reproducible.
export function createFluidDemo(ctx) {
  const seconds = 30;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  const notes = [
    220, 329.6276, 391.9954, 493.8833, 293.6648, 391.9954, 440, 329.6276,
  ];
  for (let channel = 0; channel < 2; channel++) {
    const out = buffer.getChannelData(channel);
    let noise = 0x12345;
    for (let i = 0; i < out.length; i++) {
      const t = i / ctx.sampleRate;
      const beat = t % (60 / 112);
      const step = Math.floor(t / (30 / 112));
      const tick = t % (30 / 112);
      const frequency = notes[step % notes.length];
      const fade = Math.min(1, t * 100, (seconds - t) * 3);
      const kick =
        0.4 *
        Math.sin(2 * Math.PI * (52 * beat + 3 * (1 - Math.exp(-beat * 38)))) *
        Math.exp(-beat * 13);
      const pan = 0.72 + 0.28 * Math.sin(step * 1.7 + channel * Math.PI);
      const pluck =
        pan *
        0.23 *
        (Math.sin(2 * Math.PI * frequency * t) +
          0.32 * Math.sin(2 * Math.PI * frequency * 2 * t)) *
        Math.exp(-tick * 9);
      const chord =
        0.055 * Math.sin(2 * Math.PI * (channel ? 165.05 : 164.81) * t) +
        0.045 * Math.sin(2 * Math.PI * (channel ? 246.75 : 246.94) * t);
      noise = (Math.imul(noise, 1664525) + 1013904223) | 0;
      const hat = (noise / 2147483648) * 0.045 * Math.exp(-tick * 75);
      out[i] = Math.tanh(kick + pluck + chord + hat) * 0.86 * fade;
    }
  }
  return buffer;
}
