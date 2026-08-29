# RootGene Framework 标准

## 版本

- v0.2.0 (2026-08-24) — 双轴雷达定稿：基因只表示能力，位置移入 `moduleId`/`unitId`；新增 `gradeCode` 深度轴与匿名 `profileId`
- draft v0.1.0 (2026-08-02) — 初稿
- 适用范围：Learning、MindSeeds、Studio（Creative Workshop / Clio）
- 棋类（chess / chess-series）暂不接入，后续单独讨论

## 1. 目标

平台的核心资产是**用户的思维雷达图**：用户端自动上报「练了哪种思维」和「练到什么深度」，
本地实时显示覆盖与进步，服务器汇总后做统计与推荐。

RootGene 就是这张雷达图的坐标系。

## 2. 雷达是二维的

| 轴 | 字段 | 含义 | 谁决定 |
|----|------|------|--------|
| 轴 1：覆盖 | `geneIds` | **哪一种**思维能力 | 游戏的 `registerRootGenes()` |
| 轴 2：深度 | `gradeCode` | 练到**什么层级**（K1…G6） | 模块的 `getReportContext()` |

两轴缺一不可：只有轴 1 只能说明「练过比较」，加上轴 2 才能说明「在 G2 的层级上练过比较」。
这也是元思维本身就分级（K1/K2–G1…G6）的直接结果。

**位置不是轴。** 「在哪个模块的哪个单元练的」是内容坐标，不是能力，
它随 `moduleId` / `unitId` 上报，不进基因 ID（见 §5）。

## 3. 接口约定

### 3.1 `registerRootGenes(ctx) => string[]`

返回本次结算涉及的**能力基因**，去重字符串数组。

`ctx` 结构：

1. `shell`: `shell-1`（统一入口）
2. `gameId`: 当前游戏 ID
3. `unit`: 当前单元对象
4. `state`: `{ score, total, hints, passed, elapsedMs }`

> ⚠️ `ctx.state` 是 Puzzle 批次结算的形状。Interaction / Mini-game 的过程数据
> （拖拽轨迹、每回合响应）无法用这五个字段表达，它们走 `CmpEngine.recordAttempt()`
> 的 `meta` 通道，见 `docs/patterns/COMPARISON-INTERACTION-IMPLEMENTATION.md`。
> 因此 `registerRootGenes` 不应依赖 `ctx.state` 做判断，只按单元静态声明返回基因。

### 3.2 `getReportContext(ctx) => object`

返回本次结算的内容坐标与深度坐标：

```javascript
getReportContext: function (ctx) {
  return {
    moduleId:       'comparison',        // 内容位置：模块
    moduleType:     'metathinking',
    levelId:        'G2',               // 模块自己的级别名（可以是 L1/L2，也可以直接是 G2）
    gradeCode:      'G2',               // 轴 2：必须是 §4 的规范词表
    comparisonType: 'quantity',
    difficultyAxis: { /* 见 §6 */ },
    sourceGameId:   'learning-math-comparison'
  };
}
```

## 4. 轴 2 规范词表：`gradeCode`

唯一合法取值（`shell.grade.CODES`）：

```
K1  K2  G1  G2  G3  G4  G5  G6
```

Shell 提供：

```javascript
shell.grade.CODES              // ['K1','K2','G1',…,'G6']
shell.grade.isValid(code)      // boolean
shell.grade.index(code)        // 0..7，用于排序 / 画深度轴
shell.grade.normalize(value)   // 规范化，认不出就返回 null（不猜）
```

### 4.1 为什么不做 `L1..L8 → K1..G6` 的全局别名

因为**「L2」在不同模块不代表同一个年龄段**。number-sense 的 L2 是 G1 下学期，
comparison 的 L2 是 K2，spatial-pattern 的 L2 只是路线规划的第二档难度、跟年级无关。
一旦全局猜映射，错的年级会**静默污染**聚合数据，而且没人会发现。

所以规则是：

1. `gradeCode` 是唯一规范词表；
2. **每个模块自己声明** `levelId → gradeCode` 的映射（写在 `getReportContext()` 里，
   并与 `metadata/metathinking/<module>.json` 的 `levelMap` 一致）；
3. `shell.grade.normalize()` 认不出就返回 `null`，绝不猜。

### 4.2 「故意不分级」和「忘了写」必须可区分

有些活动确实没有年级位置：Creative Workshop 的作品是创作者自己拧的难度旋钮，
spatial-pattern 的 L1–L3 是难度档而非年级。这些应当**显式声明** `gradeCode: null`。

`shell.report()` 的判定：

| 情况 | 行为 |
|------|------|
| `gradeCode` 合法 | 正常入库，落在深度轴上 |
| 显式 `gradeCode: null`（key 存在） | 静默通过——模块已决定不分级 |
| 有 `levelId` 但完全没提 `gradeCode` | `console.warn`：本次只计入覆盖轴，没有深度位置 |

实现上靠 `hasOwnProperty('gradeCode')` 区分，所以已知的 backlog 项不会天天报警，
而真正漏写的新模块一定会被发现。

## 5. 命名规范：基因只表示能力

### 5.1 合法（能力式）

```
RG.LOGIC.COMPARISON.BASIC
RG.PATTERN.SEQUENCE.BASIC
RG.PATTERN.SPATIAL.RELATION
RG.STRATEGY.DECISION.PLANNING
RG.MODELING.EQUATION.RELATION
RG.MATH.NUMBER_SENSE.BASIC
```

### 5.2 非法（位置式）

