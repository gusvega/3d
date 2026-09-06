# Gus 3D

Two interactive studies in sound, light, and form.

**Live:** https://3d.gusvega.dev · **Vercel project:** `3d`

## Explore

- `/` — static gallery with previews captured from the actual scenes. No WebGL is loaded on the index.
- `/gus` — glossy letterforms with drag, keyboard rotation, reset, and motion pause.
- `/ferrofluid` — a reflective surface driven by a built-in sound demo, local audio file, or microphone. Includes transport, volume, sensitivity, decay, response modes, and an optional focus view.

YouTube videos can be embedded as a secondary source. The microphone hears speaker playback; the site does not access the iframe's audio stream. Local files feed the analyser directly. Files and microphone audio are processed in-browser and never uploaded. Files are limited to 64 MB and 20 minutes; decoding requires additional memory.

## Develop and verify

Use Node.js 24 (matching Vercel and CI).

```sh
npm ci
npm run dev
npm test
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start a production server on port 3103. Microphone tests use Chromium's synthetic device, not a physical microphone. They cover source switching, navigation cleanup, decoded file analysis, keyboard controls, reduced motion, WebGL recovery, mobile layout, and YouTube injection rejection. Unit tests cover late permission/decode results and frame-rate-independent timing.

To refresh the gallery's real scene previews, start the built site on port 3104, then run `node scripts/capture-previews.mjs`. Commit the two resulting images in `public/`.

## Architecture

- `lib/audio-session.mjs` owns the audio graph, playback state, and async request cancellation. The microphone never connects to the speaker output.
- `lib/fluid-scene.js` and `lib/gus-scene.js` own GPU resources and input listeners. Both run a bounded 60 Hz simulation, stop rendering while hidden, and avoid repeated GPU draws while paused.
- `components/SceneCanvas.jsx` lazily loads the renderers and provides WebGL failure/recovery UI.
- `components/FerrofluidScene.jsx` owns the accessible audio and scene interface.
- `lib/youtube.mjs` validates supported URLs and IDs. React renders the iframe; user input never enters an HTML string.
- `src/vendor/` retains the existing Three.js r164 source and its license header. It is not covered by npm dependency auditing.

The system reduced-motion preference starts scenes paused. Users may explicitly resume. Canvas arrow keys rotate; Home resets. Focus mode keeps a visible Show controls button and exits with Escape. The mobile control panel follows the canvas instead of covering it.

## Deployment

GitHub `main` is the production branch for Vercel project `3d` in `gusvegas-projects`. `vercel.json` selects Next.js. The committed lockfile makes dependency resolution reproducible. No environment variables are required.

CI runs formatting, unit tests, production build, and browser tests. Production headers restrict embedded frames to YouTube's privacy-enhanced domain and disable camera/geolocation access.
