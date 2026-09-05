# 学习系列 · 规律模块架构规范

## 版本

- v1.0.0 (2026-09-04) —— 三维模型定稿；`metadata/metathinking/pattern.json` 同步升到 v0.2.0
- 适用范围：`learning/math/pattern/`（学习系列规律单元）。
  小精灵系列的 9 个规律猎人不受本规范约束，边界见 §2。

## 0. 一句话

规律不是「找数列规律」。它是**在重复、变化、位置与关系中发现稳定结构，
并用这个结构预测、补全、纠错、迁移与创造**的元思维操作。

> 比较训练孩子看见「不同与相同」，规律训练孩子从这些变化中发现「什么保持不变」。

这两者是自然的前后关系，所以 `pattern.json` 把 `comparison` 列为前置模块。

---

## 1. 三维模型

一道规律题由三个**相互独立**的维度确定：

| 维度 | 问题 | 取值来源 |
|------|------|----------|
| **规律结构 Structure** | 规律本身怎样形成 | `pattern.json → typeTree`（7 类） |
| **表现载体 Carrier** | 用什么东西呈现 | `pattern.json → carriers`（15 种） |
| **思维任务 Task** | 要孩子做什么 | `pattern.json → taskTypes`（6 种） |

题量来自维度组合，不来自逐题手写。同一个 AB 结构换载体、换任务，
就是完全不同的体验——这是本模块能用几十个母模板覆盖 K1–G2 的原因。

### 1.1 七类结构

| id | 中文 | 结构基因 | 说明 |
|----|------|----------|------|
| `repetition` | 重复规律 | `RG.PATTERN.SEQUENCE.BASIC` | AB / AAB / ABB / ABC / AABB / AABC；两个属性同时循环 |
| `growth` | 增长与缩减规律 | `RG.PATTERN.SEQUENCE.BASIC` | 1 个→2 个→3 个；小→中→大；每步多一条边 |
| `alternating` | 交替与双规则 | `RG.PATTERN.SEQUENCE.BASIC` | 上下上下；+2/−1 交错；奇偶位各自成规律 |
| `spatial` | 空间规律 | `RG.PATTERN.SPATIAL.RELATION` | 位置条带上的左右、上中下、平移、缺失格 |
| `transformation` | 变换规律 | `RG.PATTERN.TRANSFORMATION.RULE` | 每步加一个点、去一个部件、组合与拆分 |
| `relational` | 关系规律 | `RG.MODELING.EQUATION.RELATION` | 每只动物对一种食物；输入→输出 |
| `numerical` | 数量与数据规律 | `RG.PATTERN.SEQUENCE.BASIC` + `RG.PATTERN.QUANTITY.RELATION` | 递增递减、跳数、倍增、数表与日历 |

**`growth` 与 `numerical` 的分界**：变化落在载体的可数量上（几个、多大、多长）算
`growth`；变化落在**数值本身**算 `numerical`。

**v0.2.0 的三处改名**（旧 id 会在校验器里 FAIL，不要再用）：

| 旧 | 新 | 理由 |
|----|----|------|
| `progression` | `numerical` | 与合并进来的数表统一叫「变化落在数值上」 |
| `structure` | 并入 `numerical` | 数表结构和数值递进是同一件事，拆两类没有教学意义；而且 `structure` 现在是整个维度的名字，同名冲突 |
| `rule_induction` | **移出 typeTree** | 「说出规则并迁移」是**任务**不是结构，现在是 `discover` / `match` 两个 task |

最后一条是这次重构的核心：旧 `typeTree` 把 Task 混进了 Structure，
所以「规律归纳」既像一类题又像一种要求，谁都说不清它该配什么载体。

### 1.2 六种任务

思维进阶路线：**看见规律 → 预测规律 → 补全规律 → 检查规律 → 迁移规律 → 创造规律**

| id | 中文 | Runtime | 判定方式 |
|----|------|---------|----------|
| `discover` | 发现 | `puzzle` | `signature-exists`：几组里哪一组真有规律 |
| `continue` | 继续 | `puzzle` | `equals-next` |
| `complete` | 补全 | `puzzle` | `equals-gap`（空缺在中间或开头） |
| `repair` | 纠错 | `puzzle` | `index-and-value`：先找出哪一项错，再改对 |
| `match` | 匹配 | `match` | `signature-equality`：红蓝红蓝 ≡ 圆方圆方，都是 ABAB |
| `create` | 创造 | `sort` | `constraint-satisfaction`：约束式创造，可自动判定 |

