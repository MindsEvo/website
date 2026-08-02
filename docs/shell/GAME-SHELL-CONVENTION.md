# MindsEvo 游戏开发公约

## Game Shell Convention v2.2

> **核心原则：游戏只写游戏，公共功能零重复**
>
> 当前已发布两套 Shell 入口，共享同一个 `shell.js` 公共层：
>
> - `shell.createGame()`：Shell-1，序列预测型（视觉/颜色/大小/空间/数量等）
> - `shell.createReasoningGame()`：Shell-2，陈述推理型（前提 → 结论）
>
> Shell-1 游戏只实现 3 个函数：`renderSequence` / `renderOption` / `checkAnswer`
> Shell-2 游戏只实现 2 个函数：`renderOption` / `checkAnswer`（前提与问题由 Shell 自动渲染）

---

## 0.2 跨平台时序兼容基线（Shell-1 / Shell-2 共用）

从 v1.1.0 起，所有 Shell 游戏应优先复用 `shell.runtime`，避免各游戏重复处理 Android / iPad / PC 时序差异。

六个架构点：

1. 会话隔离：`beginSession()` + token 校验，防止旧回调污染新局。
2. 计时治理：`setGuardedTimer()` / `clearTimer()` / `clearOwnerTimers()`。
3. 生命周期：`onLifecycle()` / `emitLifecycle()`，统一 start/pause/reset/background/foreground。
4. 输入归一：`bindUnifiedTap()` 统一 touch 与 click，避免双触发或延迟触发。
5. 动画提交：`commitAnimationStart()` + `nextFrame()`，减少移动端丢帧问题。
6. 诊断观测：`diagnostics.enable()` + `getLogs()`，用于跨端问题定位。

最小接入建议：

- 任何带定时器的玩法，必须用 `setGuardedTimer()`，并绑定 session token。
- 任何触控主交互按钮，优先用 `bindUnifiedTap()`。
- 页面进入后台时，建议基于 `background` 生命周期自动 pause。

示例：

```javascript
var token = shell.runtime.beginSession('prediction-workshop');
shell.runtime.setGuardedTimer('practice-lane', 'fall', 1200, function () {
  // only runs when session is still active
}, token);

var unbind = shell.runtime.bindUnifiedTap(buttonEl, function () {
  // unified tap handler
});
```

---

## 0.1 治理与门禁文档（必读）

为保证“公共能力零重复、模块互不干扰”，请在设计和开发前同步阅读：

- `SHELL-FEATURE-GATE.md`：Shell 公共能力升级准入规范（判断何时从游戏层上升到 Shell）
- `PATTERN-QUALITY-GATE.md`：Pattern 模块出题与质量门禁规范（边界、干扰项、归因与验收）

使用顺序建议：

1. 先按本公约完成游戏层实现。
2. 涉及公共能力抽象时，按 `SHELL-FEATURE-GATE.md` 走 Gate 流程。
3. 涉及题型扩展时，按 `PATTERN-QUALITY-GATE.md` 完成题型规格单与上线检查。

---

## 1. 创建新游戏（全流程）

### 文件结构

```
games/
└── my-new-game/
    ├── index.html    ← 14行极简 bootstrap（复制模板，改title即可）
    ├── data.js       ← 游戏题库（Shell-1 标准格式）
    └── game.js       ← 游戏逻辑（~40-80行，只含3个渲染函数）
```

### index.html 模板（固定不变）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MindsEvo</title>
  <link rel="stylesheet" href="../../shell-1.css">
</head>
<body>
  <script src="../../shell.js"></script>
  <script src="./data.js"></script>
  <script src="./game.js"></script>
</body>
</html>
```

---

## 2. Shell-1 标准数据格式

### Unit 格式

```javascript
{
  id:      '1',           // string，第一个单元 id 必须是 '1'（默认解锁）
  icon:    '➕',           // emoji，显示在单元卡片左侧
  nameZh:  '加法规律',     // 中文名称
  nameEn:  'Addition',    // 英文名称
  descZh:  '每次加同样的数', // 中文描述
  descEn:  'Add the same number each time', // 英文描述
  questions: [ ... ]      // Question 数组
}
```

### Question 格式（Shell-1 标准字段）

```javascript
{
  answer:  8,              // 正确答案（必须，类型与 options 元素一致）
  options: [7, 8, 9, 5],  // 4个选项（必须包含 answer）
  hintZh:  '每次加 2',     // 中文提示（点击提示按钮时显示）
  hintEn:  'Add 2 each time', // 英文提示
  // + 任意游戏自定义字段（完整传给 renderSequence / renderOption）
  seq:     [2, 4, 6, '?', 10],  // 例：数字规律游戏的序列
  sequence: ['○', '△', '?'],    // 例：图形规律游戏的序列
}
```

> **`'?'` 约定**：序列中的空白位置用字符串 `'?'` 表示，
> 游戏在 `renderSequence` 中检测并渲染为红色问号块。

---

## 3. shell.createGame(config) API

```javascript
shell.createGame({
  // ── 必填 ──────────────────────────────────────────
  id:       'my-game-id',          // 游戏唯一ID（用作 localStorage key 前缀）
  title:    { zh: '游戏名', en: 'Game Name' },
  subtitle: { zh: '副标题', en: 'Subtitle' },
  units:    MY_DATA.units,         // Shell-1 格式的单元数组
  passScore: 8,                    // 通关所需最低分（default: 8）

  // ── 必须实现：3个游戏逻辑函数 ─────────────────────
  renderSequence(q, containerEl, unit) {
    // 把 q 的序列内容渲染到 containerEl
    // 序列中 '?' 需要渲染为红色问号
    containerEl.innerHTML = ...;
  },

  renderOption(opt, q, unit) {
    // 返回选项按钮的 innerHTML（HTML字符串）
    return String(opt);
  },

  checkAnswer(selected, q) {
    // 返回 boolean：选的答案是否正确
    return selected === q.answer;
  },

  // ── 可选 ──────────────────────────────────────────
  theme: { primary: '#667eea', primary2: '#764ba2', bg: '#f8faff' },
  debug: true,             // true = 所有单元默认解锁（开发用）
  getVoiceText(q, index) { // 自定义语音提示文本
    return shell.lang === 'zh' ? '...' : '...';
  }
});
```

### Shell-1 自动提供的所有功能

| 功能 | 说明 |
|------|------|
| 双语 UI | 所有文字自动支持中/英切换，无需任何代码 |
| 语言切换按钮 | 自动绑定，切换后整页刷新 |
| 静音按钮 | 自动绑定，状态持久化 |
| 三屏状态机 | Home → Game → Result 自动管理 |
| 进度点 | 自动渲染，答对变绿 |
| 答题反馈 | 正确（绿）/ 错误（红）动画 |
| 提示功能 | 错误后显示 hintZh/hintEn |
| 结算页面 | 分数、用时、按钮全自动 |
| 单元解锁 | passScore 达标自动解锁下一关 |
| 本次练习报告 | 折叠表格，显示每关得分/错误/用时 |
| 历史总览 | 折叠卡片，累计统计 + 清除功能 |
| localStorage 管理 | 自动命名空间，防冲突 |
| 数据上报 | shell.report() 自动调用 |
| Android TTS 兼容 | 自动处理（unlock + delay） |
| 响应式布局 | 手机/平板/桌面自适应 |

---

## 4. 主题色配置

每个游戏通过 `theme` 参数定义色彩，Shell-1 注入为 CSS 变量：

```javascript
theme: { primary: '#667eea', primary2: '#764ba2' }
// → :root { --s1-primary: #667eea; --s1-primary2: #764ba2; }
```

| 变量 | 用途 |
|------|------|
| `--s1-primary` | 标题色、按钮渐变起点、进度点 |
| `--s1-primary2` | 按钮渐变终点、背景渐变终点 |
| `--s1-bg` | 卡片背景色（默认 `#f8faff`） |

