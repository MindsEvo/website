# 学习系列 · 语文素养模块架构规范

## 版本

- v0.1.0-draft (2026-09-25) —— 设计草案，待审。审定后 `metadata/metathinking/language.json` 按本文重写。
- 适用范围：`learning/language/`。第一阶段只做 **G1–G2**；K1–K2（不识字，图画 + 语音）另开一节规划，不在 v1 实施范围内。
- 现有 K1/K2 实现（`learning/language/data.js` 的常识问答与生活流程排序）**整体作废**，理由见 §0.2。保留：shell 接线、雷达上报、Create→Compare→Reflect 不计分机制。

## 0. 一句话

语文素养不是「多认字、多背词、写对作文」。它是**借助语言观察、理解、关联、推理、组织、表达与创造**的元思维操作。

> 知识是载体，思维才是目标。孩子在传统教材里学内容；在 MindsEvo 里，用**同等难度**的内容，练教材练得最薄弱的那部分思维。

### 0.1 定位：对标，不复制；换角度，不换难度

| | 传统语文 / ELA 课 | MindsEvo 语文素养 |
|---|---|---|
| 目标 | 学会这门语言：识字、词汇、语法、课文 | 借语言训练思维：观察、推理、组织、表达 |
| 内容 | 教材课文 | **原创**素材，体裁、主题、字词量、句长**对标同级教材** |
| 题目 | 以「找原句 / 标准答案」为主 | 以「你怎么知道的 / 还可以怎样想」为主 |
| 评价 | 对错 + 范文 | 客观题即时判定 + 开放题 Create→Compare→Reflect |
| 中英文 | 各自一门课 | 共享同一思维骨架，素材**分别原生创作** |

我们既不能「外行」（难度、字词、体裁脱离教材，家长和老师一看就不专业），也不能「照搬」（变成又一个同步练习册）。区别只落在**问法和编排**上。

### 0.2 为什么作废现有 K1/K2 内容：文本依赖性测试

语文理解题必须通过一条硬测试：

> **不读这段素材，能不能答对？能 → 不是语文题。**

现有「鱼身上有鳞片还是毛发」「刷牙先挤牙膏」全部靠世界常识就能答对，没有一道题依赖素材本身。它们练的是常识和逻辑，不是语言。这条测试写进 §9 不变式，今后每道客观题都要过。

---

## 1. 对标体系

每一道题必须带**两个标签**：对标哪条课标/教材内容（专业性），补哪一个思维薄弱点（特色）。缺一不可。

### 1.1 中文对标

| 来源 | 用途 |
|---|---|
| **《义务教育语文课程标准（2022 年版）》第一学段（1–2 年级）** | 主锚点。目标维度：识字与写字、阅读与鉴赏、表达与交流、梳理与探究；学习任务群：语言文字积累与梳理 / 实用性阅读与交流 / 文学阅读与创意表达 / **思辨性阅读与表达** / 整本书阅读 |
| **统编版（部编版）语文 一上、一下、二上、二下** | 难度与体裁锚点：识字单元、课文单元、口语交际、语文园地（字词句运用、日积月累、我的发现）、快乐读书吧 |
| 儿童分级阅读（如亲近母语、南方分级阅读等机构的分级书目与标准） | 课外素材的篇幅、主题、字词难度参照 |
| 优秀儿童阅读 / 语文平台（斑马、叫叫阅读、凯叔讲故事等） | 参考交互与节奏，**不参考题目**。它们大多是「同步教学 / 内容消费」，正好是我们要区分开的方向 |

**关键判断**：2022 版课标单独设了「**思辨性阅读与表达**」任务群，要求学生在阅读中「比较、推断、质疑、讨论」，但统编教材课后题落实这条线最薄弱。MindsEvo 语文就是**把课标已经要求、但教材练得不够的这一条线做深**。这让我们的定位有正式依据，不是自说自话。

### 1.2 英文对标