**六种任务落在现有 runtime 上，一个新引擎接口都不需要**：四种是 puzzle，
`match` 用 `match-runtime.js`，`create` 用 `sort-runtime.js` 加一层约束验证。
这是这套设计成本可控的最强证据。

`create` 必须是**约束式**创造而不是完全开放：给定约束（「用 3 种颜色做一个 ABC 循环，
至少两个周期」），产出物的结构签名等于约束签名才算对。开放式创造无法自动判定，
也就无法进雷达。

### 1.3 载体

`pattern.json → carriers` 共 15 种，每种声明三件事：`objectComplexity`
（复用 `object_complexity` 轴的 concrete / symbolic / abstract，
所以**选载体就是在选难度**）、`status`、以及 `carrierGeneId`。

现在 `active` 的只有 4 种：`color` `shape` `size` `count` `numeral`。
用户特别要求的三类目前少见内容——**动作 `action`、时间 `temporal`、声音 `audio`**——
基因位早就存在（`RG.PATTERN.MOTION.SEQUENCE` / `RG.PATTERN.TEMPORAL.SEQUENCE`），
只等 renderer。

> **`audio` 是 reserved，不是 planned**：schema 里留位，但没有 renderer。
> 声音载体上线前，任何模板不得声明 `carrier=audio`。

---

## 2. 与小精灵系列的边界（硬约束）

学习系列按**规则处理的深度**分工，小精灵系列按**线索**分工，恒为 `forward` 且限时。
同一个根基因两边都会训练，这是 M:N，不是重复建设。

三条视觉与题型边界，**违反即 FAIL**：

1. **3×3 图形阵列是小精灵 Spatial Pattern 的专属视觉锚点。**
   学习系列的 `spatial` 只用 **1×N / 2×N 位置条带**与数表类载体。
   见 `pattern.json → seriesBoundary.gridAnchorZh`、`SPATIAL-PATTERN-MODULE.md` §4.4。
   这个独占不是洁癖：它是让孩子一眼分清「我在小精灵还是在学习」的唯一手段。
2. **单符号朝向旋转（↑→↓←）归小精灵 Visual Pattern。**
3. **方向 + 步长的连续移动归小精灵 Motion Pattern。**
   学习系列的 `transformation` 只做**可数的部件与属性变化**。

结论：学习系列照样能做空间与变换题，差异化并不来自那 9 个格子长什么样——
**来自 Task 维度（纠错、匹配、创造）和二维行列同时成立**。

---

## 3. 白名单矩阵：三维独立，但不是叉乘

7 结构 × 6 任务 = 42 格，其中若干格无意义或退化。所以：

- **允许的格**列在 `pattern.json → taskMatrix`，每格带 `levelFloor` / `runtime` / `status`；
- **排除的格**列在 `taskMatrixExclusions`，**每格必须写中英文理由**；
- 两者合起来必须**正好覆盖每一格一次**——不许有格子既允许又排除，也不许有格子没表态。

当前：**允许 38 · 排除 4 · 合计 42/42**。校验器 S7 守这条不变式。

### 4 个排除格及理由

| 格 | 理由 |
|----|------|
| `numerical × match` | 两条数列的同构匹配退化成「两组都是 +2」，与 `discover` 说出规则是同一件事。同构匹配要训练的是「外观不同、结构相同」，请用非数字载体 |
| `relational × continue` | 关系规律不是序列，没有「下一个」。想推进只能再给一组输入，那本质上是 `complete` |
| `relational × create` | 让孩子自己造一条对应关系，需要一套关系语法才能自动判定，超出约束式创造的表达能力。第二波再评估 |
| `transformation × create` | 孩子要能定义「每次怎么变」才算创造变换，那需要一个变换编辑器，成本高于其余全部相加。第三波再评估 |

`levelFloor` 是真正的内容：它挡住「K1 模板声明 match」这类越级。
校验器还会检查 `levelMap` 每一行强调的 `primaryTasks`，
在它自己的 `primaryTypes` 上按矩阵**确实做得出来**（floor ≤ 该行 gradeCode）。

---

## 4. 难度轴：六根

