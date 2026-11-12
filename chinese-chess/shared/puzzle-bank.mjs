import {
  ATTACKING_GROUPS,
  selectAttackingPuzzles
} from '../academy/attacking/attacking-catalog.mjs';
import {
  OPENING_GROUPS,
  OPENING_SUBGROUPS,
  OPENING_ROOTS,
  selectOpeningPuzzles
} from '../academy/opening/opening-catalog.mjs';

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
    const sourceCategories = manifest.categories
      .filter(category => category.family === familyName);
    const categories = sourceCategories
      .map(category => ({
        ...category,
        items: category.items.filter(item => !normalizedQuery
          || `${item.title} ${item.id} ${category.label} ${category.familyLabel} ${category.level} ${category.key}`
            .toLocaleLowerCase().includes(normalizedQuery))
      }))
      .filter(category => category.items.length > 0);
    if (familyName === 'attacking' && normalizedQuery) {
      const matchingMethods = Object.entries(ATTACKING_GROUPS)
        .flatMap(([group, methods]) => methods
          .filter(method => `${group} ${method}`.toLocaleLowerCase().includes(normalizedQuery)));
      const matchingIds = new Set(matchingMethods.flatMap(method =>
        selectAttackingPuzzles({ categories: sourceCategories }, method).map(item => item.id)));
      if (matchingIds.size) {
        for (const category of sourceCategories) {
          const visible = categories.find(item => item.key === category.key);
          const matchedItems = category.items.filter(item => matchingIds.has(item.id));
          if (visible) {
            visible.items = [...new Map([...visible.items, ...matchedItems].map(item => [item.id, item])).values()];
          } else if (matchedItems.length) {
            categories.push({ ...category, items: matchedItems });
          }
        }
      }
    }
    if (familyName === 'opening' && normalizedQuery) {
      const matchingTypes = Object.entries(OPENING_GROUPS)
        .flatMap(([group, subgroups]) => subgroups.flatMap(subgroup =>
          (OPENING_SUBGROUPS[subgroup] || [subgroup])
            .filter(type => `${group} ${subgroup} ${type}`.toLocaleLowerCase().includes(normalizedQuery))));
      const matchingIds = new Set(matchingTypes.flatMap(type =>
        selectOpeningPuzzles({ categories: sourceCategories }, type).map(item => item.id)));
      if (matchingIds.size) {
        for (const category of sourceCategories) {
          const visible = categories.find(item => item.key === category.key);
          const matchedItems = category.items.filter(item => matchingIds.has(item.id));
          if (visible) {
            visible.items = [...new Map([...visible.items, ...matchedItems].map(item => [item.id, item])).values()];
          } else if (matchedItems.length) {
            categories.push({ ...category, items: matchedItems });
          }
        }
      }
    }
    const familyLabel = FAMILY_LABELS[familyName]
      || `${manifest.categories.find(category => category.family === familyName)?.familyLabel || familyName} (${familyName})`;
    if (normalizedQuery && !categories.length) continue;

    const family = branch(familyLabel, true, 'tree-family');
    visibleFamilies += 1;
    container.append(family);

    if (familyName === 'attacking') {
      renderAttackingGroups(family, categories, selectedId, onSelect);
      continue;
    }

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
      renderOpeningGroups(family, categories, selectedId, onSelect);
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

function renderOpeningGroups(parent, categories, selectedId, onSelect) {
  const manifest = { categories };
  const categoryByItem = new Map(categories.flatMap(category =>
    category.items.map(item => [item.id, category])));
  const rootByName = new Map(OPENING_ROOTS.map(root => [root.name, root]));
  for (const [groupName, subgroups] of Object.entries(OPENING_GROUPS)) {
    const group = branch(groupName, true, 'tree-level');
    let groupCount = 0;
    for (const subgroupName of subgroups) {
      const types = OPENING_SUBGROUPS[subgroupName];
      if (!types) {
        groupCount += renderOpeningType(group, subgroupName, manifest, rootByName, categoryByItem, selectedId, onSelect);
        continue;
      }
      const subgroup = branch(subgroupName, true, 'tree-category');
      let subgroupCount = 0;
      for (const type of types) {
        subgroupCount += renderOpeningType(subgroup, type, manifest, rootByName, categoryByItem, selectedId, onSelect);
      }
      if (subgroupCount) {
        subgroup.querySelector('summary').textContent = `${subgroupName} (${subgroupCount})`;
        group.append(subgroup);
        groupCount += subgroupCount;
      }
    }
    if (groupCount) {
      group.querySelector('summary').textContent = `${groupName} (${groupCount})`;
      parent.append(group);
    }
  }
}

function renderOpeningType(parent, type, manifest, rootByName, categoryByItem, selectedId, onSelect) {
  const root = rootByName.get(type);
  if (!root) return 0;
  const availableItems = new Map(manifest.categories.flatMap(category =>
    category.items.map(item => [item.id, item])));
  const puzzles = root.puzzles.map(id => availableItems.get(id)).filter(Boolean);
  if (!puzzles.length) return 0;
  const typeGroup = branch(`${type} (${puzzles.length})`, true, 'tree-category');
  for (const item of puzzles) {
    typeGroup.append(createPuzzleLeaf(categoryByItem.get(item.id), item, selectedId, onSelect));
  }
  parent.append(typeGroup);
  return puzzles.length;
}

function renderAttackingGroups(parent, categories, selectedId, onSelect) {
  const manifest = { categories };
  const categoryByItem = new Map(categories.flatMap(category =>
    category.items.map(item => [item.id, category])));
  const renderedIds = new Set();
  for (const [groupName, methods] of Object.entries(ATTACKING_GROUPS)) {
    const group = branch(groupName, true, 'tree-level');
    let groupCount = 0;
    for (const method of methods) {
      const puzzles = selectAttackingPuzzles(manifest, method)
        .filter(puzzle => !renderedIds.has(puzzle.id));
      if (!puzzles.length) continue;
      const category = branch(`${method} (${puzzles.length})`, true, 'tree-category');
      for (const item of puzzles) {
        renderedIds.add(item.id);
        category.append(createPuzzleLeaf(categoryByItem.get(item.id), item, selectedId, onSelect));
      }
      groupCount += puzzles.length;
      group.append(category);
    }
    if (groupCount) {
      group.querySelector('summary').textContent = `${groupName} (${groupCount})`;
      parent.append(group);
    }
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
      group.append(createPuzzleLeaf(category, item, selectedId, onSelect));
    }
    parent.append(group);
  }
}

function createPuzzleLeaf(category, item, selectedId, onSelect) {
  const leaf = document.createElement('button');
  leaf.type = 'button';
  leaf.className = `bank-leaf${selectedId === item.id ? ' selected' : ''}`;
  leaf.setAttribute('role', 'treeitem');
  const sequence = item.id.match(/-(\d{3})$/)?.[1];
  leaf.textContent = sequence ? `${item.title} · ${sequence}` : item.title;
  leaf.title = item.id;
  leaf.dataset.puzzleId = item.id;
  leaf.addEventListener('click', () => onSelect(category, item));
  return leaf;
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
