const courses = [
  {
    number: '①', title: '初学者介绍', subtitle: '象棋入门', description: '学习象棋基本规则、棋子走法和基础概念',
    icon: 'board', level: '入门', levelClass: 'level-beginner', count: '8课时', href: './beginner.html'
  },
  {
    number: '②', title: '残局基础', subtitle: '残局入门', description: '掌握基本残局类型和解题思路',
    icon: '🎯', level: '初级', levelClass: 'level-basic', count: '12课时', href: '../endgame/index.html'
  },
  {
    number: '③', title: '基本攻杀', subtitle: '攻杀技巧', description: '学习常见的攻杀手法和技巧',
    icon: '⚔️', level: '中级', levelClass: 'level-intermediate', count: '15课时', href: '../../module.html?module=attack'
  },
  {
    number: '④', title: '基本战术', subtitle: '战术运用', description: '掌握常用战术组合和应用技巧',
    icon: '🧠', level: '中级', levelClass: 'level-intermediate', count: '18课时', href: '../../module.html?module=tactics'
  },
  {
    number: '⑤', title: '基本开局', subtitle: '开局理论', description: '学习主流开局体系和基本原理',
    icon: '🎮', level: '高级', levelClass: 'level-advanced', count: '20课时', href: '../../module.html?module=opening'
  },
  {
    number: '⑥', title: '综合运用', subtitle: '实战应用', description: '综合运用所学知识进行实战练习',
    icon: '🏆', level: '高级', levelClass: 'level-advanced', count: '25课时', href: '../../module.html?module=comprehensive'
  }
];

const grid = document.getElementById('courseGrid');
for (const [index, course] of courses.entries()) {
  const card = document.createElement('a');
  card.className = 'course-card';
  card.href = course.href;
  card.innerHTML = `
    <span class="course-icon${course.icon === 'board' ? ' course-icon-board' : ''}" aria-hidden="true">${course.icon === 'board' ? '' : course.icon}</span>
    <span class="course-title"><strong>${course.number} ${course.title}</strong><span>${course.subtitle}</span></span>
    <span class="course-description">${course.description}</span>
    <span class="course-meta"><span class="course-level ${course.levelClass}">${course.level}</span><span>${course.count}</span></span>`;
  grid.append(card);
}
