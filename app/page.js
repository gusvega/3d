import Link from "next/link";

const sketches = [
  {
    href: "/gus",
    title: "GUS",
    description: "Glossy balloon-letter wordmark with drag-controlled motion.",
    meta: "Name study",
  },
  {
    href: "/ferrofluid",
    title: "Ferrofluid",
    description: "Audio-reactive liquid sphere driven by microphone or uploaded sound.",
    meta: "Audio sketch",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-inner" aria-labelledby="landing-title">
        <p className="eyebrow">Interactive 3D sketches</p>
        <h1 id="landing-title">Gus 3D</h1>
        <p className="landing-copy">
          A small collection of full-screen WebGL experiments tuned for direct
          interaction, polished materials, and responsive composition.
        </p>
        <div className="sketch-grid">
          {sketches.map((sketch) => (
            <Link className="sketch-card" href={sketch.href} key={sketch.href}>
              <span className="sketch-meta">{sketch.meta}</span>
              <span className="sketch-title">{sketch.title}</span>
              <span className="sketch-description">{sketch.description}</span>
              <span className="sketch-action" aria-hidden="true">
                Open
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
