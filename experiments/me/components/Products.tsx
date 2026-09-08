"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
const PluginViewer = dynamic(() => import("@/three/plugins/PluginViewer"), {
  ssr: false,
  loading: () => <p className="availability">Loading instrument study…</p>,
});
import { ArrowUpRight, X } from "lucide-react";
import { plugins } from "@/data/content";
const ratios: Record<string, [number, number]> = {
  UMBRA: [700, 560],
  FORMA: [920, 580],
  SPECTRA: [1040, 810],
  SEQUA: [1200, 754],
  LUMEN: [2048, 1191],
};
export function InstrumentUI({ name }: { name: string }) {
  const [width, height] = ratios[name];
  return (
    <div className="instrument-image">
      <Image
        src={`/me/plugins/${name.toLowerCase()}.webp`}
        alt={`${name} audio plug-in interface`}
        width={width}
        height={height}
        sizes="(max-width:700px) 88vw, 48vw"
      />
    </div>
  );
}
export default function Products() {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState(0),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);
  const [modelIndex, setModelIndex] = useState(0);
  const [modelsVisible, setModelsVisible] = useState(false);
  const modelSection = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setModelsVisible(entry.isIntersecting),
      { rootMargin: "150px" },
    );
    if (modelSection.current) observer.observe(modelSection.current);
    return () => observer.disconnect();
  }, []);
  const p = plugins[selected];
  return (
    <>
      <div className="plugin-model-showcase" ref={modelSection}>
        <div className="plugin-model-heading">
          <span className="eyebrow">
            SOFTWARE INTO FORM / 3D INSTRUMENT STUDIES
          </span>
          <h3>Inside the tools.</h3>
        </div>
        <div
          className="plugin-model-tabs"
          aria-label="Choose a 3D plugin design"
        >
          {plugins.map((plugin, i) => (
            <button
              key={plugin.name}
              type="button"
              aria-pressed={modelIndex === i}
              onClick={() => setModelIndex(i)}
            >
              {plugin.name}
            </button>
          ))}
        </div>
        <div className="plugin-model-showcase-body">
          {modelsVisible && !open ? (
            <PluginViewer
              key={plugins[modelIndex].name}
              name={plugins[modelIndex].name}
            />
          ) : (
            <div className="plugin-model-placeholder" />
          )}
        </div>
      </div>
      <div className="plugin-grid">
        {plugins.map((product, i) => (
          <article
            className={`plugin-card plugin-card-${i}`}
            key={product.name}
          >
            <button
              className="product-open"
              aria-label={`Explore ${product.name}`}
              onClick={() => {
                setSelected(i);
                setOpen(true);
                dialog.current?.showModal();
              }}
            >
              <div className="product-stage">
                <span className="product-edition">
                  {String(i + 1).padStart(2, "0")} / AUDIO SOFTWARE
                </span>
                <InstrumentUI name={product.name} />
              </div>
              <div className="product-copy">
                <div className="product-summary">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                  </div>
                  <ArrowUpRight size={22} strokeWidth={1} />
                </div>
                <p className="product-description">{product.description}</p>
                {i === 0 && (
                  <p className="product-feature-copy">
                    A space for melodic memory, cinematic depth and slow
                    transformation.
                  </p>
                )}
                <span className="text-link">
                  EXPLORE {product.name}
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          </article>
        ))}
      </div>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="product-title"
        className="product-dialog"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          className="dialog-close"
          autoFocus
          aria-label="Close instrument details"
          onClick={() => dialog.current?.close()}
        >
          CLOSE
          <X size={18} />
        </button>
        <span className="eyebrow">TOOLS FOR CREATORS</span>
        <h2 id="product-title">{p.name}</h2>
        {open && <PluginViewer key={p.name} name={p.name} />}
        <details className="plugin-software-reference">
          <summary>View software interface reference</summary>
          <InstrumentUI name={p.name} />
        </details>
        <p className="eyebrow">{p.category}</p>
        <p>{p.detail}</p>
        <p className="availability">
          Interface preview. Downloads will be connected in a later release.
        </p>
      </dialog>
    </>
  );
}
