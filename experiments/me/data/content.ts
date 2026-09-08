export const chapters = [
  ["arrive", "Arrive"],
  ["explode", "The system"],
  ["music", "Music"],
  ["plugins", "Plug-ins"],
  ["astra", "Astra"],
  ["studio", "Studio"],
  ["process", "Process"],
  ["dev", "Engineering"],
  ["reconnect", "Reconnect"],
  ["about", "About"],
] as const;
export const plugins = [
  {
    name: "UMBRA",
    category: "AMBIENT / TEXTURE / MOVEMENT",
    description: "Turn a moment of sound into an evolving atmosphere.",
    detail:
      "A space for melodic memory, cinematic depth and slow transformation. Built to become part of the way you play.",
    controls: ["MEMORY", "TEXTURE", "SPACE", "MOTION", "MIX"],
  },
  {
    name: "FORMA",
    category: "SLICE / TRANSFORM / INSTRUMENT",
    description: "Find a new instrument inside a sound.",
    detail:
      "Slice, reshape and play audio. A hands-on approach to turning recorded material into new musical ideas.",
    controls: ["START", "SLICE", "PITCH", "SHAPE", "LEVEL"],
  },
  {
    name: "SPECTRA",
    category: "STEMS / DRUMS / MIDI",
    description: "Separate a recording into new musical possibilities.",
    detail:
      "Explore seven song stems, separate drum components, and extract MIDI in one stem-discovery workspace.",
    controls: ["INPUT", "FOCUS", "SHAPE", "DEPTH", "OUTPUT"],
  },
  {
    name: "SEQUA",
    category: "SEQUENCE / RHYTHM / MOTION",
    description: "Make room for unexpected movement.",
    detail:
      "A musical sequencing system for patterns, variation and rhythm. Built to keep the idea moving.",
    controls: ["RATE", "STEPS", "GATE", "SWING", "CHANCE"],
  },
  {
    name: "LUMEN",
    category: "SYNTH / SOUND GENERATION",
    description: "A starting point for sounds of your own.",
    detail:
      "An expressive synthesis engine at the heart of the wider instrument family. From a simple voice to layered musical worlds.",
    controls: ["OSC", "CUTOFF", "RESONANCE", "ENV", "LEVEL"],
  },
];
export const engines = [
  ["LUMEN I", "Core synthesis"],
  ["LUMEN II", "Layer / alternate synthesis"],
  ["LUMEN III", "Texture / atmosphere"],
  ["LUMEN IV", "Motion / sound generation"],
  ["UMBRA", "Depth / spatial movement"],
  ["SEQUA", "Sequence / rhythm"],
];
export const processSteps = [
  [
    "IDEA",
    "A sound. A sketch. A question.",
    "Notebooks, sound concepts and the first musical idea.",
  ],
  [
    "DESIGN",
    "Give the idea a shape.",
    "Interface layouts, instrument architecture and industrial design.",
  ],
  [
    "BUILD",
    "Make the parts work together.",
    "Code, audio DSP and electronics become something playable.",
  ],
  [
    "TEST",
    "Put it into the music.",
    "Play the prototype. Record with it. Listen to what is missing.",
  ],
  [
    "REFINE",
    "Listen. Measure. Repeat.",
    "Small, deliberate iterations on the sound and the experience.",
  ],
  [
    "RELEASE",
    "An idea, out in the world.",
    "Finished music, software and hardware return to the same practice.",
  ],
];
