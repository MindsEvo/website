# Comparison · Mini-game Mode — Implementation Reference

**版本** v1.1 · 2026-08-16
**前置文档** `docs/patterns/COMPARISON-PUZZLE-IMPLEMENTATION.md` ·
`docs/patterns/COMPARISON-INTERACTION-IMPLEMENTATION.md`

> 第三种 Activity Runtime。Puzzle 与 Interaction 的边界稳定之后新增，
> 复用同一个 Cycle Engine、同一个 Attempt 管道，不新增调度概念。

---

## 1. 三种活动类型的边界

| 类型 | 一次活动的含义 | 节奏 | Attempt 数量 |
|------|----------------|------|--------------|
| Puzzle | 一题一答（想 → 选） | 静态，无时限 | 1 题 1 个 |
| Interaction | 一次操作任务（想 → 操作） | 静态，无时限 | 1 个活动 1 个 |
| **Mini-game** | **短时间连续场景里多次观察、判断、行动** | **限时连续，多 round** | **整场 1 个** |

**关键约束：一个 Mini-game Template 仍然只算 Cycle 中的一个模板。**
12 个 round 不等于 12 个 Attempt——Runtime 在结束时统一生成**一个**汇总 Attempt。
第一版不上传每个 round 的明细事件。

---

## 2. 分层结构

```
Cycle Engine (engine.js)
  └── getSessionTemplates()
        └── game.js._launchInteraction()
              └── ActivityRunner.launch(template, variant, ctx)
                    │  runtime: 'puzzle'                  → PuzzleRuntime
                    │  runtime: 'sort'|'match'|'group'|'fit' → 四个 Interaction Runtime
                    └── runtime: 'mini'                   → MiniGameRuntime
                                                              └── Game Adapter（template.engine 选择）
                    ← ctx.onComplete(attempt)   统一 Attempt
              └── recordSessionAnswer() + recordAttempt()
```

两条工程原则，违反了框架就退化成"每个游戏一套代码"：

1. **MiniGameRuntime 不负责具体玩法，只负责生命周期。**
   语言切换、音量、语音、暂停、退出、计时、判定阈值、统计、Attempt 形状、
   交回 Cycle——全部只写一次。
2. **Mini-game 不直接操作 Cycle。**
   Runtime 只 `return`/回调一个 Attempt，由 `game.js` 交给 Cycle。
   Adapter 连 Runtime 的结束权都没有，只能 `ctx.requestFinish(reason)` 申请。

---

## 3. 新增文件

```
learning/math/comparison/
├── minigame-runtime.js         生命周期（694 行，与玩法无关）
├── minigame-quick-compare.js   Adapter 一：快速比较（214 行，纯玩法）
└── minigame-build-time.js      Adapter 二：限时搭塔（243 行，纯玩法）
```

`index.html` 的加载顺序必须是 **runtime 先、adapter 后、activity-runner 最后**——
Adapter 在文件末尾自注册：

```html
<script src="minigame-runtime.js"></script>
<!-- Mini-game adapters register themselves, so they must load after the runtime. -->
<script src="minigame-quick-compare.js"></script>
<script src="minigame-build-time.js"></script>
<script src="activity-runner.js"></script>
```

> 第二个 Adapter 落地时 **`minigame-runtime.js` 一行没改**——这是 §2 两条原则
> 是否真的成立的唯一硬证据。它复用了 Interaction 层的 `PointerDrag`
> （完全不同的交互方式），却依然没碰计时、暂停、结算、Attempt、Cycle。

---

## 4. 生命周期（minigame-runtime.js）

```
_buildUI()          全屏容器 + IH 头部 + 计时器 + HUD
   ↓
_showReady()        准备veil：规则一句话 + 「开始」按钮
   ↓  （必须点一下，时钟才开始——不能让孩子还没看清就在计时）
_startCountdown()   3 → 2 → 1
   ↓
_beginPlay()        mount(stageEl, ctx) → 第一个 round → requestAnimationFrame 循环
   ↓
_submit(input)      judge → showJudgement → 反馈闪一下 → 下一个 round
   ↓
_finish(reason)     unmount → 1.2s 结束闪屏 → _buildAttempt() → ctx.onComplete
```

**结束原因（`process.endReason`）**：

| endReason | 触发 |
|-----------|------|
| `roundTarget` | 打完计划的 round 数 |
| `timeout` | 倒计时归零（`process.timedOut = true`） |
| `poolEnd` | Adapter 的 `nextRound()` 返回 null |
| `adapter` | Adapter 调用 `requestFinish()` |
| `no_adapter` | `template.engine` 没有注册的 Adapter（`result:'aborted'`） |

