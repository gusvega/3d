"use client";

import { useEffect, useRef } from "react";
import * as THREE from "@/src/vendor/build/three.module.js";

export default function FerrofluidScene() {
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const embedRef = useRef(null);
  const micRef = useRef(null);
  const fileRef = useRef(null);
  const statusRef = useRef(null);
  const playerRef = useRef(null);
  const playPauseRef = useRef(null);
  const restartRef = useRef(null);
  const stopRef = useRef(null);
  const backRef = useRef(null);
  const forwardRef = useRef(null);
  const seekRef = useRef(null);
  const timeRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ytForm = formRef.current;
    const ytInput = inputRef.current;
    const ytEmbed = embedRef.current;
    const micBtn = micRef.current;
    const fileInput = fileRef.current;
    const status = statusRef.current;
    const player = playerRef.current;
    const playPauseBtn = playPauseRef.current;
    const restartBtn = restartRef.current;
    const stopBtn = stopRef.current;
    const backBtn = backRef.current;
    const forwardBtn = forwardRef.current;
    const seek = seekRef.current;
    const timeReadout = timeRef.current;
    const trackName = trackRef.current;
    if (
      !canvas ||
      !ytForm ||
      !ytInput ||
      !ytEmbed ||
      !micBtn ||
      !fileInput ||
      !status ||
      !player ||
      !playPauseBtn ||
      !restartBtn ||
      !stopBtn ||
      !backBtn ||
      !forwardBtn ||
      !seek ||
      !timeReadout ||
      !trackName
    ) {
      return undefined;
    }

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      Math.min(window.innerWidth, window.innerHeight) < 740;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.85;
    renderer.setClearColor(0x020203, 1);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020203);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.38, 7.6);

    function makeEnvironment() {
      const w = 1024;
      const h = 512;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, "#f9fbff");
      grad.addColorStop(0.12, "#d9dee8");
      grad.addColorStop(0.23, "#1f232b");
      grad.addColorStop(0.58, "#050507");
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

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.8);
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

    const rimLight = new THREE.DirectionalLight(0xffffff, 4.2);
    rimLight.position.set(5.5, 2, -5);
    scene.add(rimLight);
    const fillFront = new THREE.DirectionalLight(0xbfc7d8, 0.55);
    fillFront.position.set(0, 1.5, 9);
    scene.add(fillFront);
    const fillLeft = new THREE.DirectionalLight(0xeef2ff, 1.2);
    fillLeft.position.set(-8, 1, 2);
    scene.add(fillLeft);
    const fillRight = new THREE.DirectionalLight(0xeef2ff, 1.2);
    fillRight.position.set(8, 1, 2);
    scene.add(fillRight);
    const glintLight = new THREE.PointLight(0xffffff, 34, 50, 2);
    glintLight.position.set(-1.8, 5.2, 4.2);
    scene.add(glintLight);
    scene.add(new THREE.HemisphereLight(0xb7c1d6, 0x000000, 0.35));

    const RADIUS = 1.72;
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
      new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3)
    );
    geometry.setIndex(indices);
    const posAttr = geometry.attributes.position;

    const SPIKE_COUNT = isMobile ? 118 : 172;
    const SPIKE_MAX = isMobile ? 0.78 : 0.94;
    const SPIKE_NEAR = 8;
    const SPIKE_SPACING = Math.sqrt((8 * Math.PI) / (SPIKE_COUNT * Math.sqrt(3)));
    const SPIKE_SIGMA = SPIKE_SPACING * 0.38;
    const INV_2S2 = 1 / (2 * SPIKE_SIGMA * SPIKE_SIGMA);
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

    const vIdx = new Uint16Array(vertexCount * SPIKE_NEAR);
    const vWt = new Float32Array(vertexCount * SPIKE_NEAR);
    const bestDot = new Float32Array(SPIKE_NEAR);
    const bestK = new Int32Array(SPIKE_NEAR);
    for (let i = 0; i < vertexCount; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const bz = base[i * 3 + 2];
      bestDot.fill(-2);
      bestK.fill(0);
      for (let k = 0; k < SPIKE_COUNT; k++) {
        const dot =
          bx * spikeDirs[k * 3] +
          by * spikeDirs[k * 3 + 1] +
          bz * spikeDirs[k * 3 + 2];
        if (dot > bestDot[SPIKE_NEAR - 1]) {
          let p = SPIKE_NEAR - 1;
          while (p > 0 && dot > bestDot[p - 1]) {
            bestDot[p] = bestDot[p - 1];
            bestK[p] = bestK[p - 1];
            p--;
          }
          bestDot[p] = dot;
          bestK[p] = k;
        }
      }
      for (let j = 0; j < SPIKE_NEAR; j++) {
        const ang = Math.acos(Math.min(1, Math.max(-1, bestDot[j])));
        vIdx[i * SPIKE_NEAR + j] = bestK[j];
        vWt[i * SPIKE_NEAR + j] = Math.exp(-ang * ang * INV_2S2);
      }
    }

    const spikeHeight = new Float32Array(SPIKE_COUNT);
    const spikeVelocity = new Float32Array(SPIKE_COUNT);
    const spikeTarget = new Float32Array(SPIKE_COUNT);
    const spikeF0 = new Float32Array(SPIKE_COUNT);
    const spikeF1 = new Float32Array(SPIKE_COUNT);
    const spikeGain = new Float32Array(SPIKE_COUNT);
    const spikeSpring = new Float32Array(SPIKE_COUNT);
    const spikeDamping = new Float32Array(SPIKE_COUNT);
    const spikeLowWeight = new Float32Array(SPIKE_COUNT);
    const spikeMidWeight = new Float32Array(SPIKE_COUNT);
    const spikeHighWeight = new Float32Array(SPIKE_COUNT);
    const spikeSeed = new Float32Array(SPIKE_COUNT);
    const spikeNeighbors = new Uint16Array(SPIKE_COUNT * 4);
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
      spikeLowWeight[k] = Math.max(0, 1 - fn * 1.3) * (0.75 + y * 0.45);
      spikeMidWeight[k] = Math.max(0, 1 - Math.abs(fn - 0.42) * 2.25) * (0.82 + side * 0.22);
      spikeHighWeight[k] = Math.pow(fn, 1.28) * (0.82 + (1 - y) * 0.32);
      spikeSeed[k] = ((Math.sin(k * 127.1) * 43758.5453) % 1 + 1) % 1;
    }

    for (let k = 0; k < SPIKE_COUNT; k++) {
      const best = [
        { dot: -2, index: k },
        { dot: -2, index: k },
        { dot: -2, index: k },
        { dot: -2, index: k },
      ];
      const ax = spikeDirs[k * 3];
      const ay = spikeDirs[k * 3 + 1];
      const az = spikeDirs[k * 3 + 2];
      for (let j = 0; j < SPIKE_COUNT; j++) {
        if (j === k) {
          continue;
        }
        const dot =
          ax * spikeDirs[j * 3] +
          ay * spikeDirs[j * 3 + 1] +
          az * spikeDirs[j * 3 + 2];
        if (dot > best[3].dot) {
          let p = 3;
          while (p > 0 && dot > best[p - 1].dot) {
            best[p] = best[p - 1];
            p--;
          }
          best[p] = { dot, index: j };
        }
      }
      for (let j = 0; j < 4; j++) {
        spikeNeighbors[k * 4 + j] = best[j].index;
      }
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
    blob.position.set(0, -1.15, 0);
    blob.scale.set(1.34, 1.34, 1.34);
    blob.rotation.x = -0.18;
    scene.add(blob);

    let audioCtx = null;
    let analyser = null;
    let freqData = null;
    let audioActive = false;
    let audioMode = "idle";
    let mediaElement = null;
    let mediaSource = null;
    let micSource = null;
    let micStream = null;
    let objectUrl = "";
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

    function ensureAnalyser() {
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.6;
        freqData = new Uint8Array(analyser.frequencyBinCount);
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      return analyser;
    }

    function getMediaElement() {
      if (!mediaElement) {
        mediaElement = new Audio();
        mediaElement.preload = "metadata";
        mediaElement.addEventListener("loadedmetadata", updateTransport);
        mediaElement.addEventListener("timeupdate", updateTransport);
        mediaElement.addEventListener("play", updateTransport);
        mediaElement.addEventListener("pause", updateTransport);
        mediaElement.addEventListener("ended", onMediaEnded);
      }
      return mediaElement;
    }

    function connectMediaElement() {
      const element = getMediaElement();
      ensureAnalyser();
      if (!mediaSource) {
        mediaSource = audioCtx.createMediaElementSource(element);
        mediaSource.connect(analyser);
        mediaSource.connect(audioCtx.destination);
      }
      return element;
    }

    async function startMic() {
      ensureAnalyser();
      await audioCtx.resume();
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(analyser);
      audioActive = true;
      audioMode = "mic";
    }

    function stopMicInput() {
      if (micSource) {
        micSource.disconnect();
        micSource = null;
      }
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
      }
      micBtn.disabled = false;
      micBtn.textContent = "Listen via mic";
      micBtn.classList.remove("active");
    }

    function unlockAudio() {
      ensureAnalyser();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    }

    async function startFile(file) {
      stopMicInput();
      const element = connectMediaElement();
      await audioCtx.resume().catch(() => {});
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrl = URL.createObjectURL(file);
      element.src = objectUrl;
      element.load();
      audioMode = "file";
      trackName.textContent = file.name;
      player.hidden = false;
      updateTransport();
      try {
        await element.play();
        audioActive = true;
        scheduleFade(4600);
        return true;
      } catch (err) {
        audioActive = false;
        updateTransport();
        if (err?.name === "NotAllowedError") {
          return false;
        }
        throw err;
      }
    }

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
      const hzToBin = (hz) => Math.max(1, Math.min(n - 1, Math.round((hz / (audioCtx.sampleRate / 2)) * n)));
      const avgBins = (a, b) => {
        let sum = 0;
        for (let i = a; i < b; i++) {
          sum += freqData[i];
        }
        return sum / (b - a) / 255;
      };
      const avgHz = (lo, hi) => avgBins(hzToBin(lo), Math.max(hzToBin(lo) + 1, hzToBin(hi)));
      const lerp = (a, b, t) => a + (b - a) * t;
      const shape = (value, gain = 1, power = 0.82) =>
        Math.pow(Math.min(1, Math.max(0, value) * gain), power);

      const sub = shape(avgHz(24, 68), 1.35, 0.78);
      const bass = shape(avgHz(55, 150), 1.25, 0.76);
      const lowMid = shape(avgHz(140, 420), 1.12, 0.82);
      const mid = shape(avgHz(380, 1450), 1.18, 0.86);
      const high = shape(avgHz(1400, 5200), 1.55, 0.74);
      const presence = shape(avgHz(4800, 12000), 2.25, 0.64);
      const instantLevel = sub * 0.22 + bass * 0.24 + lowMid * 0.15 + mid * 0.16 + high * 0.15 + presence * 0.08;

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
      bands.transient = Math.max(bands.transient * 0.72, Math.min(1, transient * 5.2 + presence * 0.25));
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
    let revealTimer = 0;
    let openingFadeTimer = 0;

    function onPointerDown(e) {
      dragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      velX = 0;
      velY = 0;
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      revealControls();
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
      for (let k = 0; k < SPIKE_COUNT; k++) {
        let spectralLevel = 0;
        if (audioActive && n) {
          const lo = Math.max(1, Math.min(n - 1, Math.round((spikeF0[k] / (audioCtx.sampleRate / 2)) * n)));
          const hi = Math.max(lo + 1, Math.min(n, Math.round((spikeF1[k] / (audioCtx.sampleRate / 2)) * n)));
          let sum = 0;
          for (let b = lo; b < hi; b++) {
            sum += freqData[b];
          }
          spectralLevel = Math.pow(Math.min(1, Math.max(0, sum / (hi - lo) / 255 - 0.025) * spikeGain[k]), 0.72);
        }

        const wobble =
          Math.sin(time * (1.2 + spikeSeed[k] * 1.8) + spikeSeed[k] * 12.4) *
          (0.008 + bands.high * 0.018);
        const magnetic =
          bands.sub * spikeLowWeight[k] * 0.72 +
          bands.bass * spikeLowWeight[k] * 0.94 +
          bands.lowMid * spikeMidWeight[k] * 0.56 +
          bands.mid * spikeMidWeight[k] * 0.68 +
          bands.high * spikeHighWeight[k] * 0.5 +
          bands.presence * spikeHighWeight[k] * 0.42 +
          spectralLevel * 0.88 +
          pump * spikeLowWeight[k] * 0.7 +
          bands.transient * spikeHighWeight[k] * 0.5;

        const neighborAvg =
          (spikeHeight[spikeNeighbors[k * 4]] +
            spikeHeight[spikeNeighbors[k * 4 + 1]] +
            spikeHeight[spikeNeighbors[k * 4 + 2]] +
            spikeHeight[spikeNeighbors[k * 4 + 3]]) *
          0.25;
        const idleNeedle = 0.055 + spikeSeed[k] * 0.035;
        spikeTarget[k] = Math.min(1.45, idleNeedle + magnetic + neighborAvg * 0.12 + wobble) * SPIKE_MAX;
      }

      for (let k = 0; k < SPIKE_COUNT; k++) {
        const force = (spikeTarget[k] - spikeHeight[k]) * spikeSpring[k];
        spikeVelocity[k] = (spikeVelocity[k] + force) * spikeDamping[k];
        spikeHeight[k] = Math.max(0.02, spikeHeight[k] + spikeVelocity[k]);
      }

      const pulse = 1 + 0.006 * Math.sin(time * 0.8) + bands.sub * 0.035 + pump * 0.075;
      const arr = posAttr.array;
      for (let i = 0; i < vertexCount; i++) {
        const o = i * 3;
        const m = i * SPIKE_NEAR;
        let h = 0;
        let crown = 0;
        let weightSum = 0;
        for (let j = 0; j < SPIKE_NEAR; j++) {
          const weight = vWt[m + j];
          const height = spikeHeight[vIdx[m + j]];
          h += weight * height;
          crown += weight * weight * height;
          weightSum += weight;
        }
        const normalized = weightSum > 0 ? h / weightSum : h;
        const roundedPeak = normalized * 0.72 + crown * 0.36;
        const directionY = base[o + 1];
        const moundMask = THREE.MathUtils.smoothstep(directionY, -0.82, 0.32);
        const lowerCompression = directionY < -0.2 ? (directionY + 0.2) * 0.3 : 0;
        const r = RADIUS * pulse + roundedPeak * moundMask + lowerCompression;
        arr[o] = base[o] * r;
        arr[o + 1] = base[o + 1] * r - Math.max(0, -base[o + 1] - 0.2) * 0.34;
        arr[o + 2] = base[o + 2] * r;
      }
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const portrait = w / h < 0.9;
      camera.position.z = portrait ? 10.2 : 7.6;
      camera.position.y = portrait ? 0.55 : 0.38;
      camera.updateProjectionMatrix();
    }

    function animate() {
      frame = requestAnimationFrame(animate);
      time += 0.016;
      sampleAudio();
      if (!dragging) {
        rotY += velX + 0.00062 + bands.level * 0.0024;
        rotX += velY + 0.00022;
        velX *= 0.94;
        velY *= 0.94;
      }
      blob.rotation.y = rotY;
      blob.rotation.x = -0.18 + rotX;
      blob.rotation.z = Math.sin(time * 0.08) * 0.035;
      updateGeometry();
      renderer.render(scene, camera);
    }

    function parseYouTubeId(raw) {
      const value = raw.trim();
      if (/^[\w-]{11}$/.test(value)) {
        return value;
      }
      try {
        const url = new URL(value);
        if (url.hostname.includes("youtu.be")) {
          return url.pathname.slice(1, 12);
        }
        if (url.searchParams.get("v")) {
          return url.searchParams.get("v");
        }
        const match = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
        if (match) {
          return match[2];
        }
      } catch (_) {
        const match = value.match(/[\w-]{11}/);
        if (match) {
          return match[0];
        }
      }
      return null;
    }

    function enterImmersive() {
      document.body.classList.add("immersive");
      revealControls();
    }

    function scheduleFade(delay = 1600) {
      clearTimeout(openingFadeTimer);
      clearTimeout(revealTimer);
      document.body.classList.remove("immersive", "reveal");
      openingFadeTimer = window.setTimeout(() => {
        document.body.classList.add("immersive");
        document.body.classList.remove("reveal");
      }, delay);
    }

    function revealControls() {
      if (!document.body.classList.contains("immersive")) {
        return;
      }
      document.body.classList.add("reveal");
      clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => document.body.classList.remove("reveal"), 2600);
    }

    function formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
      }
      const minutes = Math.floor(seconds / 60);
      const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${minutes}:${remaining}`;
    }

    function updateTransport() {
      const element = mediaElement;
      const hasFile = Boolean(element && element.src);
      playPauseBtn.disabled = !hasFile;
      restartBtn.disabled = !hasFile;
      stopBtn.disabled = !hasFile;
      backBtn.disabled = !hasFile;
      forwardBtn.disabled = !hasFile;
      seek.disabled = !hasFile;
      if (!hasFile) {
        seek.value = "0";
        timeReadout.textContent = "0:00 / 0:00";
        playPauseBtn.textContent = "Play";
        return;
      }

      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      const progress = duration > 0 ? (element.currentTime / duration) * 1000 : 0;
      seek.value = String(Math.round(progress));
      timeReadout.textContent = `${formatTime(element.currentTime)} / ${formatTime(duration)}`;
      playPauseBtn.textContent = element.paused ? "Play" : "Pause";
      audioActive = audioMode === "mic" || (audioMode === "file" && !element.paused && !element.ended);
    }

    async function togglePlayback() {
      if (!mediaElement || !mediaElement.src) {
        return;
      }
      if (mediaElement.paused) {
        await audioCtx?.resume().catch(() => {});
        await mediaElement.play();
        audioActive = true;
        scheduleFade(mediaElement.currentTime < 1 ? 4600 : 1200);
      } else {
        mediaElement.pause();
        audioActive = false;
        document.body.classList.remove("immersive", "reveal");
        clearTimeout(openingFadeTimer);
      }
      updateTransport();
    }

    function seekBy(seconds) {
      if (!mediaElement || !mediaElement.src) {
        return;
      }
      const duration = Number.isFinite(mediaElement.duration) ? mediaElement.duration : 0;
      mediaElement.currentTime = Math.min(Math.max(mediaElement.currentTime + seconds, 0), duration || 0);
      updateTransport();
    }

    function rewindTrack() {
      seekBy(-10);
    }

    function forwardTrack() {
      seekBy(10);
    }

    function restartTrack() {
      if (!mediaElement || !mediaElement.src) {
        return;
      }
      mediaElement.currentTime = 0;
      if (mediaElement.paused) {
        mediaElement.play().catch(() => {});
      }
      audioActive = true;
      scheduleFade(4600);
      updateTransport();
    }

    function stopTrack() {
      if (!mediaElement || !mediaElement.src) {
        return;
      }
      mediaElement.pause();
      mediaElement.currentTime = 0;
      audioActive = false;
      clearTimeout(openingFadeTimer);
      document.body.classList.remove("immersive", "reveal");
      updateTransport();
    }

    function onSubmit(e) {
      e.preventDefault();
      const id = parseYouTubeId(ytInput.value);
      if (!id) {
        status.textContent =
          "Could not read that link. Paste a full YouTube URL or an 11-character video ID.";
        return;
      }
      ytEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="YouTube player" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      ytEmbed.classList.add("loaded");
      status.textContent = audioActive
        ? "Playing. The fluid is reacting to your audio."
        : "Playing. Now press Listen via mic and allow access so the fluid reacts to the sound.";
    }

    async function onMicClick() {
      if (audioActive) {
        return;
      }
      micBtn.disabled = true;
      status.textContent = "Requesting microphone...";
      try {
        await startMic();
        micBtn.textContent = "Listening";
        micBtn.classList.add("active");
        player.hidden = true;
        status.textContent = "Listening. Move the mouse to bring the controls back.";
        enterImmersive();
      } catch (err) {
        micBtn.disabled = false;
        console.error("mic error", err);
        status.textContent = "Mic error: " + (err ? `${err.name} - ${err.message}` : err);
      }
    }

    async function onFileChange(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        return;
      }
      status.textContent = `Playing ${file.name}...`;
      try {
        const didPlay = await startFile(file);
        status.textContent = didPlay
          ? "Playing your file. Controls will fade after the opening."
          : "Track loaded. Press Play to start.";
      } catch (err) {
        console.error("file error", err);
        status.textContent = "File error: " + (err ? `${err.name} - ${err.message}` : err);
      }
    }

    function onSeekInput() {
      if (!mediaElement || !mediaElement.src) {
        return;
      }
      const duration = Number.isFinite(mediaElement.duration) ? mediaElement.duration : 0;
      if (duration > 0) {
        mediaElement.currentTime = (Number(seek.value) / 1000) * duration;
      }
      updateTransport();
    }

    function onMediaEnded() {
      audioActive = false;
      document.body.classList.remove("immersive", "reveal");
      clearTimeout(openingFadeTimer);
      updateTransport();
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("pointermove", revealControls);
    window.addEventListener("pointerdown", revealControls);
    ytForm.addEventListener("submit", onSubmit);
    micBtn.addEventListener("click", onMicClick);
    fileInput.addEventListener("change", onFileChange);
    playPauseBtn.addEventListener("click", togglePlayback);
    restartBtn.addEventListener("click", restartTrack);
    stopBtn.addEventListener("click", stopTrack);
    backBtn.addEventListener("click", rewindTrack);
    forwardBtn.addEventListener("click", forwardTrack);
    seek.addEventListener("input", onSeekInput);

    resize();
    animate();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(revealTimer);
      clearTimeout(openingFadeTimer);
      document.body.classList.remove("immersive", "reveal");
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("pointermove", revealControls);
      window.removeEventListener("pointerdown", revealControls);
      ytForm.removeEventListener("submit", onSubmit);
      micBtn.removeEventListener("click", onMicClick);
      fileInput.removeEventListener("change", onFileChange);
      playPauseBtn.removeEventListener("click", togglePlayback);
      restartBtn.removeEventListener("click", restartTrack);
      stopBtn.removeEventListener("click", stopTrack);
      backBtn.removeEventListener("click", rewindTrack);
      forwardBtn.removeEventListener("click", forwardTrack);
      seek.removeEventListener("input", onSeekInput);
      if (mediaElement) {
        mediaElement.removeEventListener("loadedmetadata", updateTransport);
        mediaElement.removeEventListener("timeupdate", updateTransport);
        mediaElement.removeEventListener("play", updateTransport);
        mediaElement.removeEventListener("pause", updateTransport);
        mediaElement.removeEventListener("ended", onMediaEnded);
        mediaElement.pause();
        mediaElement.src = "";
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      stopMicInput();
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      renderer.dispose();
      envTex.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <section aria-label="Audio-reactive ferrofluid sketch">
      <h1 className="sr-only">Ferrofluid</h1>
      <canvas ref={canvasRef} className="fluid-canvas" aria-label="Audio-reactive ferrofluid" />
      <div className="panel">
        <form ref={formRef} className="yt-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Paste a YouTube link or ID"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit">Load</button>
        </form>
        <div className="btn-row">
          <button ref={micRef} id="mic-btn" type="button">
            Listen via mic
          </button>
          <label className="upload-btn">
            Upload audio
            <input ref={fileRef} type="file" accept="audio/*" hidden />
          </label>
        </div>
        <div ref={playerRef} className="transport" hidden>
          <div className="track-row">
            <span ref={trackRef} className="track-name">
              No track loaded
            </span>
            <span ref={timeRef} className="time-readout">
              0:00 / 0:00
            </span>
          </div>
          <input
            ref={seekRef}
            className="seek-slider"
            type="range"
            min="0"
            max="1000"
            defaultValue="0"
            aria-label="Track position"
            disabled
          />
          <div className="transport-buttons">
            <button ref={backRef} type="button" disabled>
              -10
            </button>
            <button ref={playPauseRef} type="button" disabled>
              Play
            </button>
            <button ref={forwardRef} type="button" disabled>
              +10
            </button>
            <button ref={restartRef} type="button" disabled>
              Restart
            </button>
            <button ref={stopRef} type="button" disabled>
              Stop
            </button>
          </div>
        </div>
        <p ref={statusRef} className="status">
          Upload an audio file, or load a YouTube song and press Listen via mic so the fluid
          reacts to what is playing.
        </p>
        <div ref={embedRef} className="yt-embed" aria-hidden="false" />
      </div>
    </section>
  );
}
