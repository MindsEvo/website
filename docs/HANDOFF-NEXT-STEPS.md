# 交接说明：思维雷达架构落地状态与下一步

- 版本：v1.4 (2026-09-02)
- 适用：接手 comparison 单元之后工作的人 / 模型（本轮为 Opus → Sonnet 交接）
- 前置阅读顺序：`docs/rootgene/ROOTGENE-FRAMEWORK.md` → 本文 → `docs/patterns/COMPARISON-*.md`

> v1.4 变更：**阶段 2 完成**（P3 + P4）。新增校验页 `metadata/validate.html` +
> `metadata/validate.js`，把 metadata 词表与代码取值对撞一次（当前
> **OK 49 · INFO 13 · WARN 0 · FAIL 0**）；`metadata/game.json` → v0.2.0，
> 25 条、每条带 `path`、Clio 7 个 workshop 已注册；`metadata/rootgene.json` → v0.2.0，
> 17 个基因 / 7 个分类；`comparison.json` → v0.5.1，修掉两处 typeTree 状态谎报。见 §1.7。
> v1.3 变更：**P2 完成**（`radar-reader.js` + `profile/` 雷达页上线，
> 首页三处「思维图谱」占位改成真链接），陷阱 §3.6 的 history 无上限已修
> （`HISTORY_MAX = 600` + `_pruneHistory()`），新增名称登记表
> `metadata/rootgene.json`（P3 校验器应当拿它对撞）。见 §1.6。
> v1.2 变更：**P1 完成**（三种 runtime 都上了深度轴），P2 的采集端完成、只剩 reader；
> `shell.js` → v1.6.0。见 §1.5。
> v1.1 变更：阶段 0 已落地（见 §1.4），P6 的第一刀已切，`shell.js` → v1.5.0。

---

## 0. 一句话现状

**架构骨架已经完成并且一致**：基因只表能力、深度轴用 `gradeCode`、匿名 `profileId` 已盖章，
18 个已注册游戏 + 73 个模板 + 模块 metadata 三处口径统一。
**读端也闭环了**：`profile/` 已经能把本机全部 history 画成 rootGene × grade 的雷达图（§1.6）。

**剩下的都是「模块内的活」和「服务器端的活」**，不再需要改架构——这正是当初预期的低成本阶段。

---

## 1. 已落地的改动

§1.1–1.3 是雷达架构那一轮（共 20 个文件，commit `751f85d`）；
§1.4 是紧接着的阶段 0（响应式布局收口）；§1.5 是阶段 1 的 1.1–1.2；
§1.6 是阶段 1 的 1.3–1.4（读端 + 雷达页，P2 到此关掉）。

### 1.1 `shell.js` → v1.4.0（架构核心）

| 新增 | 说明 |
|------|------|
| `shell.grade` | `CODES / isValid / index / normalize`，`K1,K2,G1..G6` 唯一词表；`normalize()` 认不出返回 `null`，不猜 |
| `shell.user.profileId()` | 读 / 建 `sys:profile`，永不轮换 |
| `report()` 自动盖章 | 每条记录补 `gradeCode` + `profileId` |
| 声明式 gradeCode 检查 | 用 `hasOwnProperty` 区分「显式 null」与「漏写」，只对后者 `console.warn` |

⚠️ **不要**把匿名 id 写进 `user:profile.id`——`shell.user.isLoggedIn()` 读的是它，
会让全站误判为已登录。

### 1.2 `learning/math/comparison/`（参考实现）

- `game.js` 新增 `buildRadarContext()` / `difficultyAxisFor()` / `COMPARISON_TYPE_OF`，
  **Puzzle 批次结算和 Interaction / Mini-game 的 Attempt 两条路径共用同一个函数**，
  这一步关掉了「两种 runtime 自我描述不一致」的口子；
- 修掉真 bug：原来发的是 `level:`，而 `shell.js` 读 `levelId`，
  旗舰单元一直在上报 `levelId: null`；