**暂停**：🔸 按钮、`visibilitychange`（切标签/切后台）、`window.blur` 都会暂停。
恢复永远是显式点击，绝不自动恢复。暂停时长从 `responseMs` 中扣除
（`_elapsed()` 减 `pausedTotal` 和当前这次暂停）。

> **已修的坑**：暂停如果发生在"反馈闪屏"的那 400–800ms 内，
> 那个待执行的"下一个 round"回调会因为 `phase !== 'playing'` 直接丢弃，
> 整局卡死在旧 round 上。修法是 `pendingNext` 标记：暂停时记账，`_resume()` 里补发。
> 回归用例见 `/tmp/minigame-test.js`「pause mid-feedback still advances」。

**退出**：`mg-back` 什么都不记录——不生成 Attempt，模板留在 Cycle 里下次还会出。
`aborted` 只是本地遥测（`MiniGameRuntime._abortCount` + `console.debug`）。
IH 的 🔄 复位按钮**不接**（`IH.wire('mg', {})`）：限时局没有"复位"语义。

---

## 5. 参数与默认值（`_readParams`）

`variant` 优先于 `template.params`，全部带钳制，坏模板不会造出畸形局：

| 参数 | 默认 | 钳制 | 说明 |
|------|------|------|------|
| `durationSec` | 30 | 10–120 | 整局时长 |
| `roundTarget` | 12 | 3–40 | 计划 round 数 |
| `passThreshold` | 0.7 | 0.3–1 | 准确率通过线（K1 放宽到 0.6） |
| `minRounds` | — | `max(3, ceil(roundTarget*0.5))` | 最少 round 数，不足不能判 passed |
| `timerStyle` | `collect` | `collect` \| `countdown` | K1/K2 收集条，G1+ 倒计时 |
| `hudStyle` | 按 level | `stars`(K1/K2) \| `streak`(G1/G2) | 小班看星星，高年级看连对 |

`timerStyle` 分开是刻意的：**倒计时对 K1 是压力源**，同一段时间画成"收集进度条"
（越玩越满）而不是"剩余时间"（越玩越少），呈现的是收获而不是流失。

---

## 6. Adapter 契约

```javascript
MiniGameRuntime.register({
  id: 'quick_compare',            // 必须等于 template.engine
  mount(stageEl, ctx),            // ctx: {params, template, variant, lang,
                                  //       speak, submit, requestFinish, setMessage}
  nextRound(roundIndex),          // → round | null（null 结束整局）
  renderRound(round, roundIndex),
  judge(input, round),            // → {correct:boolean, errorType?:string}
  showJudgement(correct, round, input),  // 可选，玩法专属反馈
  applyLang(),                    // 可选，语言切换时重绘
  onTick(dtMs, elapsedMs),        // 可选，只有会动的游戏需要
  unmount()
});
```

Adapter **能做**：画面、round 数据、判定、玩法反馈。
Adapter **不能做**：计时、暂停、结算、写 Attempt、碰 Cycle、自己结束整局
（只能 `ctx.requestFinish(reason)` 申请）。

---

## 7. 已实现的 Adapter

### 7.1 Quick Compare（快速比较，`engine: 'quick_compare'`）

**玩法**：屏幕上出现左右两张卡，问"哪个更大/更多/更小/更少"，点一下即判定，
立刻换下一对。一个 round = 一次点击，孩子始终在 观察 → 判断 → 行动 的连续节奏里。

**支持维度**（`MINI_DIMENSIONS`，映射到已有 Puzzle 生成器）：

| dimension | 复用生成器 | 渲染 |
|-----------|-----------|------|
| `size` | 大小比较 | 两个 emoji，不同缩放 |
| `quantity` | 数量比较 | 点阵 |
| `number` | 数字比较 | 大字号数字 |
| `length` | 长度比较 | 同一横向标尺下的两条长条 |

**语音**：只在 `round.type + 极性` 变化时才念题干，否则每 1–2 秒念一次会把孩子逼疯。

**极性统一为一个布尔**：Puzzle 的生成器各自用 `askBigger`/`askMore`/`askLonger`/`askTaller`，
`miniRound` 统一收成 `q.askPositive`，Adapter 和校验都只看这一个字段。

**错误分类**：`askPositive` 为真时答错 → `perception`（看错了）；
为假时答错 → `polarity_confusion`（听成了反问）。两者的教学含义完全不同。

