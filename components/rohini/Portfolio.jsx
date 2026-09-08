"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Button,
  Badge,
  Card,
  Modal,
  Link,
  Accordion,
  AccordionItem,
} from "@gusvega/ui";
import {
  projects,
  asset,
  resume,
  email,
  linkedin,
} from "../../data/rohini/projects";

function Arrow({ diagonal = false, ...props }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Lock() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" />
      <path d="M7 8V5a3 3 0 0 1 6 0v3" stroke="currentColor" />
    </svg>
  );
}
export function PortfolioShell({ children }) {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMenu(false), [pathname]);
  return (
    <div className="rohini-site">
      <a className="r-skip" href="#main-content">
        Skip to content
      </a>
      <header className="r-header">
        <NextLink
          href="/rohini"
          className="r-brand"
          aria-label="Rohini Mohandoss home"
        >
          <span className="r-monogram">
            r<span>.</span>
          </span>
          <span>
            Rohini
            <br />
            Mohandoss
          </span>
        </NextLink>
        <nav className="r-desktop-nav" aria-label="Main navigation">
          <NextLink href="/rohini#work">
            Selected work <span>08</span>
          </NextLink>
          <NextLink
            href="/rohini/about"
            aria-current={pathname === "/rohini/about" ? "page" : undefined}
          >
            About me
          </NextLink>
          <Link
            href={resume}
            target="_blank"
            rel="noopener noreferrer"
            className="r-nav-resume"
          >
            Résumé <Arrow diagonal />
          </Link>
        </nav>
        <Link className="r-contact-pill" href="mailto:mrohini07@gmail.com">
          Let’s talk <Arrow diagonal />
        </Link>
        <Button
          variant="ghost"
          className="r-menu-button"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          aria-controls="r-mobile-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? "Close" : "Menu"}{" "}
          <span aria-hidden="true">{menu ? "−" : "+"}</span>
        </Button>
      </header>
      {menu && (
        <nav
          id="r-mobile-nav"
          className="r-mobile-nav"
          aria-label="Mobile navigation"
        >
          <NextLink href="/rohini#work" onClick={() => setMenu(false)}>
            Selected work
          </NextLink>
          <NextLink href="/rohini/about">About me</NextLink>
          <a href={resume}>Résumé</a>
          <a href={email}>Let’s talk</a>
        </nav>
      )}
      <main id="main-content">{children}</main>
      <footer id="contact" className="r-footer">
        <div className="r-footer-top">
          <div>
            <span className="r-eyebrow">
              A GOOD CONVERSATION IS A GREAT START
            </span>
            <h2>
              Let’s make something
              <br />
              <em>meaningful.</em>
            </h2>
          </div>
          <Link
            href={email}
            className="r-footer-arrow"
            aria-label="Email Rohini"
          >
            <Arrow diagonal />
          </Link>
        </div>
        <div className="r-footer-links">
          <Link href={email}>
            mrohini07@gmail.com <Arrow diagonal />
          </Link>
          <div>
            <Link href={linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn <Arrow diagonal />
            </Link>
            <Link href={resume} target="_blank" rel="noopener noreferrer">
              Résumé <Arrow diagonal />
            </Link>
          </div>
        </div>
        <div className="r-footer-bottom">
          <span>© {new Date().getFullYear()} Rohini Mohandoss</span>
          <span>Thoughtfully designed. Made for people.</span>
          <a href="#main-content">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
export function Home() {
  const [filter, setFilter] = useState("All work");
  const shown = projects.filter(
    (p) => filter === "All work" || p.category === filter,
  );
  return (
    <>
      <section className="r-hero r-wrap">
        <div className="r-hero-copy">
          <div className="r-eyebrow">
            <span className="r-status-dot" /> LEAD UX/UI DESIGNER · SEATTLE, WA
          </div>
          <h1>
            Making complex
            <br />
            feel <em>human.</em>
            <span className="r-spark" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p>
            I’m Rohini. I bring curiosity, clarity, and a little delight to
            digital experiences — always starting with the people who use them.
          </p>
          <div className="r-hero-actions">
            <Link href="#work" className="r-primary-link">
              Explore my work <Arrow />
            </Link>
            <NextLink href="/rohini/about" className="r-text-link">
              A little about me <Arrow diagonal />
            </NextLink>
          </div>
          <div className="r-hero-note">
            <span className="r-note-line" /> From understanding people to
            shaping possibilities.
          </div>
        </div>
        <div className="r-portrait-area">
          <div className="r-portrait-frame">
            <Image
              src={asset("Rohini.png")}
              alt="Rohini Mohandoss by a river"
              fill
              preload
              sizes="(max-width: 700px) 80vw, 32vw"
            />
            <span className="r-portrait-label">
              DESIGNER. EXPLORER. PROBLEM SOLVER.
            </span>
          </div>
          <div className="r-photo-caption">
            <span>
              Behind every interface,
              <br />
              there’s a human story.
            </span>
            <span className="r-caption-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        </div>
      </section>
      <div className="r-practice-strip r-wrap">
        <span>
          EMPATHY IN THE PROCESS.
          <br />
          INTENTION IN THE DETAILS.
        </span>
        <p>
          User research <i /> Product design <i /> UX strategy <i /> Prototyping
        </p>
      </div>
      <section id="work" className="r-work r-wrap">
        <div className="r-section-heading">
          <div>
            <span className="r-eyebrow">01 / SELECTED WORK</span>
            <h2>
              Thoughtful work.
              <br />
              <em>Real-world challenges.</em>
            </h2>
          </div>
          <p>
            From healthcare and enterprise tools
            <br />
            to the everyday moments in between.
          </p>
        </div>
        <div
          className="r-filters"
          role="group"
          aria-label="Filter projects by category"
        >
          {[
            "All work",
            "Healthcare",
            "Enterprise",
            "Consumer",
            "Experiments",
            "Web design",
          ].map((f) => (
            <Button
              key={f}
              variant="ghost"
              className="r-filter"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
              {f === "All work" && <span>08</span>}
            </Button>
          ))}
        </div>
        <div className="r-sr-only" role="status">
          {shown.length} projects shown
        </div>
        <div className="r-project-grid">
          {shown.map((p) => (
            <ProjectCard
              key={p.slug}
              project={p}
              featured={p.slug === "mcg" && filter === "All work"}
            />
          ))}
        </div>
      </section>
      <section className="r-about-preview r-wrap">
        <div className="r-desk-photo">
          <Image
            src={asset("Ro-Intro.png")}
            alt="Rohini’s design workspace with sketches, a notebook, and a phone"
            fill
            sizes="(max-width: 700px) 90vw, 45vw"
          />
          <span>THE WORK STARTS WITH CURIOSITY.</span>
        </div>
        <div>
          <span className="r-eyebrow">02 / THE PERSON BEHIND THE PIXELS</span>
          <h2>
            A designer’s eye.
            <br />
            <em>An engineer’s mind.</em>
          </h2>
          <p>
            My background in software engineering and web development helps me
            connect the dots between what people need and what technology can
            do.
          </p>
          <p>
            Outside the screen? You’ll find me with family, on a trail, or on a
            badminton court.
          </p>
          <NextLink className="r-text-link" href="/rohini/about">
            Get to know me <Arrow diagonal />
          </NextLink>
        </div>
      </section>
    </>
  );
}
function ProjectCard({ project: p, featured }) {
  return (
    <Card className={`r-project-card ${featured ? "r-featured" : ""}`}>
      <NextLink href={`/rohini/${p.slug}`} className="r-project-link">
        <div className="r-project-image" style={{ background: p.color }}>
          <Image
            src={asset(p.image)}
            alt={`${p.client} — ${p.short}`}
            fill
            sizes={
              featured
                ? "(max-width: 700px) 90vw, 55vw"
                : "(max-width: 700px) 90vw, 45vw"
            }
          />
          <Badge variant="outline" className="r-project-badge">
            {p.protected ? (
              <>
                <Lock /> Private case study
              </>
            ) : (
              p.category
            )}
          </Badge>
          <span className="r-card-arrow">
            <Arrow diagonal />
          </span>
        </div>
        <div className="r-project-info">
          <span className="r-eyebrow">{p.client}</span>
          <h3>{featured ? p.title : p.short}</h3>
          {featured && <p>{p.description}</p>}
          <div className="r-project-bottom">
            <span>{p.discipline}</span>
            <span>
              {featured ? "Explore project" : "View project"} <Arrow />
            </span>
          </div>
        </div>
      </NextLink>
    </Card>
  );
}
export function About({ sections }) {
  return (
    <>
      <section className="r-about-hero r-wrap">
        <div>
          <span className="r-eyebrow">A LITTLE ABOUT ME</span>
          <h1>
            Curious by nature.
            <br />
            <em>Thoughtful by design.</em>
          </h1>
          <p className="r-lede">
            Hello, I’m Rohini — a UX designer with an engineer’s curiosity and a
            belief that useful can be delightful, too.
          </p>
          <Link
            href={resume}
            className="r-primary-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            View my résumé <Arrow diagonal />
          </Link>
        </div>
        <div className="r-about-portrait">
          <Image
            src={asset("Rohini.png")}
            alt="Rohini Mohandoss outdoors"
            fill
            preload
            sizes="(max-width: 700px) 90vw, 35vw"
          />
        </div>
      </section>
      <section className="r-about-story r-wrap">
        <span className="r-eyebrow">MY STORY</span>
        <div>
          {sections
            .flatMap((s) => s.blocks)
            .map((b, i) => (
              <div
                key={i}
                dangerouslySetInnerHTML={{
                  __html: b.html || `<p>${b.text}</p>`,
                }}
              />
            ))}
        </div>
      </section>
      <section className="r-approach r-wrap">
        <div>
          <span className="r-eyebrow">HOW I THINK ABOUT DESIGN</span>
          <h2>
            Useful. Usable.
            <br />
            <em>A little unexpected.</em>
          </h2>
        </div>
        <Accordion className="r-accordion">
          <AccordionItem title="01 — Start with people" defaultOpen>
            Research and listening bring context to the problem. Understanding
            people’s needs is the foundation of useful design.
          </AccordionItem>
          <AccordionItem title="02 — Make complexity clear">
            An engineering and web development background helps me translate
            technical complexity into interfaces that make sense.
          </AccordionItem>
          <AccordionItem title="03 — Learn, iterate, collaborate">
            Sketches, prototypes, and usability testing make ideas tangible.
            Collaboration helps those ideas become working experiences.
          </AccordionItem>
        </Accordion>
      </section>
      <div className="r-wrap r-about-resumes">
        <a
          href={asset("Rohini-Resume.pdf")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Earlier résumé (archive) <Arrow diagonal />
        </a>
      </div>
    </>
  );
}
export function CaseStudy({ project: p, sections }) {
  const [selected, setSelected] = useState(null);
  const opener = useRef(null);
  const [active, setActive] = useState("overview");
  const close = useCallback(() => {
    setSelected(null);
    requestAnimationFrame(() => opener.current?.focus());
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    document
      .querySelectorAll(".r-case-section")
      .forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [p.slug]);
  const next =
    projects[
      (projects.findIndex((x) => x.slug === p.slug) + 1) % projects.length
    ];
  return (
    <>
      <section className="r-case-hero r-wrap">
        <NextLink href="/rohini#work" className="r-back">
          ← All projects
        </NextLink>
        <div className="r-case-kicker">
          <span className="r-eyebrow">{p.client}</span>
          <Badge variant="outline" className="r-case-badge">
            {p.category}
          </Badge>
        </div>
        <h1>{p.title}</h1>
        <p className="r-lede">{p.description}</p>
        <div className="r-case-meta">
          <div>
            <span>ROLE</span>
            <p>{p.role}</p>
          </div>
          <div>
            <span>FOCUS</span>
            <p>{p.discipline}</p>
          </div>
          {p.duration && (
            <div>
              <span>TIMELINE</span>
              <p>{p.duration}</p>
            </div>
          )}
        </div>
        {["joe-coffee", "home-depot", "standard-goods", "spitfyre"].includes(
          p.slug,
        ) && (
          <p className="r-archive-note">
            The original hosted prototype is no longer available. The complete
            design story and saved screens are preserved below; original
            external links remain for reference.
          </p>
        )}
        <div className="r-case-cover" style={{ background: p.color }}>
          <Image
            src={asset(p.image)}
            alt={`${p.client} project overview`}
            fill
            preload
            sizes="(max-width: 700px) 95vw, 85vw"
          />
        </div>
      </section>
      {p.protected ? (
        <section className="r-private r-wrap">
          <span className="r-eyebrow">
            <Lock /> PRIVATE CASE STUDY
          </span>
          <h2>There’s more to this story.</h2>
          <p>
            This case study is password protected on Rohini’s original
            portfolio. Continue there if you have access, or get in touch to
            learn more about the work.
          </p>
          <div>
            <Link
              href="https://www.mrohini.com/securepages/index.html"
              className="r-primary-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open protected case studies <Arrow diagonal />
            </Link>
            <Link href={email} className="r-text-link">
              Request access <Arrow />
            </Link>
          </div>
        </section>
      ) : (
        <div className="r-case-layout r-wrap">
          <aside className="r-case-toc">
            <span className="r-eyebrow">IN THIS CASE STUDY</span>
            <nav aria-label="Case study sections">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "location" : undefined}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              ))}
            </nav>
            <NextLink href="/rohini#work" className="r-toc-back">
              ← Back to selected work
            </NextLink>
          </aside>
          <article className="r-case-article">
            {sections.map((s, i) => (
              <section className="r-case-section" id={s.id} key={s.id}>
                <div className="r-case-section-title">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h2>{s.title}</h2>
                </div>
                <div className="r-case-blocks">
                  {s.blocks.map((b, j) =>
                    b.type === "image" ? (
                      <figure
                        className={
                          b.width <= 300 && b.height <= 300
                            ? "r-small-figure"
                            : b.width / b.height < 0.7
                              ? "r-tall-figure"
                              : ""
                        }
                        key={j}
                      >
                        <Button
                          variant="ghost"
                          className="r-image-button"
                          onClick={(e) => {
                            opener.current = e.currentTarget;
                            setSelected(b);
                          }}
                          aria-label={`Enlarge ${b.alt}`}
                        >
                          <Image
                            src={b.src}
                            alt={b.alt}
                            width={b.width}
                            height={b.height}
                            sizes="(max-width: 700px) 90vw, 65vw"
                            loading="lazy"
                            unoptimized={b.src.endsWith(".gif")}
                          />
                          <span className="r-image-zoom">↗ Expand image</span>
                        </Button>
                        <figcaption>{b.alt}</figcaption>
                      </figure>
                    ) : b.type === "heading" ? (
                      <h3 key={j}>{b.text}</h3>
                    ) : b.type === "link" ? (
                      <Link
                        key={j}
                        href={b.href}
                        target={
                          b.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel="noopener noreferrer"
                        className="r-inline-link"
                      >
                        {b.text} <Arrow diagonal />
                      </Link>
                    ) : b.html ? (
                      <div
                        key={j}
                        className="r-source-copy"
                        dangerouslySetInnerHTML={{ __html: b.html }}
                      />
                    ) : (
                      <p key={j}>{b.text}</p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </article>
        </div>
      )}
      <section className="r-next-project r-wrap">
        <div>
          <span className="r-eyebrow">KEEP EXPLORING</span>
          <h2>{next.client}</h2>
          <p>{next.short}</p>
        </div>
        <NextLink
          href={`/rohini/${next.slug}`}
          className="r-next-arrow"
          aria-label={`Next project: ${next.client}`}
        >
          <Arrow diagonal />
        </NextLink>
      </section>
      <Modal open={!!selected} onClose={close} title={selected?.alt} size="lg">
        {selected && (
          <div className="r-lightbox">
            <Image
              src={selected.src}
              alt={selected.alt}
              width={selected.width}
              height={selected.height}
              unoptimized
            />
            <a href={selected.src} target="_blank" rel="noopener noreferrer">
              Open full resolution <Arrow diagonal />
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
