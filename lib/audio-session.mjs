import { createFluidDemo } from "./fluid-demo.mjs";
export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_DURATION = 20 * 60;

// A single owner for every audio resource. Request IDs make late permission and
// decode results harmless after source changes or route navigation.
export class AudioSession {
  constructor({ createContext, getUserMedia, onChange = () => {} }) {
    this.createContext = createContext;
    this.getUserMedia = getUserMedia;
    this.onChange = onChange;
    this.request = 0;
    this.disposed = false;
    this.volume = 0.65;
    this.state = {
      mode: "idle",
      playing: false,
      name: "",
      duration: 0,
      error: "",
    };
  }
  emit(patch) {
    this.state = { ...this.state, ...patch };
    if (!this.disposed) this.onChange(this.state);
  }
  context() {
    if (!this.ctx) {
      this.ctx = this.createContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.15;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.volume;
      // Analysis remains independent of listening volume.
      this.outputAnalyser = this.ctx.createAnalyser();
      this.outputAnalyser.fftSize = 512;
      this.outputData = new Float32Array(this.outputAnalyser.fftSize);
      this.gain.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.ctx.destination);
      this.ctx.onstatechange = () => {
        if (!this.disposed)
          this.emit({ interrupted: this.ctx.state !== "running" });
      };
    }
    return this.ctx;
  }
  get active() {
    return this.state.playing && ["file", "mic"].includes(this.state.mode);
  }
  get currentTime() {
    if (!this.buffer) return 0;
    return Math.min(
      this.buffer.duration,
      this.offset +
        (this.state.mode === "file" && this.state.playing
          ? this.ctx.currentTime - this.startedAt
          : 0),
    );
  }
  stopNode() {
    if (!this.node) return;
    this.node.onended = null;
    try {
      this.node.stop();
    } catch {
      /* already ended */
    }
    this.node.disconnect();
    this.node = null;
  }
  release() {
    this.stopNode();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.micSource?.disconnect();
    this.micSource = null;
    this.buffer = null;
    this.offset = 0;
  }
  stop() {
    ++this.request;
    this.release();
    this.emit({
      mode: "idle",
      playing: false,
      name: "",
      duration: 0,
      error: "",
    });
  }
  begin(name) {
    this.stop();
    const id = this.request;
    this.emit({ mode: "loading", name });
    return id;
  }
  isCurrent(id) {
    return !this.disposed && id === this.request;
  }
  fail(id, error) {
    if (!this.isCurrent(id)) return;
    this.release();
    const message =
      error?.name === "NotAllowedError"
        ? "Microphone access was not allowed. Check browser permissions or choose an audio file."
        : error?.name === "NotFoundError"
          ? "No microphone was found. Connect one or choose an audio file."
          : error?.message ||
            "Audio could not start. Please try another source.";
    this.emit({
      mode: "idle",
      playing: false,
      name: "",
      duration: 0,
      error: message,
    });
  }
  async loadFile(file) {
    const id = this.begin(file.name);
    try {
      if (!file.size || file.size > MAX_FILE_BYTES)
        throw new Error("Choose an audio file smaller than 64 MB.");
      const ctx = this.context();
      // Called directly within the user gesture, before reading the file.
      await ctx.resume();
      if (!this.isCurrent(id)) return;
      const data = await file.arrayBuffer();
      if (!this.isCurrent(id)) return;
      const buffer = await ctx.decodeAudioData(data);
      if (!this.isCurrent(id)) return;
      if (buffer.duration > MAX_DURATION)
        throw new Error("Choose a track shorter than 20 minutes.");
      this.buffer = buffer;
      this.emit({ mode: "file", name: file.name, duration: buffer.duration });
      this.playAt(0);
    } catch (error) {
      this.fail(id, error);
    }
  }
  async microphone() {
    const id = this.begin("Microphone");
    let stream;
    try {
      const ctx = this.context();
      await ctx.resume();
      if (!this.isCurrent(id)) return;
      stream = await this.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (!this.isCurrent(id)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      stream.getTracks().forEach((track) =>
        track.addEventListener?.(
          "ended",
          () => {
            if (this.isCurrent(id) && this.stream === stream) {
              this.stop();
              this.emit({
                error:
                  "Microphone disconnected. Connect it again or choose a file.",
              });
            }
          },
          { once: true },
        ),
      );
      this.micSource = ctx.createMediaStreamSource(stream);
      this.micSource.connect(this.analyser);
      // Never route microphone input to speakers.
      this.emit({ mode: "mic", playing: true, name: "Microphone" });
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      this.fail(id, error);
    }
  }
  async demo() {
    const id = this.begin("Matter study · 30 seconds");
    try {
      const ctx = this.context();
      await ctx.resume();
      if (!this.isCurrent(id)) return;
      const buffer = createFluidDemo(ctx);
      this.buffer = buffer;
      this.emit({
        mode: "file",
        name: "Matter study · 30 seconds",
        duration: buffer.duration,
      });
      this.playAt(0);
    } catch (error) {
      this.fail(id, error);
    }
  }
  playAt(offset) {
    if (this.disposed || !this.buffer || this.state.mode !== "file") return;
    this.stopNode();
    this.offset = Math.max(0, Math.min(offset, this.buffer.duration));
    if (this.offset >= this.buffer.duration) {
      this.emit({ playing: false });
      return;
    }
    const node = this.ctx.createBufferSource();
    node.buffer = this.buffer;
    node.connect(this.gain);
    node.connect(this.analyser);
    node.onended = () => {
      if (this.node !== node || this.disposed) return;
      node.disconnect();
      this.node = null;
      this.offset = this.buffer.duration;
      this.emit({ playing: false });
    };
    this.node = node;
    this.startedAt = this.ctx.currentTime;
    node.start(0, this.offset);
    this.emit({ playing: true });
  }
  pause() {
    if (this.state.mode !== "file") return;
    this.offset = this.currentTime;
    this.stopNode();
    this.emit({ playing: false });
  }
  async play() {
    const id = this.request;
    try {
      await this.context().resume();
      if (this.isCurrent(id))
        this.playAt(this.offset >= this.buffer?.duration ? 0 : this.offset);
    } catch (error) {
      this.fail(id, error);
    }
  }
  seek(seconds) {
    if (this.state.mode !== "file" || !this.buffer) return;
    if (this.state.playing) this.playAt(seconds);
    else this.offset = Math.max(0, Math.min(seconds, this.buffer.duration));
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gain)
      this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.025);
  }
  get outputLevel() {
    if (
      !this.outputAnalyser ||
      this.state.mode !== "file" ||
      !this.state.playing
    )
      return 0;
    this.outputAnalyser.getFloatTimeDomainData(this.outputData);
    let energy = 0;
    for (const sample of this.outputData) energy += sample * sample;
    return Math.sqrt(energy / this.outputData.length);
  }
  async resumeOutput() {
    try {
      await this.context().resume();
      if (this.state.mode === "file" && !this.state.playing) await this.play();
    } catch (error) {
      this.fail(this.request, error);
    }
  }
  dispose() {
    this.disposed = true;
    this.stop();
    this.gain?.disconnect();
    this.analyser?.disconnect();
    this.outputAnalyser?.disconnect();
    if (this.ctx) this.ctx.onstatechange = null;
    this.ctx?.close().catch(() => {});
  }
}
