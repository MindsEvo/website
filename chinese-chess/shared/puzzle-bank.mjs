export const PUZZLE_BANK_BASE = '../bank/';

export async function loadPuzzleBank() {
  const response = await fetch(`${PUZZLE_BANK_BASE}manifest.json`);
  if (!response.ok) throw new Error(`题库清单载入失败 (${response.status})`);
  return response.json();
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
