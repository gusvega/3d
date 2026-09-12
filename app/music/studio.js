"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ROOTS,
  MODES,
  PARTS,
  DESTINATIONS,
  PRESETS,
  createProject,
  generate,
  transpose,
  scale,
  scaleNames,
  chord,
  name,
  pc,
  explain,
  midi,
  validateProject,
} from "../../lib/music/engine.mjs";
import { MusicAudio } from "../../lib/music/audio.mjs";
import "./studio.css";
const STORE = "gus-music-project-v1";
const LABELS = {
  melody: "Melody",
  chords: "Chords",
  bass: "Bass",
  arp: "Arpeggio",
  kick: "Kick",
  clap: "Snare / clap",
  hat: "Hi-hat",
};
const download = (data, filename, type) => {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
const safe = (s) => s.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70);
export default function MusicStudio() {
  const [p, setP] = useState(createProject),
    [tab, setTab] = useState("compose"),
    [bar, setBar] = useState(0),
    [part, setPart] = useState("melody"),
    [selected, setSelected] = useState(0),
    [playing, setPlaying] = useState(false),
    [beat, setBeat] = useState(0),
    [loop, setLoop] = useState(true),
    [slow, setSlow] = useState(false),
    [status, setStatus] = useState("Ready when you are."),
    [loaded, setLoaded] = useState(false),
    [history, setHistory] = useState([]),
    [brief, setBrief] = useState(
      "A restrained cinematic melody in A minor, 8 bars, 123 BPM",
    ),
    [practice, setPractice] = useState(false),
    [practiceIndex, setPracticeIndex] = useState(0),
    [held, setHeld] = useState([]),
    [showHints, setShowHints] = useState(true),
    [library, setLibrary] = useState([]),
    [duration, setDuration] = useState(0.5),
    [midiStatus, setMidiStatus] = useState(""),
    [edit, setEdit] = useState(false);
  const audio = useRef(null),
    file = useRef(null),
    midiAccess = useRef(null),
    inputHandler = useRef(null),
    release = useRef(null);
  const getAudio = () => {
    if (!audio.current) audio.current = new MusicAudio();
    return audio.current;
  };
  const stop = () => {
    audio.current?.stop();
    setPlaying(false);
    setBeat(0);
  };
  function change(next) {
    stop();
    setHistory((h) => [...h.slice(-29), p]);
    setP(typeof next === "function" ? next(p) : next);
    setSelected(0);
    setPractice(false);
    setPracticeIndex(0);
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) setP(validateProject(JSON.parse(saved)));
      const list = JSON.parse(localStorage.getItem(STORE + "-library") || "[]");
      if (Array.isArray(list))
        setLibrary(list.slice(0, 20).map(validateProject));
    } catch {
      setStatus(
        "A saved project could not be loaded. You can import a backup.",
      );
    }
    setLoaded(true);
    return () => {
      audio.current?.stop();
      audio.current?.ctx?.close();
      clearTimeout(release.current);
    };
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(STORE, JSON.stringify(p));
      } catch {
        setStatus(
          "Browser storage is full or unavailable. Download a project backup.",
        );
      }
  }, [p, loaded]);
  useEffect(() => {
    const f = () => {
      if (document.hidden) {
        audio.current?.stop();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/music/sw.js", { scope: "/music" })
      .then(async () => {
        const registration = await navigator.serviceWorker.ready;
        const assets = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((url) => url.startsWith(location.origin + "/_next/static/"));
        registration.active?.postMessage({ type: "CACHE_ASSETS", assets });
      })
      .catch(() => {});
  }, []);
  const sc = scale(p.root, p.mode),
    names = scaleNames(p.root, p.mode);
  const activeBar = playing ? Math.min(p.bars - 1, Math.floor(beat / 4)) : bar;
  const currentChord = chord(
    p.root,
    p.mode,
    p.progression[activeBar % 4],
    p.inversions[activeBar % 4],
  );
  const barNotes = p.notes[part].filter((n) => Math.floor(n.start / 4) === bar);
  const melodyNotes = p.notes.melody
    .filter((n) => Math.floor(n.start / 4) === bar)
    .sort((a, b) => a.start - b.start);
  const chosen = barNotes[Math.min(selected, Math.max(0, barNotes.length - 1))];
  const explanation = chosen ? explain(p, chosen) : null;
  const expected = melodyNotes[practiceIndex];
  const nowNotes = playing
    ? p.notes.melody
        .filter((n) => n.start <= beat && n.start + n.duration > beat)
        .map((n) => n.pitch)
    : held;
  const target =
    practice && expected
      ? [expected.pitch]
      : !playing && chosen
        ? [chosen.pitch]
        : [];
  const keyboardBase = Math.max(
    0,
    Math.min(
      96,
      Math.floor(Math.max(...target, ...nowNotes, 72) / 12) * 12 - 12,
    ),
  );
  const keyboardNotes = Array.from({ length: 25 }, (_, i) => keyboardBase + i);
  const rollPitches = useMemo(() => {
    const pitches = p.notes[part]
      .filter((n) => Math.floor(n.start / 4) === bar)
      .map((n) => n.pitch);
    const min = Math.min(...pitches, 60),
      max = Math.max(...pitches, 83);
    return Array.from({ length: max - min + 1 }, (_, i) => max - i).filter(
      (n) => scale(p.root, p.mode).includes(pc(n)) || pitches.includes(n),
    );
  }, [p, part, bar]);
  async function hear(notes, track = "melody") {
    try {
      const a = getAudio();
      await a.ready();
      notes.forEach((n) => a.tone(n, a.ctx.currentTime, 0.65, track));
      setHeld(notes);
      clearTimeout(release.current);
      release.current = setTimeout(() => setHeld([]), 700);
    } catch (e) {
      setStatus(e.message);
    }
  }
  async function play() {
    if (playing) {
      stop();
      return;
    }
    try {
      setPractice(false);
      const a = getAudio();
      await a.ready();
      a.play(p, {
        loop,
        slow: slow ? 0.5 : 1,
        onBeat: setBeat,
        onEnd: () => setPlaying(false),
      });
      setPlaying(true);
      setStatus("Playing your composition.");
    } catch (e) {
      setStatus(e.message);
    }
  }
  function playKey(n) {
    hear([n]);
    if (practice && expected) {
      if (n === expected.pitch) {
        if (practiceIndex + 1 === melodyNotes.length) {
          setPractice(false);
          setPracticeIndex(0);
          setStatus("Phrase complete. Now try it with the hints hidden.");
        } else {
          setPracticeIndex((i) => i + 1);
          setStatus("Yes. Move to the next note.");
        }
      } else
        setStatus(
          `Try ${name(expected.pitch, p.root, p.mode, p.octaveOffset)}. You played ${name(n, p.root, p.mode, p.octaveOffset)}.`,
        );
    }
  }
  inputHandler.current = playKey;
  useEffect(
    () => () => {
      if (midiAccess.current) {
        midiAccess.current.inputs.forEach((i) => {
          i.onmidimessage = null;
        });
        midiAccess.current.onstatechange = null;
      }
    },
    [],
  );
  async function connectMidi() {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus(
        "MIDI input is unavailable in this browser. Use the touch keyboard, or a desktop browser with Web MIDI support.",
      );
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccess.current = access;
      const attach = () => {
        const inputs = [...access.inputs.values()];
        inputs.forEach((i) => {
          i.onmidimessage = (e) => {
            if ((e.data[0] & 240) === 144 && e.data[2] > 0)
              inputHandler.current(e.data[1]);
          };
        });
        setMidiStatus(
          inputs.length
            ? `Listening: ${inputs.map((i) => i.name).join(", ")}`
            : "No MIDI input found. Connect a keyboard, then it will appear here.",
        );
      };
      access.onstatechange = attach;
      attach();
    } catch {
      setMidiStatus("MIDI access was not granted. Touch practice still works.");
    }
  }
  function regenerate(kind = "all") {
    const next = { ...p, seed: p.seed + 1 };
    const notes = generate(next, p.notes);
    if (kind === "melody") next.notes = { ...p.notes, melody: notes.melody };
    else next.notes = notes;
    change(next);
    setStatus(
      p.locked.length
        ? "New variation. Locked melody bars were preserved."
        : "New variation ready. Compare it with Undo.",
    );
  }
  function applyBrief() {
    const keyMatch = brief.match(
        /\b([A-G])([#b]?)\s+(natural\s+minor|minor|major|dorian)\b/i,
      ),
      tempo = brief.match(/\b(\d{2,3})\s*bpm\b/i),
      bars = brief.match(/\b(4|8|16)[ -]?bars?\b/i);
    let root = p.root,
      mode = p.mode;
    if (keyMatch) {
      const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      root = pc(
        natural[keyMatch[1].toUpperCase()] +
          (keyMatch[2] === "#" ? 1 : keyMatch[2] === "b" ? -1 : 0),
      );
      mode = keyMatch[3].toLowerCase().replace("natural ", "");
    }
    let next = {
      ...p,
      root,
      mode,
      bpm: tempo ? Math.min(220, Math.max(40, +tempo[1])) : p.bpm,
      bars: bars ? +bars[1] : p.bars,
      density: /busy|active|energetic/i.test(brief)
        ? 7
        : /sparse|minimal|restrained/i.test(brief)
          ? 3
          : p.density,
      locked: [],
      seed: p.seed + 1,
      progression: PRESETS[mode][0],
    };
    next.notes = generate(next);
    change(next);
    setBar(0);
    setStatus(
      `Applied ${ROOTS[root]} ${mode}, ${next.bars} bars, ${next.bpm} BPM. Descriptions support sparse or busy density; use the controls to refine the music.`,
    );
  }
  function updateHarmony(index, degree, inversion) {
    let next = {
      ...p,
      progression: p.progression.map((n, i) => (i === index ? degree : n)),
      inversions: p.inversions.map((n, i) => (i === index ? inversion : n)),
    };
    const generated = generate(next);
    next.notes = {
      ...p.notes,
      chords: generated.chords,
      bass: generated.bass,
      arp: generated.arp,
    };
    change(next);
    setStatus(
      "Harmony updated. Your melody is preserved so you can hear its new relationship to the chords.",
    );
  }
  function editCell(pitch, step) {
    const start = bar * 4 + step / 4;
    const at = p.notes[part].findIndex(
      (n) => n.pitch === pitch && Math.abs(n.start - start) < 0.01,
    );
    let notes = p.notes[part].filter((_, i) => i !== at);
    if (at < 0) {
      if (part !== "chords")
        notes = notes.filter((n) => Math.abs(n.start - start) > 0.01);
      notes.push({
        pitch,
        start,
        duration: Math.min(duration, 4 - step / 4),
        velocity: 85,
      });
    }
    notes.sort((a, b) => a.start - b.start);
    change({ ...p, notes: { ...p.notes, [part]: notes } });
  }
  function toggleDrum(k, step) {
    const start = bar * 4 + step / 4,
      exists = p.notes[k].some((n) => n.start === start);
    change({
      ...p,
      notes: {
        ...p.notes,
        [k]: exists
          ? p.notes[k].filter((n) => n.start !== start)
          : [
              ...p.notes[k],
              {
                pitch: p.drumMap[k],
                start,
                duration: 0.15,
                velocity: k === "kick" ? 105 : 80,
              },
            ].sort((a, b) => a.start - b.start),
      },
    });
  }
  function exportMidi(parts = PARTS) {
    download(
      midi(p, parts),
      `${safe(p.title)}-${ROOTS[p.root]}-${p.mode}-${p.bpm}bpm${parts.length === 1 ? "-" + safe(p.setup[parts[0]]) : ""}.mid`,
      "audio/midi",
    );
    setStatus(
      "MIDI exported. Set Live to the displayed tempo before importing.",
    );
  }
  async function importProject(e) {
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 1000000) throw Error("Choose a project smaller than 1 MB.");
      const next = validateProject(JSON.parse(await f.text()));
      change(next);
      setBar(0);
      setStatus("Project imported.");
    } catch (err) {
      setStatus(err.message);
    }
    e.target.value = "";
  }
  function saveVersion() {
    const list = [structuredClone(p), ...library].slice(0, 20);
    try {
      localStorage.setItem(STORE + "-library", JSON.stringify(list));
      setLibrary(list);
      setStatus(
        "Version saved in this browser. Download a project to transfer it to another device.",
      );
    } catch {
      setStatus("Could not save. Download a project backup instead.");
    }
  }
  function compare() {
    if (!chosen) return;
    const c = explain(p, chosen).c;
    let nearest = c.notes
      .flatMap((n) => [n - 12, n, n + 12])
      .sort(
        (a, b) => Math.abs(a - chosen.pitch) - Math.abs(b - chosen.pitch),
      )[0];
    (async () => {
      try {
        const a = getAudio();
        await a.ready();
        a.stop();
        setPlaying(false);
        const t = a.ctx.currentTime;
        c.notes.forEach((n) => {
          a.tone(n, t, 1, "chords");
          a.tone(n, t + 1.5, 1, "chords");
        });
        a.tone(chosen.pitch, t, 0.8);
        a.tone(nearest, t + 1.5, 0.8);
        setStatus(
          `First ${name(chosen.pitch, p.root, p.mode, p.octaveOffset)}, then ${name(nearest, p.root, p.mode, p.octaveOffset)}, both over ${c.label}. ${nearest === chosen.pitch ? "This note is already a chord tone." : "Listen for the change in tension."}`,
        );
      } catch (e) {
        setStatus(e.message);
      }
    })();
  }
  const keyboard = (
    <section className="music-panel keyboard-panel">
      <div className="panel-heading">
        <div>
          <span className="music-eyebrow">AT YOUR FINGERTIPS</span>
          <h2>
            {ROOTS[p.root]} {p.mode}{" "}
            <span className="heading-muted">
              / {showHints ? names.join(" · ") : "Listen and explore"}
            </span>
          </h2>
        </div>
        <div className="keyboard-legend">
          <span>● Scale</span>
          <span>● Chord</span>
          <span>● {practice ? "Next note" : "Selected / playing"}</span>
        </div>
      </div>
      <div className="keyboard-scroll">
        <div className="music-keyboard">
          {keyboardNotes.map((n) => {
            const black = [1, 3, 6, 8, 10].includes(pc(n)),
              whites = keyboardNotes.filter(
                (x) => x < n && ![1, 3, 6, 8, 10].includes(pc(x)),
              ).length;
            return (
              <button
                key={n}
                className={`piano-key ${black ? "black" : "white"} ${showHints && sc.includes(pc(n)) ? "in-scale" : ""} ${showHints && currentChord.notes.some((x) => pc(x) === pc(n)) ? "chord-tone" : ""} ${nowNotes.includes(n) || (showHints && target.includes(n)) ? "lit" : ""}`}
                style={{
                  left: `${black ? whites * 6.6667 - 2 : whites * 6.6667}%`,
                  width: black ? "4%" : "6.6667%",
                }}
                aria-label={`Play ${name(n, p.root, p.mode, p.octaveOffset)}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playKey(n);
                }}
                onClick={(e) => {
                  if (e.detail === 0) playKey(n);
                }}
              >
                <span>
                  {showHints ? name(n, p.root, p.mode, p.octaveOffset) : ""}
                </span>
                {showHints && sc.includes(pc(n)) && (
                  <small>{sc.indexOf(pc(n)) + 1}</small>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="panel-foot">
        {p.octaveOffset === -2
          ? "Ableton octave labels: MIDI 60 = C3."
          : "Scientific octave labels: MIDI 60 = C4."}{" "}
        Scale highlighting is guidance; you can audition every key.
      </p>
    </section>
  );
  return (
    <main className="music-app">
      <header className="music-header">
        <a href="/" className="music-brand" aria-label="Gus 3D home">
          <span className="brand-glyph">g.</span>
          <span>
            GUS <b>/ MUSIC</b>
          </span>
        </a>
        <span className="header-note">A place to find your next phrase.</span>
        <div className="header-actions">
          <span className="save-indicator">
            ● <span>{loaded ? "Saved on this device" : "Loading"}</span>
          </span>
          <button onClick={() => setTab("export")}>
            Export MIDI <span aria-hidden>↗</span>
          </button>
        </div>
      </header>
      <div className="music-shell">
        <section className="music-intro">
          <div>
            <div className="music-eyebrow">COMPOSE · PLAY · UNDERSTAND</div>
            <h1>Make a little music.</h1>
            <p>Find the notes. Feel the connection. Make it yours.</p>
          </div>
          <div className="key-orbit" aria-label={`${ROOTS[p.root]} ${p.mode}`}>
            <span>{ROOTS[p.root]}</span>
            <small>{p.mode}</small>
            <i />
            <i />
          </div>
        </section>
        <nav className="music-tabs" aria-label="Workspace">
          {[
            ["compose", "01", "Compose"],
            ["learn", "02", "Play & learn"],
            ["setup", "03", "My Ableton"],
            ["export", "04", "Projects & export"],
          ].map(([id, num, label]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <small>{num}</small>
              {label}
            </button>
          ))}
        </nav>
        <div className="music-transport">
          <button
            className="play-button"
            aria-label={playing ? "Stop playback" : "Play composition"}
            onClick={play}
          >
            {playing ? "■" : "▶"}
          </button>
          <div className="transport-position">
            <strong>
              {String(Math.floor(beat / 4) + 1).padStart(2, "0")}
              <span> / {String(p.bars).padStart(2, "0")}</span>
            </strong>
            <small>{playing ? "PLAYING" : "READY"} · 4/4</small>
          </div>
          <label>
            KEY
            <select
              value={p.root}
              onChange={(e) => change(transpose(p, +e.target.value, p.mode))}
            >
              {ROOTS.map((n, i) => (
                <option value={i} key={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            SCALE
            <select
              value={p.mode}
              onChange={(e) => change(transpose(p, p.root, e.target.value))}
            >
              {Object.keys(MODES).map((m) => (
                <option key={m} value={m}>
                  {m === "minor"
                    ? "Natural minor"
                    : m[0].toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            BPM
            <input
              type="number"
              min="40"
              max="220"
              aria-label="Tempo BPM"
              key={p.bpm}
              defaultValue={p.bpm}
              onBlur={(e) => {
                const v = Math.min(
                  220,
                  Math.max(40, Number(e.target.value) || p.bpm),
                );
                e.target.value = String(v);
                if (v !== p.bpm) change({ ...p, bpm: v });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          </label>
          <label>
            BARS
            <select
              value={p.bars}
              onChange={(e) => {
                const next = {
                  ...p,
                  bars: +e.target.value,
                  locked: p.locked.filter((b) => b < +e.target.value),
                };
                next.notes = generate(next, p.notes);
                change(next);
                setBar(0);
              }}
            >
              {[4, 8, 16].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            className={loop ? "toggle active" : "toggle"}
            aria-pressed={loop}
            onClick={() => {
              stop();
              setLoop(!loop);
            }}
          >
            ↻ Loop
          </button>
          <button
            className={slow ? "toggle active" : "toggle"}
            aria-pressed={slow}
            onClick={() => {
              stop();
              setSlow(!slow);
            }}
          >
            ½ Speed
          </button>
        </div>
        {tab === "compose" && (
          <>
            <section className="brief-box">
              <label htmlFor="music-brief">WHAT DO YOU WANT TO WRITE?</label>
              <div>
                <input
                  id="music-brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyBrief();
                  }}
                  maxLength={250}
                />
                <button className="primary" onClick={applyBrief}>
                  Create composition <span>↗</span>
                </button>
              </div>
              <small>
                Try a key, 4 / 8 / 16 bars, BPM, and “sparse” or “busy”. A
                musical starting point you can edit.
              </small>
            </section>
            <div className="composer-layout">
              <div className="composer-main">
                <section className="music-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="music-eyebrow">01 / THE HARMONY</span>
                      <h2>A home for your melody.</h2>
                    </div>
                    <select
                      aria-label="Progression preset"
                      value=""
                      onChange={(e) => {
                        const next = {
                          ...p,
                          progression: PRESETS[p.mode][+e.target.value],
                        };
                        const notes = generate(next);
                        change({
                          ...next,
                          notes: {
                            ...p.notes,
                            chords: notes.chords,
                            bass: notes.bass,
                            arp: notes.arp,
                          },
                        });
                      }}
                    >
                      <option value="" disabled>
                        Try a progression
                      </option>
                      {PRESETS[p.mode].map((seq, i) => (
                        <option value={i} key={i}>
                          {seq
                            .map((d) => chord(p.root, p.mode, d).label)
                            .join(" → ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="chord-cards">
                    {p.progression.map((d, i) => {
                      const c = chord(p.root, p.mode, d, p.inversions[i]);
                      return (
                        <div
                          className={`chord-card ${activeBar % 4 === i ? "current" : ""}`}
                          key={i}
                        >
                          <div className="chord-top">
                            <small>{String(i + 1).padStart(2, "0")}</small>
                            <span>{c.roman}</span>
                            <button
                              aria-label={`Hear chord ${i + 1}: ${c.label}`}
                              onClick={() => hear(c.notes, "chords")}
                            >
                              ▷
                            </button>
                          </div>
                          <strong>{c.label}</strong>
                          <p>
                            {c.notes
                              .map((n) =>
                                name(n, p.root, p.mode, p.octaveOffset, false),
                              )
                              .join(" · ")}
                          </p>
                          <select
                            aria-label={`Chord ${i + 1}`}
                            value={d}
                            onChange={(e) =>
                              updateHarmony(i, +e.target.value, p.inversions[i])
                            }
                          >
                            {names.map((n, j) => (
                              <option value={j} key={j}>
                                {chord(p.root, p.mode, j).label}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label={`Inversion ${i + 1}`}
                            value={p.inversions[i]}
                            onChange={(e) =>
                              updateHarmony(i, d, +e.target.value)
                            }
                          >
                            <option value={0}>Root position</option>
                            <option value={1}>1st inversion</option>
                            <option value={2}>2nd inversion</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  <p className="panel-foot">
                    One chord per bar. The four-chord sequence repeats through
                    your phrase.
                  </p>
                </section>
                <section className="music-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="music-eyebrow">02 / THE PHRASE</span>
                      <h2>A few notes. Your own direction.</h2>
                    </div>
                    <button
                      disabled={!history.length}
                      onClick={() => {
                        stop();
                        const prior = history[history.length - 1];
                        setP(prior);
                        setBar(0);
                        setSelected(0);
                        setHistory((h) => h.slice(0, -1));
                      }}
                    >
                      ↶ Undo
                    </button>
                  </div>
                  <div className="track-tabs">
                    {["melody", "chords", "bass", "arp"].map((k) => (
                      <button
                        key={k}
                        className={part === k ? "active" : ""}
                        onClick={() => {
                          setPart(k);
                          setSelected(0);
                        }}
                      >
                        {LABELS[k]} <span>{p.notes[k].length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="bar-tabs" aria-label="Select bar">
                    {Array.from({ length: p.bars }, (_, i) => (
                      <button
                        aria-label={`Bar ${i + 1}${p.locked.includes(i) ? ", melody locked" : ""}`}
                        className={bar === i ? "active" : ""}
                        key={i}
                        onClick={() => {
                          setBar(i);
                          setSelected(0);
                          setPracticeIndex(0);
                        }}
                      >
                        {i + 1}
                        {p.locked.includes(i) ? " ·" : ""}
                      </button>
                    ))}
                  </div>
                  <div className="roll-tools">
                    <span>
                      BAR {bar + 1} ·{" "}
                      {chord(p.root, p.mode, p.progression[bar % 4]).label}
                    </span>
                    <label>
                      <input
                        type="checkbox"
                        checked={edit}
                        onChange={(e) => setEdit(e.target.checked)}
                      />{" "}
                      Draw notes
                    </label>
                    <label>
                      Length
                      <select
                        value={duration}
                        onChange={(e) => setDuration(+e.target.value)}
                      >
                        <option value={0.25}>1/16</option>
                        <option value={0.5}>1/8</option>
                        <option value={1}>1/4</option>
                        <option value={2}>1/2</option>
                      </select>
                    </label>
                    <button
                      aria-pressed={p.locked.includes(bar)}
                      onClick={() =>
                        change({
                          ...p,
                          locked: p.locked.includes(bar)
                            ? p.locked.filter((b) => b !== bar)
                            : [...p.locked, bar],
                        })
                      }
                    >
                      {p.locked.includes(bar) ? "● Locked" : "○ Lock melody"}
                    </button>
                  </div>
                  <div className="roll-scroll">
                    <div
                      className="piano-roll"
                      style={{ height: rollPitches.length * 23 + 24 }}
                    >
                      <div className="roll-beats">
                        {[1, 2, 3, 4].map((n) => (
                          <span key={n}>{n}</span>
                        ))}
                      </div>
                      {rollPitches.map((pitch, row) => (
                        <div
                          className="roll-row"
                          key={pitch}
                          style={{ top: 24 + row * 23 }}
                        >
                          <span>
                            {name(pitch, p.root, p.mode, p.octaveOffset)}
                          </span>
                          <div className="roll-cells">
                            {Array.from({ length: 16 }, (_, s) => (
                              <button
                                tabIndex={edit ? 0 : -1}
                                disabled={!edit}
                                aria-label={`Place ${name(pitch, p.root, p.mode, p.octaveOffset)} at beat ${s / 4 + 1}`}
                                key={s}
                                onClick={() => editCell(pitch, s)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="note-layer" style={{ left: 43, top: 24 }}>
                        {barNotes.map((n, i) => (
                          <button
                            key={`${n.start}-${n.pitch}-${i}`}
                            aria-label={`${name(n.pitch, p.root, p.mode, p.octaveOffset)}, beat ${n.start - bar * 4 + 1}, ${n.duration} beats`}
                            className={`roll-note ${i === selected ? "selected" : ""}`}
                            style={{
                              left: `${((n.start - bar * 4) / 4) * 100}%`,
                              width: `${(n.duration / 4) * 100}%`,
                              top: rollPitches.indexOf(n.pitch) * 23 + 3,
                            }}
                            onClick={() => {
                              if (edit)
                                editCell(
                                  n.pitch,
                                  Math.round((n.start - bar * 4) * 4),
                                );
                              else {
                                setSelected(i);
                                hear([n.pitch], part);
                              }
                            }}
                          >
                            {name(
                              n.pitch,
                              p.root,
                              p.mode,
                              p.octaveOffset,
                              false,
                            )}
                          </button>
                        ))}
                      </div>
                      {playing && activeBar === bar && (
                        <div
                          className="playhead"
                          style={{
                            left: `calc(43px + (100% - 43px) * ${(beat % 4) / 4})`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="variation-tools">
                    <button
                      className="primary"
                      onClick={() => regenerate("melody")}
                    >
                      ↗ New melody variation
                    </button>
                    <label>
                      Density{" "}
                      <input
                        aria-label="Melody density"
                        type="range"
                        min="2"
                        max="7"
                        value={p.density}
                        onChange={(e) =>
                          change({ ...p, density: +e.target.value })
                        }
                      />
                    </label>
                    <button onClick={() => regenerate()}>
                      Regenerate all parts
                    </button>
                  </div>
                  <p className="panel-foot">
                    Tap a note to hear it and learn why it fits. Enable Draw
                    notes to add or remove notes. Density applies to the next
                    variation.
                  </p>
                </section>
              </div>
              <aside className="composer-aside">
                <section className="music-panel insight-panel">
                  <span className="music-eyebrow">THE NOTEBOOK</span>
                  <h2>
                    {chosen
                      ? name(chosen.pitch, p.root, p.mode, p.octaveOffset)
                      : "Room for a note."}
                  </h2>
                  {explanation ? (
                    <>
                      <div className="note-badges">
                        <span>
                          Degree {explanation.degree || "outside scale"}
                        </span>
                        <span>{explanation.role}</span>
                      </div>
                      <p>{explanation.text}</p>
                      <button onClick={compare}>▷ Hear why</button>
                    </>
                  ) : (
                    <p>Draw a note to begin exploring this bar.</p>
                  )}
                  <div className="insight-divider" />
                  <span className="music-eyebrow">YOUR SCALE</span>
                  <div className="scale-chips">
                    {names.map((n, i) => (
                      <button
                        key={n}
                        onClick={() => hear([60 + p.root + MODES[p.mode][i]])}
                      >
                        <strong>{n}</strong>
                        <small>{i + 1}</small>
                      </button>
                    ))}
                  </div>
                  <p className="small-copy">
                    These seven notes belong to {ROOTS[p.root]} {p.mode}. Chord
                    tones give you landing points; other scale notes add
                    movement.
                  </p>
                  <button onClick={() => setTab("learn")}>
                    Practice this phrase →
                  </button>
                </section>
                <section className="music-panel mixer-panel">
                  <span className="music-eyebrow">YOUR ENSEMBLE</span>
                  {PARTS.map((k) => (
                    <div className="mixer-track" key={k}>
                      <button
                        aria-label={`${p.muted.includes(k) ? "Unmute" : "Mute"} ${LABELS[k]}`}
                        aria-pressed={!p.muted.includes(k)}
                        className={p.muted.includes(k) ? "muted" : ""}
                        onClick={() =>
                          change({
                            ...p,
                            muted: p.muted.includes(k)
                              ? p.muted.filter((x) => x !== k)
                              : [...p.muted, k],
                          })
                        }
                      >
                        ●
                      </button>
                      <div>
                        <strong>{LABELS[k]}</strong>
                        <small>{p.setup[k]}</small>
                      </div>
                      <span
                        className={
                          p.muted.includes(k) ? "meter muted" : "meter"
                        }
                      >
                        ▂▅▃▆▂
                      </span>
                    </div>
                  ))}
                  <p className="small-copy">
                    Browser instruments are previews. Your Ableton instruments
                    provide the final sound.
                  </p>
                </section>
              </aside>
            </div>
            <section className="music-panel">
              <div className="panel-heading">
                <div>
                  <span className="music-eyebrow">03 / THE PULSE</span>
                  <h2>Give it somewhere to move.</h2>
                </div>
                <span className="muted-copy">Editing bar {bar + 1}</span>
              </div>
              <div className="drum-scroll">
                <div className="drum-grid">
                  {["kick", "clap", "hat"].map((k) => (
                    <div className="drum-row" key={k}>
                      <strong>{LABELS[k]}</strong>
                      {Array.from({ length: 16 }, (_, i) => (
                        <button
                          key={i}
                          aria-label={`${LABELS[k]} step ${i + 1}`}
                          aria-pressed={p.notes[k].some(
                            (n) => n.start === bar * 4 + i / 4,
                          )}
                          className={`${p.notes[k].some((n) => n.start === bar * 4 + i / 4) ? "on" : ""} ${i % 4 === 0 ? "downbeat" : ""}`}
                          onClick={() => toggleDrum(k, i)}
                        >
                          {i % 4 === 0 ? i / 4 + 1 : "·"}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  const notes = { ...p.notes };
                  for (const k of ["kick", "clap", "hat"])
                    notes[k] = Array.from({ length: p.bars }, (_, b) =>
                      p.notes[k]
                        .filter((n) => Math.floor(n.start / 4) === bar)
                        .map((n) => ({ ...n, start: b * 4 + (n.start % 4) })),
                    ).flat();
                  change({ ...p, notes });
                  setStatus(
                    "This drum bar now repeats throughout the composition.",
                  );
                }}
              >
                Repeat this drum bar across the phrase
              </button>
            </section>
          </>
        )}
        {tab === "learn" && (
          <section className="music-panel learn-panel">
            <div className="panel-heading">
              <div>
                <span className="music-eyebrow">PLAY & UNDERSTAND</span>
                <h2>Let your ears lead your hands.</h2>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={showHints}
                  onChange={(e) => setShowHints(e.target.checked)}
                />{" "}
                Show hints
              </label>
            </div>
            <p>
              Practice the melody one note at a time, then play the full
              composition to learn its rhythm. This exercise checks pitches, not
              timing.
            </p>
            <div className="bar-tabs">
              {Array.from({ length: p.bars }, (_, i) => (
                <button
                  key={i}
                  className={bar === i ? "active" : ""}
                  onClick={() => {
                    setBar(i);
                    setPracticeIndex(0);
                    setSelected(0);
                  }}
                >
                  Bar {i + 1}
                </button>
              ))}
            </div>
            <div className="lesson-banner">
              <div>
                <span className="music-eyebrow">
                  {practice ? "YOUR TURN" : "START WITH ONE PHRASE"}
                </span>
                <h3>
                  {practice && expected
                    ? `Play ${showHints ? name(expected.pitch, p.root, p.mode, p.octaveOffset) : "the next note"}`
                    : `Bar ${bar + 1} · ${chord(p.root, p.mode, p.progression[bar % 4]).label}`}
                </h3>
                <p>
                  {practice
                    ? `Note ${practiceIndex + 1} of ${melodyNotes.length}`
                    : "Listen, follow the highlighted keys, then try it yourself."}
                </p>
              </div>
              <button
                className="primary"
                disabled={!melodyNotes.length}
                onClick={() => {
                  stop();
                  setPractice(!practice);
                  setPracticeIndex(0);
                }}
              >
                {practice ? "Finish practice" : "Practice this bar →"}
              </button>
              <button
                onClick={async () => {
                  try {
                    const a = getAudio();
                    await a.ready();
                    a.stop();
                    setPlaying(false);
                    const t = a.ctx.currentTime;
                    melodyNotes.forEach((n) =>
                      a.tone(
                        n.pitch,
                        t + (((n.start - bar * 4) * 60) / p.bpm) * 2,
                        ((n.duration * 60) / p.bpm) * 2,
                      ),
                    );
                    setStatus("Playing this melody bar at half speed.");
                  } catch (e) {
                    setStatus(e.message);
                  }
                }}
              >
                ▷ Hear this bar
              </button>
            </div>
            <div className="phrase-notes">
              {melodyNotes.map((n, i) => (
                <button
                  key={i}
                  className={practiceIndex === i && practice ? "active" : ""}
                  onClick={() => {
                    setPart("melody");
                    setSelected(i);
                    hear([n.pitch]);
                  }}
                >
                  <small>{i + 1}</small>
                  <strong>
                    {showHints
                      ? name(n.pitch, p.root, p.mode, p.octaveOffset)
                      : "?"}
                  </strong>
                  <span>
                    Beat {(n.start % 4) + 1} · {n.duration} beats
                  </span>
                </button>
              ))}
            </div>
            {keyboard}
            <div className="lesson-columns">
              <article>
                <span className="music-eyebrow">01 / FIND HOME</span>
                <h3>{ROOTS[p.root]} is your tonic.</h3>
                <p>
                  Play {ROOTS[p.root]}, then another scale note, then return.
                  The tonic is the tonal center. A phrase can return here to
                  sound finished.
                </p>
                <button onClick={() => hear([60 + p.root])}>
                  Hear the tonic
                </button>
              </article>
              <article>
                <span className="music-eyebrow">02 / FOLLOW THE CHORD</span>
                <h3>
                  {currentChord.label}:{" "}
                  {currentChord.notes
                    .map((n) => name(n, p.root, p.mode, p.octaveOffset, false))
                    .join(", ")}
                  .
                </h3>
                <p>
                  These three chord tones are useful landing points. Try one on
                  a strong beat, then connect it to another with a nearby scale
                  note.
                </p>
                <button onClick={() => hear(currentChord.notes, "chords")}>
                  Hear the chord
                </button>
              </article>
              <article>
                <span className="music-eyebrow">03 / MAKE A SENTENCE</span>
                <h3>Repeat, then change.</h3>
                <p>
                  Play a short motif twice. On the second pass, change only its
                  ending. Repetition gives the listener something to recognize;
                  the new ending creates direction.
                </p>
                <button
                  onClick={() => {
                    setTab("compose");
                    setPart("melody");
                  }}
                >
                  Edit your motif →
                </button>
              </article>
            </div>
            <button onClick={connectMidi}>Connect MIDI keyboard</button>
            <p className="small-copy">
              {midiStatus ||
                "Optional on supported browsers. Your phone’s touch keyboard is always available."}
            </p>
          </section>
        )}
        {tab === "compose" && keyboard}
        {tab === "setup" && (
          <section className="music-panel">
            <div className="panel-heading">
              <div>
                <span className="music-eyebrow">
                  YOUR STUDIO, CONNECTED BY MUSIC
                </span>
                <h2>A place for every part.</h2>
              </div>
            </div>
            <p>
              Destinations below come from your Gus Music Template. Choose where
              each part belongs. Export creates named MIDI tracks; it does not
              control Live or change hardware routing.
            </p>
            <div className="setup-grid">
              {PARTS.map((k) => (
                <label key={k}>
                  <span>{LABELS[k]}</span>
                  <select
                    value={p.setup[k]}
                    onChange={(e) =>
                      change({
                        ...p,
                        setup: { ...p.setup, [k]: e.target.value },
                      })
                    }
                  >
                    {[...new Set([...DESTINATIONS, p.setup[k]])].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  {["kick", "clap", "hat"].includes(k) && (
                    <small>
                      Trigger note{" "}
                      <input
                        aria-label={`${LABELS[k]} MIDI trigger`}
                        type="number"
                        min="0"
                        max="127"
                        value={p.drumMap[k]}
                        onChange={(e) => {
                          const n = +e.target.value;
                          if (Number.isInteger(n) && n >= 0 && n <= 127)
                            change({
                              ...p,
                              drumMap: { ...p.drumMap, [k]: n },
                              notes: {
                                ...p.notes,
                                [k]: p.notes[k].map((x) => ({
                                  ...x,
                                  pitch: n,
                                })),
                              },
                            });
                        }}
                      />
                    </small>
                  )}
                </label>
              ))}
            </div>
            <p className="small-copy">
              Drum triggers default to General MIDI: 36 / 38 / 42. Match them to
              the occupied pads in your Drum Racks before export. A drum trigger
              selects a sound, not its tuning.
            </p>
            <label className="octave-setting">
              Keyboard octave labels
              <select
                value={p.octaveOffset}
                onChange={(e) =>
                  change({ ...p, octaveOffset: +e.target.value })
                }
              >
                <option value={-2}>Ableton: MIDI 60 = C3</option>
                <option value={-1}>Scientific: MIDI 60 = C4</option>
              </select>
            </label>
            <div className="lesson-columns">
              <article>
                <h3>1. Open your template</h3>
                <p>
                  Open Gus Music Template in Live and set the tempo to {p.bpm}{" "}
                  BPM. The composition uses {p.bars} bars in 4/4.
                </p>
              </article>
              <article>
                <h3>2. Place the MIDI</h3>
                <p>
                  Import each part to its chosen MIDI track at the same bar, or
                  put the clips in one Session scene. Use individual exports to
                  place parts precisely.
                </p>
              </article>
              <article>
                <h3>3. Play through your sounds</h3>
                <p>
                  Use your configured instruments and hardware routing. MIDI
                  carries notes, durations and velocities. It does not include
                  browser audio or audio recordings.
                </p>
              </article>
            </div>
            <p className="small-copy">
              Hardware destinations use your existing Moog and Minilogue MIDI
              tracks. Companion audio tracks are for recording their sound. This
              page does not adjust monitoring or arm tracks.
            </p>
          </section>
        )}
        {tab === "export" && (
          <section className="music-panel">
            <div className="panel-heading">
              <div>
                <span className="music-eyebrow">TAKE THE IDEA WITH YOU</span>
                <h2>From a small phrase to your studio.</h2>
              </div>
            </div>
            <label className="project-title">
              Project name
              <input
                maxLength={100}
                value={p.title}
                onChange={(e) => setP({ ...p, title: e.target.value })}
              />
            </label>
            <div className="export-summary">
              <strong>
                {ROOTS[p.root]} {p.mode}
              </strong>
              <span>{p.bpm} BPM</span>
              <span>{p.bars} bars · 4/4</span>
              <span>{PARTS.length} MIDI tracks</span>
            </div>
            <div className="export-actions">
              <button className="primary" onClick={() => exportMidi()}>
                Download all tracks .mid ↗
              </button>
              <button
                onClick={() => {
                  download(
                    JSON.stringify(p, null, 2),
                    safe(p.title) + ".music.json",
                    "application/json",
                  );
                  setStatus(
                    "Project downloaded. Import this file on another device to continue.",
                  );
                }}
              >
                Download project
              </button>
              <button onClick={() => file.current.click()}>
                Import project
              </button>
              <input
                ref={file}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={importProject}
              />
              <button onClick={saveVersion}>Save a version</button>
            </div>
            <p className="small-copy">
              MIDI exports include every part, including muted tracks. All
              tracks end at the same phrase boundary. Project files preserve
              edits, locks, settings and destinations.
            </p>
            <div className="export-tracks">
              {PARTS.map((k) => (
                <div key={k}>
                  <div>
                    <strong>{LABELS[k]}</strong>
                    <small>
                      {p.setup[k]} · {p.notes[k].length} notes
                    </small>
                  </div>
                  <button onClick={() => exportMidi([k])}>
                    Download MIDI ↓
                  </button>
                </div>
              ))}
            </div>
            <h3>
              Saved versions <span className="muted-copy">/ this browser</span>
            </h3>
            {library.length ? (
              library.map((v, i) => (
                <div className="saved-version" key={i}>
                  <div>
                    <strong>{v.title}</strong>
                    <small>
                      {ROOTS[v.root]} {v.mode} · {v.bpm} BPM · {v.bars} bars
                    </small>
                  </div>
                  <button
                    onClick={() => {
                      change(validateProject(v));
                      setBar(0);
                      setStatus("Saved version loaded.");
                    }}
                  >
                    Load
                  </button>
                </div>
              ))
            ) : (
              <p className="small-copy">
                Save a version before exploring a different direction.
              </p>
            )}
            <div className="transfer-note">
              <strong>On your phone</strong>
              <p>
                In Safari, use Share → Add to Home Screen. On Android, use your
                browser’s Install app option. Open the app online once to cache
                it for offline use.
              </p>
              <strong>Phone → desktop</strong>
              <p>
                Download your project file and transfer it with AirDrop, Files,
                or your cloud drive. Open this page on desktop and import it.
                Projects are saved locally; there is no account or automatic
                cloud sync.
              </p>
            </div>
          </section>
        )}
        <div className="music-status" role="status">
          <span>●</span>
          {status}
        </div>
        <footer className="music-footer">
          <span>GUS / MUSIC</span>
          <span>Small phrases. New possibilities.</span>
          <a href="https://www.gusvega.com">Music by Gus ↗</a>
        </footer>
      </div>
    </main>
  );
}
