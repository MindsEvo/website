# 交接说明：思维雷达架构落地状态与下一步

- 版本：v1.1 (2026-08-29)
- 适用：接手 comparison 单元之后工作的人 / 模型（本轮为 Opus → Sonnet 交接）
- 前置阅读顺序：`docs/rootgene/ROOTGENE-FRAMEWORK.md` → 本文 → `docs/patterns/COMPARISON-*.md`

> v1.1 变更：阶段 0 已落地（见 §1.4），P6 的第一刀已切，`shell.js` → v1.5.0。

---

## 0. 一句话现状

**架构骨架已经完成并且一致**：基因只表能力、深度轴用 `gradeCode`、匿名 `profileId` 已盖章，
18 个已注册游戏 + 73 个模板 + 模块 metadata 三处口径统一。

**剩下的都是「模块内的活」和「读端的活」**，不再需要改架构——这正是当初预期的低成本阶段。

---

## 1. 已落地的改动

§1.1–1.3 是雷达架构那一轮（共 20 个文件，commit `751f85d`）；
§1.4 是紧接着的阶段 0（响应式布局收口）。

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

## 2. 待办（按性价比排序）

### P1. Interaction / Mini-game 结算没有走 `shell.report()`

**现状分裂**：

| 存储 | 内容 | 覆盖范围 |
|------|------|----------|
| `me:{gameId}:history:{ts}` | 深度轴（gradeCode / geneIds / profileId） | **只有 Puzzle** |
| `me:cmp:*`（engine 事件） | mode / process / 每次 attempt | 三种 runtime 都有 |

所以 Interaction 和 Mini-game 的 session **不在雷达的深度轴上**。

**为什么本轮没做**：`_renderHist()` 是用户正在真机测试的可见面板，
往里灌三种 runtime 的记录会立刻改变面板显示（条数、正确率口径），
风险不在写入端而在读取端。必须和读端改造一起做。

**建议做法**：

1. 在 Interaction / Mini-game 的收尾处调用 `shell.report()`，payload 用
   `buildRadarContext()` 的结果 + `activityRuntime: 'interaction' | 'mini'`；
2. 同时给 `_calcHist()` 加 runtime 过滤，保证面板口径不变；
3. 注意 `_calcHist()` 会跳过没有 `r.total` 的记录——Mini-game 的「total」是回合数，
   要显式填，否则新记录会被静默丢弃。

### P2. 本地雷达图只缺「读端」

`_calcHist()` / `_renderHist()` 目前**对基因和级别都是盲的**，只统计
sessions / correct / wrong / hints / totalMs。

数据其实已经全在 `me:{gameId}:history:*` 里了（geneIds + gradeCode + profileId），
**所以本地雷达图不需要新的采集，只需要一个 reader**：按 `geneIds × gradeCode`
分组聚合，就是用户要的 profile 进步雷达图。这是用户明确说过「非常重要」的一项。

### P3. metadata 词表校验器

`difficultyAxes` / `levelMap` **没有任何 JS 读取**，所以：

- 代码里写了词表外的取值 → 静默；
- 模块声明的 `levelId → gradeCode` 与 metadata 的 `levelMap` 不一致 → 静默。

建议加一个纯静态校验页（跟 `test.html` 同风格），把两边对撞一次。
本轮的 number-sense 词表 bug 就是人工比对才发现的。

### P4. Clio 7 个 workshop 未注册

`metadata/game.json` 只有 18 个游戏，Clio 的 7 个 workshop 全部缺席。
7 行注册是接入 Creative Workshop 系列最便宜的第一步。

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
result 词表改造、服务器 schema、profile UI、推荐机制。

---

## 6. 提交与验证约定

- commit trailer 必须带：`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **分工**：本地实现 + 提交由模型做；**push 与线上 GitHub Pages 测试由用户自己做**。
- 每次改完 comparison 相关代码，请用户在浏览器跑 `learning/math/comparison/test.html`，
  对基线 **OK 73 · WARN 0 · FAIL 0**。
