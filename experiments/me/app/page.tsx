import Image from "next/image";
import { ArrowDown } from "lucide-react";
import StudioEquipment from "@/components/StudioEquipment";
import Navigation from "@/components/Navigation";
import SceneLoader from "@/components/SceneLoader";
import ScrollNarrative from "@/components/ScrollNarrative";
import Products from "@/components/Products";
import {
  AstraEngines,
  ProcessExplorer,
  MusicExplorer,
} from "@/components/Explorers";
function Label({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-label">
      <span>{number}</span>
      <span>{children}</span>
      <span className="label-line" />
    </div>
  );
}
function Annotation({
  children,
  number,
}: {
  children: React.ReactNode;
  number: string;
}) {
  return (
    <div className="annotation">
      <span className="annotation-point" />
      <span>{children}</span>
      <small>{number}</small>
    </div>
  );
}
export default function Home() {
  return (
    <>
      <Navigation />
      <SceneLoader />
      <ScrollNarrative />
      <main>
        <section id="arrive" className="hero scene-section">
          <div className="hero-kicker eyebrow">
            <span className="tiny-dot" /> ARTIST / BUILDER / ENGINEER
          </div>
          <div className="hero-copy">
            <h1>
              MUSIC.
              <br />
              TECHNOLOGY.
              <br />
              <span>
                A MORE CREATIVE <br />
                TOMORROW
              </span>
              <span className="heading-period">.</span>
            </h1>
            <p>
              I build the tools
              <br />I want to make
              <br />
              the music I want
              <br />
              to hear.
            </p>
          </div>
          <div className="hero-object-label">
            <span>01 — THE CREATIVE CORE</span>
            <span>ARTIST / BUILDER / ENGINEER</span>
          </div>
          <a href="#explode" className="scroll-invitation">
            <span className="scroll-icon">
              <ArrowDown size={20} strokeWidth={1} />
            </span>
            <span>
              SCROLL TO EXPLORE
              <br />
              <small>ONE SYSTEM. MANY LAYERS.</small>
            </span>
          </a>
          <div className="hero-footer">
            <span>GUS VEGA / INDEPENDENT CREATIVE PRACTICE</span>
            <span>MUSIC + TOOLS + SYSTEMS</span>
          </div>
        </section>
        <section id="explode" className="scene-section explode-section">
          <div className="section-copy">
            <Label number="00">THE SYSTEM</Label>
            <h2>
              Nothing here
              <br />
              exists alone.
            </h2>
            <p>
              A sound becomes an idea.
              <br />
              An idea becomes an instrument.
              <br />
              An instrument becomes music.
            </p>
            <p className="muted">
              A closer look at the layers
              <br />
              of one creative practice.
            </p>
          </div>
          <div className="object-annotations">
            <Annotation number="01">CONTROL / INTERACTION</Annotation>
            <Annotation number="02">SOUND / PROCESSING</Annotation>
            <Annotation number="03">STRUCTURE / SYSTEMS</Annotation>
          </div>
        </section>
        <section id="music" className="music-section content-section">
          <div className="section-intro">
            <div>
              <Label number="01">MUSIC</Label>
              <h2>
                It starts
                <br />
                with a feeling.
              </h2>
            </div>
            <div className="intro-copy">
              <span className="eyebrow">MELODIC HOUSE / DEEP / EMOTIONAL</span>
              <p>
                Music is where it all starts.
                <br />
                It is the reason I build.
              </p>
              <p>
                A space to explore, feel
                <br />
                and keep moving forward.
              </p>
            </div>
          </div>
          <MusicExplorer />
          <div className="music-formats">
            <div>
              <span>01 / LISTEN</span>
              <h3>
                <a
                  href="https://open.spotify.com/album/5JmPznW0ITbZRF2ML4FlWq"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Low Light ↗
                </a>
              </h3>
              <p>The latest album. Listen on Spotify.</p>
            </div>
            <div>
              <span>02 / EXPERIENCE</span>
              <h3>No Direction</h3>
              <p>Live sets. An open-ended journey.</p>
            </div>
            <div>
              <span>03 / IN THE ROOM</span>
              <h3>Studio performances</h3>
              <p>Ideas in their most immediate form.</p>
            </div>
          </div>
        </section>
        <section id="plugins" className="content-section plugins-section">
          <div className="section-intro">
            <div>
              <Label number="02">PLUG-INS</Label>
              <h2>Made to make.</h2>
            </div>
            <div className="intro-copy">
              <span className="eyebrow">TOOLS FOR CREATORS</span>
              <p>
                Effects, instruments and creative systems designed to inspire
                new ideas and make the creative process flow.
              </p>
            </div>
          </div>
          <Products />
        </section>
        <section id="astra" className="scene-section astra-section">
          <div className="section-copy">
            <Label number="03">ASTRA</Label>
            <div className="development-status">
              <span className="tiny-dot" /> IN DEVELOPMENT
            </div>
            <h2 className="astra-title">ASTRA</h2>
            <span className="eyebrow">EVERYTHING TOGETHER</span>
            <p className="astra-manifesto">
              Four sound engines.
              <br />
              Umbra.
              <br />
              Sequa.
              <br />
              <span>One instrument.</span>
            </p>
            <p>A new way to create.</p>
            <AstraEngines />
            <p className="astra-note">
              Inspired by the immediacy of classic performance synthesizers.
              <br />
              Built for what comes next.
            </p>
          </div>
          <div className="astra-annotation">
            <span>06 SYSTEMS → 01 INSTRUMENT</span>
            <span>CONCEPT / WORK IN PROGRESS</span>
          </div>
        </section>
        <section id="studio" className="content-section studio-section">
          <div className="section-intro">
            <div>
              <Label number="04">STUDIO</Label>
              <h2>
                Where it
                <br />
                comes together.
              </h2>
            </div>
            <div className="intro-copy">
              <span className="eyebrow">THE SPACE</span>
              <p>
                A room for listening.
                <br />A workbench for building.
                <br />A place to follow an idea.
              </p>
            </div>
          </div>
          <StudioEquipment />
          <div className="studio-footnote">
            <span>88 KEYS. ENDLESS STARTING POINTS.</span>
            <p>
              Drum machines, controllers, outboard gear and development
              hardware.
              <br />
              Everything within reach of the next idea.
            </p>
          </div>
        </section>
        <section id="process" className="content-section process-section">
          <div className="section-intro">
            <div>
              <Label number="05">PROCESS</Label>
              <h2>
                Ideas into
                <br />
                instruments.
              </h2>
            </div>
            <div className="intro-copy">
              <p>
                A look into the process.
                <br />
                From concept to code.
                <br />
                From plugin to hardware.
                <br />
                From an idea into something real.
              </p>
            </div>
          </div>
          <ProcessExplorer />
        </section>
        <section id="dev" className="scene-section dev-section">
          <div className="section-copy">
            <Label number="06">ENGINEERING / DEV</Label>
            <h2>
              Beneath
              <br />
              the surface.
            </h2>
            <p>
              Good tools begin with
              <br />
              thoughtful systems.
            </p>
            <p className="muted">
              Software engineering, audio DSP, AI-assisted systems and the
              infrastructure that connects them.
            </p>
            <div className="engineering-stack">
              {[
                "PRODUCT",
                "UI / INTERACTION",
                "AUDIO ENGINE",
                "DSP",
                "AI SYSTEMS",
                "INFRASTRUCTURE",
                "CLOUD / AUTOMATION",
              ].map((s, i) => (
                <div key={s}>
                  <span>0{i + 1}</span>
                  <h3>{s}</h3>
                  <span>↓</span>
                </div>
              ))}
            </div>
            <p className="dev-technologies">
              TERRAFORM · KUBERNETES · GITHUB
              <br />
              CI/CD · SOFTWARE ARCHITECTURE · AUDIO DSP
            </p>
          </div>
        </section>
        <section id="reconnect" className="scene-section reconnect-section">
          <div className="section-copy">
            <Label number="07">RECONNECT</Label>
            <h2>
              Different layers.
              <br />
              <span>Same purpose.</span>
            </h2>
            <div className="reconnect-disciplines">
              MUSIC / PLUG-INS / ASTRA
              <br />
              STUDIO / HARDWARE / SOFTWARE
              <br />
              ENGINEERING
            </div>
            <p className="reconnect-statement">
              I BUILD THE TOOLS
              <br />I WANT TO MAKE
              <br />
              THE MUSIC I WANT
              <br />
              TO HEAR.
            </p>
          </div>
        </section>
        <section id="about" className="content-section about-section">
          <Label number="08">ABOUT</Label>
          <div className="about-lockup">
            <div className="about-portrait">
              <Image
                src="/me/images/gus-vega.webp"
                alt="Gus Vega"
                width={1200}
                height={1800}
                sizes="(max-width:700px) 88vw, 40vw"
              />
              <span>GUS VEGA / ARTIST & BUILDER</span>
            </div>
            <div>
              <span className="eyebrow">ONE CONNECTED PRACTICE</span>
              <h2>GUS VEGA</h2>
              <h3>ARTIST. BUILDER. ENGINEER.</h3>
              <p>
                I make music and the tools that make it possible.
                <br />
                From a melody to an instrument.
                <br />
                From an idea to a working system.
              </p>
              <a className="text-link" href="#arrive">
                BACK TO THE BEGINNING <span>↑</span>
              </a>
            </div>
          </div>
          <footer>
            <a className="wordmark" href="#arrive">
              GUS VEGA
            </a>
            <span>MUSIC. TECHNOLOGY. A MORE CREATIVE TOMORROW.</span>
            <span>© {new Date().getFullYear()} GUS VEGA</span>
          </footer>
        </section>
      </main>
    </>
  );
}