- `engine.js` 的 1.1 事件补 `profile_id` 与 `grade_code / module_id / module_type /
  comparison_type / difficulty_axis`（来自 `meta.radar`）；
- `templates.json` 73 个模板的 `rootGeneIds` 一律收敛为 `["RG.LOGIC.COMPARISON.BASIC"]`。

### 1.3 其他

- `metadata/metathinking/comparison.json` → v0.5.0，补齐 levelMap L5–L8 = G3–G6；
- `number-sense/game.js` 修真 bug：原来 `moduleId:'comparison'`，它的数据一直汇进 comparison
  （对照 `metadata/game.json` 确认是 bug 不是设计）；同时修掉词表外的
  `relation_complexity:'direct+indirect'`；
- `spatial-pattern-hunter` / `studio-comparison-lab`：显式 `gradeCode: null` + 理由注释；
- 14 个 `game.js`：`registerRootGenes` 去掉位置式第三个基因，逐个对照
  `metadata/game.json` 校验一致。

---

### 1.4 阶段 0（2026-08-29，`shell.js` → v1.5.0）
响应式布局收口的第一刀。完整契约见 `docs/shell/UNIFIED-GUI-FRAMEWORK.md` §8。

| 改动 | 文件 | 说明 |
|------|------|------|
| `.board` 改容器驱动 | `studio/Clio/games/word-connections-workshop/style.css` | `repeat(auto-fit, minmax(min(320px,100%),1fr))` 取代 `@media(max-width:860px)` 里的 `grid-template-columns:1fr`；栏数不再由设备宽度决定 |
| 删掉 `.link-canvas{display:none}` | 同上 | 连线是这个游戏的核心反馈，任何布局下都必须在；端点是相对 `.board` 量的，竖排也画得对 |
| 新增 `s1-duo` / `s1-multi` | `shell-1.css` | 共享两栏 / 多栏原语，游戏只调 `--s1-duo-min` 决定塌栏点 |
| 新增 `shell.diag` | `shell.js` | `?diag=1` 出诊断浮层：CSS 尺寸 / dpr / 物理像素 / **当前命中的所有标准断点** / UA |

已用 headless Chrome 在 1280 / 900 / 700 / 420 四个宽度实测：
1280 与 900 两栏、700 与 420 一栏、**四个宽度下 canvas 都是 `display:block`**。
`?diag=1` 才出浮层，无 `?diag` 时不出，`window.onerror` 为空。

⚠️ `?diag=1` 与 `?debug=1` 是两个独立开关。`debug` 解锁单元、多数游戏默认开；
`diag` 只管浮层、默认关。**不要把两者合并**——否则每个玩家都会看到诊断浮层。

⚠️ `.s1-duo` 假设**恰好两个 in-flow 子元素**。绝对定位的子元素（如 svg 画布）
不占 track，是安全的；但再加第三个 in-flow 子元素会变成三栏。

**用户已确认的现场情况**（写在这里，避免下一位重复排查）：
learning 比较单元在 **PC / iOS / 安卓平板 / 手机上显示都正常**，新的公共 GUI 正常；
**手上没有大屏安卓平板**，所以 word-connections 那台设备的复现只能等以后。
因此本轮只做机制修正与可诊断性，不追加设备特定的 hack。

---

### 1.5 阶段 1 的 1.1–1.2（2026-08-30，`shell.js` → v1.6.0）

**做完的事**：Interaction 与 Mini-game 的 session 现在**也在雷达的深度轴上**，
同时历史面板的原有五个数字**含义一个字都没变**。P1 关掉，P2 只剩 reader。

