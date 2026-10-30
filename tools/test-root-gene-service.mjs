import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const service = require('../server/src/rootGeneService.js');
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'root-gene-bank-'));
const fen = '8/8/8/8/8/8/8/4K2k w - - 0 1';

assert.equal(service.parseName('endgame', 'L2', 'eg_KQ-K_L2-001').folderParts[0], 'queen');
assert.equal(service.parseName('endgame', 'L3', 'eg_KR-K_L3-002').folderParts[0], 'rook');
assert.equal(service.parseName('endgame', 'L1', 'eg_K2B-K_L1-003').folderParts[0], 'bishop');
assert.equal(service.parseName('endgame', 'L1', 'eg_KBN-KN_L1-020').folderParts[0], 'knight');
assert.equal(service.parseName('endgame', 'L2', 'eg_KP-K_L2-004').folderParts[0], 'pawn');
assert.equal(service.parseName('tactics', 'L1', 'tac_fork_L1-001').group, 'groupA');
assert.equal(service.parseName('tactics', 'L2', 'tac_deflection_L2-001').group, 'groupB');
assert.equal(service.parseName('tactics', 'L3', 'tac_xRayAttack_L3-001').group, 'groupC');
assert.equal(service.parseName('tactics', 'L2', 'tac_blockade_L2-001').group, 'groupD');
assert.equal(service.parseName('mate', 'L3', 'mate_anastasia_L3-001').folderParts[0], 'anastasia');
assert.equal(service.parseName('opening', 'L2', 'eco_E99_L2-001').folderParts[1], 'E99_L2');

try {
  const endgame = await service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-020', fen }, { dataRoot: temporaryRoot });
  assert.equal(endgame.relativePath, 'web/chess/academy/endgame/data/knight');
  const endgameDirectory = path.join(temporaryRoot, 'endgame', 'data', 'knight');
  await fs.access(path.join(endgameDirectory, 'eg_KBN-KN_L1-020.anno.json'));
  await fs.access(path.join(endgameDirectory, 'eg_KBN-KN_L1-020.solution.txt'));
  await fs.access(path.join(endgameDirectory, 'eg_KBN-KN_L1-020.exp.txt'));
  const endgameManifest = JSON.parse(await fs.readFile(path.join(endgameDirectory, 'manifest.json'), 'utf8'));
  assert.equal(endgameManifest.piece, '马');
  assert.equal(endgameManifest.categories[0].key, 'kbn-kn-l1');
  assert.equal(endgameManifest.categories[0].items[0].fen, fen);
  await assert.rejects(service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-020', fen }, { dataRoot: temporaryRoot }), /已存在/);

  const tactics = await service.persistQuestion({ category: 'tactics', level: 'L2', geneName: 'tac_fork_L2-005', fen }, { dataRoot: temporaryRoot });
  assert.equal(tactics.relativePath, 'web/chess/academy/tactics/data/groupA');
  const tacticsManifest = JSON.parse(await fs.readFile(path.join(temporaryRoot, 'tactics', 'data', 'groupA', 'manifest.json'), 'utf8'));
  assert.equal(tacticsManifest.group, '战术A组');
  assert.equal(tacticsManifest.categories[0].key, 'fork');
  const mate = await service.persistQuestion({ category: 'mate', level: 'L3', geneName: 'mate_backRankMate_L3-002', fen }, { dataRoot: temporaryRoot });
  assert.equal(mate.relativePath, 'web/chess/academy/mate/data/backRankMate');
  assert.ok(Array.isArray(JSON.parse(await fs.readFile(path.join(temporaryRoot, 'mate', 'data', 'backRankMate', 'manifest.json'), 'utf8')).items));
  const opening = await service.persistQuestion({ category: 'opening', level: 'L3', geneName: 'eco_C50_L3-002', fen }, { dataRoot: temporaryRoot });
  assert.equal(opening.relativePath, 'web/chess/academy/opening/data/ECO_Opening/C50_L3');
  const openingManifest = JSON.parse(await fs.readFile(path.join(temporaryRoot, 'opening', 'data', 'ECO_Opening', 'manifest.json'), 'utf8'));
  assert.equal(openingManifest.categories[0].key, 'C50_L3');
  await fs.access(path.join(temporaryRoot, 'opening', 'data', 'ECO_Opening', 'C50_L3', 'eco_C50_L3-002.anno.json'));
  const formal = await service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-020', fen, solutionText: '1. e1e2', explanation: '正式解说' }, { dataRoot: temporaryRoot, allowExisting: true, formal: true });
  assert.equal(formal.id, endgame.id);
  assert.match(await fs.readFile(path.join(endgameDirectory, 'eg_KBN-KN_L1-020.solution.txt'), 'utf8'), /1\. e1e2/);
  assert.match(await fs.readFile(path.join(endgameDirectory, 'eg_KBN-KN_L1-020.exp.txt'), 'utf8'), /正式解说/);

  await assert.rejects(service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-021', fen: 'invalid' }, { dataRoot: temporaryRoot }), /FEN/);
  assert.match(service.CHESS_ROOT, /\\web\\chess$/i);
  console.log('PASS: JS academy routing for endgame/tactics/mate/opening, manifest updates, duplicate rejection, formal update, and FEN validation.');
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
