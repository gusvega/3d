"use client";
import { useState } from "react";
import SceneCanvas from "./SceneCanvas";
import { useMotion } from "./use-motion";
export default function GusScene() {
  const [finish, setFinish] = useState("pearl");
  const { paused, setPaused, reset, resetView } = useMotion();
  return (
    <section
      className="gus-experience"
      data-finish={finish}
      aria-labelledby="gus-title"
    >
      <div className="scene-caption">
        <span className="eyebrow">01 / GUS — Material studies</span>
        <h1 id="gus-title">
          {
            {
              pearl: "Sculpted pearl.",
              silver: "Liquid silver.",
              glass: "Smoked glass.",
            }[finish]
          }
        </h1>
        <p>Drag to turn. Find your light.</p>
      </div>
      <SceneCanvas kind="gus" settings={{ paused, reset, finish }} />
      <div className="gus-finishes" role="group" aria-label="Material finish">
        {[
          ["pearl", "Sculpted pearl"],
          ["silver", "Liquid silver"],
          ["glass", "Smoked glass"],
        ].map(([value, label], index) => (
          <button
            key={value}
            aria-pressed={finish === value}
            onClick={() => setFinish(value)}
          >
            <span className={`finish-swatch ${value}`} aria-hidden="true" />
            <span>{label}</span>
            <small>0{index + 1}</small>
          </button>
        ))}
      </div>
      <div className="scene-toolbar" aria-label="Scene controls">
        <p>Drag to rotate · Arrow keys when focused</p>
        <a
          className="gus-download"
          href={`/gus/${{ pearl: "sculpted-pearl", silver: "liquid-silver", glass: "smoked-glass" }[finish]}.png`}
          target="_blank"
          rel="noreferrer"
        >
          Design reference
        </a>
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
