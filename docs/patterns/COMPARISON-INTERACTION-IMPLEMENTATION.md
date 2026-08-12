# Comparison · Interaction Mode — Implementation Reference

**版本** v1.1 · 2026-08-12  
**前置文档** `docs/patterns/COMPARISON-PUZZLE-IMPLEMENTATION.md`

> v1.1 变更：Fit 三态判定与反馈文案；`process` 字段补齐；澄清 Interaction 在会话内的实际执行顺序；`test.html` 改为按 mode 分流校验；结果页文案按 mode 区分。

---

## 1. 新增文件一览

```
learning/math/comparison/
├── pointer-drag.js       PointerEvents 拖放底层（鼠标/触摸/手写笔）
├── interaction-ui.js     共享 GUI 头部（控件 HTML + 事件绑定）
├── sort-runtime.js       排序活动（拖入槽位）
├── match-runtime.js      配对活动（动物→合适的家）
├── group-runtime.js      分类活动（拖入大/小篮子）
└── fit-runtime.js        搭桥活动（选合适木板帮角色过河）
```

`activity-runner.js` 负责将模板路由到对应 Runtime。

---

## 2. 架构关系

```
Cycle Engine
  └── getSessionTemplates()
        │  mode: 'puzzle' → game.js → shell.createGame (Puzzle)
        └── mode: 'sort'|'match'|'group'|'fit'
                  → game.js._launchInteraction()
                  → ActivityRunner.launch(template, variant, ctx)
                  → SortRuntime / MatchRuntime / GroupRuntime / FitRuntime
                  → ctx.onComplete(attempt)
                  → recordSessionAnswer + recordAttempt
```

Puzzle 和 Interaction **共享同一个 Cycle Engine**，模板池、轮次计划、进度和升级判定完全统一。

### 2.1 会话内的实际执行顺序

调度层面透明，但**执行顺序不是计划顺序**：

```
一组 4 题 = 例如 [puzzle-A, sort-1, puzzle-B, fit-1]（_typeBalancedShuffle 的计划顺序）
实际播放  = sort-1 → fit-1 → [puzzle-A, puzzle-B] 批量
```

原因：Puzzle 通过 `shell.createGame` 一次性接收整批题目，而 Interaction 每次只能跑一个活动。
`_launchGame()` 因此先把本组的 Interaction 逐个排干，再把剩下的 Puzzle 交给 shell。
断点续传保证正确性——`getSessionTemplates()` 每次返回"尚未作答"的模板，所以重入是安全的。

若将来要求严格按计划顺序交错，需要 shell 支持"单题模式"，属 Shell 层改动。

---

## 3. pointer-drag.js

**单一职责**：封装跨平台拖放，消除 mouse/touch/stylus 差异。

```javascript
PointerDrag.makeDraggable(el, { onEnd: function(el, zoneId) {} });
PointerDrag.registerDropZone(el, 'zone-id');
PointerDrag.unregisterAll();  // 活动结束时调用
```

关键技术：
- `setPointerCapture` 确保 pointermove 在越出元素边界后仍被捕获
- Ghost 元素（`pointer-events:none`）使 `elementFromPoint` 能透视到下方放置区
- `touchAction:'none'` 阻止原生滚动干扰

---

## 4. interaction-ui.js（IH）

所有 Interaction Runtime 共享的头部工具。提供与 Puzzle shell 一致的 GUI 控件。

```javascript
IH.injectStyles();                    // 注入头部 CSS（调用一次即可）
IH.controlsHtml('prefix')            // 返回控件 HTML 字符串（含隐藏的 🔄 按钮）
IH.wire('prefix', { onReset: fn })   // 绑定事件；传 onReset 才显示复位按钮
```

控件：🔄（复位，可选）· 🔊（语音）· 🎵（音乐）· EN/CN · 音量滑条

**已知陷阱**：所有 Runtime 的 `_applyLang(el)` 函数必须在开头加：
```javascript
if (!el || el.type) el = null;  // event listener 传入 Event 对象时忽略它
```

---

## 5. 四种 Runtime 设计

### 5.1 Sort（排序）

**交互**：持有区 → 拖入编号槽位 → 全部填满 → 自动验证

