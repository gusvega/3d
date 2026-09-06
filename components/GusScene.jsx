"use client";
import SceneCanvas from "./SceneCanvas";
import { useMotion } from "./use-motion";
export default function GusScene() {
  const { paused, setPaused, reset, resetView } = useMotion();
  return (
    <section className="gus-experience" aria-labelledby="gus-title">
      <div className="scene-caption">
        <span className="eyebrow">01 / Name study</span>
        <h1 id="gus-title">
          Soft form.
          <br />
          Solid presence.
        </h1>
        <p>GUS, cast in light. Take it for a spin.</p>
      </div>
      <SceneCanvas kind="gus" settings={{ paused, reset }} />
      <div className="scene-toolbar" aria-label="Scene controls">
        <p>
          Drag to rotate <span>·</span> Arrow keys when focused
        </p>
        <button onClick={resetView}>Reset view</button>
        <button
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      </div>
    </section>
  );
}
