# Unified GUI Framework 规范（阶段 1 草案）

## 版本

- draft v0.1.0 (2026-08-01)
- 适用范围：Learning、MindSeeds、Creative Workshop（Chess 不强制）

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

## 8. 迁移建议

1. 先只接入 header + language + audio（低风险）。
2. 再接入 history/help/video（依赖文案与资源）。
3. 最后统一 theme token，清理游戏内重复样式。

## 9. 未决问题

1. Creative Workshop 是否允许自定义 Header 全布局。
2. videoId 统一放在 video.json，并在 lesson/game 中做引用。
3. History 的 panel/page 最终统一为单形态还是双形态。
