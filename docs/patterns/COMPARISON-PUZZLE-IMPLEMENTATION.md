# Comparison · Puzzle Mode — Implementation Reference

**版本** v1.1 · 2026-08-12  
**模块** `learning/math/comparison/`  
**适用范围** Learning 系列所有 Puzzle 类型游戏的样板  
**配套文档** `COMPARISON-INTERACTION-IMPLEMENTATION.md`（拖放活动）

> v1.1 变更：`test.html` 校验按 mode 分流；新增 `skipTemplate()`；事件上报端点改为显式配置；Interaction 已落地，更新限制表。

---

## 1. 总体架构

```
learning/math/comparison/
├── index.html          入口页（加载脚本链）
├── templates.json      训练单元定义（机器可读，SEO 友好）
├── engine.js           客户端自适应引擎（Cycle 调度 + Mastery 分析）
├── generator.js        题目生成器（每种类型一个函数）
├── game.js             Shell 集成层（渲染器 + 年级选择器 + 结果页逻辑）
├── style.css           （保留，暂未使用）
├── data.js             （旧版，已停用，保留备查）
└── test.html           自动化验证页（每模板跑20次，检查多样性和结构完整性）

    Interaction 模式另有 6 个文件（pointer-drag / interaction-ui /
    sort|match|group|fit-runtime / activity-runner），见配套文档。
```

**脚本加载顺序**（index.html）：
```html
<script src="../../../shell.js"></script>
<script src="engine.js"></script>
<script src="generator.js"></script>
<script src="game.js"></script>
```

---

## 2. 分层模型

```
前台（孩子视角）          后台（系统视角）
────────────────         ──────────────────────────────────────
学科入口（比较）    →    type（size / length / number / …）
年级（K1/K2/G1/G2）→    templates.json · level 字段
每组题目            →    Cycle 调度器 · getSessionTemplates()
答对/答错反馈       →    Mastery 状态机（记录，不用于出题）
升级条件            →    Cycle 完成 + 准确率 ≥ 80%
```

---

## 3. templates.json 字段规范

每个模板最小字段：

```json
{
  "id":          "cmp-k1-size-001",
  "level":       "K1",
  "type":        "size",
  "mode":        "puzzle",
  "difficulty":  1,
  "generator":   "sizeCompare",
  "promptType":  "which_bigger",
  "rootGeneIds": ["RG.LOGIC.COMPARISON.BASIC", "RG.LEARNING.MATH.COMPARISON.SIZE"],
  "mastery":     { "requiredCorrect": 3, "window": 5 },
  "cooldown":    { "correct": 5, "familiar": 8, "mastered": 20, "wrong": 2 },
  "params":      { "set": "animals", "askMode": "bigger" }
}
```

**命名约定**：`{module}-{level}-{type}-{seq}`，如 `cmp-k1-size-001`

**level 取值**：`K1` `K2` `G1` `G2`（G3–G6 预留，标记 `free:false`）

**模板数量目标**（每级别至少 12 个，才能让 Cycle 调度有意义）：

| 级别 | 模板数 | 题型数 |
|------|--------|--------|
| K1   | 19     | 9      |
| K2   | 14     | 10     |
| G1   | 13     | 10     |
| G2   | 12     | 9      |

---

## 4. Cycle 调度引擎（engine.js）

### 4.1 核心设计决策

> 不使用 Mastery/Cooldown 来决定出题顺序。  
> 改用 **Cycle 制**：每轮遍历该级别全部模板，遍历完才开始下一轮。

理由：Mastery 调度容易因准确率偏高而让孩子反复做同类题，忽略薄弱类型；Cycle 保证覆盖全面。

### 4.2 类型均衡乱序（_typeBalancedShuffle）

每轮生成 `plan`（模板 ID 数组）时：
1. 按 `type` 分组，组内随机打乱
2. 轮转取值（round-robin），确保每4题内类型尽量不重复

### 4.3 Session 参数

```javascript
SESSION_QUESTIONS = 4   // 每组题目数（设计成4的倍数利于末组整除）
```

### 4.4 断点续传

