# Memory Guardian / 记忆守护者 —— 架构 V1.0

- 范围：`sprites/memory-keeper/` 及其对应的 Memory Guardian 游戏与 metadata
- 状态：2026-10-24 建立；本文中的「现状」来自对 Flash Cards、Treasure Grid、入口页和 metadata 的代码核实
- 一句话：**不是训练“记住更多”，而是训练大脑如何获取、组织、保持、提取和运用信息。**

---

## 1. 定位

Memory Guardian 是小精灵系列（MindSeeds）的核心模块之一。

它不把记忆理解成单一的“容量”，也不以一次能背下多少对象作为唯一目标。它关注的是儿童能否逐步学会：

- 有目的地观察信息；
- 使用分类、位置、顺序、关系与模式进行编码；
- 在信息消失后维持它；
- 在需要时准确提取；
- 对已记住的信息进行重排、更新或转换；
- 把记忆用于完成行动、判断与解决问题。

基本原则：**记忆不是被动存放，而是主动组织和使用。**

与 Learning 的区别：

- Learning 是“思维 × 知识世界”，记忆服务于理解和运用知识；
- MindSeeds · Memory Guardian 是“思维 × 游戏环境”，直接把记忆过程本身变成可观察、可尝试、可调整的游戏行为。

## 2. 核心认知链

| 级 | 名称 | 含义 |
|---|---|---|
| A | Observation 观察 | 有目的地注意对象、位置、顺序、特征和关系 |
| B | Encoding 编码 | 用分类、分组、命名、位置、顺序或结构组织信息 |
| C | Retention 保持 | 在信息消失以及短暂延迟或干扰后继续维持它 |
| D | Retrieval 提取 | 通过再认、回忆、定位或重建取回信息 |
| E | Reorganization 重组 | 调换顺序、反向排列、更新局部信息或重新组合 |
| F | Application 应用 | 保持信息的同时执行规则、动作、判断或计划 |

每个游戏可以覆盖链上的一个或多个环节，但必须说明主要环节与辅助环节。不能因为一个游戏“有记忆成分”，就笼统声称它训练了完整记忆链。

## 3. 四层架构

Memory Guardian 使用四层结构：

**认知过程 × 信息维度/载体 × 任务机制 × 难度**

### 3.1 认知过程

指孩子正在执行的记忆动作，即第 2 节中的观察、编码、保持、提取、重组和应用。

### 3.2 信息维度与载体

- Visual Memory：图形、颜色、对象与视觉细节；
- Spatial Memory：位置、方向、路径与空间布局；
- Sequential Memory：先后顺序、动作序列与事件序列；
- Associative Memory：对象之间的配对、类别与关系联结；
- Contextual Memory：场景、事件和上下文中的信息；
- 可扩展载体：声音、语言、动作等，在有合适 runtime 和内容质量保证后再加入。

这些维度描述“记住的是什么”，不是彼此隔离的能力，也不要求前台为每个维度建立一个目录。

### 3.3 Working Memory 的地位

Working Memory 不与 Visual、Spatial、Sequential 等并列为单纯的信息载体。

本架构把它定义为一种处理机制：

> 在信息已经不可见时继续保持它，同时进行选择、更新、重排、规则应用或行动。

因此，Working Memory 可以作用于视觉、空间、顺序、联想或情境信息。只有任务同时包含“保持 + 加工”时，才应标记为 Working Memory；单纯延迟再认不算。

### 3.4 任务机制

任务机制是前台游戏真正让儿童做的事，例如：

- 再认看过的对象；
- 找出消失的对象；
- 定位隐藏位置；
- 重建顺序；
- 反向排列；
- 配对对象与关系；
- 在场景变化后判断发生了什么；
- 记住规则后执行动作；
- 保持线索并完成推理或侦探任务。

一个候选名称首先应被当作任务机制评估，而不是自动成为一个新的一级入口。

## 4. K1-G2 认知进阶

难度成长必须体现认知过程的变化，而不只是对象数量增加。

