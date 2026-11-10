export const PUZZLE_BANK_BASE = '../bank/';

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
  const families = new Map();
  for (const category of manifest.categories) {
    const items = category.items.filter(item => !query
      || `${item.title} ${item.id} ${category.label} ${category.familyLabel} ${category.level}`.toLocaleLowerCase().includes(query));
    if (!items.length) continue;
    let family = families.get(category.family);
    if (!family) {
      family = { node: branch(`${category.familyLabel} (${category.family})`, true), levels: new Map() };
      families.set(category.family, family);
      container.append(family.node);
    }
    let level = family.levels.get(category.level);
    if (!level) {
      const labels = { L1: 'L1 基础', L2: 'L2 进阶', L3: 'L3 高阶', classic: '经典布局', ungraded: '战术专题' };
      level = branch(labels[category.level] || category.level, true);
      family.levels.set(category.level, level);
      family.node.append(level);
    }
    const group = branch(`${category.label} (${items.length})`, Boolean(query));
    for (const item of items) {
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
    level.append(group);
  }
  if (!families.size) {
    const note = document.createElement('p');
    note.className = 'bank-note';
    note.textContent = '没有匹配的棋局。';
    container.append(note);
  }
}

function branch(label, open) {
  const node = document.createElement('details');
  node.className = 'tree-group';
  node.open = open;
  const summary = document.createElement('summary');
  summary.textContent = label;
  node.append(summary);
  return node;
}
