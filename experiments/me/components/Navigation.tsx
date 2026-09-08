"use client";
import { useState } from "react";
const links = [
  ["music", "MUSIC"],
  ["plugins", "PLUG-INS"],
  ["astra", "HARDWARE"],
  ["studio", "STUDIO"],
  ["dev", "DEV"],
  ["about", "ABOUT"],
];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#music">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="#arrive" aria-label="Gus Vega home">
          GUS VEGA
        </a>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "CLOSE −" : "MENU +"}
        </button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={open ? "open" : ""}
        >
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
        <span className="header-note">INDEPENDENT BY DESIGN</span>
      </header>
    </>
  );
}
