# ArtLens — Beyond the Frame

**Tagline:** See the art. Hear it speak.

## Inspiration

Museum labels often give visitors only a short caption. ArtLens explores a different experience: instead of asking visitors to read one plaque, let them point a phone at a work and follow their curiosity through a story, a visual detail, a historical timeline, or a spoken explanation.

## What it does

ArtLens is an offline-first, multilingual museum companion. Visitors can capture or upload an artwork, identify it within a small curated collection, read its context, tap highlighted details, explore a paired timeline, ask questions grounded in curated notes, and hear an imaginative first-person narration. English, Hindi, and Marathi are included in the starter content.

## What makes it different

- **On-device by design:** visitor images and recognition stay in the browser; the app has no backend and does not depend on paid AI APIs.
- **Curiosity over captions:** hotspots and the timeline invite visitors to inspect the artwork rather than only read a summary.
- **Honest uncertainty:** if the local model is missing or the match is uncertain, the prototype does not pretend to recognise the image.
- **Grounded Q&A:** answers come from the curated notes; unknown questions receive an explicit fallback.
- **Accessible interaction:** narrated text and multilingual UI make the experience more flexible than a wall label alone.

## How we built it

The frontend is a responsive Vite PWA. A local Transformers.js CLIP pipeline provides closed-set image recognition after its ONNX model files are bundled locally. Artwork facts and translations live in JSON. Hotspots use normalised coordinates. The Q&A retrieves relevant curated entries. Audio uses the browser's Web Speech API, and a service worker caches same-origin resources for offline revisits.

## Challenges we considered

Local model size and inference latency matter on ordinary phones. Glare and viewing angles can reduce image-match quality, and any closed-set classifier can be wrong on an unknown work. Our prototype therefore uses a small collection, a confirmation path, explicit uncertainty, and no invented fallback answer. Confidence rules still need proper evaluation with real phone photos.

## What is next

- Replace the original illustrative placeholder covers with licensed, open-access artwork images.
- Evaluate recognition on real museum-like photos and tune rejection thresholds.
- Expand the catalogue and verify translations with fluent reviewers.
- Add richer visual/audio accessibility, curated museum packs, and curator tooling.

## Demo note

Automated recognition requires model weights to be added locally; the repository intentionally does not bundle the approximately 150 MB quantized model file. Without it, the scanner remains in a transparent guided-demo mode. Do not claim offline ML recognition until the model is installed, loaded, and tested with network access disabled.