| 改动 | 文件 | 说明 |
|------|------|------|
| `activityRuntime` 升为记录顶层字段 | `shell.js` `report()` | `payload.activityRuntime` 或 `payload.context.activityRuntime`，都没有则 `null`。**读端不必再翻 `context`** 就知道该怎么解释 `score/total` |
| `geneIds` 统一去重 | `shell.js` | 抽出 `normalizeGeneIds()`，`resolveRootGenes()` 与 `report()` 共用。comparison 的 `registerRootGenes()` 会把同一个基因列两次，直连 `report()` 后那就是真的雷达双计 |
| **修真 bug：同毫秒记录互相覆盖** | `shell.js` `report()` | 原 key 是 `{gameId}:history:{ts}`。一局 Mini-game 结束同时结算 cycle session 时两条记录同毫秒，**后写的静默擦掉前一条**。现在冲突时加 `-1`/`-2`… 后缀（上限 50），`record.ts` 仍是纯时间戳，读端只匹配前缀所以零影响 |
| `_calcHist()` 按 runtime 分桶 | `shell.js` | 返回 `{sessions,correct,wrong,hints,totalMs, inter:{…}, mini:{…}}`；puzzle 桶里**原封不动**保留 `if (r.total)` 老守卫 |
| `_histRuntime(r)` 的默认值是 `'puzzle'` | `shell.js` | 老记录和从不声明 runtime 的游戏按定义就是 question-shaped，**所以别的游戏面板一点不变** |
| 面板加第二行（条件出现） | `shell.js` `_renderHist()` | 只有 `inter.sessions || mini.sessions` 才渲染；「还没有历史记录」现在要求三个桶全空 |
| `.s1-hstats` 改容器驱动 | `shell-1.css` | 一行 5 格、两行共 10 格，固定 `repeat(5,1fr)` 会空格或溢出；删掉 820px 断点里的 `repeat(3,1fr)` |
| `_reportInteraction()` | `learning/math/comparison/game.js` | 在 `_launchInteraction` 的 `onComplete` 里紧跟 `recordAttempt()` 调用，payload 用 `buildRadarContext()` |

**已实测**（headless Chrome + 真页面）：

- 四条混合 runtime 记录全部落盘（同毫秒不再覆盖）；
- 第一行 = 2 局 / 12 对 / 3 错 / 2 提示 / 1分30秒——**只含两条 question-shaped 记录**；
- 第二行 = 互动 1 / 小游戏 1 局 / 24 回合 / 75% / 57 秒；
- 真实驱动一次 sort：`interaction mode=sort grade=K1 score=1/1 genes=["RG.LOGIC.COMPARISON.BASIC"] profile=yes`；
- 真实驱动一次 mini：`mini score=19/24`（**24 = 回合数**，19 = `correctRounds`），无 gradeCode 警告；
- `.s1-hstats` 在 1100px 出 5 栏、420px 出 4 栏后换行；
- `index.html?debug=1` 无 console 报错；`test.html` 仍是 **OK 73 · WARN 0 · FAIL 0**。

⚠️ **Mini-game 的 `total` 是回合数，不是题数。** 两行统计**不许相加**：
把回合并进「总答对 / 总答错」会悄悄改掉家长正在读的正确率。
新 runtime 接入时必须自己填非零 `total`——`_calcHist()` 的 puzzle 桶仍会跳过没有
`total` 的记录（`_reportInteraction()` 里用 `rounds || 1` 兜底）。

⚠️ 目前 Interaction 的 `hintsUsed` 恒为 0：模板带提示文案，但**没有任何代码统计使用次数**。
这是事实而不是占位，等真加了提示按钮再改。

---

### 1.6 阶段 1 的 1.3–1.4（2026-08-30，读端 + 雷达页）

**做完的事**：用户说过「非常重要」的那张 profile 进步雷达图上线了，
**跨全部四个系列**读本机 history，横轴 rootGene、纵轴 gradeCode，并给出下一步建议。
纯静态、无库、不联网、不上传。

