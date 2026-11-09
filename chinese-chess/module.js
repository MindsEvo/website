(function () {
  'use strict';

  var modules = {
    intro: {
      index: '06 / 系统介绍',
      title: '系统介绍',
      lead: '介绍中国象棋平台的功能结构与学习路径。',
      state: '页面框架已接入',
      next: '后续整理原系统的介绍内容并接入平台导航。'
    },
    academy: {
      index: '02 / 初学者介绍',
      title: '初学者介绍',
      lead: '从棋盘、棋子和基本走法开始，逐步建立中国象棋入门课程。',
      state: '六课目录与互动演示已接入',
      next: '棋局演示材料与课时练习继续移植。'
    },
    settings: {
      index: '系统设置',
      title: '系统设置',
      lead: '管理棋盘、河界、棋子样式与学习偏好。',
      state: '设置页面尚未接入',
      next: '当前棋盘主题可在支持主题的页面中切换；统一设置面板将在后续版本接入。'
    },
    play: {
      index: '01 / 对弈模式',
      title: '对弈模式',
      lead: '中国象棋 Web 版的核心模块，将承载棋盘交互、规则判断与棋局流程。',
      state: '双人基础对弈已接入',
      next: '后续逐步接入 AI、局面导入导出与棋局记录。'
    },
    genes: {
      index: '03 / 根基因库',
      title: '根基因库',
      lead: '管理中国象棋局面、分类、解法与解说，并支持逐题校验。',
      state: '等待棋局数据规范',
      next: '将使用中国象棋专属局面格式；不复用国际象棋的 FEN 校验逻辑。'
    },
    endgame: {
      index: '学习阶段 / 初级',
      title: '残局基础',
      lead: '通过典型残局建立子力协调、将帅安全与胜和判断的基本思路。',
      state: '课程内容尚未接入',
      next: '当前学习中心的初学者介绍课程已开放。'
    },
    attack: {
      index: '学习阶段 / 中级',
      title: '基本攻杀',
      lead: '学习常见攻杀手法、将杀配合与进攻时机。',
      state: '课程内容尚未接入',
      next: '当前学习中心的初学者介绍课程已开放。'
    },
    tactics: {
      index: '学习阶段 / 中级',
      title: '基本战术',
      lead: '掌握牵制、捉双、引离等常见战术组合。',
      state: '课程内容尚未接入',
      next: '当前学习中心的初学者介绍课程已开放。'
    },
    opening: {
      index: '学习阶段 / 高级',
      title: '基本开局',
      lead: '认识常见开局体系，理解出子、争先与阵型发展。',
      state: '课程内容尚未接入',
      next: '当前学习中心的初学者介绍课程已开放。'
    },
    comprehensive: {
      index: '学习阶段 / 高级',
      title: '综合运用',
      lead: '综合运用规则、战术和棋局判断进行实战练习。',
      state: '课程内容尚未接入',
      next: '当前学习中心的初学者介绍课程已开放。'
    },
    records: {
      index: '04 / 我的记录',
      title: '我的记录',
      lead: '保存对弈过程与个人学习记录，支持后续复盘。',
      state: '等待对弈数据接入',
      next: '待对弈记录结构和浏览器持久化方案确定后移植。'
    },
    analysis: {
      index: '05 / 系统分析',
      title: '系统分析',
      lead: '汇总中国象棋题库与学习数据，提供系统级统计视图。',
      state: '等待题库与记录数据',
      next: '待根基因库和我的记录接入后实现统计与分析。'
    }
  };

  var key = new URLSearchParams(window.location.search).get('module');
  if (key === 'opening') {
    window.location.replace('./academy/opening/index.html');
    return;
  }
  if (key === 'attack') {
    window.location.replace('./academy/attacking/index.html');
    return;
  }
  if (key === 'tactics') {
    window.location.replace('./academy/tactics/index.html');
    return;
  }
  var module = modules[key];

  if (!module) {
    module = {
      index: '模块未找到',
      title: '暂时无法打开此模块',
      lead: '该入口不存在或链接已失效。',
      state: '请返回系统首页',
      next: '从模块总览重新选择功能。'
    };
  }

  document.title = module.title + ' | 中国象棋智慧平台';
  document.getElementById('moduleIndex').textContent = module.index;
  document.getElementById('moduleTitle').textContent = module.title;
  document.getElementById('moduleLead').textContent = module.lead;
  document.getElementById('moduleState').textContent = module.state;
  document.getElementById('moduleNext').textContent = module.next;
}());