| 轴 | 取值 | 由什么决定 |
|----|------|-----------|
| `object_complexity` | concrete / symbolic / abstract | **载体**维度 |
| `rule_complexity` | single / two_step / alternating / compound | **结构**维度 |
| `inference_direction` | forward / interior / backward | 空缺**在哪** |
| `task_complexity` | discover / continue / complete / repair / match / create | **任务**维度：要孩子**做什么** |
| `language_complexity` | action / question / compound / explain | 题面语言 |
| `transfer_complexity` | within-domain / cross-domain / strategy / evidence | 换不换载体 |

**v0.2.0 把 `repair` 从 `inference_direction` 移到了 `task_complexity`。**
「有一项被改错」是要做的事，不是空缺的位置。两根轴因此正交：
前者说空缺在哪，后者说要做什么。代码里 `task` 由 `direction` 推出
（`TASK_OF`），永不独立赋值，所以一条记录里这两根轴不可能互相矛盾。

`object_complexity` / `language_complexity` / `transfer_complexity` 与 comparison
同名同取值，雷达可以跨模块对比。

---

## 5. 基因上报规则

> 每次 Attempt 上报**结构基因 + 规则真正变化的那个属性的载体基因**。
> `rule_complexity = compound` 时额外加报 `RG.PATTERN.INTEGRATION.MULTI_DIMENSION`。

**载体基因只在规律本身在这个属性上变化时才报。**
图形是彩色的、但规律落在数量上 → 只报数量基因，不报颜色基因。
没有这条约束，每道题都会声称训练了颜色。

为什么两个都报：登记表里那 9 个 PATTERN 基因是按**线索**划分的，
本模块 7 类是按**结构**划分的，两种切法不同。同时上报，才能既如实说出
「练的是哪种结构」又如实说出「练在哪条线索上」，
也让 `seriesBoundary` 里那句 M:N 从声明变成可核对的事实。

本模块做完七类后会训练到 **11 个基因**（`pattern.json → rootGeneIds`）。
其中只有 `RG.PATTERN.TRANSFORMATION.RULE` 是这次新铸的——
另外 10 个登记表里早就有，当初为小精灵建的，正好覆盖七类结构与主要载体。

> `pattern.json → rootGeneIds` 是**课程范围**（做完会训练到什么），
> **不是**任何单个游戏当前上报的集合。后者写在 `metadata/game.json` 各 game 条目里，
> 由校验器 S1 与代码对撞。今天 `learning-math-pattern` 上报 2 个。

---

## 6. 引擎与复用

分四期，**不要一次全做**：

| 期 | 引擎 | 覆盖 | 状态 |
|----|------|------|------|
| 1 | **Sequence Engine** | `repetition` `growth` `alternating` `numerical` = 4/7 结构，K1–G1 绝大部分 | 待做 |
| 2 | Grid Engine | `spatial` + 数表 | 第二波 |
| 3 | Transformation Engine | `transformation`（SVG，最贵） | 第三波 |
| — | **Pattern Validator** | 全部任务 | 与第 1 期同行 |

### 6.1 结构签名：整套设计的技术支点

Validator 不是一个大函数，核心只是一个**结构签名归一化**：

```
红蓝红蓝  → "ABAB"
圆方圆方  → "ABAB"
```

约 30 行，一次解决四件事：

- `match` 变成字符串比较；
- `create` 变成「产出物签名 == 约束签名」，因而**可自动判定**；
- `repair` 变成「哪个下标破坏了签名」；
- 它本身就是「外观不同、结构相同」这个抽象能力的机器表示。

### 6.2 不要新写 engine.js

`learning/math/comparison/engine.js` 已经是掌握度 + 冷却 + Cycle 调度器
（`getSessionTemplates` / `recordSessionAnswer` / `completeSession` / `getCycleStatus`），
除了 `_storageKey` 的 `'cmp:'` 前缀之外**通篇与模块无关**。
规律单元**复用**它，不 fork。前缀参数化是阶段 3 已排的活
（默认 `cmp`，好让线上 `me:cmp:*` 状态不失效）。

`sort` / `match` / `group` / `fit` 四个 runtime 同理复用。

---

## 7. 一次出题量：8

`pattern.json → sessionPolicy`：

```json
{ "maxItemsPerSession": 8, "passRatio": 0.75 }
```

题库可以更大，一次只抽 8 道，通过线 `ceil(8 × 0.75) = 6`。
理由是低龄注意力与快速测试，**不是**内容不够。

代码侧对应 `game.js` 的 `var SESSION_SIZE = 8;`，
校验器 S7 把两边对撞——改一边不改另一边会 FAIL。

