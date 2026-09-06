import * as THREE from "@/src/vendor/build/three.module.js";
import { createFrameClock } from "./frame-clock.mjs";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export function createGusScene(canvas, getSettings) {
  const renderer = new THREE.WebGLRenderer({
    antialias: !window.matchMedia("(pointer: coarse)").matches,
    alpha: false,
    canvas,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0xffffff, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.05, 15.5);

  const letters = new THREE.Group();
  letters.rotation.order = "YXZ";
  scene.add(letters);

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.8);
  keyLight.position.set(-5.5, 6.5, 8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
  fillLight.position.set(5, 2.4, 5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 3.8);
  rimLight.position.set(4.5, 4.1, -6);
  scene.add(rimLight);

  const glintLight = new THREE.PointLight(0xffffff, 3.5, 26);
  glintLight.position.set(-2.8, 3.7, 4.6);
  scene.add(glintLight);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6d6d6, 3.6));

  const balloonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x858585,
    metalness: 0,
    roughness: 0.075,
    clearcoat: 1,
    clearcoatRoughness: 0.028,
    reflectivity: 1,
    sheen: 0.5,
    sheenRoughness: 0.16,
    sheenColor: 0xffffff,
  });

  const tubeRadius = 0.52;
  let letterMeshes = [];
  let baseScale = 1;
  let isDragging = false;
  let previousX = 0;
  let previousY = 0;
  let rotationX = 0;
  let rotationY = 0;
  let rotationZ = 0;
  let velocityX = 0;
  let velocityY = 0;
  let targetBreath = 0;
  let frame = 0;
  let wordBounds = { width: 9.8, height: 3.9 };

  function makeTube(points, options = {}) {
    const curve = new THREE.CatmullRomCurve3(
      points,
      false,
      "centripetal",
      0.58,
    );
    const geometry = new THREE.TubeGeometry(
      curve,
      options.segments ?? 220,
      tubeRadius,
      44,
      false,
    );
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, balloonMaterial);
  }

  function makeSphere(position, radius = tubeRadius) {
    const geometry = new THREE.SphereGeometry(radius, 44, 28);
    const mesh = new THREE.Mesh(geometry, balloonMaterial);
    mesh.position.copy(position);
    return mesh;
  }

  function addTubeLetter(group, points) {
    group.add(makeTube(points));
    group.add(makeSphere(points[0]));
    group.add(makeSphere(points[points.length - 1]));
  }

  function makeG() {
    const group = new THREE.Group();
    addTubeLetter(group, [
      v(1.06, 0.96),
      v(0.62, 1.26),
      v(-0.17, 1.32),
      v(-0.9, 1.02),
      v(-1.31, 0.34),
      v(-1.23, -0.54),
      v(-0.68, -1.12),
      v(0.16, -1.22),
      v(0.86, -0.9),
      v(1.12, -0.32),
      v(0.82, 0.02),
      v(0.18, 0.02),
    ]);
    return group;
  }

  function makeU() {
    const group = new THREE.Group();
    addTubeLetter(group, [
      v(-0.88, 1.2),
      v(-0.88, 0.38),
      v(-0.84, -0.42),
      v(-0.56, -1.05),
      v(0, -1.28),
      v(0.56, -1.05),
      v(0.84, -0.42),
      v(0.88, 0.38),
      v(0.88, 1.2),
    ]);
    return group;
  }

  function makeS() {
    const group = new THREE.Group();
    addTubeLetter(group, [
      v(0.98, 0.94),
      v(0.4, 1.26),
      v(-0.48, 1.18),
      v(-1.02, 0.66),
      v(-0.76, 0.08),
      v(0.2, -0.08),
      v(0.94, -0.34),
      v(1.0, -0.86),
      v(0.42, -1.25),
      v(-0.48, -1.18),
      v(-1.02, -0.76),
    ]);
    return group;
  }

  function layoutLetters() {
    letterMeshes.forEach((mesh) => mesh.parent?.remove(mesh));
    letterMeshes = [makeG(), makeU(), makeS()];

    [-2.82, 0, 2.8].forEach((x, index) => {
      const mesh = letterMeshes[index];
      mesh.position.set(x, 0, 0);
      mesh.rotation.set(0, 0, 0);
      letters.add(mesh);
    });

    const box = new THREE.Box3().setFromObject(letters);
    const center = box.getCenter(new THREE.Vector3());
    letterMeshes.forEach((mesh) => {
      mesh.position.sub(center);
    });

    const size = new THREE.Box3()
      .setFromObject(letters)
      .getSize(new THREE.Vector3());
    wordBounds = { width: size.x, height: size.y };
  }

  function resize() {
    dirty = true;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const aspect = width / height;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    const isPortrait = aspect < 0.82;
    camera.position.z = isPortrait ? 19.8 : 15.4;

    const visibleHeight =
      2 *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.position.z;
    const visibleWidth = visibleHeight * aspect;
    const widthFit =
      (visibleWidth * (isPortrait ? 0.66 : 0.88)) / wordBounds.width;
    const heightFit =
      (visibleHeight * (isPortrait ? 0.38 : 0.62)) / wordBounds.height;
    baseScale = Math.min(widthFit, heightFit, isPortrait ? 0.45 : 1.12);
    letters.position.set(0, 0, 0);
  }

  function step() {
    dirty = true;
    if (!isDragging) {
      rotationX += velocityY;
      rotationY += velocityX;
      rotationZ += velocityX * 0.07;
      velocityX *= 0.925;
      velocityY *= 0.925;
      rotationZ *= 0.94;
    }

    rotationZ = clamp(rotationZ, -0.09, 0.09);
    targetBreath += 0.012;
    letters.rotation.set(rotationX, rotationY, rotationZ);

    const breath = Math.sin(targetBreath) * 0.01;
    letters.scale.set(
      baseScale * (1 + breath * 0.65),
      baseScale * (1 - breath * 0.32),
      baseScale * (1 + breath),
    );
  }
  function onPointerDown(event) {
    isDragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    velocityX = 0;
    velocityY = 0;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    dirty = true;
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    previousX = event.clientX;
    previousY = event.clientY;

    velocityX = clamp(deltaX * 0.0017, -0.026, 0.026);
    velocityY = clamp(-deltaY * 0.0015, -0.022, 0.022);
    rotationY += deltaX * 0.0032;
    rotationX -= deltaY * 0.0028;
    rotationZ = clamp(rotationZ + deltaX * 0.00016, -0.09, 0.09);
  }

  function onPointerRelease(event) {
    if (!isDragging) {
      return;
    }
    isDragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  let dirty = true;
  let wasPaused;
  let disposed = false;
  let seenReset = 0;
  const clock = createFrameClock();
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
    if (settings.reset !== seenReset) {
      dirty = true;
      seenReset = settings.reset;
      rotationX = rotationY = rotationZ = velocityX = velocityY = 0;
    }
    if (!settings.paused) clock.tick(now, step);
    else {
      clock.reset();
      letters.rotation.set(rotationX, rotationY, rotationZ);
      letters.scale.setScalar(baseScale);
    }
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
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
    velocityX = velocityY = 0;
    if (event.key === "Home") rotationX = rotationY = rotationZ = 0;
    if (event.key === "ArrowLeft") rotationY -= 0.12;
    if (event.key === "ArrowRight") rotationY += 0.12;
    if (event.key === "ArrowUp") rotationX -= 0.12;
    if (event.key === "ArrowDown") rotationX += 0.12;
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerRelease);
  canvas.addEventListener("pointercancel", onPointerRelease);
  canvas.addEventListener("keydown", onKeyDown);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  layoutLetters();
  resize();
  frame = requestAnimationFrame(animate);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerRelease);
    canvas.removeEventListener("pointercancel", onPointerRelease);
    canvas.removeEventListener("keydown", onKeyDown);
    renderer.dispose();
    balloonMaterial.dispose();
    letters.traverse((object) => object.geometry?.dispose());
  };
}