```
生成器：sortLength4
参数：items(4), minGapPct(18)
正确标准：slots[i] === targetOrder[i]（升序排列）
错误反馈：抖动错误槽位，状态保留，允许调整
```

**复位**：`slots` 清空，`holding` 恢复全部 item ID。

### 5.2 Match（配对）

**交互**：左列动物 → 拖到右侧对应大小的家

```
生成器：matchSize3
参数：无（从 matchSizeGroups 随机选大/中/小各一对）
正确标准：leftItem.size === rightSlot.size
错误反馈：抖动错误右槽，不清空，允许换位
```

**复位**：`placements` 全部置 null，左列重渲染（动物回来）。

### 5.3 Group（分类）

**交互**：自由区物品 → 拖入大篮/小篮 → 所有物品分完 → 自动验证

```
生成器：groupSize
参数：itemsPerBin(3)，各篮3个物品，共6个
正确标准：item.bin === 所在 bin.id
错误反馈：错误篮子抖动 + 错误物品退回自由区
```

**复位**：`pool` 恢复全部，`binContents` 清空。

### 5.4 Fit（搭桥）

**交互**：拖木板到河面 → 即时反馈

```
生成器：fitBridge
参数：margin —— 「明显过长」那块板超出河宽的百分比（不是正确板的余量）
三块木板：
  太短 = gap − 15 − rand(0..8)
  刚好 = gap + rand(0..5)        ← correctBoardId
  过长 = gap + margin + rand(0..8)
```

**三态判定**（v1.1）：木板只要 `lengthPct >= gapPct` 就真的能过河，因此算正确；
是否为「最优解」记在 `process.optimal`。

| 拖入的板 | 判定 | 反馈文案 |
|---|---|---|
| 太短 | 错误，可继续尝试 | 木板太短了，试试长一点的 / Too short — try a longer plank |
| 刚好（correctBoardId） | 正确 · optimal=true | 刚好搭到对岸了！/ A perfect fit! |
| 过长 | 正确 · optimal=false | 有点长，不过能过河！/ A bit long, but it works! |

三块板全试完仍未成功时自动恢复托盘（仅当生成器没产出可用板才可能发生），保证活动不会死锁。

**复位**：`usedBoards` 清空，桥隐藏，消息清空。

---

## 6. 统一 Attempt 数据结构

所有 Runtime 返回同一格式：

```javascript
{
  templateId:  'cmp-k1-sort-length-001',
  variantId:   'cmp-k1-sort-length-001-vXXXXX',
  mode:        'sort' | 'match' | 'group' | 'fit',
  result:      'correct',
  responseMs:  number,
  process:     { ... }        // 按 mode 不同，见下表
}
```

**`result` 目前恒为 `'correct'`。** 四个 Runtime 都不把"做错"当作结局：放错只抖动、退回、给提示，
孩子继续调整，`onComplete` 只在解开之后触发。因此：

- 挣扎程度由 `process` 承载（`corrections` / `attempts`），不由 `result` 承载
- Cycle 准确率实际只反映 Puzzle 题；Interaction 恒计为答对
- 若将来要让 Interaction 影响准确率，应基于 `process` 设阈值（如 `corrections > n` 记为未掌握），而不是让活动中途判负

**各 mode 的 `process` 字段**：

| mode | 字段 |
|------|------|
| sort | `moves` `corrections` `finalOrder[]` `targetOrder[]` |
| match | `moves` `corrections` |
| group | `moves` `corrections` |
| fit | `attempts` `boardId` `optimal` `boardLengthPct` `gapPct` |

计数器**跨复位累计**：点 🔄 只清空摆放状态，不清零 `moves`/`corrections`/`attempts`，
否则孩子一复位就把挣扎痕迹抹掉了。

`process` 记录思维过程，比最终答案更有分析价值。第一版只记录不分析，为后续推荐和成长轨迹预留。

---

## 7. templates.json 新增字段

Interaction 模板相比 Puzzle 多两个字段：

```json
{
  "mode":    "sort",       // 体验类型（puzzle|sort|match|group|fit）
  "runtime": "sort"        // 分发键，ActivityRunner 用此字段路由
}
```

`type` 字段仍描述比较内容（length/size/…），与 Puzzle 保持一致。

