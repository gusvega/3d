"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Lightbulb,
  PenTool,
  Braces,
  AudioLines,
  SlidersHorizontal,
  PackageCheck,
} from "lucide-react";
import { releases } from "@/data/music";
import { narrative, notifyScene } from "@/lib/timeline";
import { engines, processSteps } from "@/data/content";
export function AstraEngines() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="engine-explorer">
      <div className="engine-buttons" aria-label="ASTRA sound architecture">
        {engines.map(([name], i) => (
          <button
            key={name}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              narrative.astraSelection = i;
              notifyScene();
            }}
          >
            <span>0{i + 1}</span>
            {name}
            <span>{selected === i ? "−" : "+"}</span>
          </button>
        ))}
      </div>
      <p className="engine-detail" aria-live="polite">
        <span>{engines[selected][0]}</span> / {engines[selected][1]}
        <br />
        <small>→ MIXER → MASTER → ONE INSTRUMENT</small>
      </p>
    </div>
  );
}
export function ProcessExplorer() {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <div className="process-steps">
        {processSteps.map(([name], i) => (
          <button
            key={name}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>0{i + 1}</span>
            <div className="process-glyph" aria-hidden="true">
              {[
                Lightbulb,
                PenTool,
                Braces,
                AudioLines,
                SlidersHorizontal,
                PackageCheck,
              ].map((Icon, j) =>
                j === i ? <Icon key={j} size={27} strokeWidth={1} /> : null,
              )}
            </div>
            <strong>{name}</strong>
            <span className="process-next">↗</span>
          </button>
        ))}
      </div>
      <div className="process-detail" aria-live="polite">
        <h3>{processSteps[selected][1]}</h3>
        <p>{processSteps[selected][2]}</p>
      </div>
    </>
  );
}
export function MusicExplorer() {
  const [selected, setSelected] = useState(0);
  const release = releases[selected];
  const [showAll, setShowAll] = useState(false);
  const [player, setPlayer] = useState(false);
  return (
    <div className="music-explorer">
      <figure className="release-feature">
        <a
          className="release-art"
          href={release.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Listen to ${release.name} on Spotify (opens in a new tab)`}
        >
          <Image
            key={release.artwork}
            src={release.artwork}
            alt={`${release.name} — official cover artwork`}
            fill
            sizes="(max-width:700px) 88vw, 48vw"
          />
        </a>
        <figcaption>
          <div>
            <span className="eyebrow">{release.kind} / GUS VEGA</span>
            <a
              className="release-feature-title"
              href={release.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {release.name}
            </a>
          </div>
          <a
            className="text-link"
            href={release.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            LISTEN ON SPOTIFY ↗
          </a>
        </figcaption>
        <div className="release-player">
          {player ? (
            <>
              <iframe
                key={release.spotifyUrl}
                title={`Listen to ${release.name} by Gus Vega`}
                src={`https://open.spotify.com/embed/album/${release.spotifyUrl.split("/").pop()}?theme=0`}
                width="100%"
                height="152"
                allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <button className="text-link" onClick={() => setPlayer(false)}>
                CLOSE PLAYER ×
              </button>
            </>
          ) : (
            <button className="listen-here" onClick={() => setPlayer(true)}>
              <span aria-hidden="true">▷</span> Listen here{" "}
              <small>LOAD SPOTIFY PLAYER</small>
            </button>
          )}
        </div>
      </figure>
      <div className="release-list">
        <div className="eyebrow">ALBUMS & SELECTED RELEASES</div>
        {releases.slice(0, showAll ? releases.length : 3).map((item, i) => (
          <div
            className="release-row"
            key={item.name}
            data-selected={selected === i}
          >
            <button
              type="button"
              className="release-preview"
              aria-pressed={selected === i}
              aria-label={`Preview ${item.name} artwork`}
              onClick={() => setSelected(i)}
            >
              <Image src={item.artwork} alt="" width={48} height={48} />
            </button>
            <a
              className="release-spotify-link"
              href={item.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"

              aria-label={`${item.name} on Spotify (opens in a new tab)`}
            >
              <span>
                <strong>{item.name}</strong>
                <small>{item.kind}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        ))}
        <button
          className="catalog-toggle text-link"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "FEWER RELEASES −" : "ALL RELEASES +"}
        </button>
        <p className="release-note">
          Albums to spend time with. Sounds to carry forward.
        </p>
      </div>
    </div>
  );
}
