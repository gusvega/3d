import * as THREE from "@/src/vendor/build/three.module.js";
import { FluidResponse, CELL_COUNT } from "./fluid-response.mjs";
import { magneticCells, bindSurface } from "./fluid-surface.mjs";

const clamp = THREE.MathUtils.clamp;
const surfaceGLSL = `
attribute vec3 cellOwners;
uniform vec4 magneticCells[64];
uniform float fluidTime;
uniform float fluidEnergy;
uniform float fluidHigh;
uniform vec3 magnetPosition;
uniform float magnetStrength;

// xyz is the analytical tangential gradient; w is the radial displacement.
vec4 fluidShape(vec3 n) {
  vec3 gradient = vec3(0.0);
  float radius = 1.43;
  for (int j = 0; j < 3; j++) {
    int index = int(j == 0 ? cellOwners.x : (j == 1 ? cellOwners.y : cellOwners.z));
    vec4 cell = magneticCells[index];
    float cosine = dot(n, cell.xyz);
    float q = max(0.0, (cosine - 0.945) / 0.055);
    float lobe = q * q * q;
    radius += cell.w * lobe;
    gradient += cell.w * 3.0 * q * q / 0.055 * (cell.xyz - n * cosine);
  }
  vec3 axis = vec3(2.8, 1.7, -2.2);
  float phase = dot(n, axis) + fluidTime * 0.48;
  float amp = 0.026 + fluidEnergy * 0.045;
  radius += sin(phase) * amp;
  gradient += cos(phase) * amp * (axis - n * dot(n, axis));
  vec3 microAxis = vec3(11.0, -7.0, 9.0);
  float micro = dot(n, microAxis) + fluidTime * 1.8;
  float ripple = 0.002 + fluidHigh * 0.009;
  radius += sin(micro) * ripple;
  gradient += cos(micro) * ripple * (microAxis - n * dot(n, microAxis));
  float magneticDot = dot(n, magnetPosition);
  float attraction = max(0.0, (magneticDot - 0.72) / 0.28);
  radius += attraction * attraction * attraction * magnetStrength;
  gradient += 3.0 * attraction * attraction / 0.28 * magnetStrength * (magnetPosition - n * magneticDot);
  return vec4(gradient, radius);
}
`;

function studioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.09, 0.1, 0.12);
  const panels = [];
  function panel(width, height, color, position) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    studio.add(mesh);
    panels.push(mesh);
  }
  panel(3.5, 7, new THREE.Color(5.8, 6.1, 6.4), [-5, 3, 4]);
  panel(7, 2, new THREE.Color(4.8, 5.2, 5.7), [0, 6, -1]);
  panel(1.1, 8, new THREE.Color(2.1, 3.4, 4.6), [5, 1, 2]);
  panel(6, 4, new THREE.Color(0.65, 0.8, 1.0), [0, -5, 3]);
  panel(3, 5, new THREE.Color(2.4, 2.0, 1.6), [-3, 0, -6]);
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, 0.035, 0.1, 30);
  generator.dispose();
  panels.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  return environment;
}

