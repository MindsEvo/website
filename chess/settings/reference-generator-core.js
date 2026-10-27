(function (root) {
  'use strict';

  function collect(bank, source, type, level, theme) {
    if (!bank || !Array.isArray(bank.tree)) return [];
    const rootIndex = source === 'endgame' ? 1 : type === 'mate' ? 3 : 2;
    const category = bank.tree[rootIndex];
    if (!category) return [];
    const items = [];
    function walk(node, path) {
      const currentPath = path.concat(node.label);
      if (node.question && bank.questions[node.question]) {
        const levelMatch = currentPath.join(' ').match(/\bL([123])\b/);
        const itemLevel = levelMatch ? 'L' + levelMatch[1] : 'L1';
        const itemTheme = source === 'endgame' ? currentPath[2] : currentPath[1];
        if ((level === 'all' || itemLevel === level) && (theme === 'all' || itemTheme === theme)) {
          items.push({ id: node.question, label: node.label, path: currentPath, level: itemLevel, theme: itemTheme, question: bank.questions[node.question] });
        }
        return;
      }
      (node.children || []).forEach(child => walk(child, currentPath));
    }
    (category.children || []).forEach(child => walk(child, [category.label]));
    return items;
  }

  function sample(items, requested, random) {
    const count = Math.max(0, Math.min(Number(requested) || 0, items.length));
    const pool = items.slice();
    const rng = random || Math.random;
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    return pool.slice(0, count);
  }

  root.ChessReferenceGenerator = { collect, sample };
})(window);