| 来源 | 用途 |
|---|---|
| **Common Core ELA, Grade 1–2** | 主锚点，每道题标到具体条目，如 RL.1.1（关键细节）、RL.1.3（人物、情节、事件）、RL.2.5（故事的开头、中间、结尾）、RI.2.3（事件之间的联系）、L.1.5d（近义词的细微差别）、SL.2.3（提问以澄清理解） |
| **UK National Curriculum English, KS1 (Year 1–2)** | 补充锚点。KS1 comprehension 明确要求「根据人物的言行做推断」「预测接下来会发生什么」 |
| 分级阅读体系：Fountas & Pinnell Guided Reading、Lexile、Oxford Reading Tree | 难度锚点：G1 大致 F&P D–J，G2 大致 J–M（具体区间由内容组核实后写入 metadata） |
| 主流教材 / 平台：Wonders（McGraw-Hill）、Into Reading（HMH）、Raz-Kids / Reading A-Z、Khan Academy Kids | 参考体裁比例与题型分布，**不复制**文本 |

### 1.3 思维层级框架（区分「思维题」和「练习题」的标尺）

只挂课标还不够，课标只说明「对标什么内容」。「练什么思维、练到多深」由两个国际通行的阅读理解框架来刻画：

**PIRLS 四个理解过程**（国际阅读素养进展研究）：

| 层级 | PIRLS 过程 | 孩子在做什么 | 传统课后题占比 |
|---|---|---|---|
| L1 | 提取明确陈述的信息 | 原文里有，找出来 | 高 |
| L2 | 做直接推论 | 原文没直说，一步推出 | 中 |
| L3 | 解释、整合观点和信息 | 把几处信息连起来，理解人物、主旨 | 低 |
| L4 | 评价、审视内容与语言 | 这个词用得好不好？你同意吗？ | 很低 |

**QAR 问答关系**（Raphael）用来给题目的答案来源分类：Right There（原文就在这里）、Think & Search（多处整合）、Author & Me（原文加我的推断）、On My Own（我自己的想法）。

**编排原则**：同一段素材出的题**沿 L1→L4 爬梯**。L1 只起铺垫作用，每段素材至多 1 道；**MindsEvo 的主体是 L2–L4**。On My Own 类问题一律走 Create→Compare→Reflect，不打分。

### 1.4 思维例程（本模块的「特色动作」）

借鉴哈佛 Project Zero 的 Visible Thinking 例程，把它们固化成可复用的题型骨架：

| 例程 | 在本模块里的形态 |
|---|---|
| **What makes you say that?**（你从哪里看出来的？） | 每道推理题配一个「原文找证据」追问（§4 `evidence-tap`）。**答案对、证据也对，才算完全掌握** |
| See–Think–Wonder（看到—想到—好奇） | 观察单元的三步问法 |
| Circle of Viewpoints（换个角色想） | 「如果你是小熊，你会怎么想？」，走 Create→Compare→Reflect |
| Claim–Support–Question（观点—支持—疑问） | G2 的评价题 |

---

## 2. 四层模型

一道题 = **能力单元 × 素材 × 题型模板 × 交互**，由四个相互独立的维度确定。

```
能力单元（7 个，中英文共用，= RootGene）
   └─ 题型模板（每单元 3–6 个启发式问法，大部分中英文共用，少数语言专属）
        └─ 素材（中文池 / 英文池，各自原创，带对标标签）
             └─ 交互（select / order / evidence-tap / slot-build …）
```

题量来自「素材 × 模板」的组合，而不是逐题手写孤立题目：一段好素材可以生成 4–6 道不同单元、不同层级的题。

---

## 3. 七个能力单元

