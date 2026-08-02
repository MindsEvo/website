# GUI Framework 迁移检查清单（阶段 1）

## 版本

- draft v0.1.0 (2026-08-01)
- 适用范围：Learning、Mind Seeds

## 1. 迁移步骤

1. 在游戏配置中增加 `gui` 对象。
2. 启用最小能力：header、language、audio、history。
3. 验证默认值与 localStorage 状态一致。
4. 验证游戏核心题目逻辑不受影响。

## 2. 最小配置模板

```javascript
gui: {
  header: { show: true, showBack: true },
  language: { enabled: true, default: 'zh' },
  audio: {
    music: { enabled: true, defaultOn: false },
    sound: { enabled: true, defaultOn: true }
  },
  history: { enabled: true }
}
```

## 3. 回归检查项

1. Home 与 Game 页头部显示正常。
2. Back 按钮返回首页正常。
3. 语言切换后标题、题干、选项均刷新。
4. 音效开关图标状态可持久化。
5. 音乐开关图标状态可持久化。
6. 历史面板可展开/收起。
7. 不配置 `gui` 的旧游戏仍可运行。

## 4. 已完成迁移（本轮）

1. Learning: learning-math-logic
2. Learning: learning-math-modeling
3. Learning: learning-math-pattern
4. Learning: learning-math-strategy
5. Mind Seeds: number-pattern-hunter
6. Mind Seeds: logic-pattern-hunter
7. Mind Seeds: visual-pattern-hunter
8. Mind Seeds: color-pattern-hunter
9. Mind Seeds: motion-pattern-hunter
10. Mind Seeds: temporal-pattern-hunter
11. Mind Seeds: size-pattern-hunter
12. Mind Seeds: quantity-pattern-hunter
13. Mind Seeds: spatial-pattern-hunter
14. Mind Seeds: mixed-pattern-hunter

## 5. 已知限制

1. 当前音乐开关仅统一状态，不强制接管各游戏音乐播放实现。
2. Video 优先使用 `gui.video.url`，其次解析 `video.json`；若 `videoId` 未命中则显示占位提示。
