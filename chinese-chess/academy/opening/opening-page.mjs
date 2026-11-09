import { initEndgamePage } from '../endgame/endgame-page.mjs';
import {
  OPENING_GROUPS, OPENING_SUBGROUPS, OPENING_ROOTS, OPENING_CATEGORIES,
  selectOpeningPuzzles
} from './opening-catalog.mjs';

initEndgamePage({
  groups: OPENING_GROUPS,
  subgroups: OPENING_SUBGROUPS,
  categories: OPENING_CATEGORIES,
  roots: Object.fromEntries(OPENING_ROOTS.map(root => [root.name, root.id])),
  methodDescriptions: Object.fromEntries(OPENING_ROOTS.map(root => [root.name, root.knowledge])),
  selectPuzzles: selectOpeningPuzzles,
  label: '开局',
  audience: {
    student: '从先手主流、后手应对和冷门特色三个方向认识开局。观察出子、争先与阵形，说明每一步的目的，而不是只背棋谱。',
    parent: '课程保留12大类、25型。屏风马、反宫马、顺炮、列手炮分别呈现，不混用名称。动态观察保留原题库资料；未核实的定式和缺失题目明确标注。操作练习和问答练习后续单独接入。'
  }
});
