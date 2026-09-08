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
      </figure>
      <div className="release-list">
        <div className="eyebrow">ALBUMS & SELECTED RELEASES</div>
        {releases.map((item, i) => (
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
              onFocus={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
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
        <p className="release-note">
          Select a cover to look closer. Select a name to listen on Spotify.
        </p>
      </div>
    </div>
  );
}