### 7.2 Build Under Time（限时搭塔，`engine: 'build_time'`）

**玩法**：底部是一堆宽度不同的积木，孩子每次**从剩下的积木里拿最大的那块**
（或最小的，取决于模板问法）叠到塔上。一次放置 = 一个 round，
所以每一步都是**在不断变小的集合里做比较**——Quick Compare 训练两两选择，
这个训练排序。塔搭满就换下一座塔，直到 round 数或时间用完。

**为什么是第二个 Adapter**：它和 Quick Compare 没有一行共用玩法代码，
交互方式（拖 / 点）、画面（塔 + 料堆）、round 结构（pile 而不是 pair）
全都不同，唯一共用的是 §4 的生命周期和 §9 的 Attempt。

**两条输入路径，都是一等公民**：

| 输入 | 实现 |
|------|------|
| 拖积木到塔上 | 复用 `PointerDrag.makeDraggable` + `registerDropZone(tower)` |
| 点一下积木 | `click` → 同一个 `ctx.submit(blockId)` |

点击**不是给弱设备的降级方案**：K1 孩子的手部精细动作不该决定一次比较
是否被判为"理解了"（`PATTERN-QUALITY-GATE.md` §9.3）。
反过来，**落在塔以外的地方不算作答**——`onEnd` 只在 `zoneId === 'tower'` 时
才 `submit`，半途放手的拖拽既不加分也不扣分（同 §9.2）。

**答错也把正确的那块放上去**：整局 round 是开局前预生成的（§8），
如果错一次就让塔和 pile 脱节，后面的 round 全部不可答。
所以 `showJudgement` 标出错选、点亮正解，然后**照样把正解放上塔**——
一次答错的教学收益来自"看见正确的那块被放上去"，不是来自扣分。

**塔本身就是反馈**：塔是用真实放上去的宽度画的，越往上越窄，
所以搭得对不对是一眼能看出来的**形状**，不需要打勾打叉。
一座塔剩最后一块时不算 round（一块不构成比较），直接作为奖励掉进塔里。

**语音**：一座塔里每个 round 的指令都一样，所以只在 **换塔或换极性**时才念，
不是每个 round 念一次。

**错误分类**：拿了**另一端的极值**（该拿最大却拿了最小）→ `polarity_confusion`；
拿了中间的块 → `perception`（比较本身错了）。

---

## 8. 出题：整局预生成

整局的 round **在开局前一次性生成**，不是边玩边生成。三个好处：
可离线校验（`test.html` 能逐 round 检查）、可复现、答案可以强制配平。

### 8.1 `Generators.miniRound(params)` — quick_compare

```javascript
{
  type: 'size',  engine: 'quick_compare',  mode: 'mini',
  dimension: 'size',  durationSec: 30,  roundTarget: 12,
  passThreshold: 0.6,  timerStyle: 'collect',
  rounds: [ { …单题字段…, answer:'left'|'right', askPositive:true, roundIndex:0 }, … ],
  options: [], answer: '',        // 不是选择题，留空
  titleZh/titleEn, hintZh/hintEn
}
```

**答案左右配平**：先造一个强制 50/50 的 `sides` 数组，逐题生成；
若某题的答案落在了不该落的那侧，用 `_mirrorRound()` 把所有 `left*`/`right*` 字段
对调并翻转 `answer`。**没有这一步，孩子会学会"连点同一边"而不是比较**——
这是限时游戏特有的作弊路径，Puzzle 不存在。

`test.html` 逐 round 断言 `|left − right| ≤ 1`，并**从数值重新推导**答案
（不信生成器自报的 `answer`），专门抓镜像 bug。

### 8.2 `Generators.miniBuild(params)` — build_time

```javascript
{
  type: 'size',  engine: 'build_time',  mode: 'mini',
  dimension: 'size',  durationSec: 45,  roundTarget: 12,
  passThreshold: 0.7,  timerStyle: 'collect',
  blocksPerTower: 4,   minGapPct: 16,   // 实际用上的间距，见下
  askPositive: true,
  rounds: [ {
    type:'size', towerIndex:0, step:0, blocksPerTower:4,
    pile:   [ {id:'T0B2', widthPct:50, color:'#3b82f6'}, … ],  // 已打乱
    placed: [],                                                 // 已放上塔的 id
    answer: 'T0B3',  askPositive:true, roundIndex:0
  }, … ],
  options: [], answer: '',
  titleZh/titleEn, hintZh/hintEn
}
```

