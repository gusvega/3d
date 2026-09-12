"use client";
import { useEffect, useRef, useState } from "react";
import { StemPlayer, STEMS } from "./player";
import styles from "./spectra.module.css";
const title = (s) => (s === "fx" ? "FX" : s[0].toUpperCase() + s.slice(1));
const clock = (s = 0) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const defaults = () => STEMS.map(() => ({ db: 0, mute: false, solo: false }));
export default function Spectra() {
  const [endpoint, setEndpoint] = useState("");
  const [key, setKey] = useState("");
  const [online, setOnline] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [upload, setUpload] = useState(null);
  const [channels, setChannels] = useState(defaults);
  const [state, setState] = useState("paused");
  const [position, setPosition] = useState(0);
  const [saving, setSaving] = useState("");
  const player = useRef(null);
  const fileInput = useRef(null);
  const credentials = useRef({ endpoint: "", key: "" });
  credentials.current = { endpoint, key };
  const job = jobs.find((j) => j.id === selected);
  const ready = job?.status === "ready";
  async function request(path, options = {}) {
    const c = credentials.current;
    const r = await fetch(c.endpoint + path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${c.key}` },
      cache: "no-store",
      signal: options.signal || AbortSignal.timeout(60000),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error || `Connection failed (${r.status}).`);
    }
    return r;
  }
  async function connect(e) {
    e?.preventDefault();
    setConnecting(true);
    setError("");
    try {
      if (!endpoint)
        throw new Error(
          "The Mac connection is being configured. Try refreshing shortly.",
        );
      await request("/health");
      const data = await (await request("/jobs")).json();
      setJobs(data.jobs);
      setSelected((v) => v || data.jobs[0]?.id || "");
      setOnline(true);
      localStorage.setItem("spectra-access", key);
    } catch (e) {
      setError(
        e.message === "Failed to fetch"
          ? "Mac unavailable. Check that it is awake and connected, then try again."
          : e.message,
      );
    } finally {
      setConnecting(false);
    }
  }
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const paired = params.get("key");
    setKey(paired || localStorage.getItem("spectra-access") || "");
    if (paired) history.replaceState(null, "", location.pathname);
    fetch("/api/spectra/config")
      .then((r) => r.json())
      .then((c) => setEndpoint(c.endpoint))
      .catch(() => setError("Could not load the Mac connection."));
    player.current = new StemPlayer(request, (s, message) => {
      setState(s === "ended" ? "paused" : s);
      if (s === "ended") setPosition(0);
      if (message) setError(message);
    });
    const timer = setInterval(() => {
      if (player.current?.playing) setPosition(player.current.now());
    }, 150);
    return () => {
      clearInterval(timer);
      player.current?.destroy();
    };
  }, []);
  useEffect(() => {
    if (!online) return;
    let disposed = false;
    let timer;
    let busy = true;
    const poll = async () => {
      try {
        const data = await (await request("/jobs")).json();
        if (!disposed) {
          setJobs(data.jobs);
          busy = data.jobs.some((j) => !["ready", "error"].includes(j.status));
        }
      } catch (e) {
        if (!disposed)
          setError(
            "Mac connection interrupted. Your analysis continues on the Mac. Reconnect to check it.",
          );
      }
      if (!disposed)
        timer = setTimeout(poll, document.hidden || !busy ? 15000 : 2500);
    };
    timer = setTimeout(poll, 1000);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [online, selected]);
  useEffect(() => {
    player.current?.setChannels(channels);
  }, [channels]);
  function choose(id) {
    player.current?.stop();
    if (player.current) player.current.position = 0;
    setPosition(0);
    setSelected(id);
    setChannels(defaults());
    setError("");
  }
  async function uploadFile(file) {
    if (!file) return;
    if (file.size > 256 * 1024 * 1024) {
      setError("Choose an audio file under 256 MB.");
      return;
    }
    setError("");
    setUpload({ name: file.name, progress: 0 });
    try {
      const u = await (
        await request("/uploads", {
          method: "POST",
          body: JSON.stringify({ name: file.name, size: file.size }),
        })
      ).json();
      for (let offset = 0; offset < file.size; offset += 4 * 1024 * 1024) {
        const blob = file.slice(offset, offset + 4 * 1024 * 1024);
        await request(`/uploads/${u.id}?offset=${offset}`, {
          method: "PUT",
          body: blob,
        });
        setUpload({
          name: file.name,
          progress: Math.round(
            (100 * Math.min(file.size, offset + blob.size)) / file.size,
          ),
        });
      }
      const next = await (
        await request(`/uploads/${u.id}/finish`, { method: "POST", body: "{}" })
      ).json();
      setJobs((list) => [next, ...list.filter((j) => j.id !== next.id)]);
      choose(next.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpload(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  function update(i, field, value) {
    setChannels((list) =>
      list.map((c, n) => (n === i ? { ...c, [field]: value } : c)),
    );
  }
  async function togglePlay() {
    setError("");
    if (player.current.playing) {
      player.current.stop();
      setPosition(player.current.position);
    } else {
      try {
        await player.current.play(job, position);
      } catch (e) {
        setError(e.message);
      }
    }
  }
  function seek(value) {
    setPosition(value);
    if (player.current.playing)
      player.current.play(job, value).catch((e) => setError(e.message));
    else player.current.position = value;
  }
  async function save(stem) {
    setSaving(stem);
    setError("");
    try {
      const blob = await (
        await request(`/jobs/${job.id}/stems/${stem}`)
      ).blob();
      const file = new File(
        [blob],
        `${job.name.replace(/\.[^.]+$/, "")}-${stem}.wav`,
        { type: "audio/wav" },
      );
      // Downloads remain available even if the browser cannot share files.
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving("");
    }
  }
  async function removeSong() {
    if (
      !window.confirm(
        "Remove this song and its stems from the SPECTRA web library? Your original file is unaffected.",
      )
    )
      return;
    player.current.stop();
    try {
      await request(`/jobs/${job.id}`, { method: "DELETE" });
      const remaining = jobs.filter((j) => j.id !== job.id);
      setJobs(remaining);
      choose(remaining[0]?.id || "");
    } catch (e) {
      setError(e.message);
    }
  }
  const active = channels.some((c) => c.solo);
  return (
    <main className={styles.shell}>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>
              GUS VEGA <span>/</span> MOBILE LAB
            </div>
            <h1>
              SPECTRA<span> / 01</span>
            </h1>
          </div>
          <span className={styles.connection}>
            <i className={online ? styles.lit : ""} />
            {online ? "Mac connected" : "Private workspace"}
          </span>
        </header>
        {!online ? (
          <section className={styles.welcome}>
            <div className={styles.signal} aria-hidden="true">
              {Array.from({ length: 45 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${Math.round(12 + Math.pow(Math.sin(i * 0.73), 2) * 70 * Math.sin(((i + 1) / 47) * Math.PI))}%`,
                  }}
                />
              ))}
            </div>
            <div className={styles.eyebrow}>YOUR MUSIC. TAKEN APART.</div>
            <h2>
              Every layer.
              <br />
              <span>Within reach.</span>
            </h2>
            <p>Separate on your Mac. Listen, explore and mix on your phone.</p>
            <form onSubmit={connect} className={styles.pair}>
              <label htmlFor="access">Your access key</label>
              <div>
                <input
                  id="access"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Paste your private key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                />
                <button disabled={connecting || !key || !endpoint}>
                  {connecting ? "Connecting…" : "Open workspace ↗"}
                </button>
              </div>
              <small>Your Mac needs to be awake and online.</small>
            </form>
          </section>
        ) : (
          <>
            <section className={styles.topline}>
              <div>
                <div className={styles.eyebrow}>STEM WORKSPACE</div>
                <h2>Find what’s underneath.</h2>
              </div>
              <button
                className={styles.load}
                disabled={!!upload}
                onClick={() => fileInput.current.click()}
              >
                ＋ Load audio
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="audio/*,.wav,.aiff,.aif,.flac,.mp3"
                hidden
                onChange={(e) => uploadFile(e.target.files[0])}
              />
            </section>
            {jobs.length > 0 && (
              <label className={styles.library}>
                LIBRARY
                <select
                  aria-label="Choose a song"
                  value={selected}
                  onChange={(e) => choose(e.target.value)}
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} {j.status !== "ready" ? `· ${j.status}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!job || !["ready", "error"].includes(job.status)}
                  onClick={removeSong}
                  aria-label="Remove selected song"
                >
                  Remove
                </button>
              </label>
            )}
            <section className={styles.transport}>
              <div className={styles.trackline}>
                <div>
                  <span className={styles.eyebrow}>
                    {job ? "CURRENT SOURCE" : "START WITH A SONG"}
                  </span>
                  <h3>
                    {upload
                      ? upload.name
                      : job?.name || "A whole song. Seven perspectives."}
                  </h3>
                </div>
                <span className={styles.format}>
                  {job
                    ? `${(job.sampleRate / 1000).toFixed(1)} kHz`
                    : "WAV · AIFF · FLAC · MP3"}
                </span>
              </div>
              <div className={styles.waveform}>
                <svg
                  viewBox="0 0 720 80"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {(job?.peaks || Array(180).fill(0.03)).map((p, i, a) => (
                    <rect
                      key={i}
                      x={(i * 720) / a.length}
                      y={40 - Math.max(1, p * 36)}
                      width={2}
                      height={Math.max(2, p * 72)}
                      fill={
                        i / a.length <= position / (job?.duration || 1)
                          ? "#e2e2e2"
                          : "#494949"
                      }
                    />
                  ))}
                </svg>
                <input
                  type="range"
                  aria-label="Seek audio"
                  min="0"
                  max={job?.duration || 1}
                  step="0.1"
                  value={position}
                  disabled={!ready}
                  onChange={(e) => seek(Number(e.target.value))}
                />
              </div>
              <div className={styles.transportBar}>
                <button
                  className={styles.play}
                  disabled={!ready}
                  onClick={togglePlay}
                  aria-label={
                    state === "playing" || state === "buffering"
                      ? "Pause"
                      : "Play"
                  }
                >
                  {state === "playing" || state === "buffering" ? "Ⅱ" : "▶"}
                </button>
                <span className={styles.time}>
                  {clock(position)} <span>/ {clock(job?.duration)}</span>
                </span>
                <span className={styles.playStatus}>
                  {upload
                    ? `Uploading ${upload.progress}%`
                    : job && !ready
                      ? `${job.status} ${Math.round(job.progress * 100)}%`
                      : state === "buffering"
                        ? "Buffering…"
                        : ready
                          ? "Lossless · 24-bit"
                          : "Up to 10 minutes / 256 MB"}
                </span>
              </div>
              {(upload || (job && !ready && job.status !== "error")) && (
                <progress
                  aria-label="Processing progress"
                  max="100"
                  value={upload ? upload.progress : job.progress * 100}
                />
              )}
              {job?.status === "error" && (
                <p className={styles.error}>{job.error}</p>
              )}
            </section>
            <div className={styles.sectionHeading}>
              <span>SEVEN STEMS</span>
              <button onClick={() => setChannels(defaults())} disabled={!ready}>
                Reset mix ↺
              </button>
            </div>
            <section className={styles.stems} aria-label="Stem mixer">
              {STEMS.map((stem, i) => (
                <article
                  key={stem}
                  className={`${styles.stem} ${channels[i].mute || (active && !channels[i].solo) ? styles.dim : ""}`}
                >
                  <div className={styles.stemTitle}>
                    <span className={styles.number}>0{i + 1}</span>
                    <h3>{title(stem)}</h3>
                    <span className={styles.db}>
                      {channels[i].db > 0 ? "+" : ""}
                      {channels[i].db.toFixed(1)} <small>dB</small>
                    </span>
                  </div>
                  <input
                    className={styles.fader}
                    type="range"
                    aria-label={`${title(stem)} gain`}
                    min="-48"
                    max="6"
                    step="0.5"
                    disabled={!ready}
                    value={channels[i].db}
                    onChange={(e) => update(i, "db", Number(e.target.value))}
                  />
                  <div className={styles.stemActions}>
                    <button
                      aria-label={`Mute ${title(stem)}`}
                      aria-pressed={channels[i].mute}
                      disabled={!ready}
                      onClick={() => update(i, "mute", !channels[i].mute)}
                    >
                      M
                    </button>
                    <button
                      aria-label={`Solo ${title(stem)}`}
                      aria-pressed={channels[i].solo}
                      disabled={!ready}
                      onClick={() => update(i, "solo", !channels[i].solo)}
                    >
                      S
                    </button>
                    <button
                      className={styles.save}
                      aria-label={`Save ${title(stem)} WAV`}
                      disabled={!ready || !!saving}
                      onClick={() => save(stem)}
                    >
                      {saving === stem ? "Saving…" : "WAV ↓"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
            <p className={styles.note}>
              Original SPECTRA separation. Audio plays on this device. Keep this
              page open while mixing.
            </p>
          </>
        )}
        {error && (
          <div role="alert" className={styles.error}>
            {error}
            {online && <button onClick={connect}>Reconnect</button>}
          </div>
        )}
        <footer className={styles.footer}>
          <span>
            SPECTRA <span>PROOF OF CONCEPT</span>
          </span>
          <span>Seven stems · Private Mac engine</span>
          {online && (
            <button
              onClick={() => {
                player.current.stop();
                setOnline(false);
                localStorage.removeItem("spectra-access");
                setKey("");
              }}
            >
              Lock
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}