| 年级 | 主要进阶 | 典型任务 |
|---|---|---|
| K1 | 观察 → 基本编码 → 即时提取 | 少量对象、明显分组、立即再认或定位 |
| K2 | 编码 → 保持 → 提取 | 简单顺序或位置、短延迟、轻度干扰 |
| G1 | 保持 → 提取 → 重组 | 重建顺序、找变化、反向或结构辅助记忆 |
| G2 | 保持 → 重组 → 应用 | 记住信息后执行规则、更新内容或完成多步行动 |

年级不是固定题型清单。不同游戏可以使用不同载体，但同一等级的认知要求应大体一致。

## 5. 共享难度轴

Memory Guardian 的共享难度词汇包括：

- `information_load`：需要处理的信息量；
- `exposure_time`：信息可见时间；
- `retention_delay`：信息消失后到作答之间的延迟；
- `similarity`：目标与干扰项的相似程度；
- `interference`：保持期间是否出现无关或竞争信息；
- `processing_complexity`：是否需要反向、重排、更新、转换或应用规则；
- `organization_support`：信息是否具有可利用的分类、分组、位置或模式结构；
- `retrieval_demand`：再认、定位、自由回忆、重建或应用。

`organization_support` 是 Memory Guardian 的关键轴。

六个互不相关的对象可能比六个能明显分成“3 个红色、2 个蓝色、1 个黄色”的对象更难记。系统不应只记录对象数量，还应记录信息能否被压缩成结构，以及任务是否鼓励儿童发现并使用这种结构。

各游戏仍可保留专用轴，例如 `grid_size`，但应能映射回上述共享词汇。

## 6. 现有游戏映射与差距

### 6.1 Flash Cards / 闪现卡片

当前状态：

- K1-G2 已上线；
- 每次 8 题，由 generator 动态生成；
- 卡片消失后才显示选项，避免持续视觉匹配；
- 当前 RootGene：`RG.MEMORY.VISUAL.RECOGNITION`；
- 当前难度主要由卡片数量、展示时间和选项相似度决定。

架构映射：

- 主要认知过程：Observation → Retention → Retrieval；
- 主要载体：Visual；
- 主要任务：Recognition；
- 当前尚未明确训练 Encoding、Reorganization 或 Application。

后续扩展方向：

- 加入有结构与无结构的卡片组；
- 让儿童先主动分组或发现类别；
- 把 “Who’s Missing?” 作为同一家族中的回忆/变化任务评估，而不是立即建立独立一级入口；
- 记录提示、重试、结构利用和干扰类型。

### 6.2 Treasure Grid / 宝藏格

当前状态：

- K1-G2 已上线；
- 每次 8 题，由 generator 动态生成；
- 宝藏隐藏后才允许作答；
- 当前 RootGene：`RG.MEMORY.SPATIAL.BASIC`；
- 当前难度主要由网格大小、宝藏数量和等待时间决定。

架构映射：

- 主要认知过程：Observation → Retention → Retrieval；
- 主要载体：Spatial；
- 主要任务：Location Recall；
- 当前尚未覆盖路径重建、空间更新或记忆指导下的行动。

当前 G2 存在语义不一致：

- 题面展示两处宝藏；
- 文案说记住任意一处即可；
- generator 却固定选取其中一处作为唯一答案。

该问题必须在改造 Treasure Grid 时解决。可以选择“所有宝藏格都算正确”，或明确指定要记住哪一处，但不能继续让题意和判分标准不一致。

后续扩展方向：

- 路径或连续位置记忆；
- 某一步变化后的空间更新；
- 让儿童根据记忆执行移动；
- 将 “Find the Way Home” 先作为空间记忆机制评估，同时保持与 Strategy Master 路线规划的边界。

## 7. 候选机制与入口准入

初始候选机制：

1. Flash Cards
2. Who’s Missing?
3. Treasure Grid
4. Find the Way Home
5. Magic Sequence
6. Story Order
7. Remember & Act
8. Reverse It
9. Memory Pairs+
10. What Happened?
11. Memory Detective

这些名称不是已经批准的 11 个一级入口。增加新游戏前必须回答：

1. 它主要训练认知链中的哪个动作？
2. 它使用什么信息载体？
3. 它带来了新的记忆机制，还是现有机制的表现形式？
4. 它与 Pattern Hunter、Strategy Master 或 Learning 的边界是什么？
5. 它是否能形成 K1-G2 的真实认知进阶，而不只是增加数量和缩短时间？