**已有游戏主题色参考：**
- number-pattern-hunter: `#667eea` / `#764ba2`（紫色）
- visual-pattern-hunter: `#06b6d4` / `#0891b2`（青色）

---

## 5. 实际游戏示例（对比）

### number-pattern-hunter/game.js（47行）

```javascript
shell.createGame({
  id: 'number-pattern-hunter',
  theme: { primary: '#667eea', primary2: '#764ba2' },
  title:    { zh: '🎯 找规律', en: '🎯 Pattern Hunter' },
  subtitle: { zh: '循序渐进，掌握数字规律', en: 'Master number patterns' },
  passScore: 8,
  units: NPH_DATA.units,

  renderSequence: function (q, container) {
    container.innerHTML = q.seq.map(function (n) {
      return n === '?' ? '<span class="mystery">?</span>' : '<span>' + n + '</span>';
    }).join(' ');
  },
  renderOption: function (opt) { return String(opt); },
  checkAnswer:  function (sel, q) { return Number(sel) === q.answer; },
  getVoiceText: function (q) {
    var items = q.seq.map(function (n) { return n === '?' ? '问号' : String(n); });
    return items.join('，') + '，问号是几？';
  }
});
```

### visual-pattern-hunter/game.js（92行，含SVG生成器）

游戏自带 SVG 图形渲染函数（`generateShape`、`generateDots`），
其余逻辑同样简洁：

```javascript
shell.createGame({
  id: 'visual-pattern-hunter',
  theme: { primary: '#06b6d4', primary2: '#0891b2', bg: '#f0f9ff' },
  title:    { zh: '🎨 视觉规律', en: '🎨 Visual Pattern Hunter' },
  subtitle: { zh: '观察图形，发现规律', en: 'Observe shapes and find patterns' },
  passScore: 4,
  units: VPH_DATA.units,

  renderSequence: function (q, container) { /* SVG序列渲染 */ },
  renderOption:   function (opt, q) { return shapeFor(opt, q); },
  checkAnswer:    function (sel, q) { return String(sel) === String(q.answer); },
  getVoiceText:   function (q, idx) { return '第' + (idx+1) + '题，下一个是什么？'; }
});
```

---

## 6. CSS 前缀规范

Shell-1 所有公共样式使用 `s1-` 前缀：

| 前缀 | 用途 |
|------|------|
| `.s1-wrap` | 主卡片容器 |
| `.s1-screen` | 三个屏幕区域 |
| `.s1-hidden` | 隐藏元素 |
| `.s1-opt` | 选项按钮 |
| `.s1-correct` / `.s1-wrong` | 答题反馈状态 |
| `.mystery` | 序列中的问号占位符（无前缀，游戏可直接引用） |

游戏自定义样式**不允许**使用 `s1-` 前缀，避免冲突。

---

## 7. 多 Shell 扩展规划

所有 Shell 共享同一个 `shell.js` 公共层，不同 Shell 只替换"题目显示区"并提供对应渲染接口。

```
游戏类型                  对应 Shell            入口函数
──────────────────────────────────────────────────────────
序列预测型（视觉/规律）    Shell-1  ✅ 已发布    shell.createGame()
陈述推理型（前提→结论）    Shell-2  ✅ 已发布    shell.createReasoningGame()
状态判断型（守恒/比较）    Shell-3  ⏸ 待设计    shell.createJudgmentGame()（预留）
开放探索/沙盒             Shell-4  ⏸ 待设计    —
多人对战/实时             Shell-5  ⏸ 待设计    —
```

**Shell 扩展原则：**

1. 每个新 Shell 是 `shell.js` 内一个新的 `createXxxGame()` 入口函数，不新建文件。
2. 共用同一套 Home / Result 屏、进度点、选项按钮、反馈动画、存储、语音、双语。
3. 只有"题目显示区"（Shell-1 的 `.s1-seq`，Shell-2 的 `.s2-qzone`）和渲染接口不同。
4. CSS 新增组件使用新 Shell 对应前缀（`s2-`、`s3-`…），不污染已有前缀。
5. 旧 Shell 游戏接入新 Shell 后零改动可继续运行。

**跨 Shell 统一的公共能力：**
- `shell.storage` API（localStorage 命名空间）
- `shell.report()` 数据上报（含 `shell` 字段标注所属 Shell）
- `shell.speak()` TTS API
- `shell.setLang()` 语言切换

---

## 7.1 Shell-2 API 参考（createReasoningGame）

```javascript
shell.createReasoningGame({
  // ── 必填（与 Shell-1 相同）─────────────────────────────
  id:       'my-reasoning-game',
  title:    { zh: '游戏名', en: 'Game Name' },
  subtitle: { zh: '副标题', en: 'Subtitle' },
  units:    MY_DATA.units,
  passScore: 4,

  // ── 必须实现：2个函数（不需要 renderSequence）──────────
  renderOption(opt, q, unit) → string,  // 选项按钮的 innerHTML
  checkAnswer(selected, q)  → bool,     // 返回是否正确

  // ── 可选（与 Shell-1 相同）─────────────────────────────
  theme: { primary, primary2, bg },
  onAnswer(selected, q, isCorrect),
  getVoiceText(q, index) → string
});
```

**Shell-2 题目数据格式：**

