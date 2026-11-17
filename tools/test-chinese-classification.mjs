import assert from 'node:assert/strict';
import { CLASSIFICATION_GROUPS, validClassification } from '../chinese-chess/academy/classification.mjs';
import { ATTACKING_GROUPS, selectAttackingPuzzles } from '../chinese-chess/academy/attacking/attacking-catalog.mjs';
import { selectTacticsPuzzles } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';
import { TACTICS_GROUPS } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';
import { OPENING_GROUPS, OPENING_SUBGROUPS, selectOpeningPuzzles } from '../chinese-chess/academy/opening/opening-catalog.mjs';
import { selectCoursePuzzlesForSection } from '../chinese-chess/academy/course-puzzle-levels.mjs';

const classifications = [
  { family: 'tactics', group: '空间控制战术', category: '困毙' },
  { family: 'attacking', group: '双子协同', category: '重炮' }
];
const extendedGroups = {
  ...CLASSIFICATION_GROUPS,
  tactics: { ...CLASSIFICATION_GROUPS.tactics, 自定义: ['测试分类'] }
};
assert.ok(classifications.every(classification => validClassification(classification, extendedGroups)));
assert.ok(classifications.every(classification => validClassification(classification)));
assert.equal(validClassification({ family: 'tactics', group: '自定义', category: '测试分类' }), false);
assert.equal(validClassification({ family: 'tactics', group: '错误', category: '困毙' }), false);
const puzzle = { id: 'eg_test_L2-001', title: '测试', classifications, lessonSections: ['observation'] };
const manifest = { categories: [{ family: 'endgame', key: 'endgame/L2/cannon', items: [puzzle] }] };
assert.deepEqual(selectTacticsPuzzles(manifest, '困毙'), [puzzle]);
assert.deepEqual(selectAttackingPuzzles(manifest, '重炮'), [puzzle]);
assert.deepEqual(selectTacticsPuzzles(manifest, '弃子'), []);
assert.deepEqual(selectCoursePuzzlesForSection([puzzle], 'observation'), []);
assert.deepEqual(selectCoursePuzzlesForSection([puzzle], 'practice'), [puzzle]);

assert.deepEqual(CLASSIFICATION_GROUPS.attacking, ATTACKING_GROUPS);
for (const [group, methods] of Object.entries(ATTACKING_GROUPS)) {
  for (const method of methods) {
    const classification = { family: 'attacking', group, category: method };
    assert.ok(validClassification(classification));
    for (const level of ['L1', 'L2', 'L3']) {
      const item = { id: `at_测试_${level}-001`, title: '测试', classifications: [classification] };
      const bank = { categories: [{ family: 'attacking', items: [item] }] };
      const selected = selectAttackingPuzzles(bank, method);
      assert.deepEqual(selected, [item], `${group} → ${method} ${level}`);
      assert.deepEqual(selectCoursePuzzlesForSection(selected, 'observation'), level === 'L1' ? [item] : []);
      assert.deepEqual(selectCoursePuzzlesForSection(selected, 'practice'), level === 'L1' ? [] : [item]);
    }

    const courseGroups = {
      tactics: { groups: TACTICS_GROUPS, select: selectTacticsPuzzles },
      opening: { groups: OPENING_GROUPS, select: selectOpeningPuzzles }
    };
    for (const [family, { groups, select }] of Object.entries(courseGroups)) {
      for (const [group, names] of Object.entries(groups)) {
        const categories = group === '待定' ? ['待定'] : names.flatMap(name =>
          family === 'opening' ? OPENING_SUBGROUPS[name] || [name] : [name]);
        assert.deepEqual(CLASSIFICATION_GROUPS[family][group], categories);
        for (const category of categories) {
          const classification = { family, group, category };
          assert.ok(validClassification(classification));
          for (const level of ['L1', 'L2', 'L3']) {
            const item = { id: `eg_测试_${level}-001`, title: '测试', classifications: [classification] };
            const originals = family === 'opening' ? [
              { id: 'oc_待定中炮对屏风马棋局_L1-003' }, { id: 'oc_弃车十三招_L1-002' }
            ] : [];
            const bank = { categories: [{ family: 'endgame', items: [item] }, { family: 'opening', items: originals }] };
            const selected = select(bank, category).filter(entry => entry === item);
            assert.deepEqual(selected, [item], `${family} ${group} → ${category} ${level}`);
            assert.deepEqual(selectCoursePuzzlesForSection(selected, 'observation'), level === 'L1' ? [item] : []);
            assert.deepEqual(selectCoursePuzzlesForSection(selected, 'practice'), level === 'L1' ? [] : [item]);
          }
        }
      }
    }
  }
}
