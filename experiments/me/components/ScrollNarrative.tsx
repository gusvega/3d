"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters } from "@/data/content";
import { narrative, notifyScene, clamp } from "@/lib/timeline";
export default function ScrollNarrative() {
  const current = useRef<HTMLSpanElement>(null),
    bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      mobile = matchMedia("(max-width: 700px)");
    let offsets: number[] = [];
    const measure = () => {
      offsets = chapters.map(
        ([id]) => document.getElementById(id)?.offsetTop ?? 0,
      );
    };
    const update = () => {
      const y = window.scrollY + window.innerHeight * 0.28;
      let index = 0;
      for (let i = 0; i < offsets.length; i++) if (y >= offsets[i]) index = i;
      narrative.chapter = index;
      narrative.local = clamp(
        (y - offsets[index]) /
          ((offsets[index + 1] ?? document.documentElement.scrollHeight) -
            offsets[index]),
      );
      narrative.progress = clamp(
        window.scrollY /
          Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight,
          ),
      );
      narrative.reduced = reduced.matches;
      narrative.mobile = mobile.matches;
      narrative.visible = !document.hidden;
      if (current.current)
        current.current.textContent = `${String(Math.max(0, index - 1)).padStart(2, "0")} / ${chapters[index][1].toUpperCase()}`;
      if (bar.current)
        bar.current.style.transform = `scaleX(${narrative.progress})`;
      document.documentElement.dataset.chapter = chapters[index][0];
      document.documentElement.style.setProperty(
        "--scene-offset",
        `${offsets[index] - window.scrollY}px`,
      );
      notifyScene();
    };
    measure();
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: update,
      onRefresh: () => {
        measure();
        update();
      },
    });
    reduced.addEventListener("change", update);
    mobile.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    const resize = new ResizeObserver(() => ScrollTrigger.refresh());
    resize.observe(document.body);
    update();
    return () => {
      trigger.kill();
      resize.disconnect();
      reduced.removeEventListener("change", update);
      mobile.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div className="narrative-status" aria-hidden="true">
      <span ref={current}>00 / ARRIVE</span>
      <span>ONE CREATIVE SYSTEM</span>
      <div className="progress-track">
        <div ref={bar} />
      </div>
    </div>
  );
}
