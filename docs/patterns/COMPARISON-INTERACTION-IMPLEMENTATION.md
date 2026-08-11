# Comparison · Interaction Mode — Implementation Reference

**版本** v1.0 · 2026-08-11  
**前置文档** `docs/patterns/COMPARISON-PUZZLE-IMPLEMENTATION.md`

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

Puzzle 和 Interaction **共享同一个 Cycle Engine**，对调度器完全透明。孩子感知不到模式切换。

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

**交互**：拖木板到河面 → 即时反馈（不够长 / 刚好过桥）

```
生成器：fitBridge
参数：margin(6-12)（正确板比河宽多出几%）
三块木板：太短 / 刚好 / 明显过长
正确标准：拖中 correctBoardId 的板
错误反馈：板消失 + "太短了" TTS，允许继续尝试其它板
全部试完后自动重置（给孩子第二轮机会）
```

**复位**：`usedBoards` 清空，桥隐藏，消息清空。

---

## 6. 统一 Attempt 数据结构

所有 Runtime 返回同一格式：

```javascript
{
  templateId:  'cmp-k1-sort-length-001',
  variantId:   'cmp-k1-sort-length-001-vXXXXX',
  mode:        'sort' | 'match' | 'group' | 'fit',
  result:      'correct' | 'incorrect',
  responseMs:  number,
  process: {
    moves:       number,        // 总拖动次数
    corrections: number,        // 放错后重移次数（sort/match）
    attempts:    number,        // 尝试次数（fit）
    finalOrder:  string[],      // sort 最终顺序
    targetOrder: string[]       // sort 正确顺序
  }
}
```

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

每种 Runtime 在 K1 至少有 1 个模板，Cycle Engine 会自然混合到 Puzzle 会话中。

---

## 9. 跨平台验证状态

| 平台 | Sort | Match | Group | Fit |
|------|------|-------|-------|-----|
| PC（Chrome） | ✅ | ✅ | ✅ | ✅ |
| iOS Safari | ✅ | ✅ | ✅ | ✅ |
| Android Chrome | ✅ | ✅ | ✅ | ✅ |

pointer-drag.js 的 PointerEvents 方案在三端均表现正常。

---

## 10. 已知限制和后续方向

| 项目 | 说明 |
|------|------|
| Interaction 暂无进度条 | Sort/Match/Group 完成后直接调 onComplete，结果页由 game.js 统一渲染 |
| Fit 无"正确但太长"提示 | 目前只区分"够长（正确）"/"太短（错误）"，过长板也算正确 |
| G1/G2 Interaction 模板少 | K2/G1/G2 的 sort/match/group 尚未添加，后续按需补充 |
| Mini-game 未实现 | Interaction Adapter 稳定后再扩展 Mini-game Runtime |
| 历史记录未区分 mode | shell.report() 的 geneIds 目前不含 mode 字段，可后续扩展 |

---

## 11. 复用步骤（新增 Runtime）

1. 创建 `xxx-runtime.js`，暴露 `XxxRuntime.run(template, variant, ctx)`
2. 在 `activity-runner.js` 添加 `case 'xxx': XxxRuntime.run(...)`
3. 在 `index.html` 加载新 runtime（在 `activity-runner.js` 之前）
4. 在 `generator.js` 添加对应生成器函数
5. 在 `templates.json` 添加模板（`"runtime":"xxx"`）
6. 在 `test.html` 验证生成器多样性

> **interaction-ui.js 和 pointer-drag.js 无需修改**，它们是稳定共享层。
