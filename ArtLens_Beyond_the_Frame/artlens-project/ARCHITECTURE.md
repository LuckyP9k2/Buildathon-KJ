# ArtLens — implementation architecture

## Runtime rule

The visitor-facing app has no backend and is designed not to make external API calls. Static hosting serves the app shell and curated dataset. When automated recognition is enabled, CLIP runs locally through Transformers.js. Model files are manually bundled under `public/models/`; `env.allowRemoteModels = false` prevents fallback to a model hub.

## One scan

1. The visitor opens the rear camera or selects a local image file.
2. The browser creates a canvas from that image.
3. `src/recognizer.js` lazily loads `Xenova/clip-vit-base-patch32` from `/models/` and runs zero-shot image classification against six candidate labels from `artworks.json`.
4. `src/main.js` sorts model outputs and applies provisional confidence/margin rules: direct match, ask the visitor to confirm the top three, or “not sure”. These values must be calibrated on real images and are not a validated accuracy claim.
5. The matched artwork record is rendered from `public/data/artworks.json`.
6. Story, hotspots, time-travel timeline, first-person script, local Q&A, and browser speech all run client-side.

## Knowledge and interaction modules

- **Story page:** displays source-linked notes, artist, year, period, medium, and location.
- **Hidden details:** hotspots are percentages relative to an illustrative image, stored as `position: {x, y}` in each artwork record.
- **Time travel:** each record contains curated paired entries for the artwork and a world event/context.
- **Talk to the painting:** plays a clearly labelled imaginative script. It is not a historical quote.
- **Ask ArtLens:** token-overlap retrieval among the work's curated Q&A, story, and hidden-detail notes. The app does not generate new historical claims.
- **Language toggle:** static interface translations and hand-written artwork translations for EN/HI/MR.
- **Audio:** Web Speech API; language voice availability depends on the device.
- **Saved gallery:** IDs stored in localStorage on the visitor's device.
- **PWA/offline:** a service worker caches the shell and same-origin assets after they are loaded. The local model must be fully available/cached before claiming that image recognition works in airplane mode.

## Model assets

Expected location:

```text
public/models/Xenova/clip-vit-base-patch32/
├── config.json
├── preprocessor_config.json
├── merges.txt
├── special_tokens_map.json
├── tokenizer.json
├── tokenizer_config.json
├── vocab.json
└── onnx/
    └── model_quantized.onnx
```

`npm run copy:runtime` copies compatible ONNX/WebAssembly runtime files from the installed package into `public/wasm/` when present. Verify filenames against the installed Transformers.js version when upgrading it.

## Honest limitations

- Recognition is a closed-set task over six candidate titles; it cannot identify any artwork in the world.
- Confidence thresholds are heuristics. CLIP's normalized scores are relative to the candidates and should not be described as calibrated probabilities.
- The model can be wrong even with a high score; use top-three confirmation and the “not sure” state.
- The bundled illustrated covers are original stand-ins, not public-domain reproductions. Obtain open-access reference images before evaluation with real-world artwork.
- First-load storage, model size, inference speed and phone-specific camera/speech support require testing on real devices.
- The Q&A is extractive, not a general-purpose LLM.