初步归并建议：

- Who’s Missing? → 优先纳入 Flash Cards 家族；
- Find the Way Home → 优先评估为 Treasure Grid 的空间路径机制；
- Reverse It → 优先与 Remember & Act 放在同一 Working Memory 家族；
- Story Order → 先区分“记住刚才展示的实际顺序”与“按常识或因果排序”，后者不属于纯记忆任务。

## 8. 第一个新代表机制

现有两个游戏已经证明了基本视觉再认和空间位置保持。下一步最有价值的新机制是：

**Remember & Act / 记住再行动**

原因：

- 它第一次覆盖“保持 + 加工”；
- 能验证 Working Memory 在本架构中的定义；
- 能自然形成 K1-G2 进阶；
- 能区别于 Flash Cards 和 Treasure Grid 的单纯再认；
- 能为 Reverse It、规则更新和多步行动提供可复用机制。

推荐进阶：

- K1：记住一个对象或一个动作后执行；
- K2：记住两步简单指令并按顺序执行；
- G1：记住后反向、分类或按条件重排；
- G2：保持初始信息，同时应用规则或处理中途更新。

第二批候选依次为：

1. Magic Sequence；
2. Memory Pairs+；
3. What Happened? / 情境变化；
4. Memory Detective。

## 9. 与其他 MindSeeds 家族的边界

三个核心家族形成连续关系：

**Pattern → Memory → Strategy**

- Pattern Hunter：发现世界中的结构；
- Memory Guardian：保存、组织、提取和重组信息；
- Strategy Master：使用信息做出行动和调整。

边界判据：

- 信息始终可见，主要发现结构 → Pattern Hunter；
- 信息消失后仍需保持和提取 → Memory Guardian；
- 重点是在多个方案中权衡、规划和调整 → Strategy Master；
- 记住信息只是完成策略任务的附带要求时，不能把主能力标成 Memory；
- 同一个游戏可以报告多个 RootGene，但必须按实际行为上报，不能按菜单名称上报。

## 10. RootGene 原则

RootGene 描述能力，不描述目录、游戏名或题目位置。

当前两个基因可以继续保留：

- `RG.MEMORY.VISUAL.RECOGNITION`
- `RG.MEMORY.SPATIAL.BASIC`

后续不按候选游戏名称逐个创建 RootGene。只有当以下条件同时成立时才新增：

1. 存在清楚、稳定且可重复观察的能力；
2. 不能由已有基因准确表达；
3. 有至少一个实际任务能够上报；
4. 与相邻 Pattern、Strategy、Attention、Language 基因有明确边界。

`metadata/rootgene.json` 的 categories 必须登记 `MEMORY`，因为现有两个基因已经使用该 category。

## 11. 成长指标

Memory Guardian 记录成长轨迹，不生成“记忆力排名”或“智力分数”。

可观察指标包括：

- Accuracy；
- Response Time；
- Memory Span；
- Exposure Need；
- Delay Tolerance；
- Interference Resistance；
- Sequence Accuracy；
- Spatial Accuracy；
- Association Accuracy；
- Organization Support Used；
- Retrieval Demand；
- retries / hints / completion tier。

指标必须按任务机制、难度轴和年级解释。不能把不同 runtime 的原始数量直接相加，也不能把视觉再认与工作记忆压成一个无上下文的总分。

## 12. 实施路线

1. 建立本文档，统一中英文品牌为 Memory Guardian。
2. 在 `metadata/rootgene.json` 中补登记 `MEMORY` category。
3. 给 Flash Cards 和 Treasure Grid metadata 增加认知链、载体、任务机制与共享难度映射。
4. 修正 Treasure Grid G2 的题意与判分不一致。
5. 在不破坏现有可玩版本的前提下，为 Flash Cards 和 Treasure Grid 增加过程上报和结构化难度信息。
6. 以 Remember & Act 实现第一个“保持 + 加工”代表机制。（首版已实现）
7. 架构和代表机制稳定后，再决定其余候选是进入现有家族还是成为新的一级入口。