一座 `perTower` 块的塔提供 `perTower − 1` 个 round（最后一块不算比较），
所以 `towerCount = ceil(roundTarget / (perTower − 1))`，
`roundTarget` 恰好整除时 round 数与模板申报值完全一致。

**宽度算法（踩过的坑）**：积木宽度限制在 24–96%（塔宽的百分比）。
`minGapPct` 必须能在这段跨度里放下 `perTower − 1` 次，
所以**塔越高，间距自动收窄**，而不是把最宽那块顶出屏幕——
"6 块 × 间距 16" 需要 80 个百分点，跨度只有 72，算术上不可能。
剩下的余量随机撒在起点和各个间距上（都向下取整，所以宽度都是整百分点，
间距只会变大不会变小），两座塔不会长得一样，最宽那块也永远不出界。
返回的 `minGapPct` 是**实际生效的间距**，校验器据此断言真实约束。

`test.html` 的 `checkMiniBuild()` **从宽度重新推导每个 round 的答案**，
并逐塔检查整条链：pile 每轮只少一块、少掉的正是上一轮的答案、
`placed` 每轮多一个、`step` 连续、开局是空地。
逐 round 单独看都合法但"塔悄悄重复用同一块积木"的 bug，只有链式检查能抓到。

---

## 9. 统一 Attempt

```javascript
{
  templateId, variantId,
  mode: 'mini',
  result: 'passed' | 'completed' | 'aborted',
  responseMs,                     // 整局净时长（已扣暂停）
  process: {
    engine, rounds, correctRounds, wrongRounds, accuracyPct, bestStreak,
    avgRoundMs, fastestRoundMs, slowestRoundMs,
    roundTarget, durationSec, passThreshold, minRounds, minRoundsMet,
    endReason, timedOut,
    score,                        // correct*10 + bestStreak*5，仅分析用
    topErrorType
  }
}
```

**判定**：`passed` 需要 `rounds >= minRounds` **且** `accuracy >= passThreshold`。

**低于阈值是 `completed` 而不是 `failed`**：模板照样计为已完成，
Cycle 永远不会因为一个难游戏卡住不推进。挣扎程度写在 `process` 里，
由后续的推荐逻辑读，不体现为"失败"。

`result` 枚举已在 Phase 0 扩宽为 `completed | passed | failed | aborted`；
`game.js` 里 `correct = (result === 'correct' || result === 'passed')`。

### 9.1 `responseMs` 的语义冲突（后端必须知道）

| mode | `responseMs` 含义 | 典型量级 |
|------|-------------------|----------|
| puzzle | 单题思考时长 | 2–15 秒 |
| sort/match/group/fit | 单个活动的完成时长 | 10–90 秒 |
| **mini** | **整局净时长（含 12–18 个 round）** | **30–40 秒** |

**后端聚合"平均反应时间"必须按 `game_mode` 分桶**，否则一个 Mini-game
会把一个孩子的平均思考时间抬高一个数量级。
Mini-game 的可比指标是 `process.avgRoundMs`，不是 `responseMs`。

---

## 10. 结果页

Runtime 只闪 1.2 秒（`END_FLASH_MS`），**可读的结算由 `game.js._miniStatsHtml()` 渲染**——
放在共享结果层，所有未来的 Mini-game 免费获得同一套结算。

显示：✅ 答对数/总数 · 🎯 准确率 · 🔥 最长连对 · ⚡ 平均用时。

**故意不显示分数。** 速度和准确率本身就是反馈；一旦露出分数，分数就变成目标。

---

## 11. 当前模板覆盖

| id | level | engine / dimension | 时长/round | 阈值 | timerStyle |
|----|-------|--------------------|-----------|------|------------|
| `cmp-k1-mini-quick-001` | K1 | quick_compare · size | 30s / 12 | 0.6 | collect |
| `cmp-k2-mini-build-001` | K2 | build_time · size（4 块/塔，间距 16） | 45s / 12 | 0.7 | collect |
| `cmp-g1-mini-quick-001` | G1 | quick_compare · quantity（问更少） | 40s / 16 | 0.7 | countdown |
| `cmp-g2-mini-quick-001` | G2 | quick_compare · number | 40s / 18 | 0.7 | countdown |
| `cmp-g2-mini-build-001` | G2 | build_time · length（6 块/塔，问更短） | 60s / 15 | 0.7 | countdown |

模板池共 73 个模板，K1–G2 四个层级都有 Mini-game。