| id | 中文 | 核心思维 | PIRLS 层级 | 对标（中 / 英） | 教材练得薄弱的地方 → 我们换的角度 |
|---|---|---|---|---|---|
| `observe` | 观察与发现 | 注意细节、分主次 | L1–L2 | 课标「阅读与鉴赏」：了解文中的细节 / RL.1.1、RL.1.7（插图与文字） | 只罗列有什么 → **哪个细节最重要？哪个细节暗示了什么？** |
| `comprehend` | 信息理解 | 抓住文本说了什么 | L1–L2 | 课标「实用性阅读与交流」/ RI.1.1、RI.1.2 | 只找原句 → **用自己的话概括；判断哪句话是重点** |
| `infer` | 关联与推理 | 因果、线索→结论 | L2–L3 | 课标「思辨性阅读与表达」/ RL.1.3、KS1 inference | 几乎不练 → **原文没说，你怎么知道？找证据** |
| `structure` | 顺序与结构 | 先后、开头—经过—结尾 | L3 | 统编「按顺序讲故事」/ RL.2.5、RI.2.3 | 靠常识排序 → **只能靠这个故事里的顺序词、因果链排序** |
| `choose` | 语言选择 | 词语、语气、场合 | L3–L4 | 语文园地「字词句运用」、口语交际 / L.1.5d、L.2.5、SL.1.6 | 背近义词 → **这个人物此刻，用哪个词最准？为什么？** |
| `express` | 组织与表达 | 把想法组织成句、成段 | L3–L4 | 课标「表达与交流」、看图写话 / W.1.3、SL.2.4 | 按范文打分 → **Create→Compare→Reflect：先说，再看别人怎么说，再改** |
| `create` | 想象与创造 | 续编、改编、换角度 | L4 | 课标「文学阅读与创意表达」/ W.2.3 | 只有一个结局 → **同一个开头，可以有多少种结局？** |

v1（G1–G2）做前 5 个客观单元，外加 `express` / `create` 各 1 个 Create→Compare→Reflect 模板，挂在素材末尾。这与最初架构提案里「第一阶段 5 个单元」的建议一致。

### 3.1 RootGene 规划（审定后落库）

| 单元 | 基因 | 状态 |
|---|---|---|
| observe | `RG.LANGUAGE.OBSERVATION.DESCRIBE` | 已存在，改写 desc：从「选描述」改成「在素材里发现、甄别细节」 |
| comprehend | `RG.LANGUAGE.COMPREHENSION.INFO` | 新增 |
| infer | `RG.LANGUAGE.INFERENCE.EVIDENCE` | 新增 |
| structure | `RG.LANGUAGE.STRUCTURE.SEQUENCE` | 已存在，改写 boundary：强调「依据文本内的顺序信号」 |
| choose | `RG.LANGUAGE.CHOICE.CONTEXT` | 新增 |
| express / create | `RG.LANGUAGE.EXPRESSION.GUIDED` | 已存在；`create` 是否单独拆基因，等 G3 以后再定 |

`RG.LANGUAGE.SEMANTIC.RELATION`（Clio 连线组词）不动。与它的边界：它判断词与词之间的关系；本模块的 `choose` 判断的是**词与语境**是否相配。

---

## 4. 交互清单

| 交互 | 说明 | 状态 |
|---|---|---|
| `select` | 单选，文字或图片选项 | 已有（science `textOptions`） |
| `evidence-tap` | 素材分句显示，孩子点出支持答案的那一句或那个词 | **新增，本模块的标志交互** |
| `order` | 句卡点选排序：依次点卡片，卡片排进 1、2、3 的位置，可撤回 | **新增**，替代「从几种排好的顺序里选一个」 |
| `slot-build` | 词块组句（谁 / 在哪里 / 干什么） | 已有（Create→Compare→Reflect） |
| `compare-reflect` | 展示他人想法，再问反思题 | 已有 |

**两段式作答**（`select` 接 `evidence-tap`）是本模块区别于逻辑题的关键：逻辑题只问结论；语文推理题**必须回到文本找依据**。计分方式：结论和证据分开记录，`errorType` 区分「结论错」和「结论对、证据错」（后者往往是猜对的）。

---

## 5. 素材 schema

```js
{
  id: 'zh-g1-borrow-umbrella',
  lang: 'zh',                        // 素材不跨语言，英文池另写
  grade: 'G1',
  genre: 'story',                    // story | fable | poem | rhyme | informational | dialogue | picture
  anchors: {
    curriculum: ['课标2022-第一学段-阅读与鉴赏', '统编一下-课文单元'],
    level: { charCount: 118, newCharRatio: '≤5%' }   // 英文用 { lexile, fp }
  },
  titleText: '借伞',
  sentences: [                        // 分句存储，evidence-tap 与 order 直接用
    { id: 's1', text: '下雨了。' },
    { id: 's2', text: '小兔没有带伞，站在大树下，耳朵耷拉下来。' },
    ...
  ],
  items: [ /* 本素材派生的题，见 §6 */ ],
  reflect: { /* 末尾 Create→Compare→Reflect，可选 */ }
}
```

