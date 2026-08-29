# Comparison · Puzzle Mode — Implementation Reference

**版本** v1.3 · 2026-08-23  
**模块** `learning/math/comparison/`  
**适用范围** Learning 系列所有 Puzzle 类型游戏的样板  
**配套文档** `COMPARISON-INTERACTION-IMPLEMENTATION.md`（拖放活动）

> v1.3 变更：`multi_attribute` 从"无场景例外"移入场景题（§6.5.1），修掉 `_shapeSvg` 尺寸参数不生效的 bug；`position` 场景改为共同起点的双行虚线路径（§6.5.2）；`timeOrder` 的 durations 池 4→10 项。
> v1.2 变更：新增 §6.5 场景/选项契约与 §6.6 交互题公共标尺契约——两者都是新增模板的验收项。
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
  "rootGeneIds": ["RG.LOGIC.COMPARISON.BASIC"],
  "mastery":     { "requiredCorrect": 3, "window": 5 },
  "cooldown":    { "correct": 5, "familiar": 8, "mastered": 20, "wrong": 2 },
  "params":      { "set": "animals", "askMode": "bigger" }
}
```

**命名约定**：`{module}-{level}-{type}-{seq}`，如 `cmp-k1-size-001`

> `rootGeneIds` **只放能力基因**。维度（size / quantity / …）由同一模板的 `type`
> 字段承载，位置由 report 的 `moduleId` / `unitId` 承载，都不进基因 ID。
> 理由见 `docs/rootgene/ROOTGENE-FRAMEWORK.md` §5。当前 73 个模板的
> `rootGeneIds` 一律是 `["RG.LOGIC.COMPARISON.BASIC"]`。

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

### 6.5 场景与选项的职责划分（Scene / Option 契约）

**这是新增模板的验收项，违反则题目本身不成立。**

一道 Puzzle 有两个渲染出口：`renderSequence()` 画黄框里的**场景**，
`renderOption()` 画下面的**选项卡**。两者职责必须严格分开：

| | 场景（`#s1-seqin`） | 选项卡（`.s1-opt`） |
|---|---|---|
| 被比较的属性（高矮/长短/多少/满空/形状/颜色…） | **只在这里出现** | **绝不出现** |
| 共同基线 / 同一起点 | 必须有（否则无法比较） | — |
| 差异是否要明显 | 必须明显（生成器已保证数据有 gap，渲染不能吃掉它） | — |
| 槽位标记 `.cq-slot` | 每个选项对应一个，顺序 A B C | — |
| 内容 | 场景本体 | 指针 `.cq-opt-ptr`（字母）+ 可选的**中性身份** |

"中性身份"= 不泄露答案的辨识信息：固定字号的 emoji、物体名称。
`size` / `position` / `fullness` 两侧是不同物体，选项显示 emoji + 名称帮助对应；
`length` / `height` / `quantity` 两侧是匿名条/点，字母本身就是身份；
`shape` / `color` 的身份**就是答案**，选项只能有字母。

槽位颜色（`SLOT_COLORS`）只在 `length` / `height` 使用——匿名条需要颜色对应；
其余类型用中性 slate（`SLOT_NEUTRAL`），避免颜色变成额外线索。

**为什么写成硬规则**：早期 height 题的柱子因为
`.cq-h-bar{height:X%}` 挂在自动高度的 flex 列上（百分比高度无法解析 → `auto` → 0px）
整体塌陷，黄框里只剩两个同样大的 emoji，而选项卡用的是 px 高度、
反而把高低差画了出来——**真正的比较跑到答案里去了**，题目变成"看选项猜题目"。
因此：

- 场景里所有靠尺寸表达的元素必须用 **px**（或放在固定高度容器内），
  见 `.cq-h-track{height:108px}` + `H_BAR_MAX = 80`；
- 同一道题两侧应是**同一个物体**（`heightCompare` 的 `rightObj = leftObj`），
  两个不同物种会诱导孩子比较错误的属性。

**无场景题型例外**：`number` / `weight` / `speed` / `time`
的 `_sceneHtml()` 返回 `''`，题面只有文字，选项**就是**题目内容
（数字、物体、时刻），必须继续承载内容，也不加字母指针。
判定依据是 `_hasScene(type)`。

新增模板自查清单：

1. 有场景吗？→ 有：选项只能是指针；没有：选项承载内容。
2. 场景里两侧共基线、差异肉眼可辨吗？（用 px 而非 %）
3. 槽位标记数量 = 选项数量，字母顺序一致吗？
4. 选项里是否残留 `.cq-h-bar` / `.cq-bar-fill` / `.cq-dot` / `.cq-fill` / `.cq-shape-svg` 之类属性元素？
5. `shape` / `color` 这类"身份即答案"的题，选项有没有泄露答案？

#### 6.5.1 `multi_attribute`：第三次犯同一个错

`multi_attribute` 原来在上面的例外名单里——选项卡各画一个图形，大小写在
`_optBody()` 里。线上表现是**"答案反了"**：绿卡上一颗小爱心、红卡上一个更大的
三角形，判定却说爱心更大。

