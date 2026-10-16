import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, '..');
const packageDist = path.join(project, 'node_modules', '@huggingface', 'transformers', 'dist');
const destination = path.join(project, 'public', 'wasm');

async function walk(directory) {
  let entries;
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch { return []; }
  const output = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else output.push(absolute);
  }
  return output;
}

await fs.mkdir(destination, { recursive: true });
const files = await walk(packageDist);
const runtimeFiles = files.filter(file => {
  const name = path.basename(file).toLowerCase();
  return (name.endsWith('.wasm') || name.endsWith('.mjs')) && (name.includes('ort') || name.includes('wasm'));
});
let copied = 0;
for (const file of runtimeFiles) {
  const name = path.basename(file);
  await fs.copyFile(file, path.join(destination, name));
  copied += 1;
}
if (copied) {
  console.log(`Copied ${copied} local ONNX/WebAssembly runtime file(s) to public/wasm/.`);
} else {
  console.log('No separate WASM runtime files were found in the installed package. This can be normal for the selected runtime build.');
}
