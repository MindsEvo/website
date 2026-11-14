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
import { getCoursePuzzleLevel } from '../academy/course-puzzle-levels.mjs';
import { TACTICS_GROUPS, selectTacticsPuzzles } from '../academy/tactics/tactics-catalog.mjs';

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
const ENDGAME_GROUP_KEYS = { 车: 'rook', 马: 'horse', 炮: 'cannon', 兵卒: 'pawn', 组合: 'others', 待定: 'pending' };
export function pairedExplanation(puzzle, index) {
  const solution = puzzle.solutions?.[index];
  if (puzzle.rootGene === 'manual' && solution) {
    const version = solution.match(/-(\d{3})\.txt$/)?.[1];
    return version ? puzzle.explanations?.find(file => file.endsWith(`_exp-${version}.txt`)) : undefined;
  }
  return puzzle.explanations?.[index];
}

export async function loadPuzzleBank(base = PUZZLE_BANK_BASE) {
  const manifests = await Promise.all(['manifest.json', 'endgame/L1/manifest.json'].map(async file => {
    const response = await fetch(`${base}${file}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`题库清单载入失败 (${response.status})：${file}`);
    return response.json();
  }));
  const [manifest, customManifest] = manifests;
  const families = { eg: ['endgame', '残局基础'], at: ['attacking', '基本攻杀'], tac: ['tactics', '基本战术'], oc: ['opening', '开局'] };
  const knownIds = new Set(manifest.categories.flatMap(category => category.items.map(item => item.id)));
  for (const item of customManifest.categories.find(category => category.key === 'custom')?.items || []) {
    if (knownIds.has(item.id)) continue;
    const match = /^(eg|at|tac|oc)_[\p{L}\p{N}]+_(L[1-3])-\d{3}$/u.exec(item.id);
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
      .filter(category => category.family === familyName)
      .map(category => ({ ...category, items: category.items.filter(item => !item.classifications) }));
    const classifiedEntries = manifest.categories.flatMap(category => category.items.flatMap(item =>
      (item.classifications || []).filter(entry => entry.family === familyName
        && (!normalizedQuery || `${item.title} ${item.id} ${entry.group} ${entry.category} ${PIECE_LABELS[ENDGAME_GROUP_KEYS[entry.group]] || ''} ${getCoursePuzzleLevel(item, category.level)} ${Object.entries(OPENING_SUBGROUPS).filter(([, types]) => entry.family === 'opening' && types.includes(entry.category)).map(([name]) => name).join(' ')}`.toLocaleLowerCase().includes(normalizedQuery)))
        .map(entry => ({ category, item, entry }))));
    const categories = sourceCategories
      .map(category => ({
        ...category,
        items: category.items.filter(item => !normalizedQuery
          || (['tactics', 'opening'].includes(familyName) && '待定'.includes(normalizedQuery)
            && (item.namingPending || item.classificationPending))
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
        selectOpeningPuzzles(manifest, type).map(item => item.id)));
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
    if (normalizedQuery && !categories.length && !classifiedEntries.length) continue;

    const family = branch(familyLabel, true, 'tree-family');
    visibleFamilies += 1;
    container.append(family);
    if (classifiedEntries.length && !['endgame', 'attacking', 'tactics', 'opening'].includes(familyName)) {
      const groups = new Map();
      for (const record of classifiedEntries) {
        const key = `${record.entry.group} → ${record.entry.category}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(record);
      }
      for (const [label, records] of groups) {
        const group = branch(`${label} (${records.length})`, true, 'tree-category');
        for (const { category, item } of records) group.append(createPuzzleLeaf(category, item, selectedId, onSelect));
        family.append(group);
      }
    }

    if (familyName === 'attacking') {
      renderAttackingGroups(family, categories, classifiedEntries, selectedId, onSelect);
      continue;
    }

    if (familyName === 'tactics') {
      renderTacticsGroups(family, categories, classifiedEntries, selectedId, onSelect);
      continue;
    }

    if (familyName === 'opening') {
      renderOpeningGroups(family, categories, classifiedEntries, manifest, selectedId, onSelect);
      continue;
    }

    for (const levelName of ['L1', 'L2', 'L3']) {
      if (familyName === 'endgame') {
        const groups = groupEndgameEntries(categories, classifiedEntries, levelName);
        if (normalizedQuery && !groups.length) continue;
        const level = branch(LEVEL_LABELS[levelName], true, 'tree-level');
        family.append(level);
        if (!groups.length) appendEmptyNote(level, '当前级别暂无棋局文件。');
        for (const { label, records } of groups) {
          const group = branch(`${label} (${records.length})`, true, 'tree-category');
          const subgroups = new Map();
          for (const { category, item, subcategories } of records) {
            if (!subcategories.length) group.append(createPuzzleLeaf(category, item, selectedId, onSelect));
            for (const name of subcategories) {
              if (!subgroups.has(name)) subgroups.set(name, []);
              subgroups.get(name).push({ category, item });
            }
          }
          for (const [name, entries] of subgroups) {
            const subgroup = branch(`${name} (${entries.length})`, true, 'tree-category');
            for (const { category, item } of entries) subgroup.append(createPuzzleLeaf(category, item, selectedId, onSelect));
            group.append(subgroup);
          }
          level.append(group);
        }
        continue;
      }
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

export function groupEndgameEntries(categories, classifiedEntries, levelName) {
  const groups = new Map();
  const add = (key, label, category, item, subcategory = '') => {
    if (getCoursePuzzleLevel(item, category.level) !== levelName) return;
    if (!groups.has(key)) groups.set(key, { key, label, records: new Map() });
    const records = groups.get(key).records;
    if (!records.has(item.id)) records.set(item.id, { category, item, subcategories: [] });
    const record = records.get(item.id);
    if (subcategory && !record.subcategories.includes(subcategory)) record.subcategories.push(subcategory);
  };
  for (const category of categories) {
    for (const item of category.items) {
      const key = item.classificationPending ? 'pending' : category.key.split('/').at(-1);
      add(key, key === 'pending' ? '待定' : PIECE_LABELS[key] || category.label || key, category, item);
    }
  }
  for (const { category, item, entry } of classifiedEntries) {
    const key = ENDGAME_GROUP_KEYS[entry.group] || entry.group;
    add(key, key === 'pending' ? '待定' : PIECE_LABELS[key] || entry.group, category, item, key === 'pending' ? '' : entry.category);
  }
  const order = new Map([...PIECE_ORDER, 'pending'].map((key, index) => [key, index]));
  return [...groups.values()]
    .sort((a, b) => (order.get(a.key) ?? order.size) - (order.get(b.key) ?? order.size) || a.label.localeCompare(b.label))
    .map(({ key, label, records }) => ({ key, label, records: [...records.values()] }));
}

function visibleCourseCategories(categories, classifiedEntries) {
  const result = categories.map(category => ({ ...category, items: [...category.items] }));
  for (const { category, item } of classifiedEntries) {
    let visible = result.find(entry => entry.key === category.key);
    if (!visible) {
      visible = { ...category, items: [] };
      result.push(visible);
    }
    if (!visible.items.some(entry => entry.id === item.id)) visible.items.push(item);
  }
  return result;
}

function renderOpeningGroups(parent, categories, classifiedEntries, manifest, selectedId, onSelect) {
  const visible = visibleCourseCategories(categories, classifiedEntries);
  const categoryByItem = new Map(visible.flatMap(category =>
    category.items.map(item => [item.id, category])));
  if (!categoryByItem.size) return;
  const rootByName = new Map(OPENING_ROOTS.map(root => [root.name, root]));
  for (const [groupName, subgroups] of Object.entries(OPENING_GROUPS)) {
    const group = branch(groupName, true, 'tree-level');
    let groupCount = 0;
    if (groupName === '待定') {
      const puzzles = selectOpeningPuzzles(manifest, groupName).filter(puzzle => categoryByItem.has(puzzle.id));
      if (puzzles.length) {
        group.querySelector('summary').textContent = `${groupName} (${puzzles.length})`;
        for (const puzzle of puzzles) group.append(createPuzzleLeaf(categoryByItem.get(puzzle.id), puzzle, selectedId, onSelect));
        parent.append(group);
      }
      continue;
    }
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
  const puzzles = selectOpeningPuzzles(manifest, type).filter(item => categoryByItem.has(item.id));
  if (!puzzles.length) return 0;
  const typeGroup = branch(`${type} (${puzzles.length})`, true, 'tree-category');
  for (const item of puzzles) {
    typeGroup.append(createPuzzleLeaf(categoryByItem.get(item.id), item, selectedId, onSelect));
  }
  parent.append(typeGroup);
  return puzzles.length;
}

function renderAttackingGroups(parent, categories, classifiedEntries, selectedId, onSelect) {
  const allCategories = visibleCourseCategories(categories, classifiedEntries);
  const manifest = { categories: allCategories };
  const categoryByItem = new Map(allCategories.flatMap(category =>
    category.items.map(item => [item.id, category])));
  const renderedIds = new Set();
  for (const [groupName, methods] of Object.entries(ATTACKING_GROUPS)) {
    const group = branch(groupName, true, 'tree-level');
    let groupCount = 0;
    for (const method of methods) {
      const puzzles = selectAttackingPuzzles(manifest, method)
        .filter(puzzle => puzzle.classifications || !renderedIds.has(puzzle.id));
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

function renderTacticsGroups(parent, categories, classifiedEntries, selectedId, onSelect) {
  const allCategories = visibleCourseCategories(categories, classifiedEntries);
  const manifest = { categories: allCategories };
  const categoryByItem = new Map(allCategories.flatMap(category =>
    category.items.map(item => [item.id, category])));
  for (const [groupName, methods] of Object.entries(TACTICS_GROUPS)) {
    const group = branch(groupName, true, 'tree-level');
    let count = 0;
    for (const method of groupName === '待定' ? ['待定'] : methods) {
      const puzzles = selectTacticsPuzzles(manifest, method);
      if (!puzzles.length) continue;
      if (groupName === '待定') {
        for (const item of puzzles) group.append(createPuzzleLeaf(categoryByItem.get(item.id), item, selectedId, onSelect));
      } else {
        const category = branch(`${method} (${puzzles.length})`, true, 'tree-category');
        for (const item of puzzles) category.append(createPuzzleLeaf(categoryByItem.get(item.id), item, selectedId, onSelect));
        group.append(category);
      }
      count += puzzles.length;
    }
    if (count) {
      group.querySelector('summary').textContent = `${groupName} (${count})`;
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
