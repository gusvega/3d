"use client";
import { useEffect, useState } from "react";
import "./recovery.css";
const STORE = "gus-music-project-v1";
export default function Recovery() {
  const [projects, setProjects] = useState([]),
    [message, setMessage] = useState(
      "Checking this browser for saved projects…",
    );
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(STORE) || "null"),
        saved = JSON.parse(localStorage.getItem(STORE + "-library") || "[]");
      const entries = [
        ...(current ? [{ title: "Current project", data: current }] : []),
        ...(Array.isArray(saved)
          ? saved.map((data, i) => ({ title: `Saved version ${i + 1}`, data }))
          : []),
      ];
      setProjects(entries);
      setMessage(
        entries.length
          ? "Download each project you want to keep, then import it at the new address."
          : "No Music projects were found in this browser. Check the device and browser you originally used.",
      );
    } catch {
      setMessage(
        "Could not read this browser’s saved projects. Your storage has not been changed.",
      );
    }
  }, []);
  function download(entry) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(entry.data, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      (typeof entry.data?.title === "string"
        ? entry.data.title
        : "Music-project"
      ).replace(/[^a-z0-9_-]/gi, "-") + ".music.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  return (
    <main className="music-recovery">
      <p className="recovery-label">GUS / MUSIC</p>
      <h1>Your music has a new home.</h1>
      <p>
        The composer now lives at{" "}
        <a href="https://gusvega.dev/music">gusvega.dev/music</a>. Projects
        saved on the old domain stay in this browser until you export them.
      </p>
      <p role="status">{message}</p>
      {projects.map((entry, i) => (
        <div className="recovery-row" key={i}>
          <div>
            <strong>{entry.title}</strong>
            <span>
              {typeof entry.data?.title === "string"
                ? entry.data.title
                : "Untitled project"}
            </span>
          </div>
          <button onClick={() => download(entry)}>Download project</button>
        </div>
      ))}
      <a className="recovery-action" href="https://gusvega.dev/music">
        Open Music →
      </a>
      <p className="recovery-help">
        At the new address, choose Projects &amp; export → Import project.
        Nothing on this page deletes or modifies your saved work. If you
        installed the old app, remove its home-screen shortcut and add the new
        address.
      </p>
    </main>
  );
}
