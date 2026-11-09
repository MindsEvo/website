import { initEndgamePage } from '../endgame/endgame-page.mjs';
import {
  ATTACKING_GROUPS, ATTACKING_CATEGORIES, ATTACKING_ROOTS, ATTACKING_UNITS,
  selectAttackingPuzzles
} from './attacking-catalog.mjs';

initEndgamePage({
  groups: ATTACKING_GROUPS,
  categories: ATTACKING_CATEGORIES,
  roots: Object.fromEntries(ATTACKING_ROOTS.map(root => [root.name, root.id])),
  methodDescriptions: Object.fromEntries(ATTACKING_ROOTS.map(root => [root.name, root.knowledge])),
  groupDescriptions: ATTACKING_UNITS,
  selectPuzzles: selectAttackingPuzzles,
  label: '杀法',
  audience: {
    student: '先认识将帅的弱点，再发现关键位置，学习双子配合、组合进攻和连续推演。观察典型局面，说明杀法目标，再尝试走棋。',
    parent: '五类是面向儿童的教学分组，并非棋界统一技术分类。鼓励孩子解释棋子之间的关系。后续按“识别 → 找到杀法 → 完成杀棋 → 变化应用”逐步接入独立练习。'
  }
});