```javascript
{
  // Shell-1 沿用字段
  answer:   'opt_a',
  options:  ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
  hintZh:   '因为 A > B > C…',
  hintEn:   'Because A > B > C…',

  // Shell-2 新增字段（替代 seq/sequence）
  premises: [
    { zh: '条件一文本', en: 'Premise one text' },
    { zh: '条件二文本', en: 'Premise two text' }
  ],
  questionZh: '问题文本？',
  questionEn: 'Question text?',

  // 选项定义（renderOption 从此读取标签）
  optionDefs: {
    opt_a: { zh: '选项A', en: 'Option A' },
    opt_b: { zh: '选项B', en: 'Option B' }
  },

  // 干扰项类型（错误归因）
  optionTypes: {
    opt_a: 'correct',
    opt_b: 'middle_item',
    opt_c: 'wrong_end',
    opt_d: 'irrelevant'
  }
}
```

**Shell-2 error_type 枚举：**

| 类型 | 含义 |
|------|------|
| `correct` | 正确答案 |
| `wrong_end` | 链条端点方向错误 |
| `middle_item` | 选了链条中间项 |
| `irrelevant` | 题目未提及的无关选项 |
| `over_cautious` | 前提充分时仍选"无法确定" |

**与 Shell-1 的差异对照：**

| 维度 | Shell-1 | Shell-2 |
|------|---------|---------|
| 题目显示区 | 黄色序列框 `.s1-seq` | 前提卡片区 `.s2-qzone` |
| 游戏实现函数 | 3 个（含 renderSequence）| 2 个（无 renderSequence）|
| 前提渲染 | 游戏自定义 | Shell 自动从 `q.premises` 渲染 |
| 问题渲染 | 游戏自定义 | Shell 自动从 `q.questionZh/En` 渲染 |
| 所有其他功能 | 由 Shell 提供 | 由 Shell 提供（完全相同）|

---

## 8. 能力标签（跨游戏数据）

未来所有游戏的 `shell.report()` 应包含能力标签，
为综合能力雷达图做准备：

```javascript
shell.report({
  gameId:     'number-pattern-hunter',
  unitId:     '1',
  score:      8,
  total:      10,
  timeMs:     45000,
  hintsUsed:  2,
  shell:      'shell-1',   // 必须标注所属 Shell（shell-1 | shell-2 | …）
  // 未来扩展：
  // abilityTags: ['seq-arithmetic', 'rule-induction']
});
```

**已规划的能力标签（跨游戏统一命名）：**

| 标签 | 中文 | 覆盖游戏 |
|------|------|------|
| `seq-arithmetic` | 等差数列 | number-pattern-hunter |
| `seq-geometric`  | 等比规律 | number-pattern-hunter |
| `shape-recog`    | 形状识别 | visual-pattern-hunter |
| `spatial-rot`    | 空间旋转 | visual-pattern-hunter |
| `subitizing`     | 快速计数 | visual-pattern-hunter |

---

## 版本历史

### v2.2.0 (2026-07-03)
- 发布 Shell-2：`shell.createReasoningGame()`（陈述推理型）
- 新增 §7.1 Shell-2 API 参考、数据格式、error_type 枚举、差异对照表
- 更新 §7 Shell 扩展规划表，标注 Shell-1/2 已发布
- 新增 Shell 扩展原则 5 条
- `shell.report()` 新增必填字段 `shell`，用于跨 Shell 数据归因

### v2.1.0 (2026-07-03)
- 新增治理门禁入口章节（0.1）
- 新增配套文档：
  - `SHELL-FEATURE-GATE.md`
  - `PATTERN-QUALITY-GATE.md`

### v2.0.0 (2026-07-02)
- **架构重构**：引入 `shell.createGame()` 框架
- 游戏代码从 600+ 行精简到 40-90 行
- 所有公共 UI 移入 `shell.js` + `shell-1.css`
- 双语、静音、报告功能零配置自动提供
- 统一 Shell-1 数据格式（`nameZh/nameEn`、`answer`、`hintZh/hintEn`）

### v1.0.0 (2026-07-02)
- 初版规范文档（已废弃，被 v2.0 替代）


## 1. 双语架构（Bilingual Architecture）

### 1.1 HTML 静态文本结构

所有用户可见文本**必须**使用双语 span 结构：

```html
<!-- ✅ 正确 -->
<div class="main-title">
  🎯 <span class="zh">找规律</span><span class="en">Pattern Hunter</span>
</div>

<div class="main-subtitle">
  <span class="zh">循序渐进，掌握数字规律</span>
  <span class="en">Master number patterns step by step</span>
</div>

<!-- ❌ 错误 -->
<div class="main-title">🎯 找规律</div>
<div id="appTitle"></div> <!-- 后续用JS填充，丢失结构 -->
```

### 1.2 CSS 控制显示逻辑

在 `shell.js` 或 `i18n/strings.js` 中定义全局样式：

```css
/* 默认中文显示 */
body[data-lang="en"] .zh { display: none; }
body[data-lang="zh"] .en { display: none; }
```

### 1.3 动态内容国际化

JavaScript 动态生成的文本通过 `shell.t(key, ...args)` 获取：

```javascript
// strings.js - 注册游戏专属字符串
shell.registerStrings({
  'vph.title':    { zh: '🎯 视觉规律', en: '🎯 Visual Pattern Hunter' },
  'vph.correct':  { zh: '✓ 正确！',    en: '✓ Correct!' },
  'vph.voice.q':  { zh: '第{0}题，下一个是什么？', en: 'Question {0}, what comes next?' }
});

// game.js - 使用
var title = shell.t('vph.title');
var prompt = shell.t('vph.voice.q', [state.qIndex + 1]); // 支持占位符
shell.speak(prompt);
```

### 1.4 语言切换响应

游戏必须监听语言变化事件并重新渲染：

```javascript
document.addEventListener('shell:langchange', function () {
  if (!$homeScreen.classList.contains('hidden'))   renderHome();
  if (!$gameScreen.classList.contains('hidden'))   renderQuestion();
  if (!$resultScreen.classList.contains('hidden')) renderResult();
});
```

---

## 2. 语音控制（Voice Control）

### 2.1 静音按钮实现（标准模板）

```javascript
// ❌ 错误：调用不存在的 API
window.xxxToggleVoice = function () {
  shell.toggleVoice();  // shell 没有这个方法！
  updateVoiceBtn();
};

// ✅ 正确：直接操作 storage
window.xxxToggleVoice = function () {
  var cur = shell.storage.get('user:settings:voice', true);
  shell.storage.set('user:settings:voice', !cur);
  if (cur) speechSynthesis.cancel(); // 如果关闭，取消当前播放
  updateVoiceBtn();
};

function updateVoiceBtn() {
  var enabled = shell.storage.get('user:settings:voice', true);
  document.querySelectorAll('.voiceToggle').forEach(function (b) {
    b.textContent = enabled ? '🔊' : '🔇';
    b.classList.toggle('active', enabled);
  });
}
```

### 2.2 语音播报时机