抽题**不打乱题序**（题库按由易到难写），而是随机丢掉多余的那几道：
一个 10 题单元因此每次出不同的 8 道，同时仍然由易到难。
`test.html` 验证过 200 轮内 60 道题全部会被抽到，没有死题。

---

## 8. v1 实施范围：28 个母模板，只上 Sequence Engine

| 等级 | 数量 | 重点 |
|------|------|------|
| K1 | 8 | AB / AAB / ABB × 颜色·形状·大小；`discover` + `continue` + `complete` |
| K2 | 8 | ABC / AABB / AABC、增长缩减、`repair`、约束式 `create` |
| G1 | 6 | 双属性复合、同构 `match`、数量递进（**现有 60 题折进来**） |
| G2 | 6 | 两步交替、关系型输入—输出、数表行列 |

参照物：comparison 做到 K1–G2 是 **73 个母模板**（`generator.js` 44KB +
`templates.json` 35KB + `game.js` 59KB）。规律七类做全的体量与整个比较单元相当，
所以第一版收在 28 个、只上一个引擎，先把 K1–K2 的空白填上——那是现在最大的缺口。

**瓶颈是规格单，不是代码。** 每个母模板要一份
`PATTERN-QUALITY-GATE.md` §2 / 附录 A 的题型规格单（9 个必填字段），
「未完成规格单，不得进入开发」。

### 现有 60 题怎么迁移

不丢，也不留成平行路径：变成 6 个 `numerical` 母模板
（`count_up` / `skip_count` / `fives_tens` / `count_down` / `doubling` / `story`）+ 参数。
`data.js` 的 60 道题改成生成器参数，`test.html` 的 S3「答案重新推导」
改成对着**生成器输出**跑而不是对着静态表跑。
这样重构过程中那道审计闸门一直活着，不会出现「重构完了没人知道有没有坏」的窗口。

---

## 9. 实施次序

| 步 | 内容 | 产出 | 状态 |
|----|------|------|------|
| 1 | `pattern.json` v0.2.0 + 本文档 + 校验器 S7 | 纯元数据与文档，不动运行时 | ✅ 本次 |
| 2 | v1 那 28 个母模板的**规格单** | QUALITY-GATE §2 / 附录 A | 待做 |
| 3 | comparison 的 `engine.js` + 4 个 runtime 抽到共享目录，存储前缀参数化 | 规律复用而非 fork | 待做（阶段 3 已排） |
| 4 | `sequence-engine.js` + 签名验证器 + `generator.js` + `templates.json`；迁移 60 题 | v1 上线 | 待做 |
| 5 | 载体扩展（`action` / `temporal`），然后 Grid / Transformation 第二三波 | — | 待做 |

第 1–3 步期间**现有规律单元原样在线**，没有回归风险。

---

## 10. 校验器守住的不变式（S7）

`metadata/validate.html` 的 S7 共 17 项，都是 FAIL 级：

1. 矩阵每格的 `structure` / `task` 都已声明；
2. 允许 + 排除**正好覆盖每格一次**（不重不漏）；
3. 每个排除格都有中英文理由；
4. `levelFloor` 是合法 `gradeCode`；
5. 矩阵 `runtime` 与 `taskTypes` 声明一致；
6. 没有「一个任务都不允许」的结构，也没有「任何结构都不允许」的任务；
7. 已上线的格，其结构在 `typeTree` 里也是已上线；
8. 结构 / 载体引用的基因都在模块 `rootGeneIds` 之内；
9. `levelMap` 每行的 `primaryTasks` 在它的 `primaryTypes` 上按矩阵做得出来；
10. 七类结构在 `levelMap` 里都有归属等级；
11. 代码 `SESSION_SIZE` == `sessionPolicy.maxItemsPerSession`；
12. 代码 `TASK_OF` 的键在 `inference_direction` 词表里、值在 `taskTypes` 里；
13. 代码 `STRUCTURE_GENES` 的键是已声明结构、值在模块基因范围内。

基线：**OK 75 · INFO 16 · WARN 0 · FAIL 0**（validator v1.2.0）。
加字段或改矩阵后必须重跑，这个页面需要 HTTP 打开。

`learning/math/pattern/test.html` 基线：**PASS 34 · WARN 2 · FAIL 0**，
两条 WARN 是设计意图（unit 6 情境复用前面骨架；原始题库答案格位偏斜，由洗牌解决），
不需要 fetch，`file://` 可直接开。