export function createFluidScene(canvas, getAudio, getSettings) {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mobile = coarse || canvas.clientWidth < 600;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.debug.onShaderError = () => {
    throw new Error("The liquid surface shader could not compile.");
  };
  renderer.setClearColor(0x080b0d, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  const directions = magneticCells();
  const cells = Array.from(
    { length: CELL_COUNT },
    (_, i) =>
      new THREE.Vector4(
        directions[i * 3],
        directions[i * 3 + 1],
        directions[i * 3 + 2],
        0.1,
      ),
  );
  const uniforms = {
    magneticCells: { value: cells },
    fluidTime: { value: 0 },
    fluidEnergy: { value: 0 },
    fluidHigh: { value: 0 },
    magnetPosition: { value: new THREE.Vector3(0, 0, 1) },
    magnetStrength: { value: 0 },
  };
  // Sphere vertices are immutable. Only 64 cell amplitudes cross the CPU/GPU
  // boundary each frame; positions and exact normals are evaluated on the GPU.
  const resolutions = mobile
    ? [
        [160, 112],
        [128, 88],
        [96, 64],
      ]
    : [
        [256, 192],
        [192, 128],
        [128, 96],
      ];
  let qualityTier = 0;
  function makeGeometry(tier) {
    const [width, height] = resolutions[tier];
    const result = new THREE.SphereGeometry(1, width, height);
    result.setAttribute(
      "cellOwners",
      new THREE.BufferAttribute(
        bindSurface(result.attributes.position.array, directions),
        3,
      ),
    );
    return result;
  }
  let geometry = makeGeometry(qualityTier);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x78838c,
    metalness: 1,
    roughness: 0.19,
    clearcoat: 0.65,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.15,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = surfaceGLSL + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      "vec3 fluidDirection = normalize(position); vec4 fluidSurface = fluidShape(fluidDirection); vec3 objectNormal = normalize(fluidDirection - fluidSurface.xyz / fluidSurface.w);",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "vec3 transformed = fluidDirection * fluidSurface.w;",
    );
  };
  material.customProgramCacheKey = () => "ferrofluid-analytic-v1";
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.rotation.set(0.2, 0.4, -0.12);
  scene.add(mesh);
  const response = new FluidResponse();
  let pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.8);
  let baseDistance = 9;
  let zoom = 1,
    zoomTarget = 1;
  let rotationX = 0.2,
    rotationY = 0.4,
    velocityX = 0,
    velocityY = 0;
  let lastFrame,
    lastDraw = 0,
    frame = 0,
    dirty = true,
    disposed = false;
  const gl = renderer.getContext();
  let gpuFence = null;
  let lastField;
  let lastReset = 0,
    lastPaused,
    lastMaterial;
  let hover = false,
    dragging = false,
    dragMoved = false,
    pinchDistance = 0;
  let lastPointerX = 0,
    lastPointerY = 0;
  let geometrySlowFrames = 0;
  let slowFrames = 0,
    fastFrames = 0,
    metricFrames = 0,
    metricTime = 0;
  const pointers = new Map();
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const targetMagnet = new THREE.Vector3(0, 0, 1);
  const hit = new THREE.Vector3();
  const boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.65);
  const nominalRatio = pixelRatio;

  function resize() {
    const width = Math.max(1, canvas.clientWidth),
      height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    baseDistance =
      ((2.06 * (mobile ? 1.1 : 1.18)) /
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) *
      Math.max(1, 1 / camera.aspect);
    camera.position.set(0, 0, baseDistance / zoom);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  function locate(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2,
    );
    raycaster.setFromCamera(pointer, camera);
    mesh.updateMatrixWorld();
    if (raycaster.ray.intersectSphere(boundingSphere, hit)) {
      targetMagnet.copy(mesh.worldToLocal(hit)).normalize();
      hover = true;
    } else hover = false;
  }
  function onDown(event) {
    canvas.focus({ preventScroll: true });
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    dragging = true;
    dragMoved = false;
    velocityX = velocityY = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
    locate(event);
    dirty = true;
  }
  function onMove(event) {
    locate(event);
    if (pointers.has(event.pointerId))
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance > 0)
        zoomTarget = clamp((zoomTarget * distance) / pinchDistance, 0.75, 1.65);
      pinchDistance = distance;
    } else if (dragging) {
      const dx = event.clientX - lastPointerX,
        dy = event.clientY - lastPointerY;
      rotationY += dx * 0.006;
      rotationX += dy * 0.006;
      velocityY = dx * 0.035;
      velocityX = dy * 0.035;
      dragMoved ||= Math.abs(dx) + Math.abs(dy) > 2;
    }
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    dirty = true;
  }
  function onUp(event) {
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    dragging = pointers.size > 0;
    if (!dragging) dragMoved = false;
    pinchDistance = 0;
    if (dragging) {
      const next = [...pointers.values()][0];
      lastPointerX = next.x;
      lastPointerY = next.y;
    }
    if (event.pointerType !== "mouse") hover = false;
  }
  function onLeave() {
    hover = false;
  }
  function onWheel(event) {
    if (document.activeElement !== canvas) return;
    event.preventDefault();
    zoomTarget = clamp(
      zoomTarget * Math.exp(-event.deltaY * 0.001),
      0.75,
      1.65,
    );
    dirty = true;
  }
  function onKey(event) {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "+",
        "=",
        "-",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    velocityX = velocityY = 0;
    if (event.key === "Home") {
      rotationX = 0.2;
      rotationY = 0.4;
      zoomTarget = 1;
    }
    if (event.key === "ArrowLeft") rotationY -= 0.12;
    if (event.key === "ArrowRight") rotationY += 0.12;
    if (event.key === "ArrowUp") rotationX -= 0.12;
    if (event.key === "ArrowDown") rotationX += 0.12;
    if (event.key === "+" || event.key === "=")
      zoomTarget = clamp(zoomTarget + 0.1, 0.75, 1.65);
    if (event.key === "-") zoomTarget = clamp(zoomTarget - 0.1, 0.75, 1.65);
    dirty = true;
  }
  function animate(now) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    if (document.hidden) {
      lastFrame = undefined;
      metricTime = 0;
      metricFrames = 0;
      return;
    }
    const dt =
      lastFrame === undefined
        ? 1 / 60
        : Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    const settings = getSettings();
    const paused = settings.paused;
    if (paused !== lastPaused) {
      dirty = true;
      lastPaused = paused;
    }
    if (settings.reset !== lastReset) {
      lastReset = settings.reset;
      rotationX = 0.2;
      rotationY = 0.4;
      zoomTarget = 1;
      velocityX = velocityY = 0;
      dirty = true;
    }
    if (settings.finish !== lastMaterial) {
      lastMaterial = settings.finish;
      material.color.set(settings.finish === "mercury" ? 0xd4dce0 : 0x78838c);
      material.roughness = settings.finish === "mercury" ? 0.12 : 0.19;
      dirty = true;
    }
    if (settings.field !== lastField && paused) {
      for (let i = 0; i < 30; i++)
        response.update(null, 48000, 1 / 60, settings);
      for (let i = 0; i < CELL_COUNT; i++) cells[i].w = response.heights[i];
      dirty = true;
    }
    lastField = settings.field;
    const audio = getAudio();
    if (!paused) {
      if (audio?.active)
        audio.analyser.getByteFrequencyData(audio.frequencyData);
      response.update(
        audio?.active ? audio.frequencyData : null,
        audio?.ctx?.sampleRate || 48000,
        dt,
        settings,
      );
      for (let i = 0; i < CELL_COUNT; i++) cells[i].w = response.heights[i];
      uniforms.fluidTime.value = response.time;
      uniforms.fluidEnergy.value = response.energy;
      uniforms.fluidHigh.value = response.high;
      const magnet = hover && !dragMoved ? 0.28 : 0;
      uniforms.magnetStrength.value = THREE.MathUtils.damp(
        uniforms.magnetStrength.value,
        magnet,
        9,
        dt,
      );
      uniforms.magnetPosition.value.lerp(targetMagnet, 1 - Math.exp(-dt * 10));
      if (!dragging) {
        rotationY += (0.055 + velocityY) * dt;
        rotationX += velocityX * dt;
        velocityX *= Math.exp(-dt * 6);
        velocityY *= Math.exp(-dt * 6);
      }
      dirty = true;
    }
    if (Math.abs(zoom - zoomTarget) > 0.001) {
      zoom = paused
        ? zoomTarget
        : THREE.MathUtils.damp(zoom, zoomTarget, 12, dt);
      dirty = true;
    }
    mesh.rotation.set(rotationX, rotationY, -0.12);
    camera.position.z = baseDistance / zoom;
    // Bound duplicate work on high-refresh displays without starving input.
    if (dirty && (paused || now - lastDraw >= 1000 / 65)) {
      // Keep at most one frame in flight. A saturated GPU must not build a
      // queue that stalls browser input, audio controls, and route changes.
      if (gpuFence) {
        if (gl.clientWaitSync(gpuFence, 0, 0) === gl.TIMEOUT_EXPIRED) return;
        gl.deleteSync(gpuFence);
        gpuFence = null;
      }
      const drawInterval = lastDraw ? (now - lastDraw) / 1000 : dt;
      const start = performance.now();
      renderer.render(scene, camera);
      gpuFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const cost = performance.now() - start;
      lastDraw = now;
      dirty = false;
      metricTime += dt;
      metricFrames++;
      if (!paused) {
        slowFrames =
          cost > 20 || drawInterval > 0.03
            ? slowFrames + 1
            : Math.max(0, slowFrames - 1);
        geometrySlowFrames =
          drawInterval > 0.03
            ? geometrySlowFrames + 1
            : Math.max(0, geometrySlowFrames - 1);
        fastFrames = cost < 9 && drawInterval < 0.02 ? fastFrames + 1 : 0;
        if (slowFrames > 20 && pixelRatio > 0.65) {
          pixelRatio = Math.max(0.65, pixelRatio - 0.2);
          resize();
          slowFrames = 0;
        }
        if (geometrySlowFrames > 35 && qualityTier < resolutions.length - 1) {
          qualityTier++;
          const old = geometry;
          geometry = makeGeometry(qualityTier);
          mesh.geometry = geometry;
          old.dispose();
          geometrySlowFrames = 0;
          fastFrames = 0;
        }
        if (fastFrames > 900 && qualityTier > 0) {
          qualityTier--;
          const old = geometry;
          geometry = makeGeometry(qualityTier);
          mesh.geometry = geometry;
          old.dispose();
          fastFrames = 0;
        }
        if (fastFrames > 300 && pixelRatio < nominalRatio) {
          pixelRatio = Math.min(nominalRatio, pixelRatio + 0.1);
          resize();
          fastFrames = 0;
        }
      }
      if (metricTime > 0.25) {
        canvas.dataset.vertices = String(geometry.attributes.position.count);
        canvas.dataset.triangles = String(renderer.info.render.triangles);
        canvas.dataset.renderScale = pixelRatio.toFixed(2);
        canvas.dataset.audioEnergy = response.energy.toFixed(3);
        canvas.dataset.peakHeight = Math.max(...response.heights).toFixed(3);
        metricTime = 0;
      }
    }
  }
  // A visible magnetic form is present even if reduced motion starts paused.
  for (let i = 0; i < 40; i++)
    response.update(null, 48000, 1 / 60, getSettings());
  for (let i = 0; i < CELL_COUNT; i++) cells[i].w = response.heights[i];
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("keydown", onKey);
  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("keydown", onKey);
    if (gpuFence) gl.deleteSync(gpuFence);
    geometry.dispose();
    material.dispose();
    environment.dispose();
    renderer.dispose();
  }
  try {
    resize();
    renderer.compile(scene, camera);
    frame = requestAnimationFrame(animate);
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}
