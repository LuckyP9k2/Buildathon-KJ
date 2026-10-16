let classifierPromise;

/**
 * The model is intentionally loaded from /public/models only. Remote model
 * loading is disabled, so a missing local model fails closed rather than
 * silently downloading weights from the internet.
 */
export async function recognizeArtwork(canvas, artworks, onProgress = () => {}) {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { env, pipeline } = await import('@huggingface/transformers');
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.localModelPath = '/models/';
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.wasmPaths = '/wasm/';
      }
      if ('useWasmCache' in env) env.useWasmCache = true;
      onProgress('Loading the local CLIP model…');
      return pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
        progress_callback: event => {
          if (event?.status === 'progress' && Number.isFinite(event.progress)) {
            onProgress(`Loading local model · ${Math.round(event.progress)}%`);
          }
        }
      });
    })().catch(error => {
      classifierPromise = null;
      throw error;
    });
  }

  const classifier = await classifierPromise;
  onProgress('Comparing the image with the curated collection…');
  const labels = artworks.map(art => `${art.title.en}, a painting by ${art.artist}`);
  const output = await classifier(canvas, labels);
  const scores = Array.isArray(output) ? output : [output];
  return scores
    .map(item => {
      const index = labels.indexOf(item.label);
      return { artwork: artworks[index], score: Number(item.score) || 0, label: item.label };
    })
    .filter(item => item.artwork)
    .sort((a, b) => b.score - a.score);
}
