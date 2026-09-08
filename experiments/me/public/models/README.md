# Software-derived plug-in assemblies

Five original 3D concept designs, built from the actual software reference images in `public/plugins/`:

- `umbra.glb`: texture field, two five-control banks, memory/Hold and identity.
- `forma.glb`: sample viewport, transformation controls, instrument actions and loading.
- `spectra.glb`: source analysis, seven song stems, seven drum components and MIDI extraction.
- `sequa.glb`: articulation curve, timing/voice controls, live performance and preset panel.
- `lumen.glb`: voice/pitch, dual oscillators, mixer/filter, amplifier, stereo/effects/output and live output.

Each GLB contains named component nodes, embedded software-interface textures and two animation clips: **Explode** and **Assemble** (2.4 seconds each). Module node extras include `assembled`, `exploded`, and `semanticLayer`. Interpolate those local positions for scroll-driven usage, or scrub the Explode clip with normalized progress.

These are software-derived visual concepts, not engineering CAD or representations of manufactured products. The physical support, control caps and processing boards are conceptual. The website keeps software screenshots available alongside the models.

Editable definitions: `data/plugin-models.ts`. Mesh implementation: `three/plugins/PluginAssembly.tsx`. Viewer and GLB export: `three/plugins/PluginViewer.tsx`.

SPECTRA reference: the local `vst/spectra/screenshots/spectra-0.7.8.png` and `vst/spectra/plugins/common/PluginEditor.cpp`. No existing GLB/GLTF/OBJ was found in the local VST family. Its design was created specifically for this site.

The source screenshots record particular software versions; these visuals do not claim those are the latest installed releases.
