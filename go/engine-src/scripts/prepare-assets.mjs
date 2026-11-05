import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelUrl = 'https://raw.githubusercontent.com/lightvector/KataGo/master/cpp/tests/models/g170-b6c96-s175395328-d26788732.bin.gz';
const publicDir = path.join(root, 'public');
const modelPath = path.join(publicDir, 'models/katago-small.bin.gz');
const wasmSourceDir = path.join(root, 'node_modules/@tensorflow/tfjs-backend-wasm/dist');
const wasmOutputDir = path.join(publicDir, 'tfjs');

await mkdir(path.dirname(modelPath), { recursive: true });
await mkdir(wasmOutputDir, { recursive: true });

try {
  await stat(modelPath);
} catch {
  const response = await fetch(modelUrl);
  if (!response.ok) throw new Error(`Failed to download KataGo test model: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(modelPath, data);
  console.log(`Downloaded the CC0 KataGo test model (${data.length} bytes).`);
}

const wasmFiles = (await readdir(wasmSourceDir)).filter(name => name.endsWith('.wasm'));
if (wasmFiles.length === 0) throw new Error('TensorFlow.js WASM backend files were not found.');
await Promise.all(wasmFiles.map(name => copyFile(path.join(wasmSourceDir, name), path.join(wasmOutputDir, name))));
console.log(`Prepared ${wasmFiles.length} TensorFlow.js WASM backend files.`);