export const STEMS = [
  "vocals",
  "drums",
  "bass",
  "piano",
  "synths",
  "fx",
  "other",
];
export function effectiveGains(channels) {
  const solo = channels.some((c) => c.solo);
  return channels.map((c) =>
    c.mute || (solo && !c.solo) ? 0 : Math.pow(10, c.db / 20),
  );
}
export class StemPlayer {
  constructor(request, onState) {
    this.request = request;
    this.onState = onState;
    this.generation = 0;
    this.cache = new Map();
    this.sources = new Set();
    this.position = 0;
    this.channels = STEMS.map(() => ({ db: 0, mute: false, solo: false }));
  }
  setup() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    this.gains = STEMS.map(() => {
      const g = this.ctx.createGain();
      g.connect(this.master);
      return g;
    });
    this.setChannels(this.channels);
  }
  setChannels(channels) {
    this.channels = channels;
    if (!this.ctx) return;
    effectiveGains(channels).forEach((value, i) => {
      const p = this.gains[i].gain,
        t = this.ctx.currentTime;
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
      p.linearRampToValueAtTime(value, t + 0.005);
    });
  }
  now() {
    return this.playing
      ? Math.max(
          this.position,
          Math.min(
            this.scheduledUntil,
            this.ctx.currentTime - this.base,
            this.job.duration,
          ),
        )
      : this.position;
  }
  stop() {
    this.position = this.now();
    this.playing = false;
    this.generation++;
    clearInterval(this.timer);
    this.abort?.abort();
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {}
      s.disconnect();
    }
    this.sources.clear();
    this.cache.clear();
    this.onState("paused");
  }
  async chunk(index, generation) {
    if (this.cache.has(index)) return this.cache.get(index);
    const pending = (async () => {
      const response = await this.request(
        `/jobs/${this.job.id}/chunks/${index}`,
        { signal: this.abort.signal },
      );
      const bytes = await response.arrayBuffer();
      if (generation !== this.generation)
        throw new DOMException("Stopped", "AbortError");
      const lengths = new DataView(bytes);
      let offset = 28;
      const result = [];
      for (let i = 0; i < 7; i++) {
        const n = lengths.getUint32(i * 4, true);
        if (offset + n > bytes.byteLength)
          throw new Error("Incomplete audio chunk. Try again.");
        result.push(
          await this.ctx.decodeAudioData(bytes.slice(offset, offset + n)),
        );
        offset += n;
      }
      return result;
    })();
    this.cache.set(index, pending);
    return pending;
  }
  async play(job, position = this.position) {
    this.setup();
    // Resume during the user gesture, before any network wait (mobile autoplay).
    const resumed = this.ctx.resume();
    this.stop();
    this.job = job;
    this.position = position >= job.duration ? 0 : position;
    this.scheduledUntil = this.position;
    this.abort = new AbortController();
    const generation = this.generation;
    this.onState("buffering");
    await resumed;
    if (generation !== this.generation) return;
    this.base = this.ctx.currentTime + 0.12 - this.position;
    this.next = Math.floor(this.position / job.chunkSeconds);
    this.playing = true;
    const pump = async () => {
      if (this.pumping === generation || generation !== this.generation) return;
      this.pumping = generation;
      try {
        while (
          this.next * job.chunkSeconds < job.duration &&
          this.scheduledUntil - this.now() < 12
        ) {
          const index = this.next;
          const buffers = await this.chunk(index, generation);
          if (generation !== this.generation) return;
          const start = index * job.chunkSeconds;
          const offset = Math.max(0, this.position - start);
          const ideal = this.base + start + offset;
          const when = Math.max(this.ctx.currentTime + 0.08, ideal);
          if (when > ideal) this.base += when - ideal;
          buffers.forEach((buffer, i) => {
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.gains[i]);
            this.sources.add(source);
            source.onended = () => {
              this.sources.delete(source);
              source.disconnect();
            };
            source.start(when, offset);
          });
          this.scheduledUntil = Math.min(
            job.duration,
            start + job.chunkSeconds,
          );
          this.next++;
          for (const key of this.cache.keys())
            if (key < this.next - 2) this.cache.delete(key);
          this.onState("playing");
        }
        if (this.now() >= job.duration - 0.02) {
          this.stop();
          this.position = 0;
          this.onState("ended");
        } else if (
          this.scheduledUntil - this.now() < 0.08 &&
          this.next * job.chunkSeconds < job.duration
        )
          this.onState("buffering");
      } catch (e) {
        if (generation === this.generation && e.name !== "AbortError") {
          this.stop();
          this.onState("error", e.message);
        }
      } finally {
        if (this.pumping === generation) this.pumping = null;
      }
    };
    this.timer = setInterval(pump, 200);
    await pump();
  }
  destroy() {
    this.stop();
    this.ctx?.close();
  }
}
