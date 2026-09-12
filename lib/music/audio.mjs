export class MusicAudio {
  constructor() {
    this.ctx = null;
    this.voices = new Set();
    this.timer = null;
  }
  async ready() {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context)
        throw Error("Audio playback is unavailable in this browser.");
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.65;
      const compressor = this.ctx.createDynamicsCompressor();
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);
    }
    await this.ctx.resume();
  }
  tone(pitch, when, duration, part = "melody", velocity = 80) {
    const c = this.ctx,
      t = Math.max(c.currentTime, when),
      g = c.createGain();
    g.connect(this.master);
    const osc = c.createOscillator();
    osc.type =
      part === "bass" ? "triangle" : part === "chords" ? "sine" : "triangle";
    osc.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
    let d = Math.max(0.05, duration),
      level = ((part === "chords" ? 0.065 : 0.13) * velocity) / 127;
    if (part === "kick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      d = 0.22;
      level = 0.5;
    }
    let source = osc;
    if (part === "clap" || part === "hat") {
      const buffer = c.createBuffer(1, c.sampleRate * 0.18, c.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      source = c.createBufferSource();
      source.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = part === "hat" ? 6500 : 1400;
      source.connect(filter);
      filter.connect(g);
      d = part === "hat" ? 0.07 : 0.13;
      level = part === "hat" ? 0.12 : 0.23;
    } else source.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.05);
    source.start(t);
    source.stop(t + d + 0.07);
    this.voices.add(source);
    source.onended = () => {
      source.disconnect();
      g.disconnect();
      this.voices.delete(source);
    };
  }
  stop() {
    clearInterval(this.timer);
    this.timer = null;
    for (const v of this.voices) {
      try {
        v.stop();
      } catch {}
    }
    this.voices.clear();
  }
  play(p, { loop = true, slow = 1, onBeat, onEnd }) {
    this.stop();
    const c = this.ctx,
      seconds = 60 / p.bpm / slow,
      length = p.bars * 4;
    const events = Object.entries(p.notes)
      .filter(([part]) => !p.muted.includes(part))
      .flatMap(([part, notes]) => notes.map((n) => ({ ...n, part })))
      .sort((a, b) => a.start - b.start);
    const origin = c.currentTime + 0.06;
    let cycle = 0,
      index = 0;
    const tick = () => {
      const elapsed = (c.currentTime - origin) / seconds;
      if (elapsed >= length && !loop) {
        this.stop();
        onEnd();
        return;
      }
      onBeat(Math.max(0, elapsed % length));
      if (!events.length) return;
      let guard = 0;
      while (guard++ < 500) {
        const n = events[index],
          time = origin + (cycle * length + n.start) * seconds;
        if (time > c.currentTime + 0.12) break;
        if (time >= c.currentTime - 0.04)
          this.tone(n.pitch, time, n.duration * seconds, n.part, n.velocity);
        index++;
        if (index === events.length) {
          index = 0;
          cycle++;
          if (!loop) {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
              onBeat(Math.min(length, (c.currentTime - origin) / seconds));
              if (c.currentTime >= origin + length * seconds) {
                this.stop();
                onEnd();
              }
            }, 25);
            break;
          }
        }
      }
    };
    this.timer = setInterval(tick, 25);
    tick();
  }
}