根因不在判定，在渲染：`_shapeSvg()` 输出 `viewBox="0 0 sz sz"` 且内部几何全部
按 `sz` 成比例，而 CSS 里写着 `.cq-shape-svg{width:52px;height:52px}`。
**viewBox 只决定坐标系，实际尺寸由 CSS 盒子决定**，于是 `szPx`（34–53px）被
静默丢弃，六种形状一律画成 52px。屏幕上唯一的差别是每种形状的**墨迹占比**：
三角形 `<polygon>` 占盒子约 0.85，爱心当时是 `<text>♥</text>` 字形、占比小得多，
且和 `item.size` 完全无关——所以看起来大约一半的题"答案反了"。

三处修正：

- `_shapeSvg()` 把 `width`/`height` 写成**内联样式**（`.cq-shape-svg` 降级为默认值），
  尺寸参数这才真的到达像素；
- 爱心改用 `_heartPath()` 路径绘制，和其余五种形状统一到 0.85 的墨迹占比，
  不再依赖设备字体；
- 大小既然是被比较的属性，就必须回到场景里：新增 `_multiAttrScene()`，
  两个物体共底线放在固定高度的 `.cq-ma-box` 内，较大者占满 `MA_BOX = 96px`，
  较小者按真实比例画（§6.6 的公共标尺，只是换成了 Puzzle 场景）；
  选项卡退回纯字母指针。

配套的数据和门禁：

- `Generators.multiAttribute` 的差距从"≥2 档"放大到 `bigSize = 8..10`、
  `smallSize = big − 3..5`，即较小者 ≤ 0.70×。原来 2 档差在 9 档量程上约等于
  10% 的视觉差，六岁孩子无法稳定判断；
- `ignoreAttribute` 的语义修反了——原实现把该属性**置为相同**，等于删掉了
  `cmp-g2-multiattr-002` 要训练的干扰项。现在它表示"这个属性会变化，且要求忽略"，
  题面和语音会点名说出来（"哪个更大？不用管颜色。"）；
- `test.html` 新增 `checkMultiAttr()`：断言差距 ≥3 档且 ≤0.70×、`answer` 必须是
  更大的那一侧、模板声明会变化的干扰项**确实在变**。

**可复用的教训**：`viewBox` 不是尺寸。任何"尺寸有含义"的 SVG，
宽高必须内联，不能只靠 class；否则数据层的差异到不了屏幕，而 CSS 里
某个固定值会替你决定答案。

#### 6.5.2 `position`：距离必须真的是距离

线上第四次同类问题：`哪个离学校更近？`，滑梯几乎贴着学校、大树在远处，
判定却说大树更近。数据同样是对的（`answer` 由 `leftDist < rightDist` 得出），
错的还是渲染。

旧布局把参照物钉在 50%，两个物体分别放在 `50 ± (dist − 50) × 0.45`，
于是画出来的间距是 `0.45 × |dist − 50|`——一个 V 形：

| `distPct` | 画出来离参照物 |
|---|---|
| 50 | 0（**压在参照物上**） |
| 10 | 18 |
| 90 | 18（和 10 一样远） |

生成器给的是"近 10–40 / 远 55–90"，代进去近的画成 4.5–18、远的画成 2.25–18，
**远的经常比近的画得更近**，所以答案看起来是反的。

修正方式和 §6.6 的搭桥一样——一把标尺、共同起点、真实长度：
参照物独占左边一列（grid `auto 1fr`），两个物体各占一行，
每行一条虚线路径 `width: distPct%` 画在同一条 `.cq-scene-track` 上，
物体就站在路径末端。于是"更近"= **虚线更短**，两条线起点相同、上下相邻，可直接互比。

```
🏫 ┆·········🛝 A        ← distPct 35
   ┆····················🌳 B   ← distPct 60
```

配套：距离范围收紧为 `近 10–35 / 远 60–90`（最坏情况 35 vs 60，近路径是远路径的
0.58×，在 315px 的 track 上是 110px vs 189px）；`test.html` 新增 `checkPosition()`，
断言两个百分比差 ≥25、比值 ≤0.60、且 `answer` 与 `askNearer` 一致。

> `width: X%` 这里能生效，是因为 track 的宽度是确定的（确定宽度的 flex 行里的
> `flex:1`）。这和 §6.5 里 `.cq-h-bar{height:X%}` 挂在自动高度父元素上塌成 0 的
> 情形不同——**百分比需要一个确定的参照维度**，横向天然有、纵向往往没有。

### 6.6 交互题的公共标尺（Common Scale 契约）

**这是新增交互活动的验收项，违反则题目本身不成立。**

§6.5 管的是 Puzzle 的"场景 vs 选项"；交互题（`sort`/`match`/`group`/`fit`）里
同样的错误换了一层皮：**被比较的量和参照物画在两把不同的尺子上**，
于是"够不够长"只有代码知道，孩子在屏幕上看不出来。

规则：一屏之内只能有**一把标尺**，参照物和所有可拖动对象都按同一比例画。

