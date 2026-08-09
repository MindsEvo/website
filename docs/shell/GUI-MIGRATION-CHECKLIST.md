# GUI Framework 迁移检查清单（阶段 1）

## 版本

- v0.2.0 (2026-08-02)
- 适用范围：Learning、MindSeeds

## 1. 核查目标

1. 公共 GUI 接入一致：header、language、audio.music、audio.sound、history、help、video。
2. RootGene 接入一致：每个已迁移游戏实现 `registerRootGenes()`。
3. 回归后玩法不变：题目逻辑、判题、通关门槛不受 GUI 迁移影响。

## 2. 当前审计结果（14 个已迁移游戏）

审计时间：2026-08-02（脚本审计）

1. `gui + header + language + audio + history`：14/14 已接入。
2. `registerRootGenes`：14/14 已接入。
3. `gui.help`：2/14 已接入。
4. `gui.video`：2/14 已接入。

## 3. 缺口矩阵（待补齐）

1. `games/color-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
2. `games/visual-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
3. `games/motion-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
4. `games/temporal-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
5. `games/size-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
6. `games/spatial-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
7. `games/quantity-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
8. `games/logic-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
9. `games/mixed-pattern-hunter/game.js`：缺 `gui.help`、`gui.video`
10. `learning/math/logic/game.js`：缺 `gui.help`、`gui.video`
11. `learning/math/modeling/game.js`：缺 `gui.help`、`gui.video`
12. `learning/math/strategy/game.js`：缺 `gui.help`、`gui.video`

已完成（含 help/video）：

1. `games/number-pattern-hunter/game.js`
2. `learning/math/pattern/game.js`

## 4. 逐个游戏对接批次

1. 批次 A（MindSeeds 视觉/动作）：color、visual、motion、temporal
2. 批次 B（MindSeeds 空间/数量/逻辑/综合）：size、spatial、quantity、logic、mixed
3. 批次 C（Learning）：logic、modeling、strategy

## 5. 每个游戏统一验收项

1. 头部显示与返回按钮正常。
2. 中英文切换后题干/选项/语音一致。
3. 音乐与音效开关状态可持久化。
4. History 入口可打开并显示记录。
5. Help 入口可见、文案正确。
6. Video 入口可见，`videoId` 可解析到 `video.json`。
7. 结算后 report 含 `geneIds`，玩法得分逻辑保持不变。

## 6. 已知限制

1. 当前音乐开关统一状态，不强制接管每个游戏的音乐播放实现。
2. Video 优先 `gui.video.url`，其次 `video.json` 的 `videoId` 解析；未命中时显示占位提示。
