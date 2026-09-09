import Link from "next/link";
const sketches = [
  {
    href: "/me",
    title: "me",
    number: "03",
    type: "Creative system",
    badge: "Work in progress",
    description:
      "Music, software and hardware. I’m still working on this interactive world. Explore it as it takes shape.",
    image: "/me-preview.webp",
  },
  {
    href: "/gus",
    title: "GUS",
    number: "01",
    type: "Name study",
    badge: "Three finishes",
    description:
      "Pearl, silver, and smoked glass. Turn the sculpture and watch each finish catch the light.",
    image: "/gus-preview.png",
  },
  {
    href: "/ferrofluid",
    title: "Ferrofluid",
    number: "02",
    type: "Sound study",
    badge: "Audio reactive",
    description:
      "Sound becomes a living surface. Play a pulse, bring a track, or let the world around you in.",
    image: "/fluid-preview.png",
  },
].sort((a, b) => Number(a.number) - Number(b.number));
export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <span className="brand">
          Gus Vega <span>/ Digital experiments</span>
        </span>
        <span className="header-note">
          <i aria-hidden="true" /> Made to be played with
        </span>
      </header>
      <section className="gallery-intro" aria-labelledby="gallery-title">
        <div>
          <span className="eyebrow">A collection of interactive studies</span>
          <h1 id="gallery-title">
            Small experiments.
            <br />
            <em>A different feeling.</em>
          </h1>
        </div>
        <p>
          Exploring the space between sound, light, and form. Three little
          worlds. Yours to move.
        </p>
      </section>
      <div className="sketch-grid">
        {sketches.map((sketch) => {
          const Card = sketch.href === "/me" ? "a" : Link;
          return (
            <Card
              key={sketch.href}
              href={sketch.href}
              className="sketch-card"
              {...(sketch.href === "/me" ? {} : { prefetch: false })}
            >
              <div
                className={`sketch-preview ${sketch.number === "02" ? "fluid-preview" : ""}`}
              >
                <span className="preview-number">{sketch.number} /</span>
                <img src={sketch.image} alt="" width="800" height="500" />
                <span className="preview-badge">{sketch.badge}</span>
              </div>
              <div className="sketch-content">
                <div>
                  <span className="eyebrow">{sketch.type}</span>
                  <h2>{sketch.title}</h2>
                  <p>{sketch.description}</p>
                </div>
                <span className="open-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            </Card>
          );
        })}
      </div>
      <footer className="gallery-footer">
        <span>Built with curiosity. By Gus Vega.</span>
        <span>Explore with a mouse, touch, or keyboard.</span>
      </footer>
    </main>
  );
}
