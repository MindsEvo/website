export const ENGINE_SETTINGS_KEY = 'mindsevo.chinese-chess.engine-settings.v1';

export const DEFAULT_ENGINE_SETTINGS = Object.freeze({
  threads: 2,
  hash: 512,
  depth: 30,
  movetime: 10000,
  multiPv: 1,
  moveOverhead: 100
});

const LIMITS = {
  threads: [1, 64],
  hash: [16, 4096],
  depth: [1, 30],
  movetime: [100, 30000],
  multiPv: [1, 5],
  moveOverhead: [0, 5000]
};

const PLAY_LEVEL_LIMITS = {
  low: { depth: 10, movetime: 2000 },
  medium: { depth: 20, movetime: 5000 },
  high: { depth: 30, movetime: 30000 }
};

export function normalizeEngineSettings(settings = {}) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw new Error('Xiangqi engine settings must be an object.');
  }
  return Object.fromEntries(Object.entries(LIMITS).map(([key, [min, max]]) => {
    const value = Number(settings[key] ?? DEFAULT_ENGINE_SETTINGS[key]);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}.`);
    }
    return [key, value];
  }));
}

export function loadEngineSettings(storage = globalThis.localStorage) {
  const saved = storage?.getItem(ENGINE_SETTINGS_KEY);
  if (!saved) return { ...DEFAULT_ENGINE_SETTINGS };
  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    throw new Error(`Saved Xiangqi engine settings are invalid JSON: ${error.message}`);
  }
  return normalizeEngineSettings(parsed);
}

export function saveEngineSettings(settings, storage = globalThis.localStorage) {
  if (!storage) throw new Error('Browser storage is not available.');
  const normalized = normalizeEngineSettings(settings);
  storage.setItem(ENGINE_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getPlayEngineSettings(level = 'high', storage = globalThis.localStorage) {
  const settings = loadEngineSettings(storage);
  const limits = PLAY_LEVEL_LIMITS[level];
  if (!limits) throw new Error(`Unknown Xiangqi engine level: ${level}`);
  return {
    ...settings,
    depth: Math.min(settings.depth, limits.depth),
    movetime: Math.min(settings.movetime, limits.movetime)
  };
}