---

## 8. 当前模板覆盖

| 级别 | sort | match | group | fit |
|------|------|-------|-------|-----|
| K1   | 1    | 2     | 1     | 2   |
| K2   | 0    | 1     | 1     | 1   |
| G1   | 0    | 0     | 0     | 1   |
| G2   | 0    | 0     | 0     | 0   |

每种 Runtime 在 K1 至少有 1 个模板。注意 G2 目前为 0——越往高年级越退化成纯选择题，是当前最大的内容缺口。

---

## 9. 结果页文案

活动完成后由 `game.js._showInteractionResult()` 统一渲染，文案按 `attempt.mode` 取：

| mode | 中文 | English |
|------|------|---------|
| sort | 排对了！ | Correct order! |
| match | 全部配对成功！ | All matched! |
| group | 全部分类正确！ | All sorted! |
| fit | 成功过河了！ | Across the river! |

新增 Runtime 必须同时在 `INTERACTION_RESULT_TEXT` 里登记，否则回落到通用「做对了！/ Well done!」。

---

## 10. 跨平台验证状态

| 平台 | Sort | Match | Group | Fit |
|------|------|-------|-------|-----|
| PC（Chrome） | ✅ | ✅ | ✅ | ✅ |
| iOS Safari | ✅ | ✅ | ✅ | ✅ |
| Android Chrome | ✅ | ✅ | ✅ | ✅ |

pointer-drag.js 的 PointerEvents 方案在三端均表现正常。

> 本地调试必须通过 HTTP 打开（Live Server / `python3 -m http.server`）。
> `file://` 下 `fetch('./templates.json')` 会被 CORS 拦掉，页面只剩背景色。

---

## 11. 已知限制和后续方向

| 项目 | 说明 |
|------|------|
| Interaction 暂无进度条 | 完成后直接调 onComplete，结果页由 game.js 统一渲染 |
| Interaction 恒计为答对 | 四个 Runtime 都不判负，Cycle 准确率实际只由 Puzzle 决定（见 §6） |
| 执行顺序非计划顺序 | 一组内 Interaction 先跑、Puzzle 后批量跑（见 §2.1） |
| G1/G2 Interaction 模板少 | K2/G1/G2 的 sort/match/group 尚未添加，G2 完全为空 |
| Mini-game 未实现 | Interaction Adapter 稳定后再扩展 Mini-game Runtime |
| 历史记录未区分 mode | shell.report() 的 geneIds 目前不含 mode 字段，可后续扩展 |

---

## 12. 复用步骤（新增 Runtime）

1. 创建 `xxx-runtime.js`，暴露 `XxxRuntime.run(template, variant, ctx)`
2. 在 `activity-runner.js` 添加 `case 'xxx': XxxRuntime.run(...)`
3. 在 `index.html` 加载新 runtime（在 `activity-runner.js` 之前）
4. 在 `generator.js` 添加对应生成器函数
5. 在 `templates.json` 添加模板（`"runtime":"xxx"`）
6. 在 `game.js` 的 `INTERACTION_RESULT_TEXT` 登记结果页文案
7. 在 `test.html` 的 `checkInteraction()` 添加该 mode 的结构校验分支，然后跑到 FAIL 0

> **interaction-ui.js 和 pointer-drag.js 无需修改**，它们是稳定共享层。

### 12.1 test.html 的 Interaction 校验

Interaction 生成器返回 `options: []`，**不能**走 Puzzle 的 answer-in-options 校验
（旧版会让全部 10 个 Interaction 模板报 FAIL）。`test.html` 按 `mode` 分流：

| mode | 结构校验内容 |
|------|--------------|
| sort | targetOrder 与 items 一一对应、严格升序、相邻长度差 ≥ `minGapPct` |
| match | 左右等长、每个尺寸恰好匹配一个右槽、correctMap 一对一 |
| group | 物品数 = bins × itemsPerBin、每个 bin 数量正确、bin 值合法 |
| fit | 恰好 1 块太短、correctBoardId 够长、且是最短的能过河的板 |

这套校验对应质量门禁的**可辨识性**与**无歧义**原则，见 `PATTERN-QUALITY-GATE.md` §8。