- **题目加载**：播报题目内容
- **答对**：播报 "正确！"
- **答错**：播报 "不对哦" 或提示内容
- **结算**：播报 "完成！得分X分"
- **提示**：播报提示文本

```javascript
// 使用 shell.speak() 统一播报
shell.speak(shell.t('vph.correct'));           // 自动检测当前语言
shell.speak('Custom text', 'en');              // 强制指定语言
```

---

## 3. 数据统计与持久化（Data & Persistence）

### 3.1 数据层次结构

```
┌─────────────────────────────────────────────┐
│ Session Stats (内存，页面刷新丢失)              │
│ sessionStats[unitId] = {score, wrong, ...}  │
└─────────────────────────────────────────────┘
                    ↓ finishUnit()
┌─────────────────────────────────────────────┐
│ Unit Progress (localStorage 持久化)          │
│ GAME_ID:unit:1 = {unlocked, bestScore, ...}│
└─────────────────────────────────────────────┘
                    ↓ shell.report()
┌─────────────────────────────────────────────┐
│ History Records (localStorage 持久化)        │
│ me:GAME_ID:history:1234567890 = {...}      │
└─────────────────────────────────────────────┘
                    ↓ (未来)
┌─────────────────────────────────────────────┐
│ Cloud Sync (服务器，跨设备)                    │
└─────────────────────────────────────────────┘
```

### 3.2 Session Stats（本次练习统计）

```javascript
// 游戏启动时初始化
var sessionStats = {};   // { unitId: { score, wrong, hints, timeMs } }

// 每完成一个单元就记录
function finishUnit() {
  var unit = currentUnit();
  var timeMs = Date.now() - state.startTime;
  
  sessionStats[unit.id] = {
    score:  state.score,
    wrong:  unit.questions.length - state.score,
    hints:  state.hintsUsed,
    timeMs: timeMs
  };
  
  // ... 其他逻辑
}
```

### 3.3 Unit Progress（单元进度）

```javascript
function getUnitSave(unitId) {
  return shell.storage.get(GAME_ID + ':unit:' + unitId, {
    unlocked:  unitId === '1',  // 第一关默认解锁
    bestScore: null,            // 历史最高分
    playCount: 0                // 游玩次数
  });
}

function saveUnitSave(unitId, data) {
  shell.storage.set(GAME_ID + ':unit:' + unitId, data);
}

// 完成单元后更新
var saved = getUnitSave(unit.id);
if (saved.bestScore === null || state.score > saved.bestScore) {
  saved.bestScore = state.score;
}
saved.playCount++;
saveUnitSave(unit.id, saved);

// 解锁下一关
if (passed) {
  var nextUnit = GAME_DATA.units[state.unitIndex + 1];
  if (nextUnit) {
    var nextSave = getUnitSave(nextUnit.id);
    nextSave.unlocked = true;
    saveUnitSave(nextUnit.id, nextSave);
  }
}
```

### 3.4 History Records（历史记录上报）

```javascript
// 完成单元后调用 shell.report()
shell.report({
  event:     'unit-complete',  // 可选：事件类型
  gameId:    GAME_ID,          // 必须：游戏ID
  unitId:    unit.id,          // 必须：单元ID
  score:     state.score,      // 必须：得分
  total:     total,            // 必须：总题数
  timeMs:    timeMs,           // 必须：用时
  hintsUsed: state.hintsUsed   // 可选：使用提示次数
});
```

`shell.report()` 自动完成：
1. 添加时间戳、语言、版本号
2. 保存到 `localStorage` (key: `me:GAME_ID:history:timestamp`)
3. 加入云同步队列（未来实现）

---

## 4. 折叠报告区（Practice Summary）

### 4.1 HTML 结构模板

```html
<!-- 放在 Home Screen 底部 -->
<div class="summary-wrap">
  <!-- 本次练习 -->
  <div class="summary-section">
    <div class="summary-toggle" onclick="xxxToggleSummary('session')">
      <span id="summaryTitleSession">
        <span class="zh">📝 本次练习</span>
        <span class="en">📝 Current Session</span>
      </span>
      <span class="summary-arrow" id="summaryArrowSession">▼</span>
    </div>
    <div class="summary-body" id="summaryBodySession"></div>
  </div>

  <!-- 历史总览 -->
  <div class="summary-section">
    <div class="summary-toggle" onclick="xxxToggleSummary('history')">
      <span id="summaryTitleHistory">
        <span class="zh">📊 历史总览</span>
        <span class="en">📊 All History</span>
      </span>
      <span class="summary-arrow" id="summaryArrowHistory">▼</span>
    </div>
    <div class="summary-body" id="summaryBodyHistory"></div>
  </div>
</div>
```

### 4.2 CSS 样式模板

```css
.summary-wrap {
  margin-top: 20px;
  display: flex; flex-direction: column; gap: 10px;
}

.summary-section {
  border-radius: 14px; border: 1.5px solid var(--border);
  overflow: hidden;
}

.summary-toggle {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 18px; cursor: pointer;
  background: var(--bg); font-size: 18px; font-weight: 700;
  user-select: none; transition: background 0.2s;
}
.summary-toggle:hover { background: #eef2ff; }

.summary-body {
  max-height: 0; overflow: hidden;
  transition: max-height 0.35s ease;
  background: white;
}
.summary-body.open { max-height: 700px; }

/* 表格样式 */
.summary-table {
  width: 100%; border-collapse: collapse;
  font-size: 17px; color: var(--text);
}
.summary-table th {
  padding: 10px; font-weight: 700; font-size: 15px;
  background: var(--bg); color: var(--muted);
  text-align: center; border-bottom: 1.5px solid var(--border);
}
.summary-table th:first-child { text-align: left; padding-left: 16px; }
.summary-table td {
  padding: 13px 10px; text-align: center;
  border-bottom: 1px solid #f1f5f9; font-weight: 600;
}
.summary-table td.s-name { text-align: left; padding-left: 16px; font-weight: 700; }
.summary-table td.s-correct { color: #16a34a; font-weight: 800; }
.summary-table td.s-wrong { color: var(--red); font-weight: 800; }
.summary-table tr.s-idle td { color: var(--muted); }

/* 统计卡片 */
.summary-stats {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 8px; padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border);
}
.summary-stat { text-align: center; }
.summary-stat-value { font-size: 28px; font-weight: 900; }
.summary-stat-label { font-size: 14px; color: var(--muted); margin-top: 5px; }

.summary-empty {
  padding: 20px 16px; text-align: center;
  font-size: 15px; color: var(--muted);
}
```

### 4.3 JavaScript 必要函数

