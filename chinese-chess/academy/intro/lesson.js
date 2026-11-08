import { initLessonDemo } from './board-demo.mjs';

const lessons = [
  {
    id: 'observation', number: 1, title: '初步观察', description: '观察象棋棋盘和棋子的基本构成。',
    teacher: '欢迎来到象棋课堂！我是你的象棋老师。今天我们要学习象棋的基本知识。',
    student: '现在我们一起来观察象棋棋盘，看看都有什么特别的地方。',
    parent: '请鼓励孩子仔细观察棋盘的结构，培养观察能力。',
    topics: ['棋盘由 9 路、10 行组成，共有 90 个交叉点。', '棋盘中间以楚河汉界分隔红黑双方。', '每方各有 16 枚棋子，初始布局相互对应。'],
    state: '棋盘观察演示已接入。'
  },
  {
    id: 'board', number: 2, title: '认识棋盘', description: '学习楚河汉界、九宫与棋盘结构。',
    teacher: '象棋棋盘有很多特殊的地方，比如楚河汉界、九宫等。',
    student: '让我们一起探索棋盘的秘密，发现这些有趣的区域。',
    parent: '引导孩子了解棋盘的各个区域，增强空间概念。',
    topics: ['棋子落在交叉点上，不是落在方格内。', '楚河汉界将棋盘分成红黑两侧。', '九宫位于双方底线中央，是将帅和仕士活动的区域。'],
    state: '棋盘区域高亮演示已接入。',
    quiz: {
      type: 'single', question: '象棋棋盘共有多少个交叉点？',
      options: ['81 个', '90 个', '100 个', '64 个'], correct: [1],
      explanation: '象棋棋盘有 10 行、9 路，共 90 个交叉点。'
    }
  },
  {
    id: 'pieces', number: 3, title: '兵种介绍', description: '认识红方与黑方棋子，了解各自名称。',
    teacher: '现在我们来认识象棋的棋子。象棋有红方和黑方两种颜色的棋子。',
    student: '我们来认识这些有趣的棋子，每个棋子都有自己的名字和作用。',
    parent: '帮助孩子记住各种棋子的名称，可以通过游戏的方式学习。',
    topics: ['红方：帅、仕、相、车、马、炮、兵。', '黑方：将、士、象、车、马、炮、卒。', '双方各有 1 个将帅、2 个仕士、2 个相象、2 个车、2 个马、2 个炮和 5 个兵卒。'],
    state: '棋子名称、数量与棋子定位演示已接入。',
    quiz: {
      type: 'boolean', question: '象棋中的“将”和“帅”是同一种棋子的不同称呼吗？',
      options: ['是', '不是'], correct: [0],
      explanation: '双方主将规则相同，红方称帅，黑方称将。'
    }
  },
  {
    id: 'piece_moves', number: 4, title: '棋子走法', description: '详细学习七类棋子的基本移动规则。',
    teacher: '现在我们来学习各种棋子的走法。每种棋子都有自己独特的移动规则。',
    student: '本课时我们学习棋子的走法，要多做尝试和练习，学会后教会家长。',
    parent: '学生将尝试各种象棋走法和技巧，必要时给与提示，鼓励轻松大胆地尝试。',
    topics: ['车走直线，路径不能有棋子阻挡。', '马走日，马腿被挡时不能走。', '象走田，不可过河，象眼被挡时不能走。', '炮走直线；不吃子时路径无阻挡，吃子时必须隔一个棋子。', '帅将、仕士受九宫限制；兵卒只能前进，过河后可横行。'],
    state: '七类棋子的合法落点演示已接入。', practice: true,
    quiz: {
      type: 'multiple', question: '哪些棋子可以跨越其他棋子？（多选）',
      options: ['马', '炮', '车', '象'], correct: [0, 1],
      explanation: '马可跳跃但会被蹩腿；炮吃子时必须隔一个炮架。'
    }
  },
  {
    id: 'classic_games', number: 5, title: '棋局演示', description: '观看棋子配合与对局过程。',
    teacher: '从弃马十三着、当头炮对屏风马、中炮对反宫马与双马饮泉四局棋谱中，观察进攻组织、子力配合与防守变化。',
    student: '选择棋局并跟随棋谱逐着观察，留意布局选择如何影响后续攻防。',
    parent: '可和孩子一起暂停棋局，比较不同布局中的进攻、防守与侧翼反击思路。',
    topics: ['弃马十三着：弃子、诱导、连续进攻。', '当头炮对屏风马：主动进攻与稳健防守。', '中炮对反宫马：灵活防守与侧翼反击。', '双马饮泉：古谱《桔中秘》残局谱，观察双马配合。'],
    state: '棋局演示版式及前四局的棋谱播放已接入。'
  },
  {
    id: 'summary', number: 6, title: '总结与回顾', description: '回顾棋盘、棋子与基本走法。',
      teacher: '今天我们学习了象棋的基本知识，你们做得很好！',
    student: '恭喜你完成了象棋入门学习，继续练习会更棒。',
    parent: '孩子已经掌握了象棋基础，请继续鼓励练习。',
    topics: ['认识 9 路、10 行棋盘与楚河汉界。', '记住红黑双方的七类棋子及其名称。', '掌握走棋、阻挡、炮架、马腿、象眼、河界和九宫规则。'],
    state: '本节回顾已接入；完整总结活动正在移植。', practice: true
  }
];

