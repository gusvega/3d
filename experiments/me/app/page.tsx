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
              I build the tools
              <br />I want to make
              <br />
              <span>
                the music I want
                <br />
                to hear.
              </span>
            </h1>
            <p>
              Music, instruments and software.
              <br />
              One connected creative practice.
            </p>
            <a href="#music" className="hero-listen text-link">
              START WITH THE MUSIC <span>↗</span>
            </a>
          </div>
          <div className="hero-object-label">
            <span>THE CREATIVE CORE / INSTRUMENT CONCEPT</span>
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
          <div className="music-afterword">
            <p>
              Before there is an instrument,
              <br />
              there is something I want to hear.
            </p>
            <a
              className="text-link"
              href="https://www.youtube.com/@gusvegamusic"
              target="_blank"
              rel="noopener noreferrer"
            >
              LIVE SETS & STUDIO PERFORMANCES ↗
            </a>
            <span className="eyebrow">
              NO DIRECTION / EXPLORATIONS IN SOUND
            </span>
          </div>
        </section>
        <section id="plugins" className="content-section plugins-section">
          <div className="section-intro">
            <div>
              <Label number="02">PLUG-INS</Label>
              <h2>
                Built for
                <br />
                the next idea.
              </h2>
            </div>
            <div className="intro-copy">
              <span className="eyebrow">TOOLS FOR CREATORS</span>
              <p>
                These are working software projects, born from making music. The
                physical forms below explore what those tools could become.
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
            <p className="astra-intention">
              A performance instrument taking shape.
              <br />
              Separate voices. Shared movement. One place to play.
            </p>
            <AstraEngines />
            <p className="astra-note">
              Architecture in development. The model shows the intended
              relationship between engines, processing and performance controls.
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
              <span className="eyebrow">MY STUDIO</span>
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
            <p>The engineering matters when it makes room for the music.</p>
            <div className="engineering-stories">
              <article>
                <span className="eyebrow">01 / UMBRA</span>
                <h3>
                  Keep the sound.
                  <br />
                  Change its possibilities.
                </h3>
                <p>
                  A portable audio engine sits beneath the interface. Controls
                  and host synchronization connect the sound to the way an
                  instrument is played.
                </p>
                <div className="signal-story" aria-label="UMBRA signal path">
                  INPUT <span>→</span> AUDIO ENGINE <span>→</span> MUSICAL
                  CONTROLS <span>→</span> OUTPUT
                </div>
                <a
                  className="text-link"
                  href="https://gusvega.dev/umbra"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  INSIDE UMBRA ↗
                </a>
              </article>
              <article>
                <span className="eyebrow">02 / SPECTRA → FORMA</span>
                <h3>
                  From a recording
                  <br />
                  to something playable.
                </h3>
                <p>
                  Separation runs in the background. Aligned stems feed the
                  mixer, and a sound can move into FORMA for further
                  exploration.
                </p>
                <div className="signal-story" aria-label="SPECTRA workflow">
                  RECORDING <span>→</span> SEPARATION <span>→</span> STEMS{" "}
                  <span>→</span> FORMA
                </div>
                <a
                  className="text-link"
                  href="https://gusvega.dev/spectra"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EXPLORE THE ARCHITECTURE ↗
                </a>
              </article>
            </div>
            <a
              className="engineering-more text-link"
              href="https://gusvega.dev/#engineering"
              target="_blank"
              rel="noopener noreferrer"
            >
              SOFTWARE, PLATFORM & CLOUD WORK ↗
            </a>
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
                I’m a Mexican music producer based in Seattle, building software
                and instruments around the moments that happen in the studio.
                Music is the starting point. Making the tools is part of the
                same practice.
              </p>
              <div className="closing-actions" aria-label="Continue exploring">
                <a href="#music">
                  <span>01</span>
                  <strong>Listen to the music</strong>
                  <span>↗</span>
                </a>
                <a
                  href="https://www.gusvega.com/#products"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>02</span>
                  <strong>Explore the tools</strong>
                  <span>↗</span>
                </a>
                <a
                  href="https://www.instagram.com/gusvegamusic/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>03</span>
                  <strong>Get in touch</strong>
                  <span>↗</span>
                  <small>Message me on Instagram</small>
                </a>
              </div>
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
