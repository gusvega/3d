import * as THREE from "@/src/vendor/build/three.module.js";
import { createFrameClock } from "./frame-clock.mjs";

export function createFluidScene(canvas, getAudio, getSettings) {
  const isMobile =
    window.matchMedia("(pointer: coarse)").matches ||
    Math.min(canvas.clientWidth, canvas.clientHeight) < 740;

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    canvas,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.45;
  renderer.setClearColor(0xffffff, 1);
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.1, 12.8);

  function makeEnvironment() {
    const w = 1024;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#ffffff");
    grad.addColorStop(0.1, "#f7f9ff");
    grad.addColorStop(0.22, "#c8ceda");
    grad.addColorStop(0.46, "#20242c");
    grad.addColorStop(0.78, "#030304");
    grad.addColorStop(1.0, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const softbox = (x, y, rx, ry, a, angle = 0) => {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.28, `rgba(255,255,255,${a * 0.8})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    softbox(w * 0.28, h * 0.13, 260, 36, 1, -0.15);
    softbox(w * 0.58, h * 0.1, 360, 42, 1, 0.08);
    softbox(w * 0.86, h * 0.18, 220, 30, 0.92, 0.2);
    softbox(w * 0.52, h * 0.32, 560, 28, 0.72, -0.04);
    softbox(w * 0.5, h * 0.72, 620, 44, 0.5, 0.03);
    softbox(w * 0.28, h * 0.72, 260, 34, 0.48, -0.2);
    softbox(w * 0.74, h * 0.7, 260, 34, 0.48, 0.2);
    softbox(w * 0.08, h * 0.28, 170, 24, 0.62, -0.5);
    softbox(w * 0.95, h * 0.34, 170, 24, 0.62, 0.5);
    softbox(w * 0.18, h * 0.54, 130, 22, 0.55, -0.8);
    softbox(w * 0.8, h * 0.46, 140, 24, 0.5, 0.75);

    const warm = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.7);
    warm.addColorStop(0, "rgba(255,255,255,0)");
    warm.addColorStop(0.46, "rgba(105,115,135,0.28)");
    warm.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, h * 0.38, w, h * 0.32);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  const envTex = makeEnvironment();
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xffffff, 8.4);
  keyLight.position.set(-3.6, 8.5, 4.5);
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

  const rimLight = new THREE.DirectionalLight(0xffffff, 7.2);
  rimLight.position.set(5.5, 2, -5);
  scene.add(rimLight);
  const fillFront = new THREE.DirectionalLight(0xffffff, 3.2);
  fillFront.position.set(0, 1.5, 9);
  scene.add(fillFront);
  const fillLeft = new THREE.DirectionalLight(0xffffff, 3.1);
  fillLeft.position.set(-8, 1, 2);
  scene.add(fillLeft);
  const fillRight = new THREE.DirectionalLight(0xffffff, 3.1);
  fillRight.position.set(8, 1, 2);
  scene.add(fillRight);
  const glintLight = new THREE.PointLight(0xffffff, 62, 50, 2);
  glintLight.position.set(-1.8, 5.2, 4.2);
  scene.add(glintLight);
  const topLight = new THREE.PointLight(0xffffff, 34, 30, 2);
  topLight.position.set(0, 5.6, 2.7);
  scene.add(topLight);
  const lowerFill = new THREE.PointLight(0xffffff, 42, 34, 2);
  lowerFill.position.set(0, -4.8, 4.8);
  scene.add(lowerFill);
  const lowerLeftFill = new THREE.PointLight(0xffffff, 18, 28, 2);
  lowerLeftFill.position.set(-4.6, -3.4, 2.8);
  scene.add(lowerLeftFill);
  const lowerRightFill = new THREE.PointLight(0xffffff, 18, 28, 2);
  lowerRightFill.position.set(4.6, -3.4, 2.8);
  scene.add(lowerRightFill);
  const underRimLight = new THREE.DirectionalLight(0xffffff, 3.4);
  underRimLight.position.set(0, -5.8, 2.6);
  scene.add(underRimLight);
  const rearFill = new THREE.DirectionalLight(0xffffff, 2.8);
  rearFill.position.set(0, 2.6, -8);
  scene.add(rearFill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5f636b, 1.18));

  const RADIUS = 1.42;
  const raw = new THREE.IcosahedronGeometry(RADIUS, isMobile ? 5 : 6);
  const rawPos = raw.attributes.position.array;
  const keyToIndex = new Map();
  const uniques = [];
  const indices = [];
  for (let i = 0; i < rawPos.length; i += 3) {
    const x = rawPos[i];
    const y = rawPos[i + 1];
    const z = rawPos[i + 2];
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
  const base = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    const x = uniques[i * 3];
    const y = uniques[i * 3 + 1];
    const z = uniques[i * 3 + 2];
    const inv = 1 / Math.hypot(x, y, z);
    base[i * 3] = x * inv;
    base[i * 3 + 1] = y * inv;
    base[i * 3 + 2] = z * inv;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3),
  );
  geometry.setIndex(indices);
  const posAttr = geometry.attributes.position;

  const SPIKE_COUNT = isMobile ? 52 : 70;
  const SPIKE_MAX = isMobile ? 0.4 : 0.5;
  const SPIKE_NEAR = 1;
  const SPIKE_SPACING = Math.sqrt((8 * Math.PI) / (SPIKE_COUNT * Math.sqrt(3)));
  const CELL_RADIUS = SPIKE_SPACING * 0.9;
  // Fraction of the cell that actually lifts. The lifted radius is kept below
  // the cell's inradius (~half the spacing) so every bump rises from a fixed
  // ring of original sphere — bases stay anchored and neighbours never merge.
  const CELL_FILL = 0.52;
  const spikeDirs = new Float32Array(SPIKE_COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < SPIKE_COUNT; k++) {
    const y = 1 - (k / (SPIKE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * k;
    spikeDirs[k * 3] = Math.cos(theta) * r;
    spikeDirs[k * 3 + 1] = y;
    spikeDirs[k * 3 + 2] = Math.sin(theta) * r;
  }

  const vOwner = new Uint16Array(vertexCount);
  const vCellWeight = new Float32Array(vertexCount);
  // Per-vertex push direction: a blend of the cell axis and the vertex's own
  // radial. Pure cell-axis converges every vertex to one point (sharp tip);
  // mixing in the radial lets off-centre vertices bulge outward -> rounded tips.
  const vPushX = new Float32Array(vertexCount);
  const vPushY = new Float32Array(vertexCount);
  const vPushZ = new Float32Array(vertexCount);
  const TIP_BLEND = 0.5; // 1 = pointy (cell axis), 0 = round dome (radial)
  for (let i = 0; i < vertexCount; i++) {
    const bx = base[i * 3];
    const by = base[i * 3 + 1];
    const bz = base[i * 3 + 2];
    let bestDot = -2;
    let bestK = 0;
    for (let k = 0; k < SPIKE_COUNT; k++) {
      const dot =
        bx * spikeDirs[k * 3] +
        by * spikeDirs[k * 3 + 1] +
        bz * spikeDirs[k * 3 + 2];
      if (dot > bestDot) {
        bestDot = dot;
        bestK = k;
      }
    }
    const ang = Math.acos(Math.min(1, Math.max(-1, bestDot)));
    // Normalised distance from the cell centre. Only the inner CELL_FILL of the
    // cell lifts; outside it the weight is exactly 0, so those vertices stay on
    // the original sphere (anchored base). The exponent shapes the dome: a fuller
    // (lower) exponent bulges convex near the apex -> rounder tips, while still
    // joining the base smoothly (zero slope) at u = 1 so the rim never moves.
    const u = ang / (CELL_RADIUS * CELL_FILL);
    const falloff = u >= 1 ? 0 : 1 - u * u;
    vOwner[i] = bestK;
    vCellWeight[i] = Math.pow(falloff, 1.35);

    const ox = spikeDirs[bestK * 3];
    const oy = spikeDirs[bestK * 3 + 1];
    const oz = spikeDirs[bestK * 3 + 2];
    let px = ox * TIP_BLEND + bx * (1 - TIP_BLEND);
    let py = oy * TIP_BLEND + by * (1 - TIP_BLEND);
    let pz = oz * TIP_BLEND + bz * (1 - TIP_BLEND);
    const pInv = 1 / (Math.hypot(px, py, pz) || 1);
    vPushX[i] = px * pInv;
    vPushY[i] = py * pInv;
    vPushZ[i] = pz * pInv;
  }

  const spikeHeight = new Float32Array(SPIKE_COUNT);
  const spikeVelocity = new Float32Array(SPIKE_COUNT);
  const spikeTarget = new Float32Array(SPIKE_COUNT);
  const spikeF0 = new Float32Array(SPIKE_COUNT);
  const spikeF1 = new Float32Array(SPIKE_COUNT);
  const spikeGain = new Float32Array(SPIKE_COUNT);
  const spikeSpring = new Float32Array(SPIKE_COUNT);
  const spikeDamping = new Float32Array(SPIKE_COUNT);
  const spikeLastLevel = new Float32Array(SPIKE_COUNT);
  const spikeMotion = new Float32Array(SPIKE_COUNT);
  const spikeLowWeight = new Float32Array(SPIKE_COUNT);
  const spikeMidWeight = new Float32Array(SPIKE_COUNT);
  const spikeHighWeight = new Float32Array(SPIKE_COUNT);
  const spikeSeed = new Float32Array(SPIKE_COUNT);
  const spikeIdleAmp = new Float32Array(SPIKE_COUNT);
  const spikeIdleRate = new Float32Array(SPIKE_COUNT);
  for (let k = 0; k < SPIKE_COUNT; k++) {
    const fr = (k * 0.61803398875) % 1;
    const fn = Math.pow(fr, 1.45);
    const y = spikeDirs[k * 3 + 1] * 0.5 + 0.5;
    const side = Math.abs(spikeDirs[k * 3]);
    const center = 42 + Math.pow(fn, 1.18) * 7200;
    const bandwidth = 18 + center * 0.13;
    spikeF0[k] = Math.max(20, center - bandwidth);
    spikeF1[k] = center + bandwidth;
    spikeGain[k] = 0.82 + fn * 2.5 + y * 0.35;
    spikeSpring[k] = 0.04 + fn * 0.04;
    spikeDamping[k] = 0.78 - fn * 0.08;
    spikeLowWeight[k] = Math.max(0, 1 - fn * 1.22) * (0.95 + y * 0.16);
    spikeMidWeight[k] =
      Math.max(0, 1 - Math.abs(fn - 0.42) * 2.05) * (0.96 + side * 0.12);
    spikeHighWeight[k] = Math.pow(fn, 1.18) * (0.94 + (1 - y) * 0.12);
    spikeSeed[k] = (((Math.sin(k * 127.1) * 43758.5453) % 1) + 1) % 1;
    spikeIdleAmp[k] = 0.012 + spikeSeed[k] * 0.026;
    spikeIdleRate[k] = 0.18 + spikeSeed[k] * 0.24;
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x050507,
    metalness: 0,
    roughness: 0.085,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    reflectivity: 1,
    ior: 1.62,
    envMapIntensity: 5.2,
    sheen: 0,
  });
  const blob = new THREE.Mesh(geometry, material);
  blob.frustumCulled = false;
  blob.castShadow = true;
  blob.receiveShadow = true;
  blob.position.set(0, 0.05, 0);
  blob.scale.set(1, 1, 1);
  blob.rotation.x = -0.08;
  scene.add(blob);

  const modeProfiles = {
    balanced: {
      motion: 1,
      pump: 1,
      transient: 1,
      shimmer: 1,
      hold: 0.74,
      base: 1,
    },
    bass: {
      motion: 0.82,
      pump: 1.42,
      transient: 0.82,
      shimmer: 0.72,
      hold: 0.78,
      base: 1.25,
    },
    detail: {
      motion: 1.18,
      pump: 0.78,
      transient: 1.42,
      shimmer: 1.45,
      hold: 0.68,
      base: 0.82,
    },
  };
  const controls = {
    sensitivity: 1,
    decay: 0.45,
    mode: "balanced",
  };
  const magneticField = new THREE.Vector3(-0.32, 0.72, 0.22).normalize();
  let adaptivePixelRatio = Math.min(
    window.devicePixelRatio,
    isMobile ? 1.5 : 2,
  );
  let frameWindowStarted = performance.now();
  let frameCount = 0;

  const bands = {
    sub: 0,
    bass: 0,
    lowMid: 0,
    mid: 0,
    high: 0,
    presence: 0,
    level: 0,
    transient: 0,
  };
  let bassSlow = 0;
  let levelSlow = 0;
  let pump = 0;

  function sampleAudio() {
    if (!audioActive) {
      bands.sub *= 0.94;
      bands.bass *= 0.94;
      bands.lowMid *= 0.94;
      bands.mid *= 0.94;
      bands.high *= 0.94;
      bands.presence *= 0.94;
      bands.level *= 0.94;
      bands.transient *= 0.88;
      pump *= 0.88;
      return;
    }
    analyser.getByteFrequencyData(freqData);
    const n = freqData.length;
    const hzToBin = (hz) =>
      Math.max(
        1,
        Math.min(n - 1, Math.round((hz / (audioCtx.sampleRate / 2)) * n)),
      );
    const avgBins = (a, b) => {
      let sum = 0;
      for (let i = a; i < b; i++) {
        sum += freqData[i];
      }
      return sum / (b - a) / 255;
    };
    const avgHz = (lo, hi) =>
      avgBins(hzToBin(lo), Math.max(hzToBin(lo) + 1, hzToBin(hi)));
    const lerp = (a, b, t) => a + (b - a) * t;
    const shape = (value, gain = 1, power = 0.82) =>
      Math.pow(Math.min(1, Math.max(0, value) * gain), power);

    const sub = shape(avgHz(24, 68), 1.35, 0.78);
    const bass = shape(avgHz(55, 150), 1.25, 0.76);
    const lowMid = shape(avgHz(140, 420), 1.12, 0.82);
    const mid = shape(avgHz(380, 1450), 1.18, 0.86);
    const high = shape(avgHz(1400, 5200), 1.55, 0.74);
    const presence = shape(avgHz(4800, 12000), 2.25, 0.64);
    const instantLevel =
      sub * 0.22 +
      bass * 0.24 +
      lowMid * 0.15 +
      mid * 0.16 +
      high * 0.15 +
      presence * 0.08;

    bands.sub = lerp(bands.sub, sub, 0.34);
    bands.bass = lerp(bands.bass, bass, 0.38);
    bands.lowMid = lerp(bands.lowMid, lowMid, 0.32);
    bands.mid = lerp(bands.mid, mid, 0.36);
    bands.high = lerp(bands.high, high, 0.54);
    bands.presence = lerp(bands.presence, presence, 0.62);
    bands.level = lerp(bands.level, instantLevel, 0.36);

    bassSlow = lerp(bassSlow, bass + sub * 0.55, 0.045);
    levelSlow = lerp(levelSlow, instantLevel, 0.055);
    const kick = Math.max(0, bass + sub * 0.65 - bassSlow * 1.38 - 0.015);
    const transient = Math.max(0, instantLevel - levelSlow * 1.26 - 0.012);
    pump = Math.max(pump * 0.84, Math.min(1, kick * 4.8 + transient * 1.9));
    bands.transient = Math.max(
      bands.transient * 0.72,
      Math.min(1, transient * 5.2 + presence * 0.25),
    );
  }

  let rotX = 0;
  let rotY = 0;
  let velX = 0;
  let velY = 0;
  let dragging = false;
  let prevX = 0;
  let prevY = 0;
  let time = 0;
  let frame = 0;

  function onPointerDown(e) {
    dragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    velX = 0;
    velY = 0;
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    dirty = true;
    if (!dragging) {
      return;
    }
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    velX = dx * 0.0006;
    velY = dy * 0.0006;
  }

  function endDrag(e) {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }

  function updateGeometry() {
    const n = freqData ? freqData.length : 0;
    const profile = modeProfiles[controls.mode] || modeProfiles.balanced;
    const sensitivity = controls.sensitivity;
    const release = 0.62 + controls.decay * 0.26;
    for (let k = 0; k < SPIKE_COUNT; k++) {
      let spectralMotion = 0;
      if (audioActive && n) {
        const lo = Math.max(
          1,
          Math.min(
            n - 1,
            Math.round((spikeF0[k] / (audioCtx.sampleRate / 2)) * n),
          ),
        );
        const hi = Math.max(
          lo + 1,
          Math.min(n, Math.round((spikeF1[k] / (audioCtx.sampleRate / 2)) * n)),
        );
        let sum = 0;
        for (let b = lo; b < hi; b++) {
          sum += freqData[b];
        }
        const spectralLevel = Math.pow(
          Math.min(
            1,
            Math.max(0, sum / (hi - lo) / 255 - 0.025) * spikeGain[k],
          ),
          0.72,
        );
        const rising = Math.max(0, spectralLevel - spikeLastLevel[k] * 0.92);
        spikeMotion[k] = Math.max(
          spikeMotion[k] * profile.hold,
          rising * 5.25 * sensitivity,
        );
        spikeLastLevel[k] += (spectralLevel - spikeLastLevel[k]) * 0.18;
        spectralMotion = Math.min(1, spikeMotion[k]);
      } else {
        spikeMotion[k] *= release;
        spikeLastLevel[k] *= 0.92;
      }

      const wobble =
        Math.sin(time * (1.2 + spikeSeed[k] * 1.8) + spikeSeed[k] * 12.4) *
        (0.008 + bands.high * 0.018);
      const keyHit = Math.max(
        pump * profile.pump,
        bands.transient * profile.transient,
      );
      const motionLift =
        pump * 0.16 * profile.pump + bands.transient * 0.22 * profile.transient;
      const magnetic =
        motionLift +
        pump * spikeLowWeight[k] * 1.08 * profile.pump +
        bands.transient * spikeHighWeight[k] * 0.92 * profile.transient +
        keyHit * (0.28 + spikeSeed[k] * 0.18) +
        spectralMotion * 1.32 * profile.motion;

      spikeTarget[k] =
        Math.min(1.05, (magnetic + wobble) * sensitivity) * SPIKE_MAX;
    }

    for (let k = 0; k < SPIKE_COUNT; k++) {
      const force = (spikeTarget[k] - spikeHeight[k]) * spikeSpring[k];
      spikeVelocity[k] = (spikeVelocity[k] + force) * spikeDamping[k];
      spikeHeight[k] = Math.max(0, spikeHeight[k] + spikeVelocity[k]);
    }

    const pulse = 1;
    const arr = posAttr.array;
    for (let i = 0; i < vertexCount; i++) {
      const o = i * 3;
      const owner = vOwner[i];
      const cellWeight = vCellWeight[i];
      const height = spikeHeight[owner];
      const idleOrganic =
        (Math.sin(time * spikeIdleRate[owner] + spikeSeed[owner] * 20.1) * 0.5 +
          0.5) *
        spikeIdleAmp[owner] *
        cellWeight *
        0.28;
      const activeShimmer =
        audioActive && cellWeight > 0.08
          ? Math.sin(
              time * (5.5 + spikeSeed[owner] * 2.5) + spikeSeed[owner] * 18,
            ) *
            bands.presence *
            cellWeight *
            0.012 *
            profile.shimmer *
            sensitivity
          : 0;
      const ownerY = spikeDirs[owner * 3 + 1];
      const roundedPeak =
        (idleOrganic + activeShimmer + height * cellWeight) *
        (0.92 + THREE.MathUtils.smoothstep(ownerY, -0.72, 0.22) * 0.08);
      const r = RADIUS * pulse;
      const leanAmount = height * cellWeight * 0.018;
      const dot =
        base[o] * magneticField.x +
        base[o + 1] * magneticField.y +
        base[o + 2] * magneticField.z;
      const leanX = magneticField.x - base[o] * dot;
      const leanY = magneticField.y - base[o + 1] * dot;
      const leanZ = magneticField.z - base[o + 2] * dot;
      // push along the blended direction so off-centre vertices bulge (round tip)
      arr[o] = base[o] * r + vPushX[i] * roundedPeak + leanX * leanAmount;
      arr[o + 1] =
        base[o + 1] * r + vPushY[i] * roundedPeak + leanY * leanAmount;
      arr[o + 2] =
        base[o + 2] * r + vPushZ[i] * roundedPeak + leanZ * leanAmount;
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  function resize() {
    dirty = true;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setPixelRatio(adaptivePixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 0.9;
    camera.position.z = portrait ? 14.6 : 12.8;
    camera.position.y = portrait ? 0.16 : 0.1;
    camera.updateProjectionMatrix();
  }

  let audioCtx = null;
  let analyser = null;
  let freqData = null;
  let audioActive = false;
  let dirty = true;
  let wasPaused;
  let disposed = false;
  let seenReset = 0;
  const clock = createFrameClock();
  function step(dt) {
    dirty = true;
    time += dt;
    sampleAudio();
    if (!dragging) {
      rotY += velX + 0.00062 + bands.level * 0.0024;
      rotX += velY + 0.00022;
      velX *= 0.94;
      velY *= 0.94;
    }
    updateGeometry();
  }
  function animate(now) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    if (document.hidden) {
      clock.reset();
      return;
    }
    const settings = getSettings();
    if (settings.paused !== wasPaused) dirty = true;
    wasPaused = settings.paused;
    Object.assign(controls, settings);
    const audio = getAudio();
    audioCtx = audio?.ctx;
    analyser = audio?.analyser;
    freqData = audio?.frequencyData;
    audioActive = !!audio?.active;
    if (settings.reset !== seenReset) {
      dirty = true;
      seenReset = settings.reset;
      rotX = rotY = velX = velY = 0;
    }
    if (!settings.paused) clock.tick(now, step);
    else clock.reset();
    blob.rotation.set(
      -0.08 + rotX,
      rotY,
      settings.paused ? 0 : Math.sin(time * 0.08) * 0.035,
    );
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
    if (!settings.paused) {
      frameCount++;
      if (now - frameWindowStarted > 2200) {
        const fps = (frameCount * 1000) / (now - frameWindowStarted);
        if (fps < 42 && adaptivePixelRatio > 1) {
          adaptivePixelRatio = Math.max(1, adaptivePixelRatio - 0.25);
          renderer.setPixelRatio(adaptivePixelRatio);
        }
        frameWindowStarted = now;
        frameCount = 0;
      }
    }
  }
  function onKeyDown(event) {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    dirty = true;
    velX = velY = 0;
    if (event.key === "Home") rotX = rotY = 0;
    if (event.key === "ArrowLeft") rotY -= 0.12;
    if (event.key === "ArrowRight") rotY += 0.12;
    if (event.key === "ArrowUp") rotX -= 0.12;
    if (event.key === "ArrowDown") rotX += 0.12;
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("keydown", onKeyDown);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  updateGeometry();
  frame = requestAnimationFrame(animate);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", endDrag);
    canvas.removeEventListener("pointercancel", endDrag);
    canvas.removeEventListener("keydown", onKeyDown);
    keyLight.shadow.dispose();
    renderer.dispose();
    envTex.dispose();
    geometry.dispose();
    material.dispose();
  };
}
