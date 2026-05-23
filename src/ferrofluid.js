import * as THREE from "./vendor/build/three.module.js";

/* ---------- scene ---------- */
// Phones get a lighter mesh, lower pixel ratio and no shadow maps so the
// per-frame geometry update stays smooth.
const isMobile =
  window.matchMedia("(pointer: coarse)").matches ||
  Math.min(window.innerWidth, window.innerHeight) < 740;

const canvas = document.querySelector(".fluid-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, canvas, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 12);

/* Studio-style reflection environment: a bright overhead softbox over a dark
   room with warm amber bounce — what a glossy black liquid mirrors back. */
function makeEnvironment() {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  // bright ceiling over a mid-grey room, so every face catches enough reflected
  // light to read its shape (a near-black surface is defined by reflections)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, "#ffffff");
  grad.addColorStop(0.18, "#f2f4f8");
  grad.addColorStop(0.34, "#878d99");
  grad.addColorStop(0.58, "#5c616c");
  grad.addColorStop(1.0, "#474c57");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // overhead softboxes -> the big white glints on top of each spike
  const softbox = (x, y, rx, ry, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  softbox(w * 0.30, h * 0.16, 240, 110, 1.0);
  softbox(w * 0.74, h * 0.12, 200, 90, 0.95);

  // subtle warm bounce -> faint amber secondary reflections (kept gentle)
  const warm = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.64);
  warm.addColorStop(0, "rgba(214,120,40,0)");
  warm.addColorStop(0.5, "rgba(220,130,50,0.22)");
  warm.addColorStop(1, "rgba(180,90,30,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(w * 0.1, h * 0.44, w * 0.42, h * 0.2);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
const envTex = makeEnvironment();
scene.environment = envTex;

const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(-4, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.0006;
keyLight.shadow.radius = 4;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
rimLight.position.set(5, -2, -5);
scene.add(rimLight);
// fills from the front and both sides so no face of the ball stays black
const fillFront = new THREE.DirectionalLight(0xffffff, 1.7);
fillFront.position.set(0, 1.5, 9);
scene.add(fillFront);
const fillLeft = new THREE.DirectionalLight(0xeef2ff, 1.2);
fillLeft.position.set(-8, 1, 2);
scene.add(fillLeft);
const fillRight = new THREE.DirectionalLight(0xeef2ff, 1.2);
fillRight.position.set(8, 1, 2);
scene.add(fillRight);
// small hot key for a sharp specular glint on the spike tips
const glintLight = new THREE.PointLight(0xffffff, 16, 50, 2);
glintLight.position.set(-2, 5, 5);
scene.add(glintLight);
scene.add(new THREE.HemisphereLight(0xffffff, 0x80858f, 0.8));

/* ---------- ferrofluid blob ---------- */
const RADIUS = 1.35;
// IcosahedronGeometry is non-indexed (faceted, vertex count explodes). Weld it
// into an indexed sphere so normals stay smooth. Detail 6 (~40k verts) keeps the
// surface smooth on desktop; detail 5 (~10k) keeps phones fast.
const raw = new THREE.IcosahedronGeometry(RADIUS, isMobile ? 5 : 6);
const rawPos = raw.attributes.position.array;
const keyToIndex = new Map();
const uniques = [];
const indices = [];
for (let i = 0; i < rawPos.length; i += 3) {
  const x = rawPos[i], y = rawPos[i + 1], z = rawPos[i + 2];
  const key = `${Math.round(x * 1e4)}_${Math.round(y * 1e4)}_${Math.round(z * 1e4)}`;
  let idx = keyToIndex.get(key);
  if (idx === undefined) {
    idx = uniques.length / 3;
    uniques.push(x, y, z);
    keyToIndex.set(key, idx);
  }
  indices.push(idx);
}
raw.dispose();

const vertexCount = uniques.length / 3;
const base = new Float32Array(vertexCount * 3); // unit directions
for (let i = 0; i < vertexCount; i++) {
  const x = uniques[i * 3], y = uniques[i * 3 + 1], z = uniques[i * 3 + 2];
  const inv = 1 / Math.hypot(x, y, z);
  base[i * 3] = x * inv;
  base[i * 3 + 1] = y * inv;
  base[i * 3 + 2] = z * inv;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
geometry.setIndex(indices);
const posAttr = geometry.attributes.position;

/* ---------- spike field (metaball blend) ----------
   Spike centers are spread evenly over the sphere (Fibonacci lattice). Rather than
   isolated cones, every vertex blends the smooth Gaussian influence of its few
   nearest spikes. Summed Gaussians make one continuous, flowing membrane: rounded
   peaks, smooth valleys, no sharp tips and no creases. We precompute each vertex's
   M nearest spikes and their static Gaussian weights, so per-frame work is tiny. */
const SPIKE_COUNT = 64;
const SPIKE_MAX = 0.5;       // peak spike height (world units) — low, gentle bumps
const SPIKE_NEAR = 5;        // spikes blended per vertex
const SPIKE_SPACING = Math.sqrt((8 * Math.PI) / (SPIKE_COUNT * Math.sqrt(3)));
const SPIKE_SIGMA = SPIKE_SPACING * 0.31; // width: smoother peaks vs. anchored valleys
const INV_2S2 = 1 / (2 * SPIKE_SIGMA * SPIKE_SIGMA);
const spikeDirs = new Float32Array(SPIKE_COUNT * 3);
{
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < SPIKE_COUNT; k++) {
    const y = 1 - (k / (SPIKE_COUNT - 1)) * 2; // 1 -> -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * k;
    spikeDirs[k * 3] = Math.cos(theta) * r;
    spikeDirs[k * 3 + 1] = y;
    spikeDirs[k * 3 + 2] = Math.sin(theta) * r;
  }
}

// per vertex: its SPIKE_NEAR nearest spikes + their Gaussian weights (static).
const vIdx = new Uint16Array(vertexCount * SPIKE_NEAR);
const vWt = new Float32Array(vertexCount * SPIKE_NEAR);
{
  const bestDot = new Float32Array(SPIKE_NEAR);
  const bestK = new Int32Array(SPIKE_NEAR);
  for (let i = 0; i < vertexCount; i++) {
    const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
    bestDot.fill(-2);
    bestK.fill(0);
    for (let k = 0; k < SPIKE_COUNT; k++) {
      const dot = bx * spikeDirs[k * 3] + by * spikeDirs[k * 3 + 1] + bz * spikeDirs[k * 3 + 2];
      if (dot > bestDot[SPIKE_NEAR - 1]) {
        let p = SPIKE_NEAR - 1;
        while (p > 0 && dot > bestDot[p - 1]) {
          bestDot[p] = bestDot[p - 1]; bestK[p] = bestK[p - 1]; p--;
        }
        bestDot[p] = dot; bestK[p] = k;
      }
    }
    for (let j = 0; j < SPIKE_NEAR; j++) {
      const ang = Math.acos(Math.min(1, Math.max(-1, bestDot[j])));
      vIdx[i * SPIKE_NEAR + j] = bestK[j];
      vWt[i * SPIKE_NEAR + j] = Math.exp(-ang * ang * INV_2S2); // smooth Gaussian
    }
  }
}

// Each spike samples its own slice of the spectrum so lows/mids/highs each drive
// different spikes. Bass spikes hit hard with a heavy thump; treble spikes are
// snappy and shimmery (claps, hats, voices). Per-spike gain/attack/release encode
// that character. Frequencies are spread around the ball so the whole thing moves.
const spikeHeight = new Float32Array(SPIKE_COUNT);
const spikeF0 = new Float32Array(SPIKE_COUNT);
const spikeF1 = new Float32Array(SPIKE_COUNT);
const spikeGain = new Float32Array(SPIKE_COUNT);
const spikeAttack = new Float32Array(SPIKE_COUNT);
const spikeRelease = new Float32Array(SPIKE_COUNT);
const spikeLowWeight = new Float32Array(SPIKE_COUNT);
for (let k = 0; k < SPIKE_COUNT; k++) {
  const fr = (k * 0.61803398875) % 1;        // spread frequencies around the ball
  const fn = Math.pow(fr, 1.7);              // 0..1, weighted toward the low end
  const center = fn * 0.55;                  // use lower ~55% of the spectrum
  spikeF0[k] = Math.max(0, center - 0.012);
  spikeF1[k] = center + 0.012;
  spikeGain[k] = 1.0 + fn * 2.2;             // boost the quiet high bands
  spikeAttack[k] = 0.45 + fn * 0.4;          // highs snap up faster
  spikeRelease[k] = 0.06 + fn * 0.22;        // highs fall faster (shimmer)
  spikeLowWeight[k] = 1 - fn;                // how much the kick pump lifts this spike
}

// Ferrofluid is a dark oil, not metal: a near-black dielectric with a wet,
// mirror-like clearcoat. Fresnel gives bright rim glints; the clearcoat layer
// supplies the sharp white softbox reflections from the environment.
const material = new THREE.MeshPhysicalMaterial({
  color: 0x121317,
  metalness: 0.0,
  roughness: 0.18,
  clearcoat: 1.0,
  clearcoatRoughness: 0.07,
  reflectivity: 0.7,
  ior: 1.5,
  envMapIntensity: 2.3,
  sheen: 0.0,
});
const blob = new THREE.Mesh(geometry, material);
blob.frustumCulled = false;
blob.castShadow = true;
blob.receiveShadow = true;
scene.add(blob);

/* ---------- audio analysis ---------- */
let audioCtx = null;
let analyser = null;
let freqData = null;
let audioActive = false;
let fileSource = null; // AudioBufferSourceNode for an uploaded file
const bands = { bass: 0, mid: 0, treble: 0, level: 0 };
let bassSlow = 0; // slow baseline of bass energy, for kick detection
let pump = 0;     // decaying impulse triggered by a kick/transient

function ensureAnalyser() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioCtx();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6; // snappier so kicks/claps punch through
    freqData = new Uint8Array(analyser.frequencyBinCount);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return analyser;
}

async function startMic() {
  ensureAnalyser();
  await audioCtx.resume();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  // mic -> analyser only (never to the speakers, to avoid feedback)
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  audioActive = true;
}

// Browsers start the AudioContext suspended and only let it resume from a real
// user gesture. A file-dialog "change" event isn't always treated as one, so we
// unlock the context on the first pointerdown anywhere (dragging, clicking a
// button, etc.). By the time a file is picked the context is already running.
function unlockAudio() {
  ensureAnalyser();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
}
window.addEventListener("pointerdown", unlockAudio);

async function startFile(file) {
  ensureAnalyser();
  await audioCtx.resume().catch(() => {});
  // Decode the file into an AudioBuffer and play it via a buffer source. Unlike
  // an <audio> element, AudioBufferSourceNode.start() isn't gated by the media
  // autoplay policy, so it won't throw NotAllowedError once the context is live.
  const arrayBuf = await file.arrayBuffer();
  const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
  if (fileSource) {
    try { fileSource.stop(); } catch (_) {}
  }
  fileSource = audioCtx.createBufferSource();
  fileSource.buffer = audioBuf;
  fileSource.connect(analyser);            // analyse the true audio (perfect sync)
  fileSource.connect(audioCtx.destination); // and play it through the speakers
  fileSource.start();
  audioActive = true;
}

function sampleAudio() {
  if (!audioActive) return;
  analyser.getByteFrequencyData(freqData);
  const n = freqData.length; // 1024 bins
  const avg = (a, b) => {
    let sum = 0;
    for (let i = a; i < b; i++) sum += freqData[i];
    return sum / (b - a) / 255;
  };
  // bins are ~ (sampleRate/2)/n Hz wide
  const bass = avg(1, Math.floor(n * 0.04));
  const mid = avg(Math.floor(n * 0.04), Math.floor(n * 0.18));
  const treble = avg(Math.floor(n * 0.18), Math.floor(n * 0.55));
  const lerp = (a, b, t) => a + (b - a) * t;
  bands.bass = lerp(bands.bass, bass, 0.4);
  bands.mid = lerp(bands.mid, mid, 0.45);
  bands.treble = lerp(bands.treble, treble, 0.5);
  bands.level = lerp(bands.level, (bass + mid + treble) / 3, 0.4);

  // kick / transient detection: bass jumping well above its slow baseline fires a
  // pump that decays — drives a satisfying whole-body thump on each beat.
  bassSlow = lerp(bassSlow, bass, 0.06);
  const kick = Math.max(0, bass - bassSlow * 1.5 - 0.02);
  pump = Math.max(pump * 0.85, Math.min(1, kick * 4.5));
}

/* ---------- rotation / drag ---------- */
let rotX = 0, rotY = 0, velX = 0, velY = 0;
let dragging = false, prevX = 0, prevY = 0;
canvas.addEventListener("pointerdown", (e) => {
  dragging = true; prevX = e.clientX; prevY = e.clientY; velX = velY = 0;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - prevX, dy = e.clientY - prevY;
  prevX = e.clientX; prevY = e.clientY;
  rotY += dx * 0.005; rotX += dy * 0.005;
  velX = dx * 0.0006; velY = dy * 0.0006;
});
const endDrag = (e) => {
  if (!dragging) return;
  dragging = false;
  if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
};
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

/* ---------- displacement loop ---------- */
let time = 0;
function updateGeometry() {
  // Drive each spike from its own frequency band, shaped by that band's
  // character: bass spikes get a heavy kick "pump"; treble spikes are snappy and
  // shimmery. Each spike has its own attack/release. No audio -> targets 0 -> the
  // whole thing eases back to a clean sphere.
  const n = freqData ? freqData.length : 0;
  for (let k = 0; k < SPIKE_COUNT; k++) {
    let tgt = 0;
    if (audioActive && n) {
      const lo = Math.floor(spikeF0[k] * n);
      const hi = Math.max(lo + 1, Math.floor(spikeF1[k] * n));
      let sum = 0;
      for (let b = lo; b < hi; b++) sum += freqData[b];
      let level = sum / (hi - lo) / 255;          // 0..1 for this band
      level = Math.max(0, level - 0.05);          // noise gate: ignore quiet hiss
      level = Math.pow(Math.min(1, level * spikeGain[k]), 0.85);
      // overall loudness lifts every spike (many bumps appear together), the
      // spike's own band adds variation, and the kick pumps the bass spikes.
      const react = bands.level * 0.55 + level * 1.1 + pump * spikeLowWeight[k] * 0.7;
      tgt = Math.min(1.3, react) * SPIKE_MAX; // no floor: spike fully melts when quiet
    }
    const rate = tgt > spikeHeight[k] ? spikeAttack[k] : spikeRelease[k];
    spikeHeight[k] += (tgt - spikeHeight[k]) * rate;
  }

  // very subtle whole-body thump on the kick, plus a faint idle breath
  const pulse = 1 + 0.006 * Math.sin(time * 0.8) + pump * 0.05;
  const arr = posAttr.array;
  for (let i = 0; i < vertexCount; i++) {
    const o = i * 3;
    const m = i * SPIKE_NEAR;
    // blend the nearest spikes' heights by their smooth Gaussian weights
    let h = 0;
    for (let j = 0; j < SPIKE_NEAR; j++) h += vWt[m + j] * spikeHeight[vIdx[m + j]];
    const r = RADIUS * pulse + h;
    arr[o] = base[o] * r;
    arr[o + 1] = base[o + 1] * r;
    arr[o + 2] = base[o + 2] * r;
  }
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = w / h < 0.9 ? 15 : 12;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;
  sampleAudio();
  if (!dragging) {
    // very slow constant tumble on two axes for ambient movement
    rotY += velX + 0.0011 + bands.level * 0.004;
    rotX += velY + 0.00045;
    velX *= 0.94; velY *= 0.94;
  }
  blob.rotation.y = rotY;
  blob.rotation.x = rotX;
  blob.rotation.z = Math.sin(time * 0.08) * 0.06;
  updateGeometry();
  renderer.render(scene, camera);
}

/* ---------- UI: YouTube embed + mic ---------- */
const ytForm = document.getElementById("yt-form");
const ytInput = document.getElementById("yt-input");
const ytEmbed = document.getElementById("yt-embed");
const micBtn = document.getElementById("mic-btn");
const fileInput = document.getElementById("file-input");
const status = document.getElementById("status");

function parseYouTubeId(raw) {
  const value = raw.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1, 12);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const m = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
    if (m) return m[2];
  } catch (_) {
    const m = value.match(/[\w-]{11}/);
    if (m) return m[0];
  }
  return null;
}

ytForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = parseYouTubeId(ytInput.value);
  if (!id) {
    status.textContent = "Couldn't read that link — paste a full YouTube URL or an 11-character video ID.";
    return;
  }
  ytEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="YouTube player" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  ytEmbed.classList.add("loaded");
  status.textContent = audioActive
    ? "Playing. The fluid is reacting to your audio."
    : "Playing. Now press “Listen via mic” and allow access so the fluid reacts to the sound.";
});

