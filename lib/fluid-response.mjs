export const CELL_COUNT = 192;
const BAND_COUNT = 64;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const follow = (value, target, dt, attack, release) =>
  target +
  (value - target) * Math.exp(-dt / (target > value ? attack : release));

// Logarithmic bands with a fast attack and independent, critically damped
// surface cells. No allocations in the audio/render loop.
export class FluidResponse {
  constructor() {
    this.levels = new Float32Array(BAND_COUNT);
    this.heights = new Float32Array(CELL_COUNT);
    this.velocities = new Float32Array(CELL_COUNT);
    this.previous = new Float32Array(BAND_COUNT);
    this.bass = 0;
    this.high = 0;
    this.energy = 0;
    this.onset = 0;
    this.reference = 0.2;
    this.time = 0;
  }
  update(data, sampleRate, dt, settings = {}) {
    dt = clamp(dt, 0, 0.05);
    this.time += dt;
    const sensitivity = settings.sensitivity ?? 1;
    const decay = settings.decay ?? 0.45;
    const field = settings.field ?? 0.6;
    const release = 0.09 + decay * 0.55;
    let total = 0,
      bass = 0,
      high = 0,
      flux = 0;
    for (let band = 0; band < BAND_COUNT; band++) {
      const lowHz = 35 * Math.pow(12000 / 35, band / BAND_COUNT);
      const highHz = 35 * Math.pow(12000 / 35, (band + 1) / BAND_COUNT);
      let value = 0;
      if (data?.length && sampleRate) {
        const low = clamp(
          Math.floor((lowHz * data.length * 2) / sampleRate),
          1,
          data.length - 1,
        );
        const upper = clamp(
          Math.ceil((highHz * data.length * 2) / sampleRate),
          low + 1,
          data.length,
        );
        for (let bin = low; bin < upper; bin++) value += (data[bin] / 255) ** 2;
        value = Math.sqrt(value / (upper - low));
      }
      value = Math.max(0, value - 0.035);
      total += value;
      if (band < 20) bass += value / 20;
      if (band > 43) high += value / 20;
      flux += Math.max(0, value - this.previous[band]) / BAND_COUNT;
      this.previous[band] = value;
      this.levels[band] = follow(this.levels[band], value, dt, 0.012, release);
    }
    total /= BAND_COUNT;
    this.reference = follow(this.reference, Math.max(0.12, total), dt, 0.2, 3);
    const gain = clamp(0.34 / this.reference, 0.65, 2.4) * sensitivity;
    this.energy = follow(
      this.energy,
      clamp(total * gain, 0, 1),
      dt,
      0.02,
      release,
    );
    this.bass = follow(this.bass, clamp(bass * gain, 0, 1), dt, 0.014, release);
    this.high = follow(
      this.high,
      clamp(high * gain, 0, 1),
      dt,
      0.012,
      release * 0.7,
    );
    this.onset = Math.max(
      this.onset * Math.exp(-dt / 0.12),
      clamp(flux * 11, 0, 1),
    );
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      const band = (cell * 23) % BAND_COUNT;
      const seed = (cell * 0.61803398875) % 1;
      const modeGain =
        settings.mode === "bass"
          ? band < 24
            ? 1.5
            : 0.5
          : settings.mode === "detail"
            ? band > 30
              ? 1.6
              : 0.65
            : 1;
      const cluster =
        0.5 + 0.5 * Math.sin(cell * 2.399 + Math.sin(cell * 0.73) * 2.1);
      const drift =
        0.5 + 0.5 * Math.sin(this.time * (0.23 + seed * 0.26) + seed * 31);
      const idle = field * (0.18 + cluster * cluster * (0.18 + drift * 0.52));
      const activity = this.levels[band] * gain * modeGain;
      const target = clamp(
        idle +
          activity * (0.3 + seed * 0.44) +
          this.onset * (0.03 + cluster * 0.17),
        0,
        1.05,
      );
      const omega = target > this.heights[cell] ? 50 : 12 + (1 - decay) * 16;
      const delta = this.heights[cell] - target;
      const velocity = this.velocities[cell];
      const c = velocity + omega * delta;
      const damping = Math.exp(-omega * dt);
      this.heights[cell] = Math.max(0, target + (delta + c * dt) * damping);
      this.velocities[cell] = (velocity - omega * c * dt) * damping;
    }
    return this;
  }
}
