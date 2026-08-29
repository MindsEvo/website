# Unified GUI Framework 规范（阶段 1 草案）

## 版本

- draft v0.2.0 (2026-08-29)
- 适用范围：Learning、MindSeeds、Creative Workshop（Chess 不强制）

> v0.2.0 变更：新增 §8「响应式布局契约」（`s1-duo` / `s1-multi` 原语 +
> 两条硬规则）与 `shell.diag` 诊断浮层；设计原则补第 5 条。

## 1. 目标

统一非玩法能力，让游戏只实现自己的题目与交互逻辑。

统一能力清单：

1. Header
2. Language（zh/en）
3. Music
4. Sound
5. History 入口
6. Return
7. Theme
8. Help
9. Video 入口

## 2. 设计原则

1. 默认可用：不配置也能运行。
2. 显式覆盖：游戏可按需覆盖文案、主题和入口行为。
3. 渐进迁移：允许老游戏按功能分批接入。
4. 低侵入：游戏层只使用少量 API，不关心平台差异。
5. **重排由共享层定义**：游戏不自己发明设备宽度断点，见 §8。

## 3. 最小接入接口

```javascript
shell.createGame({
  id: 'number-pattern-hunter',
  title: { zh: '找规律', en: 'Pattern Hunter' },
  units: NPH_DATA.units,

  // 新增统一 GUI 配置
  gui: {
    header: {
      show: true,
      showBack: true,
      showHelp: true,
      showVideo: true,
      titleZh: '数字规律训练',
      titleEn: 'Number Pattern Training'
    },
    language: {
      enabled: true,
      default: 'zh'
    },
    audio: {
      music: { enabled: true, defaultOn: false },
      sound: { enabled: true, defaultOn: true }
    },
    history: {
      enabled: true,
      mode: 'panel'
    },
    theme: {
      name: 'ocean',
      tokens: {
        primary: '#0d9488',
        primary2: '#0f766e',
        bg: '#f0fdfa'
      }
    },
    help: {
      enabled: true,
      contentZh: '观察规律后选择正确答案。',
      contentEn: 'Find the pattern and choose the correct answer.'
    },
    video: {
      enabled: true,
      videoId: 'pattern-intro-001'
    }
  },

  renderSequence: function (q, el) { /* game logic */ },
  renderOption: function (opt) { return String(opt); },
  checkAnswer: function (selected, q) { return Number(selected) === q.answer; }
});
```

## 4. 配置协议（草案）

### 4.1 gui.header

1. show: 是否显示统一头部。
2. showBack: 是否显示返回按钮。
3. showHelp: 是否显示帮助入口。
4. showVideo: 是否显示视频入口。
5. titleZh/titleEn: 头部标题覆盖。

### 4.2 gui.language

1. enabled: 是否启用中英文切换。
2. default: 默认语言（zh/en）。

### 4.3 gui.audio

1. music.enabled: 是否启用音乐控制。
2. music.defaultOn: 默认音乐状态。
3. sound.enabled: 是否启用音效控制。
4. sound.defaultOn: 默认音效状态。

### 4.4 gui.history

1. enabled: 是否显示历史入口。
2. mode: panel 或 page（草案保留）。

### 4.5 gui.theme

1. name: 主题名（可选）。
2. tokens: 主题色变量覆盖。

### 4.6 gui.help

1. enabled: 是否显示帮助。
2. contentZh/contentEn: 帮助文案。

### 4.7 gui.video

1. enabled: 是否显示视频入口。
2. videoId: 对应 video.json 的 ID。

## 5. 运行时接口（草案）

```javascript
shell.gui.getState();
shell.gui.setLanguage('zh');
shell.gui.setMusic(true);
shell.gui.setSound(false);
shell.gui.openHelp();
shell.gui.openHistory();
shell.gui.openVideo('pattern-intro-001');
```

约束：

1. setLanguage 只能接受 zh/en。
2. openVideo 的入参优先使用 videoId，避免硬编码 URL。
3. 运行时状态与 localStorage 同步，但由 shell 统一管理 key。

## 6. 最小事件协议（草案）

```javascript
shell.on('gui:languageChanged', function (payload) {
  // payload: { lang: 'zh' }
});

shell.on('gui:audioChanged', function (payload) {
  // payload: { musicOn: true, soundOn: false }
});

shell.on('gui:helpOpened', function () {});
shell.on('gui:historyOpened', function () {});
shell.on('gui:videoOpened', function (payload) {
  // payload: { videoId: 'pattern-intro-001', url: 'https://...' }
});
```

