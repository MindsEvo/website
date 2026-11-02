const lessons = [
  { id: 'observation', title: '初步观察', description: '观察象棋棋盘和棋子的基本构成。', symbol: '观', color: 'observation' },
  { id: 'pieces', title: '兵种介绍', description: '认识红方与黑方棋子，了解各自名称。', symbol: '子', color: 'pieces' },
  { id: 'board', title: '棋盘显示', description: '学习楚河汉界、九宫与棋盘结构。', symbol: '盘', color: 'board' },
  { id: 'piece_moves', title: '棋子走法', description: '了解七类棋子的基本移动规则。', symbol: '走', color: 'moves' },
  { id: 'classic_games', title: '棋局演示', description: '观看棋子配合与对局过程。', symbol: '局', color: 'games', pending: true },
  { id: 'summary', title: '总结与回顾', description: '回顾棋盘、棋子与基本走法。', symbol: '记', color: 'summary' }
];

const grid = document.getElementById('lessonGrid');
for (const [index, lesson] of lessons.entries()) {
  const link = document.createElement('a');
  link.className = `lesson-card lesson-${lesson.color}`;
  link.href = `./lesson.html?lesson=${lesson.id}`;
  link.innerHTML = `
    <span class="lesson-number">${String(index + 1).padStart(2, '0')}</span>
    <span class="lesson-symbol" aria-hidden="true">${lesson.symbol}</span>
    <span class="lesson-copy"><strong>${index + 1}. ${lesson.title}</strong><span>${lesson.description}</span></span>
    <span class="lesson-state">${lesson.pending ? '演示材料待接入' : '查看课时'}</span>
    <span class="lesson-arrow" aria-hidden="true">→</span>`;
  grid.append(link);
}