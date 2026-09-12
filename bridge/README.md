# SPECTRA mobile proof of concept

Unlisted route: `/spectra`. The homepage is intentionally unchanged and the route declares `noindex, nofollow`. The route is publicly reachable; songs, processing and downloads require a randomly generated access key.

## Implemented

- Upload mono/stereo WAV, AIFF, FLAC or MP3 supported by the installed libsndfile runtime, up to 256 MB and 10 minutes.
- Run the existing SPECTRA Demucs/AudioSep separation script on the Mac without modifying the plugin.
- Seven aligned song stems, gain/mute/solo with 5 ms gain ramps, waveform seeking, 24-bit WAV downloads.
- Six-second FLAC packets decoded and scheduled on the phone with bounded buffering. Playback is lossless relative to the prepared 24-bit exports; original floating-point model outputs are quantized to 24-bit.
- Source/model-script hash caching, serial model execution, upload progress, analysis progress, persistent library, removal, eight-song and 12 GB admission limits. Storage can grow beyond 12 GB by the size of the last accepted job. Incomplete uploads expire after one hour on the next upload.
- Authentication on every Mac endpoint, constant-time key comparison, failed-auth throttling, loopback binding, explicit CORS origins, bounded upload requests and generated internal paths.

## Deliberate proof-of-concept limits

Drum sub-stems, MIDI extraction, host automation, project-format compatibility, offline playback and guaranteed background/screen-locked playback are not implemented. Keep the page open for playback. Saved gain/mute/solo edits currently last only while this page is open. On-device sample-rate conversion uses the browser; server source-rate conversion uses SciPy, so this is not a bit-identical JUCE resampler port.

The Mac connection currently uses a Cloudflare Quick Tunnel, which is temporary and has no uptime guarantee. If that tunnel process restarts, update `SPECTRA_BRIDGE_URL` in Vercel and redeploy. A named tunnel or private VPN is the next step for a durable service. The tunnel terminates HTTPS at Cloudflare; it is not an end-to-end private VPN. Access keys are never committed or embedded in public JavaScript. The browser remembers the key in local storage; Lock clears it.

## Run the Mac bridge

Use the existing SPECTRA Python environment containing NumPy, SoundFile, SciPy, PyTorch, Demucs and AudioSep dependencies. No new model or replacement algorithm is installed by this bridge.

```sh
SPECTRA_WEB_DATA="/path/to/private/data" \
SPECTRA_SEPARATOR="/path/to/spectra/scripts/demucs_separator.py" \
/path/to/spectra/runtime/bin/python bridge/server.py
```

The bridge binds only to `127.0.0.1:8768`. The generated `access-key` file has mode 0600. The parent data directory should have mode 0700. Runtime files for launchd should live in Application Support, not Documents, because of macOS background file-access permissions.

Expose only this port through an HTTPS tunnel. Set `SPECTRA_BRIDGE_URL` to its HTTPS origin for the web deployment. Large uploads and audio bypass Vercel functions. The user accesses the stable `/spectra` page, enters the private key once, then uses Load audio. A `#key=...` fragment can prefill pairing and is removed from browser history immediately; never publish such links.

Current launchd labels are `dev.gusvega.spectra-bridge` and `dev.gusvega.spectra-tunnel`. They are loaded for the current login session, with process restart enabled. The bridge uses `caffeinate -s` to keep the Mac from system sleeping on AC power while it runs. Automatic startup after logout/reboot is not installed.

## Verification

```sh
npm test
SPECTRA_KEY_FILE="/path/to/access-key" node bridge/browser-check.mjs
SPECTRA_KEY_FILE="/path/to/access-key" SPECTRA_BROWSER=webkit node bridge/browser-check.mjs
```

The browser check expects an existing prepared test song. Set `SPECTRA_TEST_URL` to verify production. A generated 18-second musical test fixture exercised the real separation pipeline, lossless packet decoding, playback, solo, seeking and WAV download in Chromium and WebKit at 390 px. This is browser-engine verification, not a physical iPhone/Android or cellular-network test.

## Migration

The private workspace now lives at https://gusvega.dev/Spectra in gusvega/personal-website. The original route permanently redirects there. The Mac key and prepared songs remain unchanged; enter the same key once on the new origin. The bridge allows gusvega.dev through its explicit CORS allowlist.