```javascript
// 1. 本次练习统计（表格）
function renderSessionSummary() {
  var body = document.getElementById('summaryBodySession');
  if (!body) return;
  var isZh = shell.lang === 'zh';
  var hasAny = Object.keys(sessionStats).length > 0;

  if (!hasAny) {
    body.innerHTML = '<div class="summary-empty">' +
      (isZh ? '本次尚未完成任何练习' : 'No practice completed') +
      '</div>';
    return;
  }

  var th = isZh
    ? ['<th>关卡</th>','<th>答对</th>','<th>答错</th>','<th>提示</th>','<th>用时</th>']
    : ['<th>Unit</th>','<th>Correct</th>','<th>Wrong</th>','<th>Hints</th>','<th>Time</th>'];
  var html = '<table class="summary-table"><thead><tr>' + th.join('') + '</tr></thead><tbody>';

  GAME_DATA.units.forEach(function (unit) {
    var d = sessionStats[unit.id];
    if (d) {
      html += '<tr>' +
        '<td class="s-name">' + unit.icon + ' ' + shell.t(unit.nameKey) + '</td>' +
        '<td class="s-correct">' + d.score + '</td>' +
        '<td class="s-wrong">' + d.wrong + '</td>' +
        '<td>' + d.hints + '</td>' +
        '<td>' + fmtTime(d.timeMs) + '</td>' +
        '</tr>';
    } else {
      html += '<tr class="s-idle">' +
        '<td class="s-name">' + unit.icon + ' ' + shell.t(unit.nameKey) + '</td>' +
        '<td colspan="4" class="s-dash">—</td>' +
        '</tr>';
    }
  });
  html += '</tbody></table>';
  body.innerHTML = html;
}

// 2. 历史总览（数字卡片）
function renderHistorySummary() {
  var body = document.getElementById('summaryBodyHistory');
  if (!body) return;
  var isZh = shell.lang === 'zh';
  var data = calcHistory();

  if (data.sessions === 0) {
    body.innerHTML = '<div class="summary-empty">' +
      (isZh ? '还没有历史记录' : 'No history yet') +
      '</div>';
    return;
  }

  var html = '<div class="summary-stats">' +
    statBox(data.sessions,          isZh ? '完成局数' : 'Sessions') +
    statBox(data.correct,           isZh ? '总答对' : 'Correct') +
    statBox(data.wrong,             isZh ? '总答错' : 'Wrong') +
    statBox(data.hints,             isZh ? '用提示' : 'Hints') +
    statBox(fmtTime(data.totalMs),  isZh ? '总用时' : 'Total Time') +
    '</div>';

  html += '<div class="summary-clear">' +
    '<button class="btn-clear" onclick="xxxClearHistory()">' +
    (isZh ? '🗑 清除历史记录' : '🗑 Clear History') +
    '</button></div>';

  body.innerHTML = html;
}

// 3. 从 localStorage 计算历史统计
function calcHistory() {
  var prefix = 'me:' + GAME_ID + ':history:';
  var sessions = 0, correct = 0, wrong = 0, hints = 0, totalMs = 0;
  
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf(prefix) === 0) {
      try {
        var r = JSON.parse(localStorage.getItem(key));
        if (r && r.total) {
          sessions++;
          correct += (r.score || 0);
          wrong += (r.total - (r.score || 0));
          hints += (r.hintsUsed || 0);
          totalMs += (r.timeMs || 0);
        }
      } catch (e) {}
    }
  }
  return { sessions, correct, wrong, hints, totalMs };
}

// 4. 时间格式化
function fmtTime(ms) {
  var s = Math.floor(ms / 1000);
  var m = Math.floor(s / 60);
  var h = Math.floor(m / 60);
  var zh = shell.lang === 'zh';
  
  if (h > 0) return h + (zh ? '小时' : 'h ') + (m % 60) + (zh ? '分' : 'm');
  if (m > 0) return m + (zh ? '分' : 'm ') + (s % 60) + (zh ? '秒' : 's');
  return s + (zh ? '秒' : 's');
}

// 5. 统计卡片生成
function statBox(val, label) {
  return '<div class="summary-stat">' +
    '<div class="summary-stat-value">' + val + '</div>' +
    '<div class="summary-stat-label">' + label + '</div>' +
    '</div>';
}

// 6. 折叠切换
window.xxxToggleSummary = function (which) {
  var bodyId = which === 'session' ? 'summaryBodySession' : 'summaryBodyHistory';
  var arrowId = which === 'session' ? 'summaryArrowSession' : 'summaryArrowHistory';
  var body = document.getElementById(bodyId);
  var arrow = document.getElementById(arrowId);
  
  if (!body) return;
  var open = body.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▲' : '▼';
  
  if (open) {
    if (which === 'session') renderSessionSummary();
    else renderHistorySummary();
  }
};

// 7. 清除历史记录
window.xxxClearHistory = function () {
  var isZh = shell.lang === 'zh';
  var msg = isZh ? '确认清除所有历史记录？此操作不可恢复。' 
                 : 'Clear all history? This cannot be undone.';
  if (!confirm(msg)) return;
  
  var prefix = 'me:' + GAME_ID + ':history:';
  var toRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf(prefix) === 0) toRemove.push(key);
  }
  toRemove.forEach(function (k) { localStorage.removeItem(k); });
  
  // 重置单元进度
  GAME_DATA.units.forEach(function (unit) {
    shell.storage.remove(GAME_ID + ':unit:' + unit.id);
  });
  
  renderHome();
  
  // 重新打开历史面板显示空状态
  var sbH = document.getElementById('summaryBodyHistory');
  if (sbH && sbH.classList.contains('open')) renderHistorySummary();
};
```

### 4.4 语言切换更新

在 `renderHome()` 中检查已打开的折叠区域：

```javascript
function renderHome() {
  // ... 渲染单元列表 ...
  
  // 如果报告区域已打开，重新渲染（响应语言切换）
  var sbS = document.getElementById('summaryBodySession');
  var sbH = document.getElementById('summaryBodyHistory');
  if (sbS && sbS.classList.contains('open')) renderSessionSummary();
  if (sbH && sbH.classList.contains('open')) renderHistorySummary();
}
```

---

## 5. 屏幕结构规范（Screen Structure）

### 5.1 三屏状态机

```
    ┌─────────────┐
    │ Home Screen │ ←─────┐
    └──────┬──────┘       │
           │ 点击单元        │ 返回
           ↓              │
    ┌─────────────┐       │
    │ Game Screen │ ──────┤
    └──────┬──────┘       │
           │ 完成题目        │
           ↓              │
    ┌─────────────┐       │
    │Result Screen│ ──────┘
    └─────────────┘
```

### 5.2 Home Screen 布局

