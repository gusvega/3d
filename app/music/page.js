import MusicStudio from "./studio";
export const metadata = {
  title: "Music — Compose, play, understand",
  description:
    "A personal music composition workspace. Explore keys, write melodies, learn harmony and export MIDI for Ableton.",
  manifest: "/music/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Music",
    statusBarStyle: "black-translucent",
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f0f",
};
export default function MusicPage() {
  return <MusicStudio />;
}
