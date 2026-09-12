# Music composition workspace

`/music` is a responsive, local-first composition and learning tool. It runs without API keys or a backend. The brief field parses root, mode, 4/8/16 bars, BPM, and sparse/busy density; it is a deterministic music generator, not an LLM chat interface.

## Included

- All twelve roots in natural minor, major and Dorian, with diatonic spelling.
- Four-chord progressions, triad inversions, editable scale-grid notes, melody variations and per-bar melody locks.
- Coordinated melody, chords, monophonic bass, arpeggio, kick, clap and hat tracks; editable drum steps and trigger mapping.
- Web Audio preview, looping, half speed, mute controls, and background-tab stop.
- Scale/chord keyboard highlights, note explanations, tension comparisons and pitch-by-pitch practice. Practice does not grade timing. Optional Web MIDI input depends on browser support.
- Format-1 standard MIDI export at 480 PPQ with tempo/time signature, track names and aligned end events. Drum tracks use MIDI channel 10; all parts, including muted ones, export.
- Local autosave, up to twenty saved versions and validated JSON project import/export. Transfer a project file between devices; no automatic cloud sync.
- Scoped service worker and manifest for offline reload after an online visit and home-screen installation. The worker caches this route and its static assets only.

## Ableton profile

Track names were read from the local `Gus Music Template.als` on 2026-09-12. Defaults are Noire Piano MIDI, Absynth MIDI, Moog Sub37 MIDI, Minilogue MIDI, Kick, Snare/Clap/Rim and Perc Rack MIDI. Additional destinations are available in My Ableton.

Octave labels default to MIDI 60 = C3, with scientific labels available. Drum trigger notes default to General MIDI 36/38/42 and must be checked against the user's Drum Racks. The app does not connect to Live, modify its template, arm tracks or adjust hardware monitoring. Browser sounds are previews; exported MIDI uses the destination instruments.

## Validation

`npm test` covers key membership across all roots/modes, transposition, locked bars, note spelling, inversions, import bounds and MIDI parsing. `npm run test:e2e` includes desktop and phone composition/practice/export, offline reload and measured Web Audio output/stop behavior, alongside existing site regression tests.

Physical iPhone audio, external MIDI hardware and actual Ableton import/playback require device/host verification. A passing browser or MIDI-file test is not proof of those paths.

Chromium offline reload passed. WebKit composition, touch practice, export and audio checks passed; Playwright WebKit returned an internal browser error during offline reload, so Safari offline reopening remains unverified.