## 7. 验收标准（阶段 1）

1. 统一 Header/Language/Music/Sound/History/Return/Theme/Help/Video 全部可配置。
2. Learning 与 MindSeeds 各至少一个游戏完成接入。
3. 老游戏不配置 gui 仍可运行（向后兼容）。
4. 移动端（<=520px）头部按钮布局无错位。
5. 中英文切换与音频开关状态可持久化。
6. Help / Video 入口在配置启用时可见且可点击。

## 8. 响应式布局契约（v0.2.0 新增）

### 8.1 为什么需要它

真实案例：Clio「连线组词」在 PC、iOS、小屏安卓平板正常（左右两栏），
在**大屏安卓平板**上变成上下两栏，安卓版本相同。

根因不是"屏幕大小"，而是 **CSS 像素 = 物理像素 ÷ devicePixelRatio**。
安卓 dpr 从 1.0 到 3.0+ 都有，所以**物理更大的高密度平板，CSS 宽度可能比
物理更小的低密度平板还窄**，`max-width` 断点因此在大屏上命中、小屏上不命中。
这类问题在开发机上永远看不到。

更糟的是那个断点里还有 `.link-canvas { display: none; }`——
一个「连线」游戏在那台设备上**丢掉了连线本身**。

全仓库曾有约 25 个互不相同的 `max-width` 断点（860/640/780/980/820/520…），
没有任何共享契约，每个游戏各自发明一套。

### 8.2 两条硬规则

**规则 1：按容器宽度重排，不按设备宽度。**

用 `repeat(auto-fit, minmax(...))` 问容器"你实际有多宽"，
不需要断点、不受 dpr 影响，且在老安卓 WebView 上可用（`@container` 不一定）。

**规则 2：重排只能重新排列，永远不许删除功能。**

窄布局可以竖排、缩小、滚动，**不许 `display:none` 掉玩法必需或负责反馈的元素**。
放不下就缩小或移位，不要拿掉游戏的核心可感知反馈。

### 8.3 共享原语

`shell-1.css` 提供：

```html
<div class="s1-duo">   <!-- 两栏；恰好两个 in-flow 子元素 -->
<div class="s1-multi">  <!-- 三栏以上 -->
```

| 变量 | 默认 | 含义 |
|------|------|------|
| `--s1-duo-min` | `320px` | 单栏允许的最小宽度，低于此则塌成一栏 |
| `--s1-duo-gap` | `22px` | 栏间距 |
| `--s1-multi-min` | `220px` | 同上，多栏版 |
| `--s1-multi-gap` | `16px` | |

游戏只需要调 `--s1-duo-min` 来决定"什么时候塌"，不再写媒体查询。
媒体查询仍可用于**纯装饰**（字号、圆角、内边距），不得用于决定栏数或显隐。

### 8.4 诊断：`shell.diag`

dpr 相关的显示问题无法靠推理复现，必须在那台设备上读数。
任意页面加 `?diag=1` 即出现浮层：

```
css   1024 x 768  landscape
dpr   2
phys  2048 x 1536   screen 1024 x 768
bp<=  1200 1180 1100 1024
<user agent>
```

`bp<=` 列出当前命中的所有仓库标准断点——**布局意外塌栏时，凶手就在这一行**。
点击浮层换角（不会永久遮住被诊断的东西），长按 600ms 关闭。
也可 `shell.diag.info()` 取结构化数据、`shell.diag.toggle()` 手动开关。

⚠️ `?diag=1` 与 `?debug=1` 是**两个开关**：`debug` 解锁全部单元且多数游戏默认开，
`diag` 只影响诊断浮层且**默认关**。

样式内联在 `shell.js` 里，所以不加载 `shell-1.css` 的页面也能用。

### 8.5 接入状态

| 游戏 | 状态 |
|------|------|
| `word-connections-workshop` | ✅ 已改为容器驱动，`.link-canvas` 不再隐藏 |
| 其余约 24 个自定义断点 | ⚪ 未迁移，逐个游戏改动时顺带收敛 |

新游戏**必须**用 `s1-duo` / `s1-multi`，不得新增设备宽度断点来决定栏数。

## 9. 迁移建议

1. 先只接入 header + language + audio（低风险）。
2. 再接入 history/help/video（依赖文案与资源）。
3. 最后统一 theme token，清理游戏内重复样式。

## 10. 未决问题

1. Creative Workshop 是否允许自定义 Header 全布局。
2. videoId 统一放在 video.json，并在 lesson/game 中做引用。
3. History 的 panel/page 最终统一为单形态还是双形态。
