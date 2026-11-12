export const PUZZLE_BANK_BASE = '../bank/';

const FAMILY_ORDER = ['endgame', 'attacking', 'tactics', 'opening', 'comprehensive'];
const FAMILY_LABELS = {
  endgame: '残局基因 (endgame)',
  attacking: '攻杀基因 (attacking)',
  tactics: '战术基因 (tactics)',
  opening: '开局基因 (opening)',
  comprehensive: '综合基因 (comprehensive)'
};
const LEVEL_LABELS = { L1: 'L1 基础', L2: 'L2 组合', L3: 'L3 复杂' };
const PIECE_ORDER = ['rook', 'horse', 'cannon', 'pawn', 'others'];
const PIECE_LABELS = { rook: '车类', horse: '马类', cannon: '炮类', pawn: '兵类', others: '其他' };
const TACTIC_ORDER = [
  'zhuoshuang', 'shanji', 'shuangchongweixie', 'shanjiang', 'choujiang',
  'yinli', 'xiyin', 'dusai', 'lanjie', 'qianzhi', 'jieli', 'fengsuo',
  'tengnuo', 'yuhui', 'jiaohuan', 'duncuo', 'dengzhe', 'kunzi', 'kunbi',
  'jiejiang', 'jiesha', 'duizi', 'qizi'
];
const TACTIC_LABELS = {
  zhuoshuang: '捉双', shanji: '闪击', shuangchongweixie: '双威',
  shanjiang: '闪将', choujiang: '抽将', yinli: '引离', xiyin: '吸引',
  dusai: '堵塞', lanjie: '拦截', qianzhi: '牵制', jieli: '接力',
  fengsuo: '封锁', tengnuo: '腾挪', yuhui: '迂回', jiaohuan: '交换',
  duncuo: '顿挫', dengzhe: '等着', kunzi: '困子', kunbi: '困毙',
  jiejiang: '解将', jiesha: '解杀', duizi: '兑子', qizi: '弃子'
};
const OPENING_LABELS = {
  bingdipao: '兵底炮', feixiang: '飞相', guogongpao: '过宫炮',
  jingoupao: '金钩炮', qima: '起马', sanbuhu: '三步虎',
  xianrenzhilu: '仙人指路', zhongpao: '中炮'
};

export function pairedExplanation(puzzle, index) {
  const solution = puzzle.solutions?.[index];
  if (puzzle.rootGene === 'manual' && solution) {
    const version = solution.match(/-(\d{3})\.txt$/)?.[1];
    return version ? puzzle.explanations?.find(file => file.endsWith(`_exp-${version}.txt`)) : undefined;
  }
  return puzzle.explanations?.[index];
}

