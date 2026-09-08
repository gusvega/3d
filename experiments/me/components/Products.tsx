"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
const PluginViewer = dynamic(() => import("@/three/plugins/PluginViewer"), {
  ssr: false,
  loading: () => (
    <div className="model-loading">
      <p className="availability">Loading instrument study…</p>
    </div>
  ),
});
import { ArrowUpRight, X } from "lucide-react";
import { plugins } from "@/data/content";
import { pluginDesigns } from "@/data/plugin-models";
export function InstrumentUI({ name }: { name: string }) {
  const [width, height] = pluginDesigns.find(
    (design) => design.name === name,
  )!.sourceSize;
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
  const p = plugins[selected];
  return (
    <>
      <div className="plugin-model-showcase">
        <div className="plugin-model-heading">
          <span className="eyebrow">WORKING SOFTWARE / PHYSICAL CONCEPT</span>
          <h3>One sound. More possibilities.</h3>
        </div>
        <div className="product-context">
          <p>
            UMBRA turns a moment of sound into atmosphere.
            <br />
            Scroll to look beneath its controls.
          </p>
          <a
            className="text-link"
            href="https://www.gusvega.com/umbra"
            target="_blank"
            rel="noopener noreferrer"
          >
            EXPLORE THE SOFTWARE ↗
          </a>
          <button
            className="text-link"
            aria-label="Explore UMBRA"
            onClick={() => {
              setSelected(0);
              setOpen(true);
              dialog.current?.showModal();
            }}
          >
            VIEW THE INTERFACE ↗
          </button>
        </div>
        <section aria-label="UMBRA exploded study">
          <PluginViewer name="UMBRA" />
        </section>
      </div>
      <div className="plugin-grid">
        {plugins.slice(1).map((product, index) => {
          const i = index + 1;
          return (
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
          );
        })}
      </div>
      <p className="collection-note">
        Each interface is real software. Explore a tool to see its own
        scroll-driven physical study.
      </p>
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
        <span className="eyebrow">SOFTWARE PROJECT / 3D HARDWARE CONCEPT</span>
        <h2 id="product-title">{p.name}</h2>
        {open && <PluginViewer key={p.name} name={p.name} />}
        <details className="plugin-software-reference">
          <summary>View software interface reference</summary>
          <InstrumentUI name={p.name} />
        </details>
        <p className="eyebrow">{p.category}</p>
        <p>{p.detail}</p>
        <p className="availability">
          The software and this physical concept are different stages of the
          same idea.
        </p>
        <a
          className="text-link"
          href={`https://www.gusvega.com/${p.name.toLowerCase()}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          PRODUCT DETAILS & AVAILABILITY ↗
        </a>
      </dialog>
    </>
  );
}