```
RG.LEARNING.MATH.COMPARISON.SIZE     ✗ 这是「在哪」，不是「什么能力」
RG.MINDSEEDS.NUMBER_PATTERN.U3       ✗ 每个单元变成一根独立雷达轴
RG.MINDSEEDS.SPATIAL_PATTERN.<unit>  ✗ 同上
```

**为什么禁止**：把位置写进基因，会让同一种能力在不同单元 / 不同系列里落到不同的轴上，
雷达图轴数随内容量线性膨胀，而「同一能力在别处也练过」这件事永远无法汇聚——
而这恰恰是四大系列共用一套基因的全部价值。

`RG.LOGIC.COMPARISON.BASIC` 现在同时出现在 Learning 的 comparison、
MindSeeds 的 difference-scout、Studio 的 studio-comparison-lab 里。
基因与模块是 **M:N**，这是特性，不是重复。

位置信息的正确去处：`moduleId` + `unitId` + `sourceGameId`（都在 report 里）。

## 6. `difficultyAxis`（能力画像的第三层细节）

不是雷达的第三根轴，而是给同一 (gene, grade) 格子加上质地描述，供推荐用。
取值**必须**来自 `metadata/metathinking/comparison.json → difficultyAxes`：

| 维度 | 合法取值 |
|------|----------|
| `object_complexity` | concrete / symbolic / abstract |
| `dimension_complexity` | single / dual / multi |
| `relation_complexity` | direct / indirect / chain / constrained |
| `language_complexity` | action / question / compound / explain |
| `transfer_complexity` | within-domain / cross-domain / strategy / evidence |

> ⚠️ 目前**没有任何 JS 读取** `difficultyAxes` / `levelMap`，所以词表漂移是静默的。
> 写新模块时必须人工对照 metadata。校验器见 `docs/HANDOFF-NEXT-STEPS.md` 待办项。

## 7. 写入时机与匿名身份

1. 单元结算时 Shell 自动调用 `registerRootGenes(ctx)` 与 `getReportContext(ctx)`；
2. 结果进 `shell.report()`，写入 `me:{gameId}:history:{ts}`，并进 `sys:syncPending` 队列；
3. Shell 自动补两个字段：
   - `gradeCode`：规范化后的深度轴
   - `profileId`：来自 `shell.user.profileId()`

### 7.1 匿名 profile

`shell.user.profileId()` 读 / 建 `sys:profile = { id:'p1', createdAt, label:null }`，
首次读取时创建，**永不轮换**——雷达进步曲线的连续性依赖它稳定。

它**不是** `user:profile.id`：后者驱动 `shell.user.isLoggedIn()`，
把匿名 id 写进去会让整个应用误以为用户已登录。

服务器端目前**没有任何用户身份字段**，`profileId` 先在本地积累，等服务器 schema 补齐后再对接。

## 8. 接入状态

| 系列 | 游戏 / 模块 | 能力基因 | 轴 2 |
|------|-------------|----------|------|
| Learning | comparison | `RG.LOGIC.COMPARISON.BASIC` | ✅ K1/K2/G1/G2 已声明 |
| Learning | number-sense | `RG.MATH.NUMBER_SENSE.BASIC` | ✅ L1→G1, L2→G1, L3→G2 |
| Learning | logic | `RG.LOGIC.REASONING.BASIC` | — 无 `getReportContext` |
| Learning | modeling | `RG.MODELING.EQUATION.RELATION` | — |
| Learning | pattern | `RG.PATTERN.SEQUENCE.BASIC` | — |
| Learning | strategy | `RG.STRATEGY.DECISION.PLANNING` | — |
| MindSeeds | spatial-pattern-hunter | `RG.PATTERN.SPATIAL.RELATION` + `RG.STRATEGY.DECISION.PLANNING` | ⚪ 显式 `null`（难度档非年级） |
| MindSeeds | difference-scout | `RG.LOGIC.COMPARISON.BASIC` | — |
| MindSeeds | number / color / visual / motion / temporal / size / quantity / logic / mixed -pattern-hunter | 各自单一能力基因 | — |
| Studio | studio-comparison-lab | `RG.LOGIC.COMPARISON.BASIC` + `RG.STRATEGY.DECISION.PLANNING` | ⚪ 显式 `null`（创作者旋钮） |
| Studio | Clio 7 个 workshop | 未注册 | — 见 handoff |
| Chess | — | 不接入 | — |

「—」表示该游戏没有 `getReportContext()`，只上报 `levelId: null`，
所以不会触发 §4.2 的警告；补齐深度轴是逐模块推进的工作。

18 个已注册游戏的基因与 `metadata/game.json` 的 `rootGeneIds` **逐条一致**（2026-08-24 校验）。

## 9. 回退策略

1. 游戏未实现 `registerRootGenes`，回退到单元 / 模板的静态 `rootGeneIds` 字段；
2. 两者都没有，`geneIds` 为空数组；
3. 游戏抛异常不得中断主流程（Shell 捕获并降级）。

## 10. 验收检查

1. 结算后 `me:{gameId}:history:*` 含 `geneIds`、`gradeCode`、`profileId`；
2. `geneIds` 是去重字符串数组，**且每一项都是能力式命名**（§5）；
3. `gradeCode` ∈ `shell.grade.CODES` 或显式 `null`；
4. 控制台无 §4.2 警告；
5. 游戏内基因与 `metadata/game.json` 一致；
6. `difficultyAxis` 每个维度的取值都在 §6 词表内。