`sessionActive: true` 时，`sessionAnswered` 记录已答模板。  
下次调用 `getSessionTemplates()` 自动返回本组剩余题目。

```javascript
// localStorage key: me:cmp:cycle:{level}
{
  plan:            ['id1','id2',...],   // 本轮完整计划
  doneInCycle:     ['id1','id2'],       // 本轮已完成
  sessionPlan:     ['id3','id4','id5','id6'],  // 当前组计划
  sessionAnswered: {'id3': {correct:true}},     // 当前组已答
  sessionActive:   true,               // 是否有未完成的组
  cycleCorrect:    5,
  cycleAttempts:   6,
  completedCycles: [{accuracy:0.84,...}],
  unlocked:        false
}
```

### 4.5 升级条件

```
完成一整轮（doneInCycle.length === plan.length）
AND 本轮准确率 ≥ 80%
→ state.unlocked = true
→ 结果页显示「升级到 K2 →」按钮
```

若准确率 < 80%，提示再来一轮，不强制。

### 4.6 Mastery 状态机（analytics 层）

保留，用于将来历史分析和雷达图，**不参与出题决策**。

状态转移：`NEW → LEARNING → FAMILIAR → MASTERED → REVIEW`

旧的加权抽题函数 `selectSessionTemplates()` 已标记 `@deprecated`，调用时会打 console.warn。
它连同 `_scoreTemplate` / `_tickCooldowns` / `_coverageBonus` 一起保留在 engine.js 里，
只服务于分析层，**不要**再用它出题。

---

## 5. generator.js 题型一览

| generator 函数      | 对应类型            | 出现级别      | 选项数 |
|---------------------|---------------------|--------------|--------|
| `sizeCompare`       | size                | K1 K2 G1 G2  | 2      |
| `lengthCompare`     | length              | K1 K2 G1 G2  | 2      |
| `heightCompare`     | height              | K1 K2 G1 G2  | 2      |
| `quantityVisual`    | quantity            | K1 K2 G1 G2  | 2      |
| `numberCompare`     | number              | K2 G1 G2     | 2      |
| `sameDifferent`     | shape / color       | K1 K2 G1     | **3**  |
| `nearFar`           | position            | K1 K2 G1     | 2      |
| `fullEmpty`         | fullness            | K1 K2 G1     | 2      |
| `weightCompare`     | weight              | K2 G1 G2     | 2      |
| `speedCompare`      | speed               | K2 G1 G2     | 2      |
| `timeOrder`         | time                | G1 G2        | 2      |
| `multiAttribute`    | multi_attribute     | G1 G2        | 2      |

**K1 设计原则**：几乎无数字，全视觉/直觉比较。  
**sameDifferent** 是唯一3选1题型（options: ['A','B','C']）。

Interaction 模式另有 4 个生成器，返回的是活动布局而不是选择题（`options` 为空数组）：

| generator 函数 | mode | 出现级别 | 产出 |
|----------------|------|----------|------|
| `sortLength4`  | sort  | K1       | items + targetOrder |
| `matchSize3`   | match | K1 K2    | leftItems + rightSlots + correctMap |
| `groupSize`    | group | K1 K2    | items(含 bin) + bins |
| `fitBridge`    | fit   | K1 K2 G1 | scene + boards + correctBoardId |

每个 generator 函数接收 `template.params` 返回标准化 question 对象，必须包含：
- `type` `hintZh` `hintEn`
- Puzzle 额外需要 `options` `answer`（answer 必须在 options 内）
- Interaction 额外需要各自的结构字段（见上表）

---

## 6. game.js Shell 集成

### 6.1 关键接口调用

```javascript
// 出题（含断点续传）
CmpEngine.getSessionTemplates(levelId, templates)

// 每题作答后（两个都要调用）
CmpEngine.recordSessionAnswer(tpl.level, tpl.id, correct)   // Cycle 统计
CmpEngine.recordAttempt(...)                                  // Mastery 分析

// 生成器产不出题时（模板定义有 bug）
CmpEngine.skipTemplate(levelId, tpl.id)   // 移出本轮，不计对错

// 结果页出现时
CmpEngine.completeSession(levelId)   // 返回 { cycleComplete, accuracyPct, unlocked, ... }
```