| 新增 / 改动 | 文件 | 说明 |
|------|------|------|
| **读端** | `radar-reader.js`（新，root） | 扫全部 `me:{gameId}:history:{ts}`（**跨游戏**），按 `geneIds × gradeCode` 聚合。无 shell 依赖、无 fetch、无 DOM：接受一个 Storage-like 对象（默认 `localStorage`）或直接接受一个记录数组（`opts.records`），所以 `file://` 能跑、测试能直接喂数据 |
| **名称登记表** | `metadata/rootgene.json`（新） | 14 个在用基因的 `{category, zh, en, short:{zh,en}, desc*}`，5 个分类带颜色。**表外的 id 不是错误**——reader 会从 id 推导标签（`RG.LOGIC.COMPARISON.BASIC` → `Logic · Comparison · Basic`），所以新基因上报当天就能上图，不必等谁补元数据 |
| **雷达页** | `profile/index.html` + `profile/profile.js` + `profile/style.css`（新） | 纯 SVG（≈40 行三角函数），实心多边形 = `coverage`（练到的最深等级），虚线多边形 = `mastery`（≥70% 且 ≥2 次）。基因 < 3 个时画 8 格条带（两点多边形是一条线）。**等级表始终画**，因为雷达把纵轴压成了一个数 |
| **history 保留策略** | `shell.js` `report()` | `HISTORY_MAX = 600` + `_pruneHistory(gameId)`，**按游戏**各留一个窗口，删最老的。修掉陷阱 §3.6 |
| 首页三处占位改真链接 | `index.html` | `#main-nav`、`#mobile-menu`、footer 快速链接的「思维图谱（即将推出）」→ `profile/index.html` |

**三条口径（reader 里写死并在页脚公开说明）**：

1. **不许跨 runtime 相加 `total`**。puzzle/interaction 的 `total` 是题数/项数，
   mini 的是**回合数**。可比的是每条记录的 `score / total` **比值**（无量纲），
   所以所有正确率都是**「每条记录一票的比值平均」**；原始 `score/total`
   仍然保留但**分 runtime 各存一份**（`byRuntime[rt].rawAccuracy`），
   页脚打印时每个数字都带自己的单位，并明说不可相加。
2. **基因 ↔ 模块是 M:N**，一条记录写了两个基因就在**两边各计一次**，
   所以各基因 session 数之和 **不等于** 记录条数。这不是重复计数。
3. **不发明数据**。没有 `gradeCode` 的记录进 `noGrade`，绝不猜到某个等级上；
   丢掉的每一条都进 `skipped`（`unreadable / notARecord / noTotal / noGene /
   otherProfile`），页面因此能说「读了 9/10 条」而不是悄悄少报。

**下一步建议（`frontierCode`）的定义**，改过一次，别改回去：
取**已经练过但还不稳的最浅等级**；如果练过的每一级都稳了，才往外挪一格到
`reachedIndex + 1`；G6 已稳则为 `null`（该基因读作已通关）。
**绝不推荐比已练过的更浅的等级**——初版用「reached↔mastered 之间的第一格」，
结果一个 G2 拿 100% 的孩子被推回从没碰过的 K1。

**已实测**（headless Chrome + 临时 seed 页，测完已删）：
6 个基因 / 9 of 10 条记录 / 73% 均值 / 最深 G3 / −12% 趋势（4 次 → 5 次，79% → 68%）；
6×8 等级表色阶与 tooltip 正确；未登记基因 `RG.LANGUAGE.WORD.ASSOCIATION` 按 id 显示；
`gradeCode:null` 与 `total:0` 两条分别走 noGrade 与 skipped；
中英双语（`shell:langchange` 重渲染）与空态（🧭 + 四个系列入口）都正确；
360 / 480 宽都不塌；`test.html` 仍是 **OK 73 · WARN 0 · FAIL 0**。

---

### 1.7 阶段 2（2026-09-02，P3 + P4：词表校验器 + Clio 注册）

**做完的事**：metadata 的三张词表第一次有了读它们的东西——一个校验页。
外加把 Clio 7 个 workshop 注册进目录，Creative Workshop 系列从此在雷达的
「计划中」里有位置。