```html
<div id="homeScreen">
  <!-- Header: 标题 + 语言/静音按钮 -->
  <div class="app-header">
    <div class="main-title">
      🎯 <span class="zh">游戏名</span><span class="en">Game Name</span>
    </div>
    <div class="header-controls">
      <button class="toggle-btn voiceToggle" onclick="xxxToggleVoice()">🔊</button>
      <button class="toggle-btn" id="langToggle" onclick="xxxToggleLang()">EN</button>
    </div>
  </div>
  
  <!-- Subtitle -->
  <div class="main-subtitle">
    <span class="zh">副标题</span><span class="en">Subtitle</span>
  </div>
  
  <!-- Unit List -->
  <div class="units-list" id="unitsList">
    <!-- 单元卡片动态生成 -->
  </div>
  
  <!-- Practice Summary (折叠报告) -->
  <div class="summary-wrap">...</div>
</div>
```

### 5.3 Game Screen 布局

```html
<div id="gameScreen" class="hidden">
  <!-- Header: 返回按钮 + 单元标题 + 控制按钮 -->
  <div class="game-header">
    <button class="back-btn" onclick="xxxBack()">⬅️</button>
    <div class="unit-title" id="unitTitle"></div>
    <div class="header-controls">
      <button class="toggle-btn voiceToggle" onclick="xxxToggleVoice()">🔊</button>
      <button class="toggle-btn" id="langToggleGame" onclick="xxxToggleLang()">EN</button>
    </div>
  </div>
  
  <!-- Progress Info -->
  <div class="game-info">
    <div class="q-progress">
      <span class="zh">第 <span id="currentQ">1</span> / <span id="totalQ">10</span> 题</span>
      <span class="en">Q <span id="currentQEn">1</span> / <span id="totalQEn">10</span></span>
    </div>
    <div class="live-score">
      <span class="zh">得分：<span id="liveScore">0</span></span>
      <span class="en">Score: <span id="liveScoreEn">0</span></span>
    </div>
  </div>
  
  <!-- Progress Dots -->
  <div class="progress-dots" id="progressDots"></div>
  
  <!-- Question Display -->
  <div class="sequence-display">
    <button class="replay-btn" onclick="xxxReplayQuestion()">🔊</button>
    <div id="sequenceInner"></div>
  </div>
  
  <!-- Options -->
  <div class="options-container" id="optionsContainer"></div>
  
  <!-- Feedback -->
  <div class="feedback" id="feedback"></div>
  
  <!-- Hint Box -->
  <div id="hintBox" class="hint-box hidden"></div>
  
  <!-- Action Buttons (Next/Hint) -->
  <div class="action-buttons" id="actionButtons"></div>
</div>
```

### 5.4 Result Screen 布局

```html
<div id="resultScreen" class="hidden">
  <div class="result-emoji" id="resultEmoji">🏆</div>
  <div class="result-title" id="resultTitle">完成！</div>
  
  <div class="result-stats">
    <div class="result-score" id="resultScore">8/10</div>
    <div class="result-details" id="resultDetails"></div>
  </div>
  
  <div class="result-message" id="resultMessage"></div>
  
  <div class="action-buttons" id="resultButtons">
    <!-- 重试/下一关/回首页按钮 -->
  </div>
</div>
```

---

## 6. 样式变量约定（CSS Variables）

### 6.1 必需颜色变量

每个游戏定义自己的主题色，但遵循统一命名：

```css
:root {
  --primary:  #667eea;   /* 主题色（按钮、标题） */
  --primary2: #764ba2;   /* 主题色渐变终点 */
  --green:    #10b981;   /* 正确/成功 */
  --yellow:   #f59e0b;   /* 警告/提示 */
  --red:      #ef4444;   /* 错误/失败 */
  --text:     #1e293b;   /* 主文本 */
  --muted:    #64748b;   /* 次要文本 */
  --bg:       #f8faff;   /* 背景色 */
  --card:     #ffffff;   /* 卡片背景 */
  --border:   #e2e8f0;   /* 边框 */
}
```

### 6.2 响应式断点

```css
/* 平板 */
@media (max-width: 820px) {
  body { align-items: flex-start; padding: 12px; }
  .game-container { max-width: 100%; border-radius: 18px; }
}

/* 手机 */
@media (max-width: 520px) {
  body { padding: 0; }
  .game-container { 
    border-radius: 0; 
    padding: 20px 16px 28px; 
    min-height: 100svh;  /* 使用 svh 避免地址栏问题 */
  }
  .main-title { font-size: 26px; }
  .option-btn { font-size: 17px; min-height: 54px; }
  .btn { padding: 10px 18px; font-size: 15px; }
}
```

---

## 7. 命名规范（Naming Convention）

### 7.1 游戏ID

格式：`{category}-{type}-hunter`

- `number-pattern-hunter` - 数字规律
- `visual-pattern-hunter` - 视觉规律
- `logic-puzzle-hunter` - 逻辑谜题（未来）

### 7.2 函数命名前缀

全局函数必须加游戏缩写前缀避免冲突：

```javascript
// Number Pattern Hunter: ph
window.phToggleVoice = function () { ... };
window.phBack = function () { ... };

// Visual Pattern Hunter: vph
window.vphToggleVoice = function () { ... };
window.vphBack = function () { ... };
```

内部函数无需前缀：

```javascript
function renderHome() { ... }
function renderQuestion() { ... }
function currentUnit() { ... }
```

### 7.3 LocalStorage Key 规范

```javascript
// 用户设置（跨游戏）
'me:user:settings:lang'        // 'zh' | 'en'
'me:user:settings:voice'       // true | false

// 游戏进度（单游戏）
'me:GAME_ID:unit:1'            // { unlocked, bestScore, playCount }

// 历史记录（单游戏，带时间戳）
'me:GAME_ID:history:1672531200000'  // shell.report() 自动生成

// 系统数据
'me:sys:syncPending'           // [记录数组] 待上传云端
```

### 7.4 数据变量命名

```javascript
var GAME_ID = 'visual-pattern-hunter';  // 常量大写
var PASS_SCORE = 4;                     // 常量大写
var DEBUG_MODE = true;                  // 常量大写

var state = { ... };                    // 当前游戏状态
var sessionStats = {};                  // 本次会话统计

var VPH_DATA = { units: [...] };       // 游戏数据（游戏缩写_DATA）
```

---

## 8. 文件组织结构（File Structure）

### 8.1 标准目录结构

```
games/
├── {game-name}/
│   ├── index.html        # 游戏主页（包含三屏）
│   ├── game.js           # 游戏逻辑（状态机、渲染、交互）
│   ├── data.js           # 游戏数据（单元、题目）
│   └── strings.js        # 游戏专属字符串（国际化）
├── _shared/              # 【未来】共享资源
│   ├── shell-core.js     # 提取 shell.js 通用逻辑
│   ├── sprites.js        # 小精灵动画库
│   └── ability-tags.js   # 统一能力标签定义
```

