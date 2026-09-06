import * as THREE from "@/src/vendor/build/three.module.js";
import { createFrameClock } from "./frame-clock.mjs";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export function createGusScene(canvas, getSettings) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
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
  camera.position.set(0, 2.2, 15.5);
  camera.lookAt(0, -0.15, 0);

  const letters = new THREE.Group();
  letters.rotation.order = "YXZ";
  scene.add(letters);

  // Real studio panels produce broad, continuous reflections in every finish.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.008, 0.008, 0.008);
  const panels = [];
  for (const [w, h, intensity, position] of [
    [9, 12, 5, [-6, 4, 5]],
    [12, 3, 6, [0, 6, 1]],
    [3, 9, 4, [6, 1, 3]],
    [7, 3, 0.6, [0, -4, 5]],
    [4, 6, 3, [-4, 1, -6]],
  ]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(intensity, intensity, intensity),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    panels.push(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.04, 0.1, 30);
  scene.environment = environment.texture;
  pmrem.dispose();
  panels.forEach((p) => {
    p.geometry.dispose();
    p.material.dispose();
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const keyLight = new THREE.DirectionalLight(0xfff6e8, 2.4);
  keyLight.position.set(-3, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, {
    left: -9,
    right: 9,
    top: 7,
    bottom: -7,
    near: 0.1,
    far: 30,
  });
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.03;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xdce9ff, 0.6);
  fillLight.position.set(5, 3, -4);
  scene.add(fillLight);

  const finishes = {
    pearl: new THREE.MeshPhysicalMaterial({
      color: 0xeee4d4,
      metalness: 0.08,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.85,
    }),
    silver: new THREE.MeshPhysicalMaterial({
      color: 0xf0f2f5,
      metalness: 1,
      roughness: 0.105,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xd0dfef,
      metalness: 0,
      roughness: 0.065,
      transmission: 0.96,
      thickness: 0.95,
      ior: 1.48,
      attenuationColor: 0x6e88a5,
      attenuationDistance: 7,
      clearcoat: 0.15,
      side: THREE.DoubleSide,
      envMapIntensity: 1.1,
    }),
  };
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9e4dc,
    roughness: 0.7,
  });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    groundMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const rotatedBounds = new THREE.Box3();
  let seenFinish;
  function setFinish(finish) {
    const name = finishes[finish] ? finish : "pearl";
    if (seenFinish === name) return;
    seenFinish = name;
    const color = { pearl: 0xeeeae3, silver: 0x151619, glass: 0x101a27 }[name];
    scene.background.setHex(color);
    scene.fog = new THREE.Fog(color, 20, 55);
    groundMaterial.color.setHex(color);
    keyLight.intensity = name === "pearl" ? 2.4 : 0.5;
    letters.traverse((object) => {
      if (object.isMesh) {
        object.material = finishes[name];
        object.castShadow = name !== "glass";
      }
    });
    dirty = true;
  }

  const tubeRadius = 0.47;
  let letterMeshes = [];
  let baseScale = 1;
  let isDragging = false;
  let previousX = 0;
  let previousY = 0;
  let rotationX = -0.025;
  let rotationY = -0.07;
  let rotationZ = 0;
  let velocityX = 0;
  let velocityY = 0;
  let targetBreath = 0;
  let frame = 0;
  let wordBounds = { width: 9.8, height: 3.9 };

  function addTubeLetter(group, points) {
    // One closed capsule surface per letter: no intersecting end spheres,
    // which create visible seams and double refraction in glass.
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const segments = 180;
    const radial = 48;
    const cap = 12;
    const frames = curve.computeFrenetFrames(segments, false);
    const positions = [],
      normals = [],
      indices = [];
    const rings = [];
    for (let j = 0; j < cap; j++) {
      const angle = -Math.PI / 2 + ((j / cap) * Math.PI) / 2;
      rings.push({
        i: 0,
        offset: Math.sin(angle) * tubeRadius,
        radius: Math.cos(angle) * tubeRadius,
        angle,
      });
    }
    for (let i = 0; i <= segments; i++)
      rings.push({ i, offset: 0, radius: tubeRadius, angle: 0 });
    for (let j = 1; j <= cap; j++) {
      const angle = ((j / cap) * Math.PI) / 2;
      rings.push({
        i: segments,
        offset: Math.sin(angle) * tubeRadius,
        radius: Math.cos(angle) * tubeRadius,
        angle,
      });
    }
    rings.forEach((ring, row) => {
      const center = curve
        .getPointAt(ring.i / segments)
        .addScaledVector(frames.tangents[ring.i], ring.offset);
      for (let j = 0; j <= radial; j++) {
        const angle = (j / radial) * Math.PI * 2;
        const direction = frames.normals[ring.i]
          .clone()
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(frames.binormals[ring.i], Math.sin(angle));
        const point = center.clone().addScaledVector(direction, ring.radius);
        positions.push(point.x, point.y, point.z * 1.22);
        const normal = direction
          .multiplyScalar(Math.cos(ring.angle))
          .addScaledVector(frames.tangents[ring.i], Math.sin(ring.angle));
        normal.z /= 1.22;
        normal.normalize();
        normals.push(normal.x, normal.y, normal.z);
        if (row > 0 && j > 0) {
          const a = (row - 1) * (radial + 1) + j - 1,
            b = row * (radial + 1) + j - 1;
          indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, finishes.pearl);
    mesh.castShadow = true;
    group.add(mesh);
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
      v(1.1, -0.38),
      v(0.89, -0.03),
      v(0.18, -0.03),
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
      v(0.98, 1.0),
      v(0.3, 1.3),
      v(-0.55, 1.17),
      v(-1.0, 0.72),
      v(-0.75, 0.28),
      v(0, 0),
      v(0.75, -0.28),
      v(1.0, -0.72),
      v(0.55, -1.17),
      v(-0.3, -1.3),
      v(-0.98, -1.0),
    ]);
    return group;
  }

  function layoutLetters() {
    letterMeshes.forEach((mesh) => mesh.parent?.remove(mesh));
    letterMeshes = [makeG(), makeU(), makeS()];

    [-2.94, 0, 2.92].forEach((x, index) => {
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
      (visibleWidth * (isPortrait ? 0.9 : 0.84)) / wordBounds.width;
    const heightFit =
      (visibleHeight * (isPortrait ? 0.38 : 0.62)) / wordBounds.height;
    baseScale = Math.min(widthFit, heightFit, isPortrait ? 0.45 : 1.12);
    letters.position.set(0, -0.15, 0);
    ground.position.y = (-wordBounds.height * baseScale) / 2 - 0.25;
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
    setFinish(settings.finish);
    if (settings.paused !== wasPaused) dirty = true;
    wasPaused = settings.paused;
    if (settings.reset !== seenReset) {
      dirty = true;
      seenReset = settings.reset;
      rotationX = -0.025;
      rotationY = -0.07;
      rotationZ = velocityX = velocityY = 0;
    }
    if (!settings.paused) clock.tick(now, step);
    else {
      clock.reset();
      letters.rotation.set(rotationX, rotationY, rotationZ);
      letters.scale.setScalar(baseScale);
    }
    if (dirty) {
      // Keep the studio floor below the sculpture at every drag angle.
      rotatedBounds.setFromObject(letters);
      ground.position.y = rotatedBounds.min.y - 0.14;
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
    if (event.key === "Home") {
      rotationX = -0.025;
      rotationY = -0.07;
      rotationZ = 0;
    }
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
    Object.values(finishes).forEach((material) => material.dispose());
    environment.dispose();
    ground.geometry.dispose();
    groundMaterial.dispose();
    keyLight.shadow.dispose();
    letters.traverse((object) => object.geometry?.dispose());
  };
}