const requestedId = new URLSearchParams(location.search).get('lesson');
const activeIndex = lessons.findIndex(lesson => lesson.id === requestedId);
const lesson = lessons[activeIndex];

if (!lesson) {
  location.replace('./index.html');
} else {
  document.title = `${lesson.title} | 初学者介绍`;
  document.getElementById('lessonNumber').textContent = `第 ${activeIndex + 1} 课`;
  document.getElementById('lessonTitle').textContent = lesson.title;
  document.getElementById('lessonDescription').textContent = lesson.description;
  document.getElementById('lessonProgress').textContent = `${activeIndex + 1} / ${lessons.length}`;
  document.getElementById('teacherText').textContent = lesson.teacher;
  document.getElementById('studentText').textContent = lesson.student;
  document.getElementById('parentText').textContent = lesson.parent;
  document.getElementById('contentState').textContent = lesson.state;
  if (lesson.id === 'observation') {
    document.body.classList.add('board-display-only');
    document.body.classList.add('observation-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./observation-page.mjs').then(module => module.initObservationPage(lesson));
  } else if (lesson.id === 'pieces') {
    document.body.classList.add('board-display-only', 'pieces-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./pieces-page.mjs').then(module => module.initPiecesPage(lesson));
  } else if (lesson.id === 'piece_moves') {
    document.body.classList.add('board-display-only', 'piece-moves-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./piece-moves-page.mjs').then(module => module.initPieceMovesPage(lesson));
  } else if (lesson.id === 'summary') {
    document.body.classList.add('board-display-only', 'summary-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./summary-page.mjs').then(module => module.initSummaryPage(lesson));
  } else if (lesson.id === 'classic_games') {
    document.body.classList.add('board-display-only', 'classic-games-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./classic-games-page.mjs').then(module => module.initClassicGamesPage(lesson));
  } else if (lesson.id === 'board') {
    document.body.classList.add('board-display-only');
    document.getElementById('boardDisplayApp').hidden = false;
    import('./board-display.mjs').then(module => module.initBoardDisplay(lesson));
  } else {
    initLessonDemo(lesson.id);
  }

  const topicList = document.getElementById('topicList');
  for (const topic of lesson.topics) {
    const item = document.createElement('li');
    item.textContent = topic;
    topicList.append(item);
  }
  if (lesson.topics.length === 0) {
    const item = document.createElement('li');
    item.textContent = '本课将通过真实棋谱逐步展示棋子配合。';
    topicList.append(item);
  }

  if (lesson.quiz) setupQuiz(lesson.quiz);

  const practiceLink = document.getElementById('practiceLink');
  practiceLink.hidden = !lesson.practice;
  const previous = document.getElementById('previousLesson');
  const next = document.getElementById('nextLesson');
  previous.href = activeIndex > 0 ? `./lesson.html?lesson=${lessons[activeIndex - 1].id}` : './index.html';
  previous.textContent = activeIndex > 0 ? `上一课 · ${lessons[activeIndex - 1].title}` : '返回课程目录';
  next.href = activeIndex < lessons.length - 1 ? `./lesson.html?lesson=${lessons[activeIndex + 1].id}` : './index.html';
  next.innerHTML = activeIndex < lessons.length - 1 ? `下一课 · ${lessons[activeIndex + 1].title} <span aria-hidden="true">→</span>` : '返回课程目录';

  const lessonNav = document.getElementById('lessonNav');
  lessons.forEach((item, index) => {
    const link = document.createElement('a');
    link.href = `./lesson.html?lesson=${item.id}`;
    link.className = index === activeIndex ? 'active' : '';
    link.setAttribute('aria-current', index === activeIndex ? 'page' : 'false');
    link.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${item.title}`;
    lessonNav.append(link);
  });

  document.getElementById('speakButton').addEventListener('click', () => {
    if (!window.speechSynthesis) {
      document.getElementById('contentState').textContent = '此浏览器暂不支持语音播放。';
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.teacher);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  });
  document.getElementById('stopButton').addEventListener('click', () => window.speechSynthesis?.cancel());
}

function setupQuiz(quiz) {
  const section = document.getElementById('quizSection');
  const options = document.getElementById('quizOptions');
  const feedback = document.getElementById('quizFeedback');
  section.hidden = false;
  document.getElementById('quizQuestion').textContent = quiz.question;

  quiz.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'quiz-option';
    const input = document.createElement('input');
    input.type = quiz.type === 'multiple' ? 'checkbox' : 'radio';
    input.name = 'lesson-answer';
    input.value = String(index);
    const text = document.createElement('span');
    text.textContent = option;
    label.append(input, text);
    options.append(label);
  });

  document.getElementById('quizSubmit').addEventListener('click', () => {
    const selected = [...options.querySelectorAll('input:checked')].map(input => Number(input.value)).sort();
    if (selected.length === 0) {
      feedback.textContent = '请选择答案后再提交。';
      feedback.className = 'quiz-feedback';
      return;
    }
    const correct = selected.length === quiz.correct.length && selected.every((answer, index) => answer === quiz.correct[index]);
    feedback.textContent = `${correct ? '答对了！' : `参考答案：${quiz.correct.map(index => quiz.options[index]).join('、')}。`}${quiz.explanation}`;
    feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
    options.querySelectorAll('input').forEach(input => { input.disabled = true; });
    document.getElementById('quizSubmit').disabled = true;
  });
}