| 新增 / 改动 | 文件 | 说明 |
|------|------|------|
| **校验页** | `metadata/validate.html` + `metadata/validate.js`（新） | 6 组 suite，跟 `test.html` 同风格（深色等宽）。纯静态，**需 HTTP 打开**（`file://` 下 fetch 被拦，页面会明确报出来而不是空白） |
| **目录扩表** | `metadata/game.json` → v0.2.0 | 18 → 25 条：Clio 7 个 workshop 全部注册，`status: "planned"`；**每条新增 `path`**（仓库内目录，含末尾斜杠），校验器靠它定位 `index.html` 与 `game.js` |
| **登记表扩表** | `metadata/rootgene.json` → v0.2.0 | 14 → 17 个基因，5 → 7 个分类（新增 `ATTENTION` / `LANGUAGE`）。新基因带 `status: "planned"` + `claimedBy` |
| **修掉状态谎报** | `metadata/metathinking/comparison.json` → v0.5.1 | `typeTree.temporal` `planned` → `implemented`（题库里其实有 5 道），`logic_strategy` `planned` → `partial`（3 道，多属性已上线、链式未上线，写进 `coverageGap*`） |

**6 组 suite 各查什么**：

| Suite | 对撞的两边 |
|------|------|
| S1 | `rootgene.json` 登记表 ↔ 代码里出现的 `RG.*` id ↔ `game.json` 声明的 `rootGeneIds` |
| S2 | `levelMap` 的 `levelId → gradeCode` ↔ 代码私有的 `LEVEL_GRADE`，外加 gradeCode 是否在 `RadarReader.GRADE_CODES` 里 |
| S3 | `difficultyAxes[].progression` ↔ `difficultyAxisFor()` 的 `base` 表 **以及** 之后的 `axis.* =` 精调赋值 |
| S4 | `typeTree` 的 id 与 status ↔ `COMPARISON_TYPE_OF` ↔ `templates.json` 里真有几道题 |
| S5 | `implementedModes` / `primaryTypes` ↔ `templates.json` 的 `mode` / `type`（别名 **`mini_game ≡ mini`**，写死在 `MODE_ALIAS` 里） |
| S6 | game / lesson / video / rootgene 之间的引用完整性 + 每条 `path` 下 `index.html` 真能取到 |

**四档严重度的口径（照用户定的，别改回去）**：

- **FAIL** = 两边矛盾，必须改一边。例：代码上线了 G2 而 `levelMap` 说 `planned`；
  轴取值不在 `progression` 里；`typeTree` 说 `planned` 而题库里有题。
- **WARN** = 死条目，**或者「查不动」**。提取器在 game.js 里找不到某个声明时
  报 `cannot verify` 而**不是静默通过**——这是这个页面唯一一条不可退让的规则。
- **INFO** = 合法但值得人看一眼：登记表外的 id（reader 会从 id 推导标签，
  缺的只是一个好名字）、`status: "planned"` 的条目还没接线、
  题库产生了 `primaryTypes` 之外的类别。
- **OK**。

**为什么代码侧是「读文本」而不是 import**：`LEVEL_GRADE`、`base` 轴表、
`COMPARISON_TYPE_OF` 都是 game.js 那个 IIFE 里的私有变量，而 game.js 一加载就自启动，
所以 `validate.js` 把 game.js **当文本 fetch**，`stripComments()` 去注释后用
`sliceBlock()` 花括号配对切出对象字面量。**等哪天模块显式导出自己的契约**
（例如 `window.CMP_CONTRACT = { LEVEL_GRADE, AXIS_BASE, TYPE_OF }`），
就删掉对应的文本提取器改读导出，别再往正则上叠补丁。

已经踩过的三个提取器坑，改的时候别踩回去：

1. `axis\.(\w+)\s*=` 会吃到 `axis.relation_complexity === 'direct'`——
   必须写 `=(?!=)`。
