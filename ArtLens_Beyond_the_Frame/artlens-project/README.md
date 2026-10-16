# ArtLens — Beyond the Frame

**See the art. Hear it speak.**

ArtLens is a mobile-friendly, offline-first museum companion for the Renaissance Buildathon. Visitors can scan or upload an artwork, discover the curated story, tap highlighted details, step through a short timeline, ask questions from local notes, and hear an imaginative first-person narration in English, Hindi, or Marathi.

## What is included

- Responsive PWA shell built with Vite and vanilla JavaScript.
- Camera capture and image upload; image processing stays in the browser.
- Optional on-device CLIP zero-shot recognition against six curated artworks.
- A transparent manual-demo path when the local model is not installed; it does not pretend to have recognised the image.
- Curated artwork story cards, hotspot details, artwork/world timeline, local extractive Q&A, and browser text-to-speech.
- English, Hindi, and Marathi UI / story text.
- Saved-art gallery using local storage.
- Service worker that caches the app shell and same-origin assets after use.

## Run it locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run copy:runtime
npm run dev
```

Open the localhost URL printed by Vite. To create a production build:

```bash
npm run build
npm run preview
```

The camera requires **HTTPS or localhost**. On a phone, use an HTTPS deployment (for example, a static hosting service) rather than opening the site through a plain-HTTP LAN IP. Hosting is static; there is no backend.

## Enable automated on-device recognition

The uploaded source notes did not include model weights. Until the local model is installed, the scanner uses an honest guided-demo mode: you can choose the work you photographed to preview the rest of the experience. It does not guess a title.

1. On a setup computer with internet access, open the [Xenova CLIP ViT-B/32 model files](https://huggingface.co/Xenova/clip-vit-base-patch32/tree/main).
2. Copy the model metadata files from the repository root into `public/models/Xenova/clip-vit-base-patch32/`: `config.json`, `preprocessor_config.json`, `merges.txt`, `special_tokens_map.json`, `tokenizer.json`, `tokenizer_config.json`, and `vocab.json`.
3. From that repository's `onnx/` folder, copy `model_quantized.onnx` into `public/models/Xenova/clip-vit-base-patch32/onnx/model_quantized.onnx`.
4. Run `npm run copy:runtime`, restart Vite, and scan a few known artworks. The first local inference may take a while, especially on a phone.

The current integration uses the Transformers.js `zero-shot-image-classification` pipeline with CLIP and only a closed set of six artwork labels. [The official model page documents the same pipeline pattern.](https://huggingface.co/Xenova/clip-vit-base-patch32)

**Runtime privacy rule:** `src/recognizer.js` sets `env.allowRemoteModels = false` and points model loading at `/models/`. It should fail into guided-demo mode if the files are missing. It is not intended to contact a model hub during visitor use. Review the browser Network panel once model files are added to verify all runtime assets are same-origin.

## Important model-evaluation notes

- Confidence thresholds in `src/main.js` (`0.34`, `0.63`, and the `0.10` margin) are **initial heuristics**, not validated accuracy claims. Tune them on real phone photos, with glare, frames, reflections, and angled shots.
- CLIP zero-shot scores are relative to the candidate labels sent to the model. They are not calibrated probabilities that an artwork is correct.
- A closed-set classifier can be confidently wrong on an unknown artwork. The low-confidence “not sure” branch reduces this risk but cannot eliminate it. Evaluate on out-of-set paintings and raise the rejection threshold if false matches occur.
- The bundled SVG covers are original illustrative placeholders, not reproductions of the artworks. CLIP uses text candidates, but use properly licensed open-access reference images in the gallery before presenting this as a finished museum product.
- A model download is approximately 150 MB for the single quantized ONNX file, plus metadata and runtime files. Bundle it or pre-cache it before demonstrating offline inference.
- The Ask panel is **local retrieval, not a generative chatbot**. It returns matching curated entries or says the notes do not contain an answer.
- Browser speech output depends on installed voices; the language switch changes the requested voice locale but cannot install new voices.
- Source URLs are attached to each work. Review all wording, source details, and translations before public release.

## Folder structure

```text
artlens-project/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── data/artworks.json
│   ├── data/i18n.json
│   ├── img/*.svg
│   ├── models/Xenova/clip-vit-base-patch32/  # model files added locally
│   └── wasm/                                 # local runtime files copied on setup
├── src/
│   ├── main.js
│   ├── recognizer.js
│   └── styles.css
└── scripts/copy-runtime-assets.mjs
```

## Suggested 30-second judge demo

1. Open ArtLens and show the offline-ready / no-cloud positioning.
2. Upload a photo or open the camera and capture an artwork.
3. With local weights installed, run CLIP recognition and show the match or “not sure” handling. Without weights, demonstrate the guided-demo flow transparently.
4. Open **Look closer** and tap a detail marker.
5. Show the artwork timeline, then ask one of the curated questions.
6. Press **Hear the story** and switch to Hindi or Marathi.
7. If you have preloaded the model and assets, enable airplane mode and repeat the demo.

## Team split for three people

- **Frontend & PWA:** responsive UI, camera, install/offline behaviour, testing.
- **ML & evaluation:** local CLIP files, inference speed, real-camera testing, confidence tuning.
- **Content & submission:** source-check artwork notes, verify Hindi/Marathi, collect image licences, Devpost write-up and demo recording.

## Sources and licences

The individual artwork records include reference links to collection/catalogue pages. Replace the illustrative covers with images that are explicitly public-domain or open-access for the jurisdiction and use case where you are presenting. Keep the source/licence alongside each image. Transformers.js is Apache-2.0; check the selected model repository's usage terms before redistributing its weights.

## Licence

MIT for the project code. This does not grant rights to third-party artwork images or model weights.
