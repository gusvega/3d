"use client";
import { useEffect, useState } from "react";
export function useMotion() {
  // Keep the first frame still until the system preference is known.
  const [paused, setPaused] = useState(true);
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return {
    paused,
    setPaused,
    reset,
    resetView: () => setReset((value) => value + 1),
  };
}