2. 三元 `(levelId === 'G2') ? 'multi' : 'dual'` 的**条件**会被当成取值——
   所以只取第一个 `?` 之后的引号字符串。
3. 不去注释就会捞到文档里的占位 id：`radar-reader.js` 的 `RG.X.Y.Z` / `RG.A.B`，
   以及 `games/spatial-pattern-hunter/game.js` 注释里的历史 id
   `RG.MINDSEEDS.SPATIAL_PATTERN`。

**已实测**（`python3 -m http.server` + headless Chrome）：
干净状态 **OK 49 · INFO 13 · WARN 0 · FAIL 0**；
另做了一轮**故障注入**（把 `temporal` 改回 planned、L4 的 gradeCode 改成 G3、
删掉 `learning-math-comparison` 的声明基因、加一个 `RG.BOGUS.ID`），
得到 **FAIL 6 · WARN 1** 且每条指向正确的那一处，随后按 md5 校验还原。
`test.html` 仍是 **OK 73 · WARN 0 · FAIL 0**。

**13 条 INFO 是什么**（都不是 bug，是待办清单）：
7 个 Clio 条目 `status=planned` 尚未上报基因（其中 egg-catcher 与 word-connections
另有 id 不一致，见下）+ 3 条 `primaryTypes` 比题库窄 + 3 条杂项。

**两处 id 不一致，留给阶段 3 接线时一起改**：

- `egg-catcher-workshop` 调的是 `createController('egg-catcher-workshop')`，
  少了 `clio-` 前缀；
- `word-connections-workshop` **完全没有游戏级 id**（只有关卡 `L1/L2/L3`）。

metadata 已统一按 `clio-*-workshop` 登记，接线时改代码去对齐 metadata，不要反过来。

**留给用户的课程决定**（我替 Clio 铸了 3 个新基因，需要复核）：
`RG.LOGIC.CLASSIFICATION.BASIC`（分类归组）、`RG.ATTENTION.SEARCH.VISUAL`（视觉搜索）、
`RG.LANGUAGE.SEMANTIC.RELATION`（词义关系），以及为它们新加的两个分类
`ATTENTION` / `LANGUAGE`。

**一条教训**（我在这一轮真犯了）：**不要凭记忆重打已有的 metadata**。
第一次写 `game.json` 时凭记忆重录 18 条老条目，改坏了 26 个字段值
（标题、module、lesson/video id）。正确做法是从 `git show HEAD:metadata/game.json`
读出来，**程序化地只加新字段**，再 diff 回验（当时的输出是 `entries 25 regressions 0`）。

---

## 2. 待办（按性价比排序）

### ~~P1. Interaction / Mini-game 结算没有走 `shell.report()`~~ ✅ 已完成（§1.5）

三种 runtime 现在都写 `me:{gameId}:history:*`，都带 `gradeCode / geneIds / profileId /
activityRuntime`。`me:cmp:*`（engine 事件）保持不变，两套存储各管一件事：
history 管深度轴，engine 事件管 process 细节。

### ~~P2. 本地雷达图只缺「读端」~~ ✅ 已完成（§1.6）

`radar-reader.js` + `profile/` 已上线，三种 runtime 的记录都进图。
读端的三条口径与 `frontierCode` 的定义见 §1.6——**改动读端前先读那一节**，
尤其是「不许跨 runtime 相加 `total`」和「绝不推荐比已练过的更浅的等级」。

服务器端的聚合（P5）应当复用同一套口径：比值平均、分 runtime 存原始和。

### ~~P3. metadata 词表校验器~~ ✅ 已完成（§1.7）

`metadata/validate.html` 上线，6 组 suite 把 `difficultyAxes` / `levelMap` / `typeTree` /
`rootgene.json` 与代码对撞一次，当前 **OK 49 · INFO 13 · WARN 0 · FAIL 0**。
它当场逮到了两处真谎报（`typeTree.temporal` 与 `logic_strategy` 写着 planned、
题库里其实有 5 道和 3 道），已修。

