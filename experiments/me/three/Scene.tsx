"use client";
import { useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { narrative, listeners, smooth } from "@/lib/timeline";
import CreativeCore from "./CreativeCore";
import Astra from "./Astra";
declare global {
  interface Window {
    __gvDiagnostics?: () => {
      frames: number;
      drawCalls: number;
      geometries: number;
      textures: number;
      chapter: number;
      reduced: boolean;
    };
  }
}
function CameraRig() {
  const { camera, size, invalidate, gl, setFrameloop } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "development")
      window.__gvDiagnostics = () => ({
        frames: gl.info.render.frame,
        drawCalls: gl.info.render.calls,
        ...gl.info.memory,
        chapter: narrative.chapter,
        reduced: narrative.reduced,
      });
    const onChange = () => {
      const active =
        narrative.visible && [0, 1, 4, 7, 8].includes(narrative.chapter);
      setFrameloop(active ? "demand" : "never");
      if (active) invalidate();
    };
    listeners.add(onChange);
    const lost = (e: Event) => {
      e.preventDefault();
      setFrameloop("never");
    };
    const restored = () => {
      setFrameloop("demand");
      invalidate();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () => {
      delete window.__gvDiagnostics;
      listeners.delete(onChange);
      gl.domElement.removeEventListener("webglcontextlost", lost);
      gl.domElement.removeEventListener("webglcontextrestored", restored);
    };
  }, [invalidate, gl, setFrameloop]);
  useFrame(() => {
    const narrow = size.width < 500;
    const scale = narrow ? 1.03 : 1;
    const positions = [
      [6.0, 7.3, 11.8],
      [5.0, 8.8, 12.3],
      [6.0, 7.3, 11.8],
      [6.0, 7.3, 11.8],
      [3.2, 8.8, 14.8],
      [6.0, 7.3, 11.8],
      [6.0, 7.3, 11.8],
      [5.0, 8.8, 12.3],
      [6.0, 7.3, 11.8],
      [6.0, 7.3, 11.8],
    ];
    const from = positions[Math.max(0, narrative.chapter - 1)],
      to = positions[narrative.chapter];
    const t = narrative.reduced ? 0 : smooth(narrative.local * 3);
    camera.position.set(
      (from[0] + (to[0] - from[0]) * t) * scale,
      (from[1] + (to[1] - from[1]) * t) * scale,
      (from[2] + (to[2] - from[2]) * t) * scale,
    );
    camera.lookAt(0, narrative.chapter === 4 ? 0.45 : 0.2, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}
export default function Scene() {
  const [dpr, setDpr] = useState(1);
  const [simple, setSimple] = useState(false);
  useEffect(() => {
    const media = matchMedia("(max-width: 900px)");
    const update = () => {
      setSimple(media.matches);
      setDpr(Math.min(window.devicePixelRatio, media.matches ? 1.25 : 1.65));
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [6.0, 7.3, 11.8], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <CameraRig />
      <ambientLight intensity={1.15} />
      <directionalLight position={[-4, 7, 4]} intensity={2} />
      <directionalLight position={[5, 2, -5]} intensity={2.5} />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.5}
          color="white"
          scale={[10, 5, 1]}
          position={[-3, 5, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={3}
          scale={[5, 8, 1]}
          position={[5, 1, -3]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>
      <group scale={1.12}>
        <CreativeCore simple={simple} />
      </group>
      <Astra />
    </Canvas>
  );
}