**中英文分别原生**：`zh` 池和 `en` 池不是互译关系。两个池共享能力单元、题型模板和层级分布，素材各自按本语言教材的体裁、文化和表达习惯来写。界面上的提示语（按钮、反馈）才需要双语对照。

---

## 6. 题型模板与示例

### 6.1 通用模板（中英文共用）

| 单元 | 模板 id | 问法 | 层级 |
|---|---|---|---|
| observe | `detail-find` | 素材里的 X 是什么样的？ | L1 |
| observe | `detail-key` | 哪个细节最能说明 Y？ | L2 |
| comprehend | `main-point` | 这段话主要讲了什么？ | L2 |
| infer | `feeling-evidence` | 此时人物是什么心情？→ 你从哪里看出来的？ | L2 |
| infer | `cause-hidden` | 为什么会这样？（原文没有直说） | L2–L3 |
| infer | `predict` | 接下来最可能发生什么？依据是什么？ | L3 |
| structure | `order-cards` | 按故事发生的顺序排句卡 | L3 |
| structure | `signal-word` | 哪个词告诉你这件事发生在后面？ | L3 |
| choose | `word-fit` | 这里换成哪个词最合适？为什么？ | L3–L4 |
| choose | `tone-fit` | 对老师和对朋友，这句话怎么说更合适？ | L4 |
| express/create | `ending-ccr` | 续编结局 → 看看别人的 → 你想改吗？ | — |

### 6.2 语言专属模板（体现「分别设计」）

| 中文专属 | 思维角度 | 英文专属 | 思维角度 |
|---|---|---|---|
| 形声字偏旁推义（「氵」的字大多和水有关） | 分类 → 推断 | Word families / 押韵 | 发现规律 |
| 量词搭配（一**只**鸟、一**条**鱼） | 按特征归类 | Pronoun reference（he / it 指谁） | 追踪指代 |
| 标点与语气（！？。） | 从形式推断情感 | Signal words（first / then / finally） | 结构意识 |
| 叠词、ABB（红通通） | 语言的表现力 | Prefix / suffix（un-, re-, -ful），G2 | 由构词推义 |
| 对韵、古诗意象 | 对应、联想 | Multiple-meaning words（bat, bark） | 用语境消歧 |

### 6.3 完整示例 · 中文 G1

> **借伞**
> ①下雨了。②小兔没有带伞，站在大树下，耳朵耷拉下来。③小熊撑着一把大伞走过来。④他看看小兔，又看看自己的伞，说：「我们一起走吧！」⑤雨越下越大。⑥到了小兔家门口，小兔身上干干的，小熊的半边身子却湿透了。⑦小兔说：「谢谢你！」小熊笑着摆摆手：「明天见！」

| # | 单元 / 模板 | 题目 | 交互 | 层级 |
|---|---|---|---|---|
| 1 | observe / detail-find | 下雨的时候，小兔站在哪里？ | select | L1 |
| 2 | infer / feeling-evidence | 一开始小兔心情怎么样？→ 你从哪一句看出来？（答案：②「耳朵耷拉下来」） | select + evidence-tap | L2 |
| 3 | infer / cause-hidden | 为什么小熊的半边身子湿透了？（原文没有说：他把伞往小兔那边多撑了） | select | L3 |
| 4 | structure / order-cards | 给 4 张事件卡排序 | order | L3 |
| 5 | choose / word-fit | 「小熊**撑着**一把大伞」，换成「拿着」好不好？哪个更像在下雨？ | select | L4 |
| 6 | create / ending-ccr | 第二天，小兔见到小熊会做什么？→ 有人想到还伞，有人想到送礼物，有人想到下次换自己帮忙 → 你想改吗？ | slot-build + compare-reflect | — |

干扰项按阅读题的典型错误类型设计，写进 `errorType`：**张冠李戴**（把小熊的状态安到小兔身上）、**无中生有**、**以偏概全**、**因果倒置**。

### 6.4 完整示例 · 英文 G1（独立创作，不是上一篇的翻译）

> **Max and the Kite**
> ①Max had a red kite. ②He ran and ran, but the kite fell down. ③"The wind is too weak," said Grandpa. ④So Max sat on the grass and waited. ⑤Soon the trees began to shake. ⑥Max jumped up and ran again. ⑦Up, up, up went the kite! ⑧Max laughed. "The wind is back!"