**加字段或改提取器前先读 §1.7**：尤其是「找不到声明必须报 WARN cannot verify，
不许静默通过」，以及那三个正则坑。

### ~~P4. Clio 7 个 workshop 未注册~~ ✅ 已完成（§1.7）

`metadata/game.json` → 25 条，Clio 7 个全部注册（`status: "planned"`），
每条另带 `path`。代码侧的 `registerRootGenes()` 接线属于阶段 3。

### P5. 服务器端缺用户身份

`sessions` 表已有 `gene_ids / level_id / difficulty_axis / module_id / module_type`
（比预期完整），但**没有任何用户身份列**，也**没有 `/api/events` 路由**
（现有路由只有 `/api/v1/reports/submit`、`/api/v1/history/*`、`/api/v1/chess/*`）。

`profileId` 先在本地积累。服务器动工时需要：`sessions.profile_id` 列 + 事件接收端点。

### P6. 跨平台显示一致性 —— **机制部分已完成（§1.4）**，剩余为逐个游戏收敛

契约与原语已落地（`s1-duo` / `s1-multi` / `shell.diag`，见
`docs/shell/UNIFIED-GUI-FRAMEWORK.md` §8），word-connections 已改完。
剩下的活是把其余约 24 个自定义 `max-width` 断点在各自游戏改动时顺带迁移过来——
**不必单独开一轮**，谁碰到哪个游戏就顺手改哪个。已核实的诊断过程保留在 §4。

---

## 3. 已知陷阱（会静默吃数据，不要踩）

1. **`_summarizeProcess()` 静默丢普通对象**：primitive 留（字符串截断到 64），
   数组转 `key_count`，`PROCESS_MAX_KEYS = 24`；**plain object 直接丢弃**。
   新 adapter 想上报结构化 process 会得到空数据且不报错。
2. **上传队列丢最老的**：`me:cmp:upload_queue` 上限 200，靠 `q.shift()` 裁剪，
   即**丢弃最早**的事件。默认无端点，`CmpEngine.setEventsEndpoint(url)` 才开始攒。
3. **`_flushSync()` 是 stub**：`// TODO: replace stub with real POST`，
   `sys:syncPending` 只会增长，不会真的发出去。
4. **本 VM 没有 JS runtime**：`node / nodejs / deno / bun` 都不存在，也没有 `~/.nvm`。
   `test.html`（73 模板 × 20 次）只能在浏览器里跑。基线：**OK 73 · WARN 0 · FAIL 0**。
5. **内容缺口**：`comparison.json` 的 L4 `coverageGap` 记着 G2 没有自由拖拽排序（sort runtime）内容。
6. ~~**history 记录没有上限**~~ ✅ 已修（§1.6）：`shell.js` 现在有
   `HISTORY_MAX = 600` + `_pruneHistory(gameId)`，**按 gameId 各留一个窗口**
   （四个系列互不挤占），超了删最老的并 `console.info` 说明删了几条。
   删之前**故意不做聚合归档**：一半真记录一半摘要的历史会让之后每一个读端
   都对自己的样本量说谎（`radar-reader.js` 的 `sessions` 就会开始骗人）。
   600 局 ≈ 250KB，远在 ~5MB 配额内。
7. **两行统计口径不同**：见 §1.5 的红线。任何新读端都要先看 `activityRuntime`
   再决定 `total` 怎么解释。`radar-reader.js` 的做法（比值平均 + 分 runtime
   存原始和）是参考实现，别在别处另发明一套。

---

## 4. 跨平台显示一致性：已核实的问题

**现象**：Clio 连线组词在 PC / iOS / 小屏安卓平板正常（左右两栏），
在**大屏安卓平板**上变成上下两栏。安卓版本相同。

**根因（已在代码里核实）**：

