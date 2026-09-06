"use client";

import { useEffect, useRef, useState } from "react";

export default function SceneCanvas({ kind, settings, audioRef }) {
  const canvasRef = useRef(null);
  const latest = useRef(settings);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    latest.current = settings;
  }, [settings]);
  useEffect(() => {
    if (error) return;
    let cancelled = false;
    let dispose;
    const canvas = canvasRef.current;
    function lost(event) {
      event.preventDefault();
      setError(
        "The graphics connection was interrupted. You can reload the scene below.",
      );
    }
    canvas.addEventListener("webglcontextlost", lost);
    const load =
      kind === "fluid"
        ? import("@/lib/fluid-scene")
        : import("@/lib/gus-scene");
    load
      .then((module) => {
        if (cancelled) return;
        dispose =
          kind === "fluid"
            ? module.createFluidScene(
                canvas,
                () => audioRef?.current,
                () => latest.current,
              )
            : module.createGusScene(canvas, () => latest.current);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "This browser could not start the 3D scene. Enable hardware acceleration or try another browser.",
          );
      });
    return () => {
      cancelled = true;
      dispose?.();
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [kind, audioRef, attempt, error]);

  return (
    <div className="scene-surface" data-ready={ready && !error}>
      <canvas
        key={attempt}
        ref={canvasRef}
        hidden={!!error}
        tabIndex={0}
        aria-label={`${kind === "fluid" ? "Ferrofluid sphere" : "GUS wordmark"}. Drag or use arrow keys to rotate. Home resets the view.${kind === "fluid" ? " Plus and minus zoom." : ""}`}
      />
      {!ready && !error ? (
        <div className="scene-loading" role="status">
          Preparing the scene<span className="loading-dot">…</span>
        </div>
      ) : null}
      {error ? (
        <div className="scene-fallback" role="alert">
          <div className={`static-object ${kind}`} aria-hidden="true">
            {kind === "gus" ? "GUS" : ""}
          </div>
          <h2>A moment of stillness.</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              setReady(false);
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