**K1/K2 不允许 `countdown`**：`test.html` 已把这条写成门禁——
时钟走到零对这个年龄读起来就是"失败"，而这个年龄不该有失败
（`PATTERN-QUALITY-GATE.md` §9.1）。

**极性按模板固定，不用 `'random'`**：Adapter 只在极性变化时念题干，
而且"局中途换规则"考的是认知灵活性，是另一种能力，不该混进比较训练的第一版。

---

## 12. 验收状态

| 门禁 | 命令 | 结果 |
|------|------|------|
| 语法 | `node --check *.js` | 全通过 |
| 出题结构 | `test.html`（73 模板 × 20 次） | **FAIL 0**（OK 72–73 / WARN 0–1） |
| 生命周期端到端 | `/tmp/minigame-test.js` | **50 / 50** |
| 搭塔出题不变量 | `/tmp/minibuild-test.js` | **ALL PASS（56680 断言）** |
| Attempt 管道 | `/tmp/engine-test.js` | **16 / 16** |
| 手动一局 | 浏览器 | 待人工确认 |

> 偶发的那 1 个 WARN 是 LOW VAR，出现在 emoji/事件池本来就小的 Puzzle 模板上
> （`cmp-g2-time-001` 最常见），20 次抽样在 50% 线上下浮动所致，
> 先于 Mini-game 存在，与之无关。两个 build 模板从不报 LOW VAR。

端到端用例（假 DOM + 虚拟时钟，一局 60 秒游戏跑在微秒内）覆盖：

- **两个引擎共用的生命周期**：干净一局、低于阈值、超时（0 作答）、
  反馈中暂停、中途退出、每个模板各跑一局；
- **build_time 专属**：点击一局、拖拽一局（与点击等价）、
  每个 round 先往地板上丢一次再答对（**不计分**才能一路通过）、
  塔每轮长一块（含最后那块奖励）、极性错 vs 中间块错的分类、
  答错之后剩下的 round 仍然可答。

---

## 13. 已知限制与后续方向

| 项目 | 说明 |
|------|------|
| round 明细不上传 | 第一版只上传汇总 Attempt；`round_start`/`round_answer` 事件键已在 metathinking 预留 |
| 会话时长未设约束 | 一组 4 题里若排到 Mini-game，会话会明显变长。**先观察真实数据再决定**是否加"每会话最多 1 个长活动"的调度约束——过早加约束会把调度器复杂化 |
| `onTick` 尚无使用者 | 两个已实现的 Adapter 都是静态画面：Quick Compare 是卡片，Build Under Time 靠塔在长高。**会动的游戏（Moving Choice）才是第一个使用者**——在那之前 `onTick` 是没被验证过的契约 |
| 每个层级只有一种 engine | K1/G1 只有 quick_compare，K2 只有 build_time；同一层级两种玩法交替出现的体验还没验证过 |
| 历史记录不分 mode | 与 Interaction 同一个已知限制 |

**后续 Adapter 计划**：

1. **Moving Choice**（下一个）——目标移动中做选择，验证 `onTick`（目前唯一没有使用者的契约点）。
2. **Target Catch**——反应类，**K2+ 才开**（K1 的手部精细动作会污染比较能力的测量）。

> **Build Under Time 已落地**（见 §7.2），四个计划游戏里的第二个。
> 它证明了 §2 的分层：加一个交互方式完全不同的 Adapter，
> `minigame-runtime.js` 一行没改。

---

## 14. 复用步骤（新增 Mini-game）

1. 写 `minigame-xxx.js`，实现 §6 的契约，文件末尾 `MiniGameRuntime.register(...)`
2. `index.html` 在 runtime 之后、`activity-runner.js` 之前加载它
3. `generator.js` 加对应生成器（**整局 round 预生成**，答案配平）
4. `templates.json` 加模板：`"mode":"mini_game"`、`"runtime":"mini"`、`"engine":"xxx"`
5. `test.html` 的 `checkMini()` 里加该 engine 的 round 结构校验，跑到 FAIL 0
6. `metadata/metathinking/comparison.json` 登记新的 engine
7. 跑 `/tmp/minigame-test.js` 的等价用例（至少覆盖：超时、暂停、中途退出）

> **minigame-runtime.js 无需修改**——它和 `interaction-ui.js`、`pointer-drag.js`
> 一样是稳定共享层。如果新增游戏需要改 Runtime，先问清楚这是不是玩法逻辑漏进了生命周期层。
