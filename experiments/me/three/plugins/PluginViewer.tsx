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
import UmbraModel from "./UmbraModel";
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
  const [visible, setVisible] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!track.current || reduced) return;
        const rect = track.current.getBoundingClientRect();
        const dialog = track.current.closest("dialog");
        const top = dialog ? dialog.getBoundingClientRect().top + 60 : 76;
        const viewport = dialog ? dialog.clientHeight : innerHeight;
        setSpread(
          Math.max(
            0,
            Math.min(1, (top - rect.top) / Math.max(1, rect.height - viewport)),
          ),
        );
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [reduced]);
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
    if (name === "UMBRA") {
      const a = document.createElement("a");
      a.href = "/me/models/umbra-blender-desktop.glb";
      a.download = "UMBRA-desktop.glb";
      a.click();
      return;
    }
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
    <div
      className="plugin-scroll-track"
      ref={track}
      data-plugin={name}
      data-spread={spread.toFixed(3)}
    >
      <div className="plugin-model-viewer" ref={host}>
        <div className="plugin-scroll-title">
          <h4>{name}</h4>
          <span>
            SCROLL TO REVEAL /{" "}
            {name === "UMBRA" ? "1087 × 865" : design.sourceSize.join(" × ")}
          </span>
        </div>
        <div className="plugin-model-stage" aria-hidden="true">
          {available && visible ? (
            <Canvas
              key={name}
              frameloop={visible ? "demand" : "never"}
              dpr={[1, 1.5]}
              camera={{ position: [3.5, 9.5, 10.5], fov: 32 }}
              gl={{ antialias: true, alpha: true }}
            >
              <ResponsiveCamera />
              <ambientLight intensity={name === "UMBRA" ? 0.5 : 1.6} />
              <directionalLight
                position={[2, 8, 4]}
                intensity={name === "UMBRA" ? 1.5 : 3}
              />
              <directionalLight
                position={[-5, 4, -3]}
                intensity={name === "UMBRA" ? 1 : 2}
              />
              <Suspense fallback={null}>
                {name === "UMBRA" ? (
                  <UmbraModel spread={spread} onReady={setReady} />
                ) : (
                  <PluginAssembly
                    design={design}
                    spread={spread}
                    selected={selected}
                    reduced={reduced}
                    modelRef={model}
                    onReady={setReady}
                  />
                )}
              </Suspense>
            </Canvas>
          ) : (
            <img src={`/me/plugins/${name.toLowerCase()}.webp`} alt="" />
          )}
        </div>
        <div className="plugin-model-controls">
          {reduced ? (
            <button
              type="button"
              onClick={() => setSpread(spread > 0.5 ? 0 : 1)}
            >
              {spread > 0.5 ? "Assemble instrument" : "Reveal layers"}
            </button>
          ) : (
            <span className="eyebrow">
              {String(Math.round(spread * 100)).padStart(3, "0")} / EXPLODED
              VIEW
            </span>
          )}
          <button
            type="button"
            disabled={!available || !ready || exporting}
            onClick={download}
          >
            {exporting ? "Exporting…" : "Download GLB"}
          </button>
        </div>
        <div className="assembly-phases" aria-label="Explosion stages">
          {(name === "UMBRA"
            ? ["Fasteners", "Controls", "Faceplate", "Electronics"]
            : ["Enclosure", "Electronics", "Interface", "Fasteners"]
          ).map((label, i) => (
            <span
              key={label}
              data-active={
                spread >=
                (name === "UMBRA"
                  ? [0, 0.12, 0.32, 0.64]
                  : [0.02, 0.12, 0.28, 0.72])[i]
              }
            >
              <small>0{i + 1}</small> {label}
            </span>
          ))}
        </div>
        <p className="plugin-model-summary">
          {name === "UMBRA"
            ? "A machined faceplate, removable controls, recessed display and two circuit-board assemblies. Built from the supplied UMBRA v1.6.2 reference."
            : design.summary}
        </p>
        <div
          className="plugin-module-legend"
          aria-label={`${name} assembly layers`}
        >
          {name === "UMBRA" ? (
            <p className="availability">
              FASTENERS / ENCODERS / FACEPLATE / DISPLAY / CONTROL PCB / DSP /
              ENCLOSURE
            </p>
          ) : (
            design.modules.map((m, i) => (
              <button
                type="button"
                key={m.name}
                aria-pressed={selected === i}
                onClick={() => {
                  setSelected(i);
                  if (reduced) setSpread(1);
                }}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {m.name}
              </button>
            ))
          )}
        </div>
        <p className="availability">
          3D concept derived from the software interface. Structural and
          processing layers are visual metaphors.
        </p>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
