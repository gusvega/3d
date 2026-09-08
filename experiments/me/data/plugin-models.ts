export type ModuleSpec = {
  name: string;
  rect: [number, number, number, number];
  lift: number;
  axis?: number;
};
export type PluginDesign = {
  name: string;
  aspect: number;
  summary: string;
  modules: ModuleSpec[];
  knobs: [number, number][];
};
const row = (xs: number[], y: number): [number, number][] =>
  xs.map((x) => [x, y]);
export const pluginDesigns: PluginDesign[] = [
  {
    name: "UMBRA",
    aspect: 700 / 560,
    summary:
      "A central texture field between two banks of five controls. The interaction panel lifts away from the memory and processing layers.",
    modules: [
      { name: "Texture field", rect: [0.185, 0.165, 0.63, 0.645], lift: 1.65 },
      {
        name: "Left control bank",
        rect: [0.02, 0.17, 0.16, 0.64],
        lift: 0.8,
        axis: -1,
      },
      {
        name: "Right control bank",
        rect: [0.82, 0.17, 0.16, 0.64],
        lift: 0.8,
        axis: 1,
      },
      { name: "Memory / Hold", rect: [0.02, 0.82, 0.96, 0.16], lift: 0.45 },
      { name: "Identity panel", rect: [0.02, 0.02, 0.96, 0.14], lift: 0.9 },
    ],
    knobs: [
      ...row([0.087, 0.91], 0.21),
      ...row([0.087, 0.91], 0.35),
      ...row([0.087, 0.91], 0.49),
      ...row([0.087, 0.91], 0.63),
      ...row([0.087, 0.91], 0.76),
      [0.5, 0.89],
    ],
  },
  {
    name: "FORMA",
    aspect: 920 / 580,
    summary:
      "A wide sample viewport over an eight-control transformation bank. Sample discovery, slicing and instrument creation become separate physical layers.",
    modules: [
      { name: "Sample viewport", rect: [0.03, 0.26, 0.94, 0.39], lift: 1.55 },
      {
        name: "Slice / transform controls",
        rect: [0.03, 0.81, 0.94, 0.17],
        lift: 0.8,
      },
      { name: "Instrument actions", rect: [0.03, 0.67, 0.94, 0.13], lift: 0.5 },
      { name: "Sample loading", rect: [0.03, 0.18, 0.94, 0.075], lift: 0.7 },
      { name: "Identity panel", rect: [0.02, 0.02, 0.96, 0.145], lift: 1 },
    ],
    knobs: row([0.087, 0.206, 0.322, 0.44, 0.559, 0.676, 0.794, 0.911], 0.86),
  },
  {
    name: "SPECTRA",
    aspect: 1040 / 810,
    summary:
      "Seven song stems above seven drum components. A separate MIDI extraction layer sits below the analysis and channel banks.",
    modules: [
      {
        name: "Source / analysis",
        rect: [0.025, 0.025, 0.95, 0.28],
        lift: 1.7,
      },
      {
        name: "Song stems · 7 channels",
        rect: [0.025, 0.32, 0.94, 0.165],
        lift: 1.1,
        axis: -0.45,
      },
      {
        name: "Drum components · 7 channels",
        rect: [0.025, 0.51, 0.94, 0.195],
        lift: 0.55,
        axis: 0.45,
      },
      {
        name: "MIDI extraction / notes",
        rect: [0.025, 0.72, 0.95, 0.265],
        lift: 0.1,
      },
    ],
    knobs: [
      ...row([0.091, 0.226, 0.36, 0.496, 0.63, 0.765, 0.899], 0.382),
      ...row([0.091, 0.226, 0.36, 0.496, 0.63, 0.765, 0.899], 0.592),
    ],
  },
  {
    name: "SEQUA",
    aspect: 1200 / 754,
    summary:
      "The articulation curve floats above timing and voice controls. The live-performance bank separates toward the player.",
    modules: [
      {
        name: "Articulation / motion curve",
        rect: [0.05, 0.21, 0.9, 0.285],
        lift: 1.55,
      },
      {
        name: "Timing / voice controls",
        rect: [0.05, 0.52, 0.9, 0.195],
        lift: 0.85,
      },
      { name: "Live performance", rect: [0.05, 0.74, 0.9, 0.23], lift: 0.35 },
      { name: "Preset / identity", rect: [0.025, 0.02, 0.95, 0.17], lift: 1 },
    ],
    knobs: [
      ...row([0.093, 0.21, 0.323, 0.437, 0.554, 0.673, 0.785, 0.904], 0.584),
      ...row([0.135, 0.319, 0.5, 0.685, 0.885], 0.84),
      [0.904, 0.095],
    ],
  },
  {
    name: "LUMEN",
    aspect: 1200 / 698,
    summary:
      "A modular synthesis surface: voice, pitch, dual oscillators, mixer and filter, followed by amplifier, stereo, effects and output.",
    modules: [
      {
        name: "Voice / pitch",
        rect: [0.015, 0.238, 0.25, 0.35],
        lift: 0.9,
        axis: -0.7,
      },
      {
        name: "Oscillator I / II",
        rect: [0.273, 0.238, 0.318, 0.35],
        lift: 1.5,
      },
      {
        name: "Mixer / filter",
        rect: [0.597, 0.238, 0.391, 0.35],
        lift: 1.1,
        axis: 0.65,
      },
      { name: "Amplifier", rect: [0.015, 0.607, 0.343, 0.36], lift: 0.35 },
      {
        name: "Stereo / space / output",
        rect: [0.365, 0.607, 0.623, 0.36],
        lift: 0.6,
      },
      {
        name: "Live output / routing",
        rect: [0.015, 0.01, 0.97, 0.218],
        lift: 1.8,
      },
    ],
    knobs: [
      [0.075, 0.41],
      [0.179, 0.41],
      [0.229, 0.41],
      ...row([0.344, 0.507, 0.634, 0.693, 0.745, 0.83, 0.89, 0.95], 0.35),
      ...row(
        [0.312, 0.369, 0.48, 0.528, 0.554, 0.632, 0.68, 0.828, 0.884],
        0.48,
      ),
      ...row(
        [0.07, 0.141, 0.221, 0.302, 0.433, 0.548, 0.66, 0.739, 0.902],
        0.779,
      ),
    ],
  },
];