> `skipTemplate()` 是必须的：`getSessionTemplates()` 只会返回"尚未作答"的模板，
> 一个永远生成不出题目的模板若不移出，会被无限次重新取出，整个级别卡死。

### 6.2 Shell 回调名

```javascript
shell.createGame({
  onAnswer: function(selected, q, correct) { ... }   // 注意：是 onAnswer，不是 onAnswered
})
```

### 6.3 结果页按钮逻辑

```
轮次进行中：  [再试一次]  [下一组 →]  [返回主页]
轮次完成+解锁：[再试一次]  [升级到K2 →]  [返回主页]
轮次完成+未达标：[再试一次]  [返回主页]  + 提示"准确率XX%，建议再来一轮"
```

「再试一次」已重写为重新调用 `getSessionTemplates`（产生新题），而非 shell 默认的重播同组。

### 6.4 年级选择页进度显示

选级页每个卡片通过 `CmpEngine.getCycleStatus(levelId)` 显示：
- 未开始：只显示"免费"标签
- 进行中：`进度 8/19`（蓝色）
- 已解锁：`✓ 已解锁`（绿色）

---

## 7. 音频

| 功能    | 实现              | 控制              |
|---------|-------------------|-------------------|
| TTS朗读 | Web Speech API    | 🔊 按钮（shell）  |
| 背景音乐| Web Audio API生成 | 🎵 按钮（shell）  |
| 音量    | shell.getVolume() | 音量滑条（shell） |

背景音乐共4首，随机选播：C大调五声、G大调五声、F大调五声、D大调五声，无需外部音频文件。

---

## 8. 验证工具

`test.html`（**必须通过本地 HTTP 服务打开**，它要 fetch templates.json；`file://` 下会被 CORS 拦掉）：

- 每模板跑 20 次
- 按 `mode` 分流校验：
  - **puzzle**：字段完整性、answer 在 options 内、答案分布均衡（20%–80%）
  - **interaction**（sort/match/group/fit）：结构合法性，见 Interaction 文档 §12.1
- 通用检查：变体多样性 ≥ 50%

**通过标准：`FAIL 0`。**

`WARN`（LOW VAR / SKEWED）来自 20 次抽样的统计波动，同一份代码复跑会漂移
（例如 `cmp-g2-time-001` 因 dailyEvents 池小而常报 LOW VAR）。
出现 WARN 时先复跑两次确认是否稳定，稳定复现才需要扩池或调参，不要把它当硬门禁。

---

## 9. 已知限制和后续方向

| 限制 | 说明 |
|------|------|
| G3–G6 未实现 | 卡片已显示"即将推出"，templates 和 generators 需补充 |
| 答题音效缺失 | TTS 工作，对错提示音（ding/buzz）尚未添加 |
| 服务器事件上传需显式开启 | 默认不上报；宿主页需调 `CmpEngine.setEventsEndpoint('http://localhost:8787/api/events')`。未配置时事件只在 localStorage 排队（上限 200 条） |
| 跨设备同步 | 本地 localStorage 存储，无账号体系时无法同步 |
| Interaction 不影响准确率 | 拖放活动恒记为答对，Cycle 准确率实际只由 Puzzle 决定 |
| Mini-game 已实现 | 第三种 Runtime，见 `COMPARISON-MINIGAME-IMPLEMENTATION.md`；仍只算 Cycle 中一个模板 |

---

## 10. 复用此模式的步骤

新 Learning 模块（如 Science · Comparison）：

1. 复制 `comparison/` 目录
2. 替换 `templates.json`（新学科的模板定义）
3. 替换 `generator.js` 内的生成函数（或新增函数）
4. 修改 `game.js` 的渲染器和 GRADE_LEVELS（如适用）
5. `engine.js` **无需修改**（Cycle 引擎完全通用）
6. 运行 `test.html` 验证新生成器

> **engine.js 是跨学科共享层**，templates.json + generator.js 是每个模块的定制层。