| 要素 | 要求 |
|---|---|
| 标尺 | 一个数字，由容器宽度算出（`ruler = fieldWidth - bankL - 8`），全场共用 |
| 参照物（缺口/目标） | 尺寸 = `目标% × ruler`，**必须由数据算出**，不能是写死的 `flex:1` |
| 可拖动对象 | 尺寸 = `自身% × ruler`，和参照物同一个百分比基准 |
| 起点 | 全部对齐同一条边（`.ft-boards{padding-left:bankL}`），竖排一列，便于两两互比 |
| 目标线 | 画一条可见的线（`#ft-goal-line`，`left = bankL + riverW`），"够长"= 越过这条线 |
| 落位后的对象 | 按**自己的真实长度**画（`_drawBridge()` 用 `_boardPx(board)`），多出来的部分真的伸到对岸上 |
| 数字 | 按年级开关（`showNumbers = ['K1','K2'].indexOf(levelId) === -1`），K1/K2 纯视觉 |

**为什么写成硬规则**：改版前的 fitBridge，木板宽度是 `lengthPct * 0.9` **px**，
而河面是 `.ft-water{flex:1}` 撑出来的 420px（窄屏 300px）——
正确木板画出来只有缺口的 13~17%，**比例错了 6~8 倍**；
`scene.gapPct` 完全不参与布局，52%/56%/60% 三种河宽长得一模一样；
三块木板左边缘各在 551/596/675px，彼此也没法比；
成功时的桥永远画成 `riverW + 20` px，所以"刚好"和"有点长"是同一张图。
最后只剩木板上的 `%` 数字能用——而 K1 的原则是"几乎无数字，全视觉比较"，
何况"百分之几"对 3~4 岁没有意义。**判定是数值的，画面是假的。**

配套约束：

- **生成器要留出看得见的余量**。`fitBridge` 现在是
  `short = gap-12-rand(0..8)` / `fit = gap+4+rand(0..4)` / `long = fit+margin+rand(0..6)`。
  正确木板至少越线 4% × ruler（实测 16~48px）；
  `long` 相对 `fit` 定义而非相对 `gap`，否则 margin 小的模板（G1 = 6）会让
  `long === fit`，"最短的合格木板"这一唯一性假设当场失效。
- **画面真实 ≠ 操作变难**。河面按真实比例变窄后，命中区要单独放大：
  `.ft-drop-zone{left:-24px;right:-24px;top:-40px;bottom:-12px}`——
  看到的是真尺度，摸到的是大靶子。
- **错误也要落地**。太短的木板照样铺下去、停在虚线前面、然后沉下去
  （`ft-sink`），画面和"太短了"这句话必须说同一件事。
- **响应式**：标尺依赖容器宽度，`resize` 必须重跑 `_layout()`，
  已落位的对象用 `_st.placed` 重画。

新增交互活动自查清单：

1. 参照物的尺寸是由数据算出来的，还是被 flex 撑出来的？
2. 可拖动对象和参照物用的是同一个百分比基准吗？
3. 所有对象起点对齐、可以互相直接比较吗？
4. 有没有一条可见的"及格线"？
5. 落位后画的是真实长度（多余的会溢出），还是套模板的固定长度？
6. 关掉所有数字，这道题还做得出来吗？（K1/K2 必须能）

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

**`test.html` 只验证数据，不验证渲染。** 它看不见"柱子被 CSS 塌成 0px"这类问题
（§6.5 的起因）。校验渲染几何要另写一次性探针：一个和 `index.html` 引同一批脚本的页面，
在 `shell.createGame` 上打桩截获 `cfg`，然后自己造 DOM
（`#s1-seqin` + `#s1-opts`）调 `cfg.renderSequence()` / `cfg.renderOption()`，
用 `offsetHeight` / `getBoundingClientRect()` 断言：

- 柱高 = `pct/100 × H_BAR_MAX`（比例忠实，没被 flex 压扁）
- 两侧 `bottom` 相同（共基线）
- 选项卡里没有 `.cq-h-bar` / `.cq-bar-fill` / `.cq-dot` / `.cq-fill` / `.cq-shape-svg`
- 槽位字母与选项字母一一对应

探针放在单元目录内（同源才能量 DOM），跑完即删，不进仓库。

---

## 9. 已知限制和后续方向

| 限制 | 说明 |
|------|------|
| G3–G6 未实现 | 卡片已显示"即将推出"，templates 和 generators 需补充 |
| 音效为合成音 | `shell.audio` 用 WebAudio 合成 ding/buzz 等，未使用音频文件资源 |
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
4. 修改 `game.js` 的渲染器和 GRADE_LEVELS（如适用）——渲染器必须遵守 §6.5 的 Scene / Option 契约
5. `engine.js` **无需修改**（Cycle 引擎完全通用）
6. 运行 `test.html` 验证新生成器（数据层），再按 §8 末尾写一次性探针验证渲染几何

> **engine.js 是跨学科共享层**，templates.json + generator.js 是每个模块的定制层。
