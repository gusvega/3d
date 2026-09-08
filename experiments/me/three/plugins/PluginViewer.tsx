"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Group,
  AnimationClip,
  VectorKeyframeTrack,
  PerspectiveCamera,
} from "three";
import PluginAssembly from "./PluginAssembly";
import { pluginDesigns } from "@/data/plugin-models";
function ResponsiveCamera() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const c = camera as PerspectiveCamera;
    c.fov = size.width < 600 ? 42 : 32;
    c.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, invalidate]);
  return null;
}
export default function PluginViewer({ name }: { name: string }) {
  const [ready, setReady] = useState(false);
  const design = pluginDesigns.find((d) => d.name === name)!;
  const [spread, setSpread] = useState(0),
    [selected, setSelected] = useState(-1),
    [reduced, setReduced] = useState(false),
    [available, setAvailable] = useState(false),
    [exporting, setExporting] = useState(false),
    [error, setError] = useState("");
  const model = useRef<Group>(null),
    host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const c = document.createElement("canvas"),
      gl = c.getContext("webgl2");
    setAvailable(!!gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (host.current) o.observe(host.current);
    return () => o.disconnect();
  }, []);
  async function download() {
    if (!model.current) return;
    setExporting(true);
    setError("");
    try {
      const { GLTFExporter } =
        await import("three/examples/jsm/exporters/GLTFExporter.js");
      const forward: VectorKeyframeTrack[] = [],
        reverse: VectorKeyframeTrack[] = [];
      model.current.traverse((node) => {
        const { assembled, exploded, phase = [0.01, 0.99] } = node.userData;
        if (assembled && exploded) {
          forward.push(
            new VectorKeyframeTrack(
              `${node.uuid}.position`,
              [0, phase[0] * 2.4, phase[1] * 2.4, 2.4],
              [...assembled, ...assembled, ...exploded, ...exploded],
            ),
          );
          reverse.push(
            new VectorKeyframeTrack(
              `${node.uuid}.position`,
              [0, (1 - phase[1]) * 2.4, (1 - phase[0]) * 2.4, 2.4],
              [...exploded, ...exploded, ...assembled, ...assembled],
            ),
          );
        }
      });
      const result = await new GLTFExporter().parseAsync(model.current, {
        binary: true,
        animations: [
          new AnimationClip("Explode", 2.4, forward),
          new AnimationClip("Assemble", 2.4, reverse),
        ],
      });
      const url = URL.createObjectURL(
        new Blob([result as ArrayBuffer], { type: "model/gltf-binary" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.toLowerCase()}-${spread > 0.1 ? "exploded" : "assembled"}.glb`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("The model could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="plugin-model-viewer" ref={host}>
      <div className="plugin-model-stage" aria-hidden="true">
        {available ? (
          <Canvas
            key={name}
            frameloop={visible ? "demand" : "never"}
            dpr={[1, 1.5]}
            camera={{ position: [3.5, 9.5, 10.5], fov: 32 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ResponsiveCamera />
            <ambientLight intensity={1.6} />
            <directionalLight position={[2, 8, 4]} intensity={3} />
            <directionalLight position={[-5, 4, -3]} intensity={2} />
            <Suspense fallback={null}>
              <PluginAssembly
                design={design}
                spread={spread}
                selected={selected}
                reduced={reduced}
                modelRef={model}
                onReady={setReady}
              />
            </Suspense>
          </Canvas>
        ) : (
          <img src={`/me/plugins/${name.toLowerCase()}.webp`} alt="" />
        )}
      </div>
      <div className="plugin-model-controls">
        <button type="button" onClick={() => setSpread(spread > 0.5 ? 0 : 1)}>
          {spread > 0.5 ? "Assemble instrument" : "Explode instrument"}
        </button>
        <label>
          Separation
          <input
            aria-label={`${name} assembly separation`}
            type="range"
            min="0"
            max="1"
            step=".01"
            value={spread}
            onChange={(e) => setSpread(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={!available || !ready || exporting}
          onClick={download}
        >
          {exporting ? "Exporting…" : "Download GLB"}
        </button>
      </div>
      <div className="assembly-phases" aria-label="Explosion stages">
        {["Enclosure", "Electronics", "Interface", "Fasteners"].map(
          (label, i) => (
            <button
              type="button"
              key={label}
              aria-pressed={Math.abs(spread - [0.22, 0.48, 0.78, 1][i]) < 0.03}
              onClick={() => setSpread([0.22, 0.48, 0.78, 1][i])}
            >
              <span>0{i + 1}</span>
              {label}
            </button>
          ),
        )}
      </div>
      <p className="plugin-model-summary">{design.summary}</p>
      <div
        className="plugin-module-legend"
        aria-label={`${name} assembly layers`}
      >
        {design.modules.map((m, i) => (
          <button
            type="button"
            key={m.name}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setSpread(1);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {m.name}
          </button>
        ))}
      </div>
      <p className="availability">
        3D concept derived from the software interface. Structural and
        processing layers are visual metaphors.
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
