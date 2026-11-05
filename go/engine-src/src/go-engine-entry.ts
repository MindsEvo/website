import { getKataGoEngineClient } from './engine/katago/client';
import type { BoardState, Move, Player } from './types';

const modelPath = './models/katago-small.bin.gz';
const modelUrl = new URL(/* @vite-ignore */ modelPath, import.meta.url).href;
const client = getKataGoEngineClient();

export function getModelUrl(): string {
  return modelUrl;
}

export function getEngineInfo() {
  return client.getEngineInfo();
}

export function initializeEngine(): Promise<void> {
  return client.init(modelUrl, 'webgpu');
}

export function analyzePosition(args: {
  board: BoardState;
  currentPlayer: Player;
  moveHistory: Move[];
  previousBoard?: BoardState;
  previousPreviousBoard?: BoardState;
}, signal?: { aborted: boolean; addAbortListener(listener: () => void): () => void }): Promise<Awaited<ReturnType<typeof client.analyze>>> {
  return client.analyze({
    ...args,
    signal,
    modelUrl,
    rules: 'chinese',
    komi: 7.5,
    visits: 64,
    maxTimeMs: 1800,
    batchSize: 8,
    topK: 5,
    analysisPvLen: 8,
    ownershipMode: 'none',
    reuseTree: false
  });
}