export async function loadPuzzleBank() {
  const manifests = await Promise.all(['manifest.json', 'endgame/L1/manifest.json'].map(async file => {
    const response = await fetch(`${PUZZLE_BANK_BASE}${file}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`题库清单载入失败 (${response.status})：${file}`);
    return response.json();
  }));
  const [manifest, customManifest] = manifests;
  const families = { eg: ['endgame', '残局基础'], at: ['attacking', '基本攻杀'], tac: ['tactics', '基本战术'] };
  const knownIds = new Set(manifest.categories.flatMap(category => category.items.map(item => item.id)));
  for (const item of customManifest.categories.find(category => category.key === 'custom')?.items || []) {
    if (knownIds.has(item.id)) continue;
    const match = /^(eg|at|tac)_CUSTOM_(L[1-3])-\d{3}$/.exec(item.id);
    if (!match) throw new Error(`手工棋局编号无效：${item.id}`);
    const [, prefix, level] = match;
    const [family, familyLabel] = families[prefix];
    const key = `${family}/${level}/custom`;
    let category = manifest.categories.find(category => category.key === key);
    if (!category) {
      category = { key, family, familyLabel, level, label: '手工编辑', items: [] };
      manifest.categories.push(category);
    }
    const withBase = file => `endgame/L1/${file}`;
    category.items.push({
      ...item,
      fen: withBase(item.fen),
      metadata: item.metadata ? withBase(item.metadata) : undefined,
      solutions: (item.solutions || []).map(withBase),
      explanations: (item.explanations || []).map(withBase)
    });
    knownIds.add(item.id);
  }
  return manifest;
}

export function renderPuzzleBank(container, manifest, query, selectedId, onSelect) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const knownFamilies = new Set(FAMILY_ORDER);
  const extraFamilies = [...new Set(manifest.categories.map(category => category.family))]
    .filter(family => !knownFamilies.has(family))
    .sort((first, second) => first.localeCompare(second));
  const familyOrder = [...FAMILY_ORDER, ...extraFamilies];
  let visibleFamilies = 0;

  for (const familyName of familyOrder) {
    const categories = manifest.categories
      .filter(category => category.family === familyName)
      .map(category => ({
        ...category,
        items: category.items.filter(item => !normalizedQuery
          || `${item.title} ${item.id} ${category.label} ${category.familyLabel} ${category.level} ${category.key}`
            .toLocaleLowerCase().includes(normalizedQuery))
      }))
      .filter(category => category.items.length > 0);
    const familyLabel = FAMILY_LABELS[familyName]
      || `${manifest.categories.find(category => category.family === familyName)?.familyLabel || familyName} (${familyName})`;
    if (normalizedQuery && !categories.length) continue;

    const family = branch(familyLabel, true, 'tree-family');
    visibleFamilies += 1;
    container.append(family);

    if (familyName === 'tactics') {
      renderCategories(family, categories, {
        labels: TACTIC_LABELS,
        order: TACTIC_ORDER,
        selectedId,
        onSelect
      });
      continue;
    }

    if (familyName === 'opening') {
      for (const [directory, label] of [['classic', '经典'], ['modern', '现代']]) {
        const openingCategories = categories.filter(category => category.key.split('/')[1] === directory);
        if (normalizedQuery && !openingCategories.length) continue;
        const opening = branch(label, true, 'tree-level');
        family.append(opening);
        if (!openingCategories.length) {
          appendEmptyNote(opening, '当前目录暂无棋局文件。');
          continue;
        }
        renderCategories(opening, openingCategories, {
          labels: OPENING_LABELS,
          selectedId,
          onSelect
        });
      }
      continue;
    }

    for (const levelName of ['L1', 'L2', 'L3']) {
      const levelCategories = categories.filter(category => category.level === levelName);
      if (normalizedQuery && !levelCategories.length) continue;
      const level = branch(LEVEL_LABELS[levelName], true, 'tree-level');
      family.append(level);
      if (!levelCategories.length) {
        appendEmptyNote(level, '当前级别暂无棋局文件。');
        continue;
      }
      renderCategories(level, levelCategories, {
        labels: PIECE_LABELS,
        order: PIECE_ORDER,
        selectedId,
        onSelect
      });
    }
  }

  if (!visibleFamilies) {
    const note = document.createElement('p');
    note.className = 'bank-note';
    note.textContent = '没有匹配的棋局。';
    container.append(note);
  }
}

function renderCategories(parent, categories, { labels, order = [], selectedId, onSelect }) {
  const sortOrder = new Map(order.map((key, index) => [key, index]));
  const sorted = [...categories].sort((first, second) => {
    const firstKey = first.key.split('/').at(-1);
    const secondKey = second.key.split('/').at(-1);
    return (sortOrder.get(firstKey) ?? order.length) - (sortOrder.get(secondKey) ?? order.length)
      || firstKey.localeCompare(secondKey);
  });

  for (const category of sorted) {
    const key = category.key.split('/').at(-1);
    const label = labels[key] || category.label || key;
    const group = branch(`${label} (${category.items.length})`, true, 'tree-category');
    for (const item of category.items) {
      const leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = `bank-leaf${selectedId === item.id ? ' selected' : ''}`;
      leaf.setAttribute('role', 'treeitem');
      const sequence = item.id.match(/-(\d{3})$/)?.[1];
      leaf.textContent = sequence ? `${item.title} · ${sequence}` : item.title;
      leaf.title = item.id;
      leaf.dataset.puzzleId = item.id;
      leaf.addEventListener('click', () => onSelect(category, item));
      group.append(leaf);
    }
    parent.append(group);
  }
}

function appendEmptyNote(parent, text) {
  const note = document.createElement('p');
  note.className = 'bank-note';
  note.textContent = text;
  parent.append(note);
}

function branch(label, open, className = '') {
  const node = document.createElement('details');
  node.className = `tree-group ${className}`.trim();
  node.open = open;
  const summary = document.createElement('summary');
  summary.textContent = label;
  node.append(summary);
  return node;
}