`studio/Clio/games/word-connections-workshop/style.css:246` 有
`@media (max-width: 860px)`，命中后 `.board` 从 `1fr 1fr` 变成 `1fr`。

媒体查询用的是 **CSS 像素 = 物理像素 ÷ devicePixelRatio**。安卓的 dpr 从 1.0 到 3.0+
都有，所以**物理更大的高密度平板，CSS 宽度可能比物理更小的低密度平板还窄**，
于是「大屏反而塌成上下」。iPad 竖屏 820px 其实也会塌，只是测试时多半是横屏。

**更严重的一点**：同一个断点里还有 `.link-canvas { display: none; }`（第 271 行）。
也就是说在那台大屏安卓上，**连线本身消失了**——一个「连线」游戏丢掉了它的核心反馈，
不只是排版变化。

**架构层面的事实**：

- `shell-1.css` 全部用 `s1-*` 前缀，与游戏 CSS **零冲突**（已逐类核对
  `.app/.topbar/.subtitle/.mini/.hud/.board/.col`）；
- 但 `shell-1.css` 只管 shell chrome（header / 音频按钮 / 弹窗），断点是 820 / 520 / 375；
- **活动内容的布局完全由各游戏自己写**，全仓库有约 25 个互不相同的 `max-width` 断点
  （860 / 640 / 780 / 980 / 820 / 520 …），没有任何共享契约；
- word-connections 属于 shell-bridge 型：只借 `shell-1.css`，不走 `shell.createGame()`，
  自己搭 `.app / .topbar / .board`，所以共享层管不到它的两栏板。

**结论**：用户的原则方向正确——一致性应由公共 GUI 保证，具体实现不该各自发明断点。
但目标要精确化：不是「所有设备像素级相同」（320px 手机确实放不下两栏 72px 节点），
而是

1. **由谁决定重排**：共享层给一个两栏原语（`s1-duo`），塌栏条件用
   **容器宽度**（`container-type: inline-size` + `@container`）或纯 CSS 的
   `repeat(auto-fit, minmax(min(320px,100%), 1fr))`——后者不需要媒体查询，
   也不受 dpr 影响，对老安卓 WebView 最安全；
2. **重排的红线**：重排只能改变排列，**永远不许 `display:none` 掉功能元素**。
   `.link-canvas` 必须在两种布局下都跟着 board 走。
3. **可诊断**：加一个 debug 浮层显示 `innerWidth` / `devicePixelRatio` / 命中的断点，
   这样任何设备上的问题都能直接读数，不用猜。

**本节保留为诊断记录**：上面三条结论已在阶段 0 落地（见 §1.4），
`word-connections-workshop/style.css` 与 `shell-1.css` / `shell.js` 均已改动。
留着这段是为了让下一位知道**当初是怎么定位到 dpr 的**——
以后再出现「某台设备上布局莫名塌栏」，先加 `?diag=1` 读 `bp<=` 那一行。

---

## 5. 后续实施次序（用户已定）

1. Learning 第 2 个：`learning-math-pattern`
2. MindSeeds 第 2 个：`difference-scout`
3. Clio：先 `ufo-math-workshop`（回合制），再
   `word-connections-workshop` 或 `find-it-workshop`；
   `sorting-workshop` 留作第 3 个，用来逼出「连续动作」的设计决定
4. 棋类单独实现，暂不接入雷达

用户已明确推迟到「Learning 两个 + MindSeeds 两个都落地之后」再做的：
result 词表改造、服务器 schema、推荐机制。
（profile UI 本身已提前落地，见 §1.6；推迟的是**服务器端**的推荐与聚合。）

---

## 6. 提交与验证约定

- commit trailer 必须带：`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **分工**：本地实现 + 提交由模型做；**push 与线上 GitHub Pages 测试由用户自己做**。
- 每次改完 comparison 相关代码，请用户在浏览器跑 `learning/math/comparison/test.html`，
  对基线 **OK 73 · WARN 0 · FAIL 0**。
