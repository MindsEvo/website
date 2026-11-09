export const OPENING_GROUPS = {
  先手主流开局: ['中炮类', '马类开局', '兵类开局', '相类开局'],
  后手应对体系: ['屏风马体系', '反宫马体系', '顺炮体系', '列手炮体系'],
  冷门特色开局: ['过宫炮', '士角炮', '鸳鸯炮', '龟背炮']
};

export const OPENING_SUBGROUPS = {
  中炮类: ['中炮对屏风马', '中炮对反宫马', '中炮对单提马'],
  马类开局: ['起马局（正马）', '边马局（偏马）'],
  兵类开局: ['仙人指路', '九尾龟'],
  相类开局: ['飞相局（正相）', '转角炮'],
  屏风马体系: ['屏风马对中炮', '屏风马对飞相'],
  反宫马体系: ['反宫马对中炮', '反宫马对起马'],
  顺炮体系: ['顺炮直车对横车', '顺炮横车对直车'],
  列手炮体系: ['大列手炮', '小列手炮'],
  过宫炮: ['过宫炮对中炮', '过宫炮对起马'],
  士角炮: ['士角炮对中炮', '士角炮对飞相'],
  鸳鸯炮: ['鸳鸯炮对中炮', '鸳鸯炮对仙人指路'],
  龟背炮: ['龟背炮对中炮', '龟背炮对起马']
};

export const OPENING_ROOTS = [
  { id: 'cc.opening.central.screen', name: '中炮对屏风马', knowledge: '中炮进攻与双马稳健防守；屏风马不是顺炮。', puzzles: ['oc_zhongpao_L1-003'] },
  { id: 'cc.opening.central.palcorner', name: '中炮对反宫马', knowledge: '中炮进攻与反宫马防守反击；反宫马不是列手炮。', puzzles: [] },
  { id: 'cc.opening.central.singlehorse', name: '中炮对单提马', knowledge: '认识单提马阵形与中炮的攻防关系。', puzzles: [] },
  { id: 'cc.opening.first.horse', name: '起马局（正马）', knowledge: '先出正马，观察对方应着再转换阵形。', puzzles: [] },
  { id: 'cc.opening.first.edgehorse', name: '边马局（偏马）', knowledge: '从边路出马，比较正马与边马的活动空间。', puzzles: [] },
  { id: 'cc.opening.first.fairypawn', name: '仙人指路', knowledge: '兵三进一或兵七进一，试探对方布局。', puzzles: [] },
  { id: 'cc.opening.first.edgepawn', name: '九尾龟', knowledge: '兵一进一或兵九进一，观察边路空间。', puzzles: [] },
  { id: 'cc.opening.first.elephant', name: '飞相局（正相）', knowledge: '先飞相，稳固阵形并保持布局弹性。', puzzles: [] },
  { id: 'cc.opening.first.cornercannon', name: '转角炮', knowledge: '按本课程列项观察相三进五与炮二平三的组合；具体定式和名称待棋谱核实。', puzzles: [] },
  { id: 'cc.opening.screen.central', name: '屏风马对中炮', knowledge: '从后手视角观察双马防守与反击。', puzzles: ['oc_zhongpao_L1-003'] },
  { id: 'cc.opening.screen.elephant', name: '屏风马对飞相', knowledge: '比较屏风马与飞相阵形的出子顺序。', puzzles: [] },
  { id: 'cc.opening.palcorner.central', name: '反宫马对中炮', knowledge: '从后手视角观察反宫马的防守转换。', puzzles: [] },
  { id: 'cc.opening.palcorner.horse', name: '反宫马对起马', knowledge: '观察反宫马与起马局的阵形变化。', puzzles: [] },
  { id: 'cc.opening.same.directcross', name: '顺炮直车对横车', knowledge: '双方同向中炮；先手直车与后手横车的争先。', puzzles: [] },
  { id: 'cc.opening.same.crossdirect', name: '顺炮横车对直车', knowledge: '双方同向中炮；先手横车与后手直车的争先。原题库古谱保留原名，并非新编入门定式。', puzzles: ['oc_zhongpao_L1-002'] },
  { id: 'cc.opening.opposite.large', name: '大列手炮', knowledge: '双方异向中炮，认识大列手炮的阵形特点。', puzzles: [] },
  { id: 'cc.opening.opposite.small', name: '小列手炮', knowledge: '比较小列手炮与大列手炮的出子差异。', puzzles: [] },
  { id: 'cc.opening.palace.central', name: '过宫炮对中炮', knowledge: '观察过宫炮与中炮的阵形关系。', puzzles: [] },
  { id: 'cc.opening.palace.horse', name: '过宫炮对起马', knowledge: '观察过宫炮与起马局的布局转换。', puzzles: [] },
  { id: 'cc.opening.advisor.central', name: '士角炮对中炮', knowledge: '观察士角炮的支援线路与中炮的中路压力。', puzzles: [] },
  { id: 'cc.opening.advisor.elephant', name: '士角炮对飞相', knowledge: '比较士角炮与飞相的灵活布阵。', puzzles: [] },
  { id: 'cc.opening.duck.central', name: '鸳鸯炮对中炮', knowledge: '观察鸳鸯炮的双炮配置与中路防守。', puzzles: [] },
  { id: 'cc.opening.duck.fairypawn', name: '鸳鸯炮对仙人指路', knowledge: '观察双炮配置与挺兵试探的攻防关系。', puzzles: [] },
  { id: 'cc.opening.turtle.central', name: '龟背炮对中炮', knowledge: '观察龟背炮的防守配置与中炮进攻。', puzzles: [] },
  { id: 'cc.opening.turtle.horse', name: '龟背炮对起马', knowledge: '观察龟背炮与起马局的出子和阵形转换。', puzzles: [] }
];

export const OPENING_CATEGORIES = Object.fromEntries(OPENING_ROOTS.map(root => [root.name, root.puzzles]));

export function selectOpeningPuzzles(manifest, name) {
  const root = OPENING_ROOTS.find(root => root.name === name);
  if (!root) throw new Error(`未知开局：${name}`);
  const items = manifest.categories.filter(category => category.key.startsWith('opening/'))
    .flatMap(category => category.items);
  return root.puzzles.map(id => {
    const puzzle = items.find(puzzle => puzzle.id === id);
    if (!puzzle) throw new Error(`题库缺少开局棋局：${id}`);
    return puzzle;
  });
}