| # | Unit / template | Item | Interaction | CCSS |
|---|---|---|---|---|
| 1 | infer / cause-hidden | Why did the kite fall down at first? | select | RL.1.1 |
| 2 | infer / feeling-evidence | How did Max know the wind was strong again? → Tap the sentence.（⑤ the trees began to shake） | select + evidence-tap | RL.1.3 |
| 3 | structure / signal-word | Which word tells us the trees shook *after* Max waited?（Soon） | evidence-tap | RL.1.3 / L.1.1j |
| 4 | choose / word-fit | Why does the story say "up, up, up" and not just "up"? | select | RL.1.4 |
| 5 | structure / order-cards | Put the events in order | order | RL.1.2 |
| 6 | create / ending-ccr | What might Max do tomorrow if there is no wind? | slot-build + compare-reflect | W.1.3 |

---

## 7. 难度轴

| 轴 | 取值 | 说明 |
|---|---|---|
| `text_length` | 短（G1 上：40–80 字 / 3–5 句）→ 长（G2 下：300 字以上 / 12 句以上） | 中文按字数，英文按句数 + Lexile |
| `explicitness` | 明示 → 一步推断 → 多处整合 | 对应 PIRLS L1→L3 |
| `distractor_closeness` | 远 → 近 | 近干扰项 = 典型错误类型 |
| `evidence_span` | 单句 → 跨句 | evidence-tap 需要点几处 |
| `response_type` | select → select+evidence → order → ccr | |

---

## 8. K1–K2 规划（v1 不实施）

- **不识字 → 图画 + 语音**。平台已有 `shell.speak(text, lang)`，可以按语言选择发音；CSS 动效够用，**不需要动画引擎**。
- 素材形态：单幅场景图或 3–4 格连环画，对标《3–6 岁儿童学习与发展指南》语言领域（倾听与表达、阅读与书写准备）和 EYFS Communication & Language。
- `evidence-tap` 的图画版是 `hotspot-tap`：点画面中的区域作答。
- **真正的阻塞项是插图**。emoji 只能表示单个物体，画不出细节、表情和背景，所以需要成套场景插图（AI 生成加人工筛选、画师、SVG 拼装三选一），单独立项。

---

## 9. 不变式（校验器 / 审稿清单）

1. **文本依赖性**：客观题不读素材就不能答对。
2. **双标签**：每道题都带 `anchors`（课标 / 教材 / CCSS 条目）和 `unit + level`（思维层级）。
3. **层级分布**：每段素材至多 1 道 L1；每个 session 中 L2 及以上的题占比不低于 70%。
4. **推理题必须回到文本**：`infer` 单元的题至少一半配 `evidence-tap`。
5. **干扰项有来源**：每个错误选项标注 `errorType`。
6. **中英文不互译**：同一个 `id` 前缀不能同时出现在 zh 池和 en 池。
7. **不计分就真的不计分**：Create→Compare→Reflect 不进入 accuracy 统计，文案里不出现「对 / 错 / 得分」。
8. **难度守边界**：中文素材的生字率、英文素材的 Lexile 或 F&P 级别，必须落在年级区间内。

---

## 10. v1 实施范围与次序

**范围**：G1、G2 × 中文、英文，每个年级每种语言 4 段素材，共 16 段；每段 4–6 道题，合计约 80 道；覆盖 observe / comprehend / infer / structure / choose 5 个单元，外加每段 1 个 ending-ccr。

**次序**：

1. 审定本文档（包括 §3.1 的基因规划、§9 的不变式）。
2. 重写 `language.json`，把 anchors、层级、模板写进元数据；按 §3.1 更新 `rootgene.json` / `rootgene.js`。
3. 新增 `evidence-tap` 和 `order` 两个交互（`learning/language/` 内部实现，不动 `shell.js`）。
4. 先做 2 段样板素材（§6.3、§6.4），实机走通；审过题目质量之后再批量写剩下的 14 段。
5. 撤下 K1/K2 的旧内容，年级页只显示 G1、G2。
6. 补写 `test.html`，按 §9 逐题审计（参照 `learning/math/pattern/test.html`）。
