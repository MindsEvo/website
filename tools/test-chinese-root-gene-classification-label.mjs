import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPuzzleClassification } from '../chinese-chess/rootgene/classification-label.mjs';

const families = {
  endgame: '残局基础',
  attacking: '基本攻杀',
  tactics: '基本战术',
  opening: '开局'
};

test('shows group and subcategory names for all linked classifications', () => {
  const item = { classifications: [
    { family: 'endgame', group: '炮', category: '双炮杀王' },
    { family: 'tactics', group: '空间控制战术', category: '困毙' }
  ] };
  assert.equal(formatPuzzleClassification({}, item, () => null, families),
    '残局基础：炮 → 双炮杀王；基本战术：空间控制战术 → 困毙');
});

test('uses inferred classification or clearly marks an unclassified match', () => {
  const category = { family: 'attacking', label: '车炮杀法' };
  assert.equal(formatPuzzleClassification(category, {}, () => ({
    family: 'attacking', group: '双子协同', category: '马后炮'
  }), families), '基本攻杀：双子协同 → 马后炮');
  assert.equal(formatPuzzleClassification(category, {}, () => null, families), '基本攻杀：未分类');
});
