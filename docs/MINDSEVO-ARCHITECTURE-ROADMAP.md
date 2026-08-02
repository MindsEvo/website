# MindsEvo 总体架构路线图（v1）

## 0. 当前进展快照（2026-08-02）

1. 阶段 1（统一 GUI Framework）：已在已迁移游戏中落地。
2. 阶段 3（RootGene Framework）：`registerRootGenes()` 已覆盖当前迁移范围。
3. 阶段 4（History Framework）：服务端接口已落地 `save/load/statistics/recommend`，并新增按游戏总览与日趋势聚合。
4. 阶段 5（AI Metadata）：`game/lesson/video` 三表扩展到 14 条完整覆盖并通过校验工具。

## 1. 平台定位

MindsEvo 的目标不是知识灌输，而是可持续的思维训练平台。

平台分层：

1. 产品层：Learning、Mind Seeds、Creative Workshop、Chess。
2. 共性能力层：Unified GUI Framework、Unified Game Framework。
3. 认知模型层：RootGene Framework。
4. 数据智能层：History / Analytics / Recommendation。
5. AI 生态层：AI Metadata 与可检索知识组织。

---

## 2. 产品线边界（先定边界，再扩展）

### 2.1 Learning（学习系列）

入口定位：以小学数学为载体训练思维，而非教授知识点。

当前六大核心模块：

1. Comparison（比较）
2. Number Sense（数感）
3. Pattern（规律）
4. Modeling（建模）
5. Logic（逻辑）
6. Strategy（策略）

建议命名：Six Core Cognitive Modules（六大核心认知模块）。

纵向进阶：幼儿园 -> 小学毕业，按抽象程度递进。

### 2.2 Mind Seeds（小精灵系列）

入口定位：高趣味、快反馈、可反复训练的游戏化思维练习。

与 Learning 的差异：

1. Learning 更强调体系化与递进课程。
2. Mind Seeds 更强调玩法吸引力、短时循环与兴趣维持。
3. 可以有思维能力重叠，但题面风格与交互目标要明确区分。

当前例子可保留为体系样本，但后续需增加“热门经典玩法的思维化改编”路径。

### 2.3 Creative Workshop（创意工作坊）

定位：开放创作与表达，内容题材不限。

工程重点：对齐统一 GUI 与跨端运行规范，减少每个作品重复处理语音、音乐、音效等基础能力。

### 2.4 Chess（棋类）

定位：独立产品线。

规则：可拥有专属 GUI 与交互框架，不强制与前三条产品线统一界面。

---

## 3. 五阶段实施路线（按优先级）

## 阶段 1：统一 GUI Framework（最高优先）

统一公共能力：

1. Header
2. Language（中英文）
3. Music
4. Sound
5. History 入口
6. Return
7. Theme
8. Help
9. Video 入口

完成标准（DoD）：

1. Learning 与 Mind Seeds 新游戏默认只接入统一 GUI，不重复写以上功能。
2. 旧游戏可平滑迁移，不破坏已上线记录。

## 阶段 2：统一 Game Framework

统一继承关系：

1. BaseGame
2. LearningGame
3. MindSeedGame
4. CreativeGame

完成标准（DoD）：

1. 游戏业务代码仅负责题目逻辑与渲染。
2. 公共生命周期（初始化、开始、暂停、结算、销毁）全部框架化。

## 阶段 3：RootGene Framework

每个游戏必须实现：

1. registerRootGenes()

完成标准（DoD）：

1. 每题或每回合至少可映射到一个 RootGene 标签。
2. RootGene 标签可用于后续统计与推荐。

## 阶段 4：History Framework

统一接口：

1. saveHistory()
2. loadHistory()
3. statistics()
4. recommend()

完成标准（DoD）：

1. 用户全量历史记录可按产品线和 RootGene 聚合。
2. 服务端可输出进展雷达图与基础评估。

## 阶段 5：AI Metadata 标准化

统一元数据：

1. game.json
2. lesson.json
3. video.json

完成标准（DoD）：

1. 每个游戏、课程、视频都有可机器读取的标准描述。
2. 为 AI 搜索、自动推荐、跨内容联动提供稳定输入。

---

## 4. RootGene 与统计分析总原则

1. 每个元思维单元必须有稳定 ID。
2. ID 可随实现逐步补齐，不要求一次性预定义完全。
3. 客户端记录练习行为，服务端负责汇总、归纳、评估与推荐。
4. 推荐系统是平台核心竞争力之一，应与题库增长同步建设。

---

## 5. 文档治理规则（防止再次混乱）

1. docs 目录为唯一权威规范源。
2. 根目录不再保留重复规范文档。
3. 任何规则变更先改 docs，并同步更新 docs 总入口索引。
4. 规则类文档必须标注版本和适用范围。

---

## 6. 近期执行建议（两周内）

1. 先完成 GUI Framework 的能力清单和最小 API 草案。
2. 选 2 个 Learning 游戏 + 1 个 Mind Seeds 游戏做统一 GUI 试点。
3. 同步定义 RootGene 最小字段集和映射约束。
4. 在服务端增加统计聚合接口草案，先跑通雷达图数据输出。

