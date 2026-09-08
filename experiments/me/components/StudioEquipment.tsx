"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { studioEquipment, equipmentBounds } from "@/data/studio";
import { clamp, smooth } from "@/lib/timeline";

const featured = [0, 1, 3];
const photo = "/me/images/studio-original.webp";
function PhotoPiece({ index }: { index: number }) {
  const item = studioEquipment[index],
    b = equipmentBounds(item.points);
  const clip = `polygon(${item.points.map((p) => `${((p[0] - b.x) / b.w) * 100}% ${((p[1] - b.y) / b.h) * 100}%`).join(",")})`;
  return (
    <span
      className="studio-photo-piece"
      aria-hidden="true"
      style={
        {
          aspectRatio: `${b.w}/${b.h}`,
          "--piece-ratio": b.w / b.h,
          clipPath: clip,
          backgroundImage: `url(${photo})`,
          backgroundSize: `${(1280 / b.w) * 100}% ${(960 / b.h) * 100}%`,
          backgroundPosition: `${(b.x / (1280 - b.w)) * 100}% ${(b.y / (960 - b.h)) * 100}%`,
        } as CSSProperties
      }
    />
  );
}
export default function StudioEquipment() {
  const root = useRef<HTMLElement>(null),
    stage = useRef<HTMLDivElement>(null);
  const pieces = useRef<(HTMLButtonElement | null)[]>([]);
  const modeRef = useRef<"scroll" | "open" | "closed">("scroll");
  const [mode, setMode] = useState<"scroll" | "open" | "closed">("scroll");
  const [selected, setSelected] = useState(0);
  const [equipmentPage, setEquipmentPage] = useState(0);
  const [allEquipment, setAllEquipment] = useState(false);
  const allRef = useRef(false);
  function showCollection() {
    allRef.current = !allRef.current;
    setAllEquipment(allRef.current);
    pageRef.current = 0;
    setEquipmentPage(0);
    setSelected(0);
    changeMode("open");
  }
  const pageRef = useRef(0);
  function selectEquipment(index: number) {
    if (!featured.includes(index)) {
      allRef.current = true;
      setAllEquipment(true);
    }
    setSelected(index);
    pageRef.current = Math.floor(index / 6);
    setEquipmentPage(pageRef.current);
    changeMode("open");
  }
  function turnPage(delta: number) {
    pageRef.current = Math.max(0, Math.min(3, pageRef.current + delta));
    setEquipmentPage(pageRef.current);
    setSelected(pageRef.current * 6);
    changeMode("open");
  }
  const redraw = useRef<() => void>(() => {});
  function changeMode(next: typeof mode) {
    modeRef.current = next;
    setMode(next);
    redraw.current();
  }
  useEffect(() => {
    if (root.current) root.current.dataset.interactive = "true";
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0,
      active = true,
      displayed = 0;
    const paint = () => {
      raf = 0;
      const el = stage.current,
        section = root.current;
      if (!el || !section) return;
      const r = section.getBoundingClientRect();
      const travel = Math.max(
        1,
        section.offsetHeight - window.innerHeight + 100,
      );
      const progress = clamp((100 - r.top) / travel);
      const auto = motion.matches ? 0 : smooth((progress - 0.12) / 0.6);
      const target =
        modeRef.current === "open"
          ? 1
          : modeRef.current === "closed"
            ? 0
            : auto;
      const p =
        motion.matches || Math.abs(target - displayed) < 0.002
          ? target
          : displayed + (target - displayed) * 0.2;
      displayed = p;
      el.dataset.expanded = p > 0.65 ? "true" : "false";
      el.style.setProperty("--separation", String(p));
      const w = el.clientWidth,
        h = el.clientHeight,
        scale = Math.min(w / 1280, h / 960);
      const ox = (w - 1280 * scale) / 2,
        oy = (h - 960 * scale) / 2;
      const compact = w < 550;
      const cols = allRef.current ? (compact ? 2 : 5) : compact ? 1 : 3,
        rows = allRef.current
          ? compact
            ? 3
            : Math.ceil(studioEquipment.length / cols)
          : compact
            ? 3
            : 1;
      const cw = w / cols,
        ch = h / rows;
      pieces.current.forEach((button, i) => {
        if (!button) return;
        const b = equipmentBounds(studioEquipment[i].points);
        const slot = allRef.current
          ? compact
            ? i - pageRef.current * 6
            : i
          : featured.indexOf(i);
        const excluded =
          p > 0.25 && (slot < 0 || (allRef.current && compact && slot >= 6));
        button.style.visibility = excluded ? "hidden" : "visible";
        button.disabled = excluded;
        const tx = ((slot + cols * 20) % cols) * cw + 6,
          ty = Math.floor(slot / cols) * ch + 6;
        const bw = cw - 12,
          bh = ch - 12;
        const fit = Math.min(1.5, (bw - 12) / b.w, (bh - 24) / b.h);
        const x = ox + b.x * scale,
          y = oy + b.y * scale;
        const mix = (a: number, z: number) => a + (z - a) * p;
        button.style.transform = `translate3d(${mix(x, tx)}px,${mix(y, ty)}px,0)`;
        button.style.width = `${mix(b.w * scale, bw)}px`;
        button.style.height = `${mix(b.h * scale, bh)}px`;
        const image = button.firstElementChild as HTMLElement;
        image.style.width = `${mix(b.w * scale, b.w * fit)}px`;
        image.style.transform = `translate(${mix(0, (bw - b.w * fit) / 2)}px,${mix(0, (bh - 24 - b.h * fit) / 2)}px)`;
        button.style.zIndex = String(p > 0.5 ? 1 : 25 - i);
      });
      if (p !== target && active) raf = requestAnimationFrame(paint);
    };
    const request = () => {
      if (!raf && active) raf = requestAnimationFrame(paint);
    };
    redraw.current = request;
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) request();
      },
      { rootMargin: "100px" },
    );
    if (root.current) observer.observe(root.current);
    const resize = new ResizeObserver(request);
    if (stage.current) resize.observe(stage.current);
    window.addEventListener("scroll", request, { passive: true });
    motion.addEventListener("change", request);
    request();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", request);
      motion.removeEventListener("change", request);
      redraw.current = () => {};
    };
  }, []);
  const current = studioEquipment[selected];
  return (
    <figure
      ref={root}
      className="studio-exploration"
      aria-label="Explore Gus Vega's actual studio equipment"
    >
      <div className="studio-sticky">
        <div className="studio-toolbar">
          <div>
            <span className="eyebrow">
              AT THE KEYS / IN THE SOUND / INTO THE TRACK
            </span>
            <p>One space. Every part connected.</p>
          </div>
          <div className="studio-view-controls" aria-label="Studio photo view">
            <button
              type="button"
              aria-pressed={mode === "closed"}
              onClick={() => changeMode("closed")}
            >
              Photo
            </button>
            <button
              type="button"
              aria-pressed={mode === "open"}
              onClick={() => changeMode("open")}
            >
              Separate equipment
            </button>
            {mode !== "scroll" && (
              <button type="button" onClick={() => changeMode("scroll")}>
                Follow scroll
              </button>
            )}
          </div>
        </div>
        <div
          className="studio-featured-choices"
          aria-label="Studio starting points"
        >
          {featured.map((index, i) => (
            <button
              key={index}
              aria-pressed={selected === index}
              onClick={() => selectEquipment(index)}
            >
              <span>0{i + 1}</span>
              {["Find a melody", "Shape the sound", "Build the track"][i]}
            </button>
          ))}
          <button onClick={showCollection} aria-expanded={allEquipment}>
            {allEquipment
              ? "Back to three starting points"
              : "Explore all 20 pieces"}{" "}
            ↗
          </button>
        </div>
        {allEquipment && (
          <div className="studio-mobile-pages" aria-label="Equipment pages">
            <button
              type="button"
              onClick={() => turnPage(-1)}
              disabled={equipmentPage === 0}
              aria-label="Previous equipment"
            >
              ←
            </button>
            <span>
              {String(equipmentPage * 6 + 1).padStart(2, "0")}–
              {String(Math.min(20, equipmentPage * 6 + 6)).padStart(2, "0")} /
              20 PIECES
            </span>
            <button
              type="button"
              onClick={() => turnPage(1)}
              disabled={equipmentPage === 3}
              aria-label="Next equipment"
            >
              →
            </button>
          </div>
        )}
        <div className="studio-workspace">
          <div
            ref={stage}
            className="studio-photo-stage"
            style={{ "--separation": 0 } as CSSProperties}
          >
            {/* One unchanged source photograph also supplies every clipped detail. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="studio-room-photo"
              src={photo}
              alt="Gus Vega's actual studio: two equipment desks, an 88-key keyboard, stacked synthesizers, pad controllers, audio equipment, four monitors and microphones."
              width={1280}
              height={960}
              loading="lazy"
            />
            {studioEquipment.map((item, i) => (
              <button
                type="button"
                key={item.name}
                ref={(el) => {
                  pieces.current[i] = el;
                }}
                className="studio-equipment-layer"
                aria-label={`Inspect ${item.name}`}
                aria-pressed={selected === i}
                aria-controls="studio-equipment-detail"
                onClick={() => {
                  selectEquipment(i);
                }}
                onFocus={() => {
                  if (modeRef.current !== "open") changeMode("open");
                }}
              >
                <PhotoPiece index={i} />
                <span className="studio-piece-name">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {item.name}
                </span>
              </button>
            ))}
          </div>
          <aside
            className="studio-inspector"
            id="studio-equipment-detail"
            aria-label="Selected studio equipment"
          >
            <div className="studio-inspector-photo">
              <PhotoPiece index={selected} />
            </div>
            <div
              className="studio-detail-copy"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="eyebrow">
                {String(selected + 1).padStart(2, "0")} / {current.group}
              </span>
              <h3>{current.name}</h3>
              <p>{current.role}</p>
            </div>
            <label className="studio-select-label" htmlFor="studio-item">
              Explore every piece
            </label>
            <select
              id="studio-item"
              aria-label="Explore every piece"
              value={selected}
              onChange={(e) => {
                selectEquipment(Number(e.target.value));
              }}
            >
              {studioEquipment.map((item, i) => (
                <option key={item.name} value={i}>
                  {String(i + 1).padStart(2, "0")} — {item.name}
                </option>
              ))}
            </select>
            <p className="studio-source-note">
              Details from the original photograph. Some equipment is partially
              obscured.
            </p>
          </aside>
        </div>
        <figcaption className="studio-photo-caption">
          <span>GUS VEGA / THE STUDIO</span>
          <span>SCROLL TO SEPARATE · SELECT TO LOOK CLOSER</span>
        </figcaption>
      </div>
    </figure>
  );
}