micBtn.addEventListener("click", async () => {
  if (audioActive) return;
  micBtn.disabled = true;
  status.textContent = "Requesting microphone…";
  try {
    await startMic();
    micBtn.textContent = "Listening";
    micBtn.classList.add("active");
    status.textContent = "Listening. Move the mouse to bring the controls back.";
    enterImmersive();
  } catch (err) {
    micBtn.disabled = false;
    console.error("mic error", err);
    status.textContent = "Mic error: " + (err ? err.name + " — " + err.message : err);
  }
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  status.textContent = `Playing ${file.name}…`;
  try {
    await startFile(file);
    status.textContent = "Playing your file. Move the mouse to bring the controls back.";
    enterImmersive();
  } catch (err) {
    console.error("file error", err);
    status.textContent = "File error: " + (err ? err.name + " — " + err.message : err);
  }
});

/* Immersive mode: once we're listening, fade the panel away so the ferrofluid
   is the focus. The iframe is only faded (never display:none / removed) so its
   audio keeps playing for the mic. Moving the pointer brings the panel back. */
let revealTimer = 0;
function enterImmersive() {
  document.body.classList.add("immersive");
  revealControls();
}
function revealControls() {
  if (!document.body.classList.contains("immersive")) return;
  document.body.classList.add("reveal");
  clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => document.body.classList.remove("reveal"), 2600);
}
window.addEventListener("pointermove", revealControls);
window.addEventListener("pointerdown", revealControls);

resize();
animate();