### 8.2 脚本加载顺序

```html
<!-- ✅ 正确顺序 -->
<script src="../../shell.js"></script>         <!-- 1. 核心基础设施 -->
<script src="../../i18n/strings.js"></script>  <!-- 2. 全局字符串 -->
<script src="./strings.js"></script>           <!-- 3. 游戏字符串 -->
<script src="./data.js"></script>              <!-- 4. 游戏数据 -->
<script src="./game.js"></script>              <!-- 5. 游戏逻辑 -->

<!-- ❌ 错误：顺序颠倒导致 shell 未定义 -->
<script src="./game.js"></script>
<script src="../../shell.js"></script>
```

---

## 9. Debug 模式规范（Debug Mode）

### 9.1 开发时解锁所有单元

```javascript
var DEBUG_MODE = true; // 生产环境改为 false

document.addEventListener('DOMContentLoaded', function () {
  if (DEBUG_MODE) {
    GAME_DATA.units.forEach(function (unit) {
      var saved = getUnitSave(unit.id);
      if (!saved.unlocked) {
        saved.unlocked = true;
        saveUnitSave(unit.id, saved);
      }
    });
  }
  
  renderHome();
});
```

### 9.2 控制台调试工具

```javascript
// 在 game.js 末尾添加（生产环境可删除）
if (DEBUG_MODE) {
  window.debug = {
    state: state,
    sessionStats: sessionStats,
    clearHistory: function () { xxxClearHistory(); },
    jumpToUnit: function (idx) { startUnit(idx); },
    getHistory: function () { return calcHistory(); }
  };
  console.log('[DEBUG] window.debug available');
}
```

---

## 10. 必要函数清单（Function Checklist）

每个游戏**必须**实现以下函数：

### 10.1 屏幕渲染

- [ ] `renderHome()` - 渲染首页（单元列表 + 报告区域）
- [ ] `renderQuestion()` - 渲染题目（序列 + 选项）
- [ ] `renderResult()` - 渲染结算（分数 + 按钮）

### 10.2 数据统计

- [ ] `renderSessionSummary()` - 本次练习表格
- [ ] `renderHistorySummary()` - 历史总览卡片
- [ ] `calcHistory()` - 计算历史统计
- [ ] `fmtTime(ms)` - 格式化时间
- [ ] `statBox(val, label)` - 生成统计卡片 HTML

### 10.3 交互控制

- [ ] `xxxToggleSummary(which)` - 折叠报告切换
- [ ] `xxxClearHistory()` - 清除历史记录
- [ ] `xxxToggleVoice()` - 静音切换
- [ ] `xxxToggleLang()` - 语言切换
- [ ] `xxxBack()` - 返回首页
- [ ] `xxxReplayQuestion()` - 重播题目语音

### 10.4 游戏逻辑

- [ ] `startUnit(unitIndex)` - 开始单元
- [ ] `finishUnit()` - 完成单元（保存进度、上报数据）
- [ ] `checkAnswer(selected)` - 检查答案
- [ ] `renderProgressDots()` - 渲染进度点

### 10.5 辅助工具

- [ ] `updateVoiceBtn()` - 更新静音按钮图标
- [ ] `updateLangBtn()` - 更新语言按钮文本
- [ ] `updateLangBtnGame()` - 更新游戏屏语言按钮
- [ ] `getUnitSave(unitId)` - 读取单元进度
- [ ] `saveUnitSave(unitId, data)` - 保存单元进度
- [ ] `currentUnit()` - 获取当前单元
- [ ] `currentQuestion()` - 获取当前题目
- [ ] `show(el)` / `hide(el)` - 显示/隐藏元素

---

## 11. 常见错误与陷阱（Common Pitfalls）

### ❌ 错误 1：硬编码文本

```html
<!-- 错误 -->
<div class="main-title">🎯 找规律</div>
<button>返回</button>
```

```html
<!-- 正确 -->
<div class="main-title">
  🎯 <span class="zh">找规律</span><span class="en">Pattern Hunter</span>
</div>
<button>
  <span class="zh">返回</span><span class="en">Back</span>
</button>
```

### ❌ 错误 2：调用不存在的 API

```javascript
// 错误：shell 没有 toggleVoice 方法
shell.toggleVoice();
shell.voiceEnabled; // 也不存在

// 正确：直接操作 storage
var enabled = shell.storage.get('user:settings:voice', true);
shell.storage.set('user:settings:voice', !enabled);
```

### ❌ 错误 3：忘记语言切换监听

```javascript
// 错误：语言切换后页面不更新
document.addEventListener('DOMContentLoaded', function () {
  renderHome();
});

// 正确：监听 langchange 事件
document.addEventListener('shell:langchange', function () {
  if (!$homeScreen.classList.contains('hidden')) renderHome();
  if (!$gameScreen.classList.contains('hidden')) renderQuestion();
  if (!$resultScreen.classList.contains('hidden')) renderResult();
});
```

### ❌ 错误 4：进度指标不同步

```javascript
// 错误：只更新中文版
document.getElementById('currentQ').textContent = state.qIndex + 1;
document.getElementById('liveScore').textContent = state.score;

// 正确：同时更新中英文版
document.getElementById('currentQ').textContent = state.qIndex + 1;
document.getElementById('totalQ').textContent = total;
document.getElementById('liveScore').textContent = state.score;

var currentQEn = document.getElementById('currentQEn');
var totalQEn = document.getElementById('totalQEn');
var liveScoreEn = document.getElementById('liveScoreEn');
if (currentQEn) currentQEn.textContent = state.qIndex + 1;
if (totalQEn) totalQEn.textContent = total;
if (liveScoreEn) liveScoreEn.textContent = state.score;
```

### ❌ 错误 5：localStorage Key 命名不规范

```javascript
// 错误：没有游戏前缀，会冲突
localStorage.setItem('unit1', JSON.stringify(data));
shell.storage.set('unit:1', data);  // 虽有 'me:' 前缀但没有游戏ID

// 正确：完整路径
shell.storage.set('visual-pattern-hunter:unit:1', data);
shell.report({ gameId: 'visual-pattern-hunter', ... });
```

---

## 12. 性能优化建议（Performance Tips）

### 12.1 避免频繁 DOM 操作

```javascript
// ❌ 慢：逐个添加
optionsContainer.innerHTML = '';
q.options.forEach(function (opt) {
  var btn = document.createElement('button');
  btn.textContent = opt;
  optionsContainer.appendChild(btn);  // 每次都触发 reflow
});

// ✅ 快：批量构建后一次性插入
var html = '';
q.options.forEach(function (opt) {
  html += '<button class="option-btn">' + opt + '</button>';
});
optionsContainer.innerHTML = html;
```

