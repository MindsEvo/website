import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_ENGINE_SETTINGS } from '../chinese-chess/shared/engine-defaults.mjs';

async function selectedOptions(file, ids) {
  const html = await readFile(new URL(file, import.meta.url), 'utf8');
  return Object.fromEntries(ids.map(id => {
    const select = html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`));
    assert.ok(select, `${id} exists`);
    const options = [...select[1].matchAll(/<option value="(\d+)"(?:\s+(selected))?>/g)];
    const selected = options.filter(option => option[2]);
    assert.equal(selected.length, 1, `${id} has one explicit default`);
    return [id, { value: Number(selected[0][1]), maximum: Math.max(...options.map(option => Number(option[1]))) }];
  }));
}

test('play pages default to their strongest settings and one principal variation', async () => {
  for (const [file, prefixes] of [
    ['../chinese-chess/play/human-ai.html', ['human']],
    ['../chinese-chess/play/ai-ai.html', ['aiAiRed', 'aiAiBlack']]
  ]) {
    const ids = prefixes.flatMap(prefix => ['Skill', 'Depth', 'MoveTime', 'MultiPv'].map(suffix => prefix + suffix));
    const selected = await selectedOptions(file, ids);
    for (const prefix of prefixes) {
      for (const suffix of ['Skill', 'Depth', 'MoveTime']) {
        assert.equal(selected[prefix + suffix].value, selected[prefix + suffix].maximum, prefix + suffix);
      }
      assert.equal(selected[prefix + 'Depth'].value, DEFAULT_ENGINE_SETTINGS.depth);
      assert.equal(selected[prefix + 'MoveTime'].value, DEFAULT_ENGINE_SETTINGS.movetime);
      assert.equal(selected[prefix + 'MultiPv'].value, DEFAULT_ENGINE_SETTINGS.multiPv);
    }
  }
});

test('teaching and root gene pages send the shared strongest search defaults', async () => {
  assert.deepEqual(DEFAULT_ENGINE_SETTINGS, { threads: 1, hash: 128, depth: 15, movetime: 5000, multiPv: 1 });
  for (const file of ['../chinese-chess/academy/endgame/endgame-page.mjs', '../chinese-chess/rootgene/rootgene-page.mjs']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /import \{ DEFAULT_ENGINE_SETTINGS \}/);
    assert.match(source, /settings: DEFAULT_ENGINE_SETTINGS/);
  }
});
