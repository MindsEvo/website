(function () {
  'use strict';
  const courses = {
    endgame: {
      title: '残局基础要点提示',
      student: '尽量自己多尝试， 答案只是参考， 学习和尝试才是最重要的',
      parent: '鼓励家长和孩子一起尝试， 必要时给予适当提示和解释',
      tips: ['建议先按照动态观察棋子种类的次序，练习尝试L1级别的棋局。', '操作练习按照同样的次序提供了练习题目。', '每个棋局都提供了答案和简单的解说提示，仅供参考。', '我们的核心目标是多自我尝试体会，刺激开发大脑！', '建议基本完成后，最后做问答练习。', '特别注意的是：国际象棋在被逼无子可走的情况下，是判和局的，胜棋一定不能走成和棋！', '尝试练习时，以人机模式为主。']
    },
    tactics: {
      title: '战术运用 — 要点提示',
      student: '战术是象棋的利器，先看懂棋形，再找出战术手段，反复练习才能融会贯通',
      parent: '引导孩子观察每道题的棋形特征，先找目标，再找手段，培养战术嗅觉',
      tips: ['动态观察：选择战术组 → 战术类型 → 具体棋局，系统自动演示。', 'A 组（挂子/捉双/牵制/串击）：最基础，优先学习。', 'B 组（闪击/双将/透视攻击/消除保护）：中级战术组合。', 'C 组（引入/引离/拦截/中间招）：战略巧妙，注意棋形。', 'D 组（腾挪/困子/弃子/逼着/阻塞）：高级战术，融汇各类手段。', '每道题先自己思考 1-2 分钟，再看答案解说。', '棋谱走法显示在右侧"棋道解法"，解说显示在"解说内容"。', '操作练习和问答练习即将开放，敬请期待。']
    },
    mate: {
      title: '基本攻杀 — 要点提示',
      student: '攻杀是象棋的终极目标，先认清棋形，再找到将死的手段，每种杀法都有其独特的美感',
      parent: '引导孩子欣赏每种杀法的独特棋形，从最简单的底线杀和闷杀开始，循序渐进',
      tips: ['动态观察：点击攻杀类型 → 选择具体棋局，系统自动演示。', '入门推荐顺序：底线杀 → 闷杀 → 钩杀 → 阿拉伯杀。', '底线杀：车或后利用底线限制对方逃路。', '闷杀：马将死被己方棋子困住的王。', '钩杀：马+后形成的L形包围将死。', '阿拉伯杀：车+马配合将死角落的王。', '博登杀/燕尾杀：双象斜线交叉将死。', '安娜斯塔西亚杀：车+马协作将死边缘的王。', '每局请先自己思考1-2分钟再看答案。', '操作练习和问答练习即将开放，敬请期待。']
    },
    opening: {
      title: '开局元思维 — 要点提示',
      student: '尽量自己多尝试，答案只是参考，学习和探索才是最重要的',
      parent: '鼓励孩子自己多尝试，必要时给予适当的提示和鼓励',
      tips: ['动态观察：选择大类 → 元思维 → 具体棋局，系统自动播放并解说。', '开局有无数变化，我们的目标是理解核心思维，不是背套路。', '先看"占领中心"（A1）第1-2局，概念最简单直观。', '每局解说文字会显示在右侧"解说内容"区域，可对照学习。', '棋谱走法显示在右侧"棋道解法"区域，可手动逐步查看。', '学完后推荐去 chess.com 实战，用思维去下棋，不要背定式！', '操作练习和问答练习即将开放，敬请期待。']
    }
  };
  const key = location.pathname.split('/academy/')[1]?.split('/')[0];
  const course = courses[key];
  const title = document.querySelector('.title-card');
  if (!course || !title) return;
  title.classList.add('course-guidance-title');
  const actions = document.createElement('div');
  actions.className = 'course-guidance-actions';
  const dialog = document.createElement('dialog');
  dialog.className = 'course-guidance-dialog';
  dialog.id = 'courseGuidanceDialog';
  dialog.setAttribute('aria-labelledby', 'courseGuidanceTitle');
  const heading = document.createElement('h2');
  heading.id = 'courseGuidanceTitle';
  heading.textContent = course.title;
  const list = document.createElement('ol');
  course.tips.forEach(text => {
    const item = document.createElement('li');
    item.textContent = text;
    list.appendChild(item);
  });
  const form = document.createElement('form');
  form.method = 'dialog';
  const close = document.createElement('button');
  close.textContent = '关闭';
  form.appendChild(close);
  dialog.append(heading, list, form);
  document.body.appendChild(dialog);
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.volume = Number(document.getElementById('volumeRange')?.value ?? 80) / 100;
    window.speechSynthesis.speak(utterance);
  }
  [['要点提示', 'tips', () => dialog.showModal()], ['致学生', 'student', () => speak(course.student)], ['致家长', 'parent', () => speak(course.parent)]].forEach(([label, action, handler]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'course-guidance-' + action;
    button.textContent = label;
    button.addEventListener('click', handler);
    if (action === 'tips') button.setAttribute('aria-haspopup', 'dialog');
    actions.appendChild(button);
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  });
  title.appendChild(actions);
})();