### 12.2 缓存 DOM 引用

```javascript
// ❌ 慢：每次查询
function updateScore() {
  document.getElementById('liveScore').textContent = state.score;
  document.getElementById('liveScoreEn').textContent = state.score;
}

// ✅ 快：启动时缓存
var $liveScore, $liveScoreEn;

document.addEventListener('DOMContentLoaded', function () {
  $liveScore = document.getElementById('liveScore');
  $liveScoreEn = document.getElementById('liveScoreEn');
});

function updateScore() {
  $liveScore.textContent = state.score;
  if ($liveScoreEn) $liveScoreEn.textContent = state.score;
}
```

### 12.3 延迟语音播放（Android 兼容）

```javascript
// shell.speak() 已内置 50ms 延迟修复 Android Chrome
shell.speak(text);  // 无需额外处理
```

---

## 13. 版本管理建议（Versioning）

### 13.1 文件头注释

```javascript
/**
 * Visual Pattern Hunter — Game Logic  v1.0.0
 * ─────────────────────────────────────────────────────────
 * Depends on: shell.js, i18n/strings.js, strings.js, data.js
 * Features: SVG shape rendering, pattern recognition
 * ─────────────────────────────────────────────────────────
 */
```

### 13.2 Git Commit 规范

```bash
# 格式：<type>: <description>
feat: add visual-pattern-hunter game
fix: correct voice toggle button in visual-pattern-hunter
refactor: extract common summary functions to shell-core.js
docs: update GAME-SHELL-CONVENTION.md with new examples
```

**Type 类型：**
- `feat` - 新功能
- `fix` - Bug 修复
- `refactor` - 代码重构（不改变功能）
- `docs` - 文档更新
- `style` - 样式调整
- `perf` - 性能优化
- `test` - 测试相关

---

## 14. 未来扩展路线（Future Roadmap）

### 14.1 共享代码库 `_shared/`

将重复代码提取到共享模块：

- `shell-core.js` - 通用 Shell 逻辑
- `game-base.js` - 游戏基类（状态机、渲染流程）
- `sprites.js` - 小精灵动画库
- `ability-tags.js` - 跨游戏能力标签

### 14.2 能力雷达图

基于统一标签生成跨游戏能力画像：

```javascript
// _shared/ability-tags.js
{
  'seq-arithmetic': '等差数列',
  'seq-geometric':  '等比规律',
  'spatial-rotation': '空间旋转',
  'pattern-color': '颜色规律',
  'subitizing': '快速计数',
  'shape-recog': '形状识别'
}

// 每个游戏上报包含能力标签
shell.report({
  gameId: 'visual-pattern-hunter',
  abilityTags: ['shape-recog', 'spatial-rotation'],
  ...
});
```

### 14.3 Adaptive 难度

根据实时表现动态调整难度：

```javascript
if (前3题正确率 === 100% && 平均用时 < 5s) {
  // 跳过 L1，直接进入 L2
  state.level = 2;
}

if (某题型连错2次) {
  // 降级复习
  state.level = Math.max(1, state.level - 1);
}
```

---

## 15. 快速检查清单（Quick Checklist）

创建新游戏时，按此清单逐项检查：

### 启动前

- [ ] 定义 `GAME_ID` 常量（kebab-case）
- [ ] 注册游戏专属字符串到 `strings.js`
- [ ] 准备游戏数据 `data.js`（单元、题目）
- [ ] 复制 `index.html` 模板，调整主题色

### HTML 结构

- [ ] Home Screen 包含折叠报告区域
- [ ] Game Screen 进度指标有双语版本
- [ ] Result Screen 按钮布局完整
- [ ] 所有静态文本使用 `.zh` / `.en` span

### JavaScript 实现

- [ ] 实现 15 个必要函数（见第 10 节）
- [ ] 静音按钮使用 `storage.get/set('user:settings:voice')`
- [ ] 语言切换监听 `shell:langchange` 事件
- [ ] 完成单元后调用 `shell.report()`

### CSS 样式

- [ ] 定义 10 个颜色变量
- [ ] 添加折叠报告样式（`.summary-*`）
- [ ] 响应式断点（820px / 520px）

### 测试验证

- [ ] 中英文切换正常显示
- [ ] 静音按钮切换有效
- [ ] 本次练习表格正确显示
- [ ] 历史总览数据准确
- [ ] 清除历史功能正常
- [ ] 移动端布局无错位

---

## 附录：Shell.js API 参考（Shell API Reference）

### A.1 国际化（i18n）

```javascript
shell.t(key, ...args)           // 获取翻译文本，支持占位符 {0}, {1}
shell.registerStrings(obj)      // 注册游戏专属字符串
shell.setLang(lang)             // 切换语言 ('zh' | 'en')
shell.lang                      // 当前语言 ('zh' | 'en')
```

### A.2 存储（Storage）

```javascript
shell.storage.get(key, defaultValue)   // 读取数据（自动 JSON.parse）
shell.storage.set(key, value)          // 保存数据（自动 JSON.stringify）
shell.storage.remove(key)              // 删除数据

// 注意：key 会自动加 'me:' 前缀，避免冲突
// 例如：shell.storage.set('game:unit:1', data)
//       实际存储为：localStorage['me:game:unit:1']
```

### A.3 语音（Speech）

```javascript
shell.speak(text, lang)   // 播报文本（可选指定语言）
// 注意：自动去除 emoji、延迟 50ms（修复 Android）、支持语音设置
```

### A.4 数据上报（Analytics）

```javascript
shell.report({
  gameId:    'game-name',    // 必须
  unitId:    'unit-1',       // 建议
  score:     8,              // 必须
  total:     10,             // 必须
  timeMs:    45000,          // 必须
  hintsUsed: 2               // 可选
});
// 自动保存到 localStorage 并加入云同步队列
```

### A.5 导航（Navigation）

```javascript
shell.nav.goto('game-name')  // 跳转到游戏：/games/game-name/index.html
shell.nav.home()             // 回到首页：/index.html
shell.nav.back()             // 浏览器后退
```

### A.6 用户信息（User）

```javascript
shell.user.id           // 用户ID（未登录时为匿名UUID）
shell.user.name         // 用户名（未登录时为 null）
shell.user.isAnonymous  // 是否匿名用户
```

---

## 版本历史（Changelog）

### v1.0.0 (2026-07-02)
- 初版发布
- 基于 `number-pattern-hunter` 和 `visual-pattern-hunter` 提炼
- 覆盖双语、语音、统计、折叠报告、样式、命名等 15 个方面

---

**文档维护者：** MindsEvo Team  
**最后更新：** 2026-07-02  
**适用版本：** Shell.js v1.0.0+
