import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_ENGINE_SETTINGS,
  ENGINE_SETTINGS_KEY,
  getPlayEngineSettings,
  loadEngineSettings,
  saveEngineSettings
} from '../chinese-chess/shared/engine-settings.mjs';

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('system defaults use a high Xiangqi search ceiling', () => {
  assert.deepEqual(DEFAULT_ENGINE_SETTINGS, {
    threads: 2, hash: 512, depth: 30, movetime: 10000, multiPv: 1, moveOverhead: 100
  });
  assert.deepEqual(loadEngineSettings(createStorage()), DEFAULT_ENGINE_SETTINGS);
});

test('global settings persist and are used unchanged by the strongest play level', () => {
  const storage = createStorage();
  const saved = saveEngineSettings({
    threads: 4, hash: 1024, depth: 28, movetime: 18000, multiPv: 2, moveOverhead: 200
  }, storage);

  assert.deepEqual(loadEngineSettings(storage), saved);
  assert.deepEqual(getPlayEngineSettings('high', storage), saved);
  assert.equal(storage.getItem(ENGINE_SETTINGS_KEY), JSON.stringify(saved));
});

test('lower duel levels reduce only depth and time without exceeding system maxima', () => {
  const storage = createStorage();
  saveEngineSettings({
    threads: 3, hash: 768, depth: 16, movetime: 3000, multiPv: 5, moveOverhead: 50
  }, storage);

  assert.deepEqual(getPlayEngineSettings('low', storage), {
    threads: 3, hash: 768, depth: 10, movetime: 2000, multiPv: 5, moveOverhead: 50
  });
  assert.deepEqual(getPlayEngineSettings('medium', storage), {
    threads: 3, hash: 768, depth: 16, movetime: 3000, multiPv: 5, moveOverhead: 50
  });
  assert.throws(() => getPlayEngineSettings('unknown', storage), /Unknown Xiangqi engine level/);
});

test('settings validation rejects unsafe or out-of-range values', () => {
  const storage = createStorage();
  assert.throws(() => saveEngineSettings({ threads: 0 }, storage), /threads must be an integer/);
  assert.throws(() => saveEngineSettings({ hash: 5000 }, storage), /hash must be an integer/);
  assert.throws(() => saveEngineSettings({ depth: 31 }, storage), /depth must be an integer/);
  assert.throws(() => saveEngineSettings({ movetime: 50000 }, storage), /movetime must be an integer/);
  assert.throws(() => saveEngineSettings({ multiPv: 6 }, storage), /multiPv must be an integer/);
});

test('only play pages offer difficulty selection and AI-AI sides remain independent', async () => {
  const human = await readFile(new URL('../chinese-chess/play/human-ai.html', import.meta.url), 'utf8');
  const aiAi = await readFile(new URL('../chinese-chess/play/ai-ai.html', import.meta.url), 'utf8');
  assert.match(human, /id="humanLevel"/);
  assert.match(aiAi, /id="aiAiRedLevel"/);
  assert.match(aiAi, /id="aiAiBlackLevel"/);
  assert.doesNotMatch(human, /id="human(?:Depth|Skill|MoveTime|MultiPv|Style)"/);
  assert.doesNotMatch(aiAi, /id="aiAi(?:Red|Black)(?:Depth|Skill|MoveTime|MultiPv)"/);
});

test('teaching and root gene searches read global settings at request time', async () => {
  for (const [file, relativeImport] of [
    ['../chinese-chess/academy/endgame/endgame-page.mjs', '../../shared/engine-settings.mjs'],
    ['../chinese-chess/rootgene/rootgene-page.mjs', '../shared/engine-settings.mjs']
  ]) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.ok(source.includes(`from '${relativeImport}'`), file);
    assert.match(source, /settings: loadEngineSettings\(\)/, file);
  }
});

test('AI engine settings page provides editable global settings and engine diagnostics', async () => {
  const html = await readFile(new URL('../chinese-chess/ai-engine/index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../chinese-chess/ai-engine/ai-engine-page.mjs', import.meta.url), 'utf8');
  for (const name of Object.keys(DEFAULT_ENGINE_SETTINGS)) assert.match(html, new RegExp(`name="${name}"`));
  assert.match(html, /id="engineHelpButton"[^>]*aria-haspopup="dialog"/);
  assert.match(html, /id="engineHelpDialog"[^>]*aria-labelledby="engineHelpTitle"/);
  assert.match(html, /着法预留/);
  assert.match(script, /engineHelpButton[\s\S]*helpDialog\.showModal\(\)/);
  assert.match(html, /id="testFen"/);
  assert.match(html, /id="testEngine"/);
  assert.match(script, /saveEngineSettings/);
  assert.match(script, /api\/v1\/chinese-chess\/engine\/ai-ai\/move/);
  assert.match(script, /api\/v1\/chinese-chess\/engine\/health/);
});
