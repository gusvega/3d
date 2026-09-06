"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AudioSession } from "@/lib/audio-session.mjs";
import { parseYouTubeId } from "@/lib/youtube.mjs";
import SceneCanvas from "./SceneCanvas";
import AudioSpectrum from "./AudioSpectrum";
import AudioOutput from "./AudioOutput";
import { useMotion } from "./use-motion";

const initial = {
  mode: "idle",
  playing: false,
  name: "",
  duration: 0,
  error: "",
};
const formatTime = (value) =>
  `${Math.floor(value / 60)}:${Math.floor(value % 60)
    .toString()
    .padStart(2, "0")}`;

export default function FerrofluidScene() {
  const sessionRef = useRef(null);
  const fileRef = useRef(null);
  const panelRef = useRef(null);
  const focusRef = useRef(null);
  const wasFocused = useRef(false);
  const [audio, setAudio] = useState(initial);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [sensitivity, setSensitivity] = useState(1);
  const [decay, setDecay] = useState(0.45);
  const [mode, setMode] = useState("balanced");
  const [field, setField] = useState(0.8);
  const [finish, setFinish] = useState("obsidian");
  const [dropActive, setDropActive] = useState(false);
  const [focus, setFocus] = useState(false);
  const [video, setVideo] = useState(null);
  const [videoError, setVideoError] = useState("");
  const { paused, setPaused, reset, resetView } = useMotion();

  useEffect(() => {
    const session = new AudioSession({
      createContext: () => {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context)
          throw new Error(
            "Audio is unavailable in this browser. Try a current browser.",
          );
        return new Context();
      },
      getUserMedia: (options) => {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Microphone access is unavailable. Use HTTPS or choose an audio file.",
          );
        return navigator.mediaDevices.getUserMedia(options);
      },
      onChange: setAudio,
    });
    sessionRef.current = session;
    const timer = setInterval(() => setPosition(session.currentTime), 200);
    return () => {
      clearInterval(timer);
      session.dispose();
      sessionRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (wasFocused.current && !focus) panelRef.current?.focus();
    wasFocused.current = focus;
  }, [focus]);

  function source(action) {
    setVideo(null);
    action();
  }
  function setFocusMode(value) {
    setFocus(value);
    if (value) focusRef.current?.focus();
  }
  function submitVideo(event) {
    event.preventDefault();
    const id = parseYouTubeId(
      new FormData(event.currentTarget).get("youtube") || "",
    );
    if (!id) {
      setVideoError("Use a YouTube video link or an 11-character video ID.");
      return;
    }
    sessionRef.current?.stop();
    setVideoError("");
    setVideo(id);
  }
  const status =
    audio.error ||
    (audio.interrupted && audio.playing
      ? "Audio was interrupted. Tap Resume sound below."
      : "") ||
    (audio.mode === "loading"
      ? `Preparing ${audio.name}…`
      : audio.mode === "mic"
        ? "Microphone is listening. Speaker monitoring is off."
        : audio.mode === "file"
          ? audio.playing
            ? "Sound is shaping the surface."
            : "Playback paused. Pick up where you left off."
          : "Choose a sound and watch the surface respond.");

  return (
    <section
      className={`fluid-experience ${focus ? "is-focused" : ""}`}
      aria-labelledby="fluid-title"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDropActive(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setDropActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDropActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) source(() => sessionRef.current?.loadFile(file));
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && focus) setFocusMode(false);
      }}
    >
      <div className="scene-caption">
        <span className="eyebrow">02 / Sound study</span>
        <h1 id="fluid-title">
          Ferrofluid<span aria-hidden="true">.</span>
        </h1>
        <p>Sound into matter.</p>
      </div>
      <div className="fluid-stage">
        <div className="surface-label" aria-hidden="true">
          <span>MAGNETIC MATTER</span>
          <span>{audio.playing ? "AUDIO REACTIVE" : "AMBIENT FIELD"}</span>
        </div>
        <SceneCanvas
          kind="fluid"
          audioRef={sessionRef}
          settings={{ paused, reset, sensitivity, decay, mode, field, finish }}
        />
        <div className="surface-hint">
          Drag to orbit <span>·</span> Focus the surface, then scroll to zoom
        </div>
      </div>
      {dropActive ? (
        <div className="audio-drop-overlay">
          Drop your sound.<span>Audio stays on your device.</span>
        </div>
      ) : null}
      <button
        ref={focusRef}
        className="focus-toggle"
        aria-expanded={!focus}
        aria-controls="sound-panel"
        onClick={() => setFocusMode(!focus)}
      >
        {focus ? "Show controls" : "Focus on scene"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <aside
        id="sound-panel"
        ref={panelRef}
        hidden={focus}
        tabIndex={-1}
        className="sound-panel"
        aria-label="Sound and scene controls"
      >
        <header className="panel-heading">
          <div>
            <span className="eyebrow">Sound source</span>
            <h2>Give it a pulse.</h2>
          </div>
          <span
            className={`signal ${audio.playing ? "active" : ""}`}
            aria-label={audio.playing ? "Audio active" : "Audio inactive"}
          />
        </header>
        <div className="source-buttons">
          <button
            className="primary"
            onClick={() => source(() => sessionRef.current?.demo())}
          >
            Play sound demo <span aria-hidden="true">▶</span>
          </button>
          <button onClick={() => fileRef.current?.click()}>
            Choose audio file <span aria-hidden="true">＋</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            hidden
            aria-label="Audio file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) source(() => sessionRef.current?.loadFile(file));
              event.target.value = "";
            }}
          />
          <button
            aria-pressed={audio.mode === "mic"}
            onClick={() =>
              audio.mode === "mic" || audio.mode === "loading"
                ? sessionRef.current?.stop()
                : sessionRef.current?.microphone()
            }
          >
            {audio.mode === "mic"
              ? "Stop listening"
              : audio.mode === "loading"
                ? "Cancel loading"
                : "Use microphone"}
            <span aria-hidden="true">{audio.mode === "mic" ? "■" : "◉"}</span>
          </button>
        </div>
        <p
          className={`audio-status ${audio.error ? "error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
        <AudioSpectrum sessionRef={sessionRef} />
        {audio.mode === "file" ? (
          <AudioOutput
            sessionRef={sessionRef}
            volume={volume}
            interrupted={audio.interrupted}
            onResume={() => {
              if (!volume) {
                setVolume(0.65);
                sessionRef.current?.setVolume(0.65);
              }
              sessionRef.current?.resumeOutput();
            }}
          />
        ) : null}
        {audio.mode === "file" ? (
          <div className="transport">
            <div className="track-line">
              <strong title={audio.name}>{audio.name}</strong>
              <button
                className="text-button"
                aria-label="Unload audio"
                onClick={() => sessionRef.current?.stop()}
              >
                Clear
              </button>
            </div>
            <input
              aria-label="Track position"
              type="range"
              min="0"
              max={audio.duration || 1}
              step="0.1"
              value={Math.min(position, audio.duration)}
              onChange={(event) => {
                const seconds = Number(event.target.value);
                sessionRef.current?.seek(seconds);
                setPosition(seconds);
              }}
            />
            <div className="time-line">
              <span>{formatTime(position)}</span>
              <span>{formatTime(audio.duration)}</span>
            </div>
            <div className="transport-buttons">
              <button
                aria-label="Back 10 seconds"
                onClick={() => sessionRef.current?.seek(position - 10)}
              >
                −10s
              </button>
              <button
                className="play-button"
                onClick={() =>
                  audio.playing
                    ? sessionRef.current?.pause()
                    : sessionRef.current?.play()
                }
              >
                {audio.playing ? "Pause" : "Play"}
              </button>
              <button
                aria-label="Forward 10 seconds"
                onClick={() => sessionRef.current?.seek(position + 10)}
              >
                +10s
              </button>
              <button onClick={() => sessionRef.current?.playAt(0)}>
                Restart
              </button>
            </div>
            <label className="range-row">
              <span>
                Volume <output>{Math.round(volume * 100)}%</output>
              </span>
              <input
                aria-label="Volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setVolume(value);
                  sessionRef.current?.setVolume(value);
                }}
              />
            </label>
          </div>
        ) : null}
        <div className="response-controls">
          <div className="section-label">Surface response</div>
          <div
            className="mode-selector"
            role="group"
            aria-label="Response mode"
          >
            {["balanced", "bass", "detail"].map((value) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="range-row">
            <span>
              Sensitivity <output>{sensitivity.toFixed(2)}×</output>
            </span>
            <input
              aria-label="Sensitivity"
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={sensitivity}
              onChange={(event) => setSensitivity(Number(event.target.value))}
            />
          </label>
          <label className="range-row">
            <span>
              Decay <output>{Math.round(decay * 100)}%</output>
            </span>
            <input
              aria-label="Decay"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={decay}
              onChange={(event) => setDecay(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="material-controls">
          <div className="section-label">Material</div>
          <div
            className="mode-selector"
            role="group"
            aria-label="Surface material"
          >
            {["obsidian", "mercury"].map((value) => (
              <button
                key={value}
                aria-pressed={finish === value}
                onClick={() => setFinish(value)}
              >
                {value === "obsidian" ? "Black chrome" : "Mercury"}
              </button>
            ))}
          </div>
          <label className="range-row">
            <span>
              Magnetism <output>{Math.round(field * 100)}%</output>
            </span>
            <input
              aria-label="Magnetism"
              type="range"
              min="0"
              max="1.4"
              step="0.05"
              value={field}
              onChange={(event) => setField(Number(event.target.value))}
            />
          </label>
        </div>
        <details className="youtube-section">
          <summary>Play a YouTube video</summary>
          <p>
            Video plays here. Use your microphone to react to speakers;
            headphones won’t feed the scene. Files connect directly.
          </p>
          <form onSubmit={submitVideo}>
            <label className="sr-only" htmlFor="youtube-url">
              YouTube link or video ID
            </label>
            <input
              id="youtube-url"
              name="youtube"
              placeholder="YouTube link or video ID"
              autoComplete="off"
              aria-describedby={videoError ? "youtube-error" : undefined}
              aria-invalid={!!videoError}
            />
            <button type="submit">Load</button>
          </form>
          {videoError ? (
            <p id="youtube-error" role="alert" className="error">
              {videoError}
            </p>
          ) : null}
          {video ? (
            <>
              <iframe
                key={video}
                title="YouTube player"
                src={`https://www.youtube-nocookie.com/embed/${video}?rel=0`}
                allow="encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <button className="text-button" onClick={() => setVideo(null)}>
                Close video
              </button>
            </>
          ) : null}
        </details>
        <footer className="panel-footer">
          <button onClick={resetView}>Reset view</button>
          <button
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume motion" : "Pause motion"}
          </button>
        </footer>
        <p className="privacy-note">
          Files & microphone stay on your device.
          <br />
          Drop a file anywhere. Up to 64 MB / 20 minutes.
        </p>
      </aside>
      {focus && audio.mode === "mic" ? (
        <button
          className="mic-stop-floating"
          onClick={() => sessionRef.current?.stop()}
        >
          Stop listening
        </button>
      ) : null}
    </section>
  );
}
