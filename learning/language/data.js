'use strict';

/**
 * Language & Literacy — PASSAGE POOLS (Learning series, G1–G2)
 * Spec: docs/language/LANGUAGE-MODULE-ARCHITECTURE.md
 *
 * zh and en are separate, natively authored pools — never translations of
 * each other (§5, invariant 6). Each passage carries its own question ladder
 * (L1→L4, §1.3) and an optional Create→Compare→Reflect tail (`ccr`).
 *
 * Item shapes:
 *   select   { options:[{text, errorType?}], answer:<index> }
 *   evidence { target:'sentence', answer:[sentenceId...] }
 *            { target:'phrase', phrases:[...], answer:<index> }
 *   order    { cards:[...] }             // listed in the correct order
 * Every objective item must fail without reading the passage (invariant 1).
 *
 * SCENES (below) is a separate pool for K1–K2 (pre-reading, §8 of the spec):
 * no sentences, just a small emoji scene + auto-narration. Every item must
 * still fail without looking at the scene (same invariant 1, applied to the
 * picture instead of the passage) — e.g. an `infer` item asks about the face
 * placed next to a specific character, not "the obvious" mood for the weather.
 */

var LANG_DATA = {

  ERROR_TYPES: {
    misattribution:   { zh: '张冠李戴', en: 'Misattribution' },
    fabrication:      { zh: '无中生有', en: 'Not in the text' },
    overgeneralization:{ zh: '以偏概全', en: 'Overgeneralization' },
    detail_as_main:   { zh: '把细节当主要内容', en: 'Detail taken as main idea' },
    irrelevant_detail:{ zh: '细节与问题无关', en: 'Irrelevant detail' },
    literal_only:     { zh: '只看字面', en: 'Literal reading only' },
    contradicts_text: { zh: '与原文矛盾', en: 'Contradicts the text' },
    sequence_confusion:{ zh: '先后混淆', en: 'Sequence confusion' },
    evidence_mismatch:{ zh: '证据不支持结论', en: 'Evidence does not support the answer' }
  },

  PASSAGES: [

    // ── 中文 G1 ──────────────────────────────────────────────────────────────
      {
    "id": "zh-g1-borrow-umbrella",
    "lang": "zh",
    "grade": "G1",
    "genre": "story",
    "anchors": {
      "curriculum": [
        "课标2022·第一学段·阅读与鉴赏",
        "课标2022·思辨性阅读与表达",
        "统编一下·课文单元（童话）"
      ],
      "level": {
        "hanziCount": 96
      }
    },
    "title": "借伞",
    "sentences": [
      {
        "id": "s1",
        "text": "下雨了。"
      },
      {
        "id": "s2",
        "text": "小兔没有带伞，站在大树下，耳朵耷拉下来。"
      },
      {
        "id": "s3",
        "text": "小熊撑着一把大伞走过来。"
      },
      {
        "id": "s4",
        "text": "他看看小兔，又看看自己的伞，说：“我们一起走吧！”"
      },
      {
        "id": "s5",
        "text": "雨越下越大。"
      },
      {
        "id": "s6",
        "text": "到了小兔家门口，小兔身上干干的，小熊的半边身子却湿透了。"
      },
      {
        "id": "s7",
        "text": "小兔说：“谢谢你！”小熊笑着摆摆手：“明天见！”"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "detail-find",
        "level": "L1",
        "interaction": "select",
        "prompt": "下雨的时候，小兔一开始站在哪里？",
        "options": [
          {
            "text": "大树下"
          },
          {
            "text": "屋檐下",
            "errorType": "fabrication"
          },
          {
            "text": "小熊的伞下",
            "errorType": "sequence_confusion"
          }
        ],
        "answer": 0,
        "hint": "找一找第二句，看看小兔站在什么地方。"
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "select",
        "pairId": "rabbit-feeling",
        "prompt": "小兔站在大树下的时候，心里是什么感觉？",
        "options": [
          {
            "text": "有点着急、难过"
          },
          {
            "text": "很开心",
            "errorType": "contradicts_text"
          },
          {
            "text": "很生气",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "故事没有直接说小兔的心情，看看小兔的耳朵是什么样子的。"
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "evidence",
        "pairId": "rabbit-feeling",
        "claimItemId": "q2",
        "evidenceFor": "q2",
        "prompt": "你从哪一句看出小兔不开心？点一点那一句。",
        "target": "sentence",
        "answer": [
          "s2"
        ],
        "hint": "找一找写小兔样子的那一句。"
      },
      {
        "id": "q4",
        "unit": "comprehend",
        "template": "main-point",
        "level": "L2",
        "interaction": "select",
        "prompt": "这个故事主要讲了什么？",
        "options": [
          {
            "text": "下雨天，小熊和小兔一起打伞回家"
          },
          {
            "text": "小熊有一把很大的伞",
            "errorType": "detail_as_main"
          },
          {
            "text": "小兔和小熊在雨里玩水",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "想一想，从开头到结尾，一直在发生的是什么事？"
      },
      {
        "id": "q5",
        "unit": "infer",
        "template": "cause-hidden",
        "level": "L3",
        "interaction": "select",
        "prompt": "为什么小熊的半边身子湿透了，小兔却干干的？",
        "options": [
          {
            "text": "小熊把伞往小兔那边多撑了一些"
          },
          {
            "text": "小熊的伞破了一个洞",
            "errorType": "fabrication"
          },
          {
            "text": "因为雨越下越大",
            "errorType": "overgeneralization"
          }
        ],
        "answer": 0,
        "hint": "雨越下越大，可是只有小熊湿了。伞更多地挡在谁的头上？"
      },
      {
        "id": "q6",
        "unit": "structure",
        "template": "order-cards",
        "level": "L3",
        "interaction": "order",
        "prompt": "按照故事里发生的顺序，把卡片排一排。",
        "cards": [
          "小兔站在大树下",
          "小熊邀请小兔一起走",
          "两个人打着一把伞走在雨里",
          "小兔说谢谢你"
        ],
        "hint": "先找故事开头写的是谁，在做什么。"
      },
      {
        "id": "q7",
        "unit": "choose",
        "template": "word-fit",
        "level": "L4",
        "interaction": "select",
        "prompt": "“小熊撑着一把大伞”，如果把“撑着”换成“拿着”，哪个更好？",
        "options": [
          {
            "text": "“撑着”更好，说明伞是打开的，正在挡雨"
          },
          {
            "text": "“拿着”更好，因为更简单",
            "errorType": "literal_only"
          },
          {
            "text": "两个词意思一样，都可以",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "伞“拿着”的时候，可能是合起来的吗？"
      }
    ],
    "expressCcr": {
      "prompt": "第二天，小兔见到小熊，会怎么把感谢的话说清楚？",
      "slots": [
        {
          "key": "act",
          "name": "小兔会……",
          "options": [
            "送给小熊一块自己做的胡萝卜饼",
            "把自己的新雨伞借给小熊",
            "帮小熊把湿衣服晒干",
            "请小熊到家里来玩"
          ]
        },
        {
          "key": "why",
          "name": "因为……",
          "options": [
            "小熊昨天帮了她",
            "小熊为了她淋湿了",
            "好朋友要互相帮助",
            "她想让小熊也开心"
          ]
        }
      ],
      "template": "第二天，小兔{act}，因为{why}。",
      "otherIdeas": [
        {
          "viewpoint": "有人想到了“回报”",
          "text": "小兔送给小熊一把小雨伞，下次下雨，两个人都有伞。"
        },
        {
          "viewpoint": "有人想到了小熊的感受",
          "text": "小兔先问小熊：“你昨天淋湿了，有没有感冒？”"
        },
        {
          "viewpoint": "有人把故事换了过来",
          "text": "下一次下雨，小兔撑伞，把伞往小熊那边多撑一些。"
        }
      ],
      "reflectPrompt": "看看别人的想法，哪一个是你一开始没有想到的？"
    },
    "createCcr": {
      "prompt": "借伞和还伞以后，给故事增加一个新的方向。人物会作出什么新决定？",
      "promptZh": "借伞和还伞以后，给故事增加一个新的方向。人物会作出什么新决定？",
      "slots": [
        {
          "key": "newDecision",
          "name": "人物决定……",
          "options": [
            "一起做一个雨天互助牌",
            "在伞柄上挂一张感谢卡",
            "准备一把可以借给别人的备用伞",
            "把旧伞布改成一个防水小袋"
          ]
        },
        {
          "key": "newEvent",
          "name": "接下来……",
          "options": [
            "更多朋友在下雨时互相提醒和帮助",
            "感谢卡上的话让借伞的人感到温暖",
            "一位忘带伞的新同学得到了帮助",
            "防水小袋保护了一本要带回家的图画书"
          ]
        }
      ],
      "template": "借伞的事情结束后，人物决定{newDecision}。接下来，{newEvent}。",
      "otherIdeas": [
        {
          "viewpoint": "改变叙述视角",
          "text": "让雨伞来讲述自己先后帮助了哪些人。"
        },
        {
          "viewpoint": "增加新的物品用途",
          "text": "人物把不能再使用的旧伞布做成防水书袋。"
        },
        {
          "viewpoint": "增加后续决定",
          "text": "受到帮助的人准备了一把共享伞，让新的故事继续发生。"
        }
      ],
      "reflectPrompt": "哪一个想法真正增加了新的决定、用途或后续事件，而不是只把借伞和还伞再说一遍？"
    }
  },

    // ── 中文 G2 ──────────────────────────────────────────────────────────────
      {
    "id": "zh-g2-snow-footprints",
    "lang": "zh",
    "grade": "G2",
    "genre": "story",
    "anchors": {
      "curriculum": [
        "课标2022·第一学段·阅读与鉴赏",
        "课标2022·思辨性阅读与表达",
        "统编二上·课文单元（生活故事）"
      ],
      "level": {
        "hanziCount": 232
      }
    },
    "title": "雪地上的脚印",
    "sentences": [
      {
        "id": "s1",
        "text": "早上，冬冬推开门，院子里铺满了厚厚的雪。"
      },
      {
        "id": "s2",
        "text": "雪地上有一串小小的脚印，从篱笆下面一直通到厨房的窗户底下。"
      },
      {
        "id": "s3",
        "text": "脚印旁边，还有几粒撒落的玉米。"
      },
      {
        "id": "s4",
        "text": "冬冬想起来，昨天晚上，奶奶把一小袋玉米放在了窗台上。"
      },
      {
        "id": "s5",
        "text": "他赶紧跑过去看，袋子被咬破了一个小洞，玉米少了一大半。"
      },
      {
        "id": "s6",
        "text": "“是小偷吗？”冬冬有点紧张。"
      },
      {
        "id": "s7",
        "text": "奶奶走过来，蹲下看了看脚印，笑着说：“小偷的脚可没有这么小。你看，每个脚印前面还有几个小点点呢。”"
      },
      {
        "id": "s8",
        "text": "冬冬顺着脚印往回找，一直找到篱笆外面的大松树下。"
      },
      {
        "id": "s9",
        "text": "树洞里，一只小松鼠正抱着一粒玉米，吃得正香。"
      },
      {
        "id": "s10",
        "text": "冬冬笑了。"
      },
      {
        "id": "s11",
        "text": "第二天早上，他在窗台上放了一小碟玉米，旁边插了一张纸条：“给小松鼠的早餐。”"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "detail-key",
        "level": "L2",
        "interaction": "select",
        "prompt": "哪个细节最能说明，来过的不是人？",
        "options": [
          {
            "text": "脚印很小，每个脚印前面还有几个小点点"
          },
          {
            "text": "玉米少了一大半",
            "errorType": "irrelevant_detail"
          },
          {
            "text": "院子里铺满了厚厚的雪",
            "errorType": "irrelevant_detail"
          }
        ],
        "answer": 0,
        "hint": "奶奶一看就知道不是小偷，她看的是什么？"
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "select",
        "pairId": "dongdong-first-thought",
        "prompt": "冬冬看到袋子破了，一开始是怎么想的？",
        "options": [
          {
            "text": "担心是小偷来过"
          },
          {
            "text": "觉得是奶奶把玉米吃了",
            "errorType": "fabrication"
          },
          {
            "text": "觉得是雪把袋子压破了",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "找一找冬冬说的第一句话。"
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "evidence",
        "pairId": "dongdong-first-thought",
        "claimItemId": "q2",
        "evidenceFor": "q2",
        "prompt": "你从哪一句看出冬冬一开始的想法？点一点那一句。",
        "target": "sentence",
        "answer": [
          "s6"
        ],
        "hint": "找一找冬冬说的话和他的心情。"
      },
      {
        "id": "q4",
        "unit": "infer",
        "template": "cause-hidden",
        "level": "L3",
        "interaction": "select",
        "prompt": "袋子上的小洞，最可能是怎么来的？",
        "options": [
          {
            "text": "被小松鼠咬破的"
          },
          {
            "text": "奶奶不小心剪破的",
            "errorType": "fabrication"
          },
          {
            "text": "被厚厚的雪压破的",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "袋子是被“咬”破的，谁会咬？再看看故事最后找到了谁。"
      },
      {
        "id": "q5",
        "unit": "structure",
        "template": "signal-word",
        "level": "L3",
        "interaction": "evidence",
        "prompt": "故事里有一件事，其实发生在故事开头之前。哪个词告诉了我们？",
        "target": "phrase",
        "phrases": [
          "昨天晚上",
          "早上",
          "第二天早上",
          "一直"
        ],
        "answer": 0,
        "hint": "故事从“早上”开始讲，哪个时间比早上还要早？"
      },
      {
        "id": "q6",
        "unit": "structure",
        "template": "order-cards",
        "level": "L3",
        "interaction": "order",
        "prompt": "按照事情真正发生的先后排一排。注意：不是故事里写的先后哦！",
        "cards": [
          "奶奶把玉米放在窗台上",
          "小松鼠咬破袋子吃玉米",
          "冬冬发现雪地上的脚印",
          "冬冬给小松鼠准备早餐"
        ],
        "hint": "“昨天晚上”发生的事，比“早上”发生的事更早。"
      },
      {
        "id": "q7",
        "unit": "comprehend",
        "template": "main-point",
        "level": "L3",
        "interaction": "select",
        "prompt": "冬冬为什么在窗台上放了一小碟玉米？",
        "options": [
          {
            "text": "他想让小松鼠有吃的，不用再咬破袋子"
          },
          {
            "text": "他想把小松鼠抓住",
            "errorType": "contradicts_text"
          },
          {
            "text": "奶奶让他这样做的",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "看看纸条上写的是什么。"
      },
      {
        "id": "q8",
        "unit": "choose",
        "template": "word-fit",
        "level": "L4",
        "interaction": "select",
        "prompt": "“小松鼠吃得正香”，如果换成“小松鼠正在吃”，哪个更好？",
        "options": [
          {
            "text": "“吃得正香”更好，让人感觉小松鼠吃得又开心又满足"
          },
          {
            "text": "“正在吃”更好，字更少",
            "errorType": "literal_only"
          },
          {
            "text": "两句意思完全一样",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "读一读两句话，哪一句能让你想象出小松鼠的样子？"
      }
    ],
    "expressCcr": {
      "prompt": "换个角色想一想：如果你是小松鼠，看到纸条会怎么把自己的感受说清楚？",
      "slots": [
        {
          "key": "feel",
          "name": "我会觉得……",
          "options": [
            "很惊讶",
            "很开心",
            "有点不好意思",
            "很感动"
          ]
        },
        {
          "key": "why",
          "name": "因为……",
          "options": [
            "原来有人知道我来过",
            "以后不用再咬袋子了",
            "我昨天把奶奶的袋子咬破了",
            "冬天终于有早餐吃了"
          ]
        }
      ],
      "template": "如果我是小松鼠，我会觉得{feel}，因为{why}。",
      "otherIdeas": [
        {
          "viewpoint": "有人站在小松鼠的角度",
          "text": "“我有点不好意思，昨天把奶奶的袋子咬破了。”"
        },
        {
          "viewpoint": "有人想到了以后",
          "text": "小松鼠每天早上都会来，冬冬交到了一个新朋友。"
        },
        {
          "viewpoint": "有人想到了奶奶",
          "text": "奶奶看到纸条，一定会夸冬冬是个有爱心的孩子。"
        }
      ],
      "reflectPrompt": "看看别人的想法，哪一个是你一开始没有想到的？"
    },
    "createCcr": {
      "prompt": "从雪地脚印的线索出发，设计一个新的调查方向或后续故事。",
      "promptZh": "从雪地脚印的线索出发，设计一个新的调查方向或后续故事。",
      "slots": [
        {
          "key": "newQuestion",
          "name": "新的调查问题是……",
          "options": [
            "两种不同脚印为什么会在树边交会",
            "夜里出现的新脚印来自哪一种动物",
            "脚印深浅能不能说明动物走得快还是慢",
            "雪停以后哪些脚印最先消失"
          ]
        },
        {
          "key": "newEvidence",
          "name": "可以收集的新证据是……",
          "options": [
            "比较交会前后脚印的方向和间距",
            "记录脚印旁留下的羽毛、果壳或细毛",
            "测量几组脚印的深浅和步距",
            "在不同时间画下同一片雪地的变化"
          ]
        },
        {
          "key": "newEvent",
          "name": "接下来可能发生……",
          "options": [
            "孩子们发现两只动物曾在树边争抢果子",
            "一场小雪盖住旧脚印，却留下新的线索",
            "看守公园的人带来一本本地动物图册",
            "孩子们按照证据画出几种不同的解释"
          ]
        }
      ],
      "template": "新的调查问题是{newQuestion}。大家准备{newEvidence}。接下来，{newEvent}。",
      "otherIdeas": [
        {
          "viewpoint": "改变叙述视角",
          "text": "让留下脚印的小动物讲述自己经过雪地时看到了什么。"
        },
        {
          "viewpoint": "增加证据组合",
          "text": "除了脚印，再加入折断的细枝和落在雪上的种子，让人物比较多种线索。"
        },
        {
          "viewpoint": "改变人物决定",
          "text": "人物先不公布答案，而是设计第二天的观察来检验自己的猜想。"
        }
      ],
      "reflectPrompt": "哪一个想法提出了新的问题、证据或故事方向，而不是只把原来的观察过程再说一遍？"
    }
  },

    // ── English G1 ───────────────────────────────────────────────────────────
      {
    "id": "en-g1-max-kite",
    "lang": "en",
    "grade": "G1",
    "genre": "story",
    "anchors": {
      "curriculum": [
        "CCSS RL.1.1",
        "CCSS RL.1.2",
        "CCSS RL.1.3",
        "CCSS RL.1.4",
        "UK KS1 Y1 comprehension"
      ],
      "level": {
        "sentences": 8,
        "words": 53
      }
    },
    "title": "Max and the Kite",
    "sentences": [
      {
        "id": "s1",
        "text": "Max had a red kite."
      },
      {
        "id": "s2",
        "text": "He ran and ran, but the kite fell down."
      },
      {
        "id": "s3",
        "text": "\"The wind is too weak,\" said Grandpa."
      },
      {
        "id": "s4",
        "text": "So Max sat on the grass and waited."
      },
      {
        "id": "s5",
        "text": "Soon the trees began to shake."
      },
      {
        "id": "s6",
        "text": "Max jumped up and ran again."
      },
      {
        "id": "s7",
        "text": "Up, up, up went the kite!"
      },
      {
        "id": "s8",
        "text": "Max laughed. \"The wind is back!\""
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "comprehend",
        "template": "detail-find",
        "level": "L1",
        "interaction": "select",
        "prompt": "Why did the kite fall down at first?",
        "options": [
          {
            "text": "The wind was too weak."
          },
          {
            "text": "Max did not run.",
            "errorType": "contradicts_text"
          },
          {
            "text": "The kite was broken.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Listen to what Grandpa said."
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "cause-hidden",
        "level": "L2",
        "interaction": "select",
        "prompt": "Why did Max sit on the grass?",
        "options": [
          {
            "text": "He was waiting for the wind."
          },
          {
            "text": "He did not like his kite.",
            "errorType": "fabrication"
          },
          {
            "text": "Grandpa told him to sit down.",
            "errorType": "misattribution"
          }
        ],
        "answer": 0,
        "hint": "What did Max need to fly his kite?"
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "evidence",
        "prompt": "How did Max know the wind was strong again? Tap the sentence.",
        "target": "sentence",
        "answer": [
          "s5"
        ],
        "hint": "You cannot see wind. What moved?"
      },
      {
        "id": "q4",
        "unit": "structure",
        "template": "signal-word",
        "level": "L3",
        "interaction": "evidence",
        "prompt": "Which word tells us the trees shook after Max waited?",
        "target": "phrase",
        "phrases": [
          "Soon",
          "So",
          "but",
          "again"
        ],
        "answer": 0,
        "hint": "Look at the start of the sentence about the trees."
      },
      {
        "id": "q5",
        "unit": "structure",
        "template": "order-cards",
        "level": "L3",
        "interaction": "order",
        "prompt": "Put the story in order.",
        "cards": [
          "The kite fell down.",
          "Max waited on the grass.",
          "The trees began to shake.",
          "The kite went up high."
        ],
        "hint": "What went wrong at the very beginning?"
      },
      {
        "id": "q6",
        "unit": "comprehend",
        "template": "main-point",
        "level": "L2",
        "interaction": "select",
        "prompt": "What is this story mostly about?",
        "options": [
          {
            "text": "Max waits for the wind and flies his kite."
          },
          {
            "text": "Max has a red kite.",
            "errorType": "detail_as_main"
          },
          {
            "text": "Grandpa buys Max a new kite.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Think about the beginning, the middle, and the end."
      },
      {
        "id": "q7",
        "unit": "choose",
        "template": "word-fit",
        "level": "L4",
        "interaction": "select",
        "prompt": "Why does the story say \"Up, up, up\" and not just \"up\"?",
        "options": [
          {
            "text": "To show the kite went very, very high."
          },
          {
            "text": "Because there were three kites.",
            "errorType": "literal_only"
          },
          {
            "text": "Because Grandpa said it three times.",
            "errorType": "misattribution"
          }
        ],
        "answer": 0,
        "hint": "Say \"up\" once, then \"up, up, up\". Which one feels higher?"
      },
      {
        "id": "q-observe-max-kite",
        "unit": "observe",
        "template": "text-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "Which detail is actually stated in Max’s kite story?",
        "options": [
          {
            "text": "Max had a red kite."
          },
          {
            "text": "Max found a silver kite hidden inside a tree.",
            "errorType": "fabrication"
          },
          {
            "text": "The wind carried Max and the kite across the river.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Look again at sentence s1."
      }
    ],
    "expressCcr": {
      "prompt": "How could Max explain his plan for tomorrow if there is no wind at all?",
      "slots": [
        {
          "key": "act",
          "name": "Max will…",
          "options": [
            "run with the kite anyway",
            "ask Grandpa for a new idea",
            "make a paper boat instead",
            "watch the trees and wait"
          ]
        },
        {
          "key": "why",
          "name": "because…",
          "options": [
            "he still wants to fly his kite",
            "Grandpa always has good ideas",
            "there are other fun things to do",
            "the wind might come back later"
          ]
        }
      ],
      "template": "Tomorrow, Max will {act}, because {why}.",
      "otherIdeas": [
        {
          "viewpoint": "Someone thought about Grandpa",
          "text": "Grandpa could tell Max a story about the windiest day ever."
        },
        {
          "viewpoint": "Someone made a new plan",
          "text": "Max could hold the kite and ride his bike to make his own wind!"
        },
        {
          "viewpoint": "Someone thought about the weather",
          "text": "Max could check the trees every hour to see if the wind comes."
        }
      ],
      "reflectPrompt": "Which idea did you not think of at first?"
    },
    "createCcr": {
      "prompt": "Create a new direction for Max’s kite story by changing a condition, decision, viewpoint, or use for the kite.",
      "slots": [
        {
          "key": "change",
          "name": "Change the story by…",
          "options": [
            "having the wind stop just before the kite rises",
            "letting the kite narrate what it sees from above",
            "giving Max a second kite with a different shape",
            "turning the kite into a signal for a playground team"
          ]
        },
        {
          "key": "response",
          "name": "Then Max could…",
          "options": [
            "test a lighter tail and compare what happens",
            "describe the ground from the kite’s viewpoint",
            "choose which kite fits the changing wind",
            "use the kite signal to begin a new group activity"
          ]
        }
      ],
      "template": "I would change the story by {change}. Then Max could {response}.",
      "otherIdeas": [
        {
          "viewpoint": "Change the condition",
          "text": "A sudden calm makes Max invent a way to test the kite without strong wind."
        },
        {
          "viewpoint": "Change the narrator",
          "text": "The kite tells how the trees, field, and people look as it rises."
        },
        {
          "viewpoint": "Add a new purpose",
          "text": "Max redesigns the kite to carry a lightweight picture message."
        }
      ],
      "reflectPrompt": "Which idea creates a genuinely new problem, viewpoint, or use instead of retelling how Max flew the kite?"
    }
  },

    // ── English G2 ───────────────────────────────────────────────────────────
      {
    "id": "en-g2-class-garden",
    "lang": "en",
    "grade": "G2",
    "genre": "story",
    "anchors": {
      "curriculum": [
        "CCSS RL.2.1",
        "CCSS RL.2.3",
        "CCSS RL.2.4",
        "CCSS RL.2.5",
        "UK KS1 Y2 comprehension"
      ],
      "level": {
        "sentences": 13,
        "words": 145
      }
    },
    "title": "The Class Garden",
    "sentences": [
      {
        "id": "s1",
        "text": "Every morning, Room 2 checked on their class garden."
      },
      {
        "id": "s2",
        "text": "One Monday, Ben ran inside. \"Our lettuce is gone!\" he shouted."
      },
      {
        "id": "s3",
        "text": "Only small stems were left, and there were tiny holes in the fence."
      },
      {
        "id": "s4",
        "text": "\"Maybe someone took it,\" said Ava."
      },
      {
        "id": "s5",
        "text": "Ms. Lee knelt down and pointed at the soil. \"Look at these little round droppings.\""
      },
      {
        "id": "s6",
        "text": "Ben looked closer. \"And these footprints have long back feet!\""
      },
      {
        "id": "s7",
        "text": "The class looked at each other. \"A rabbit!\" they said together."
      },
      {
        "id": "s8",
        "text": "At first, Ben was upset. He had planted that lettuce himself."
      },
      {
        "id": "s9",
        "text": "Then Ava had an idea. \"What if we fix the fence and plant extra lettuce outside it?\""
      },
      {
        "id": "s10",
        "text": "The next week, the class worked together."
      },
      {
        "id": "s11",
        "text": "They fixed the holes and planted a small row of lettuce just for the rabbit."
      },
      {
        "id": "s12",
        "text": "On Friday, Ben peeked out the window and smiled."
      },
      {
        "id": "s13",
        "text": "A little brown rabbit was munching on its very own lunch."
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "detail-key",
        "level": "L2",
        "interaction": "select",
        "prompt": "Which clue best shows that an animal, not a person, ate the lettuce?",
        "options": [
          {
            "text": "The footprints had long back feet."
          },
          {
            "text": "Only small stems were left.",
            "errorType": "irrelevant_detail"
          },
          {
            "text": "It happened on a Monday.",
            "errorType": "irrelevant_detail"
          }
        ],
        "answer": 0,
        "hint": "Which clue would look different if a person did it?"
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "claim-check",
        "level": "L3",
        "interaction": "select",
        "prompt": "Ava said, \"Maybe someone took it.\" Was she right?",
        "options": [
          {
            "text": "No. The clues showed a rabbit ate it."
          },
          {
            "text": "Yes. A person took the lettuce.",
            "errorType": "contradicts_text"
          },
          {
            "text": "The story never tells us.",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "Look at what the class found in the soil."
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "select",
        "pairId": "ben-friday-feeling",
        "prompt": "How did Ben feel on Friday?",
        "options": [
          {
            "text": "Happy"
          },
          {
            "text": "Still upset",
            "errorType": "sequence_confusion"
          },
          {
            "text": "Scared of the rabbit",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "The story does not say \"happy\". What did Ben do on Friday?"
      },
      {
        "id": "q4",
        "unit": "infer",
        "template": "feeling-evidence",
        "level": "L2",
        "interaction": "evidence",
        "pairId": "ben-friday-feeling",
        "claimItemId": "q3",
        "evidenceFor": "q3",
        "prompt": "Which sentence helps you know how Ben felt on Friday? Tap it.",
        "target": "sentence",
        "answer": [
          "s12"
        ],
        "hint": "Find the sentence that starts with \"On Friday\"."
      },
      {
        "id": "q5",
        "unit": "infer",
        "template": "cause-hidden",
        "level": "L3",
        "interaction": "select",
        "prompt": "Why did the class plant extra lettuce outside the fence?",
        "options": [
          {
            "text": "So the rabbit had its own food and left the garden alone."
          },
          {
            "text": "To catch the rabbit in a trap.",
            "errorType": "fabrication"
          },
          {
            "text": "Because there was no room inside the fence.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Who was the extra row \"just for\"?"
      },
      {
        "id": "q6",
        "unit": "structure",
        "template": "order-cards",
        "level": "L3",
        "interaction": "order",
        "prompt": "Put the beginning, middle, and end of the story in order.",
        "cards": [
          "Ben finds the lettuce is gone.",
          "The class looks at the clues.",
          "Ava has an idea.",
          "The rabbit eats its own lunch."
        ],
        "hint": "The beginning is the problem. The end is how it was solved."
      },
      {
        "id": "q7",
        "unit": "choose",
        "template": "word-fit",
        "level": "L4",
        "interaction": "select",
        "prompt": "The rabbit was \"munching\". Why is \"munching\" better than \"eating\" here?",
        "options": [
          {
            "text": "It sounds like the rabbit is chewing happily, bite after bite."
          },
          {
            "text": "It means the rabbit is sleeping.",
            "errorType": "contradicts_text"
          },
          {
            "text": "There is no difference at all.",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "Say \"munch, munch, munch\". What do you hear and see?"
      },
      {
        "id": "q-comprehend-class-garden",
        "unit": "comprehend",
        "template": "text-decision-detail",
        "level": "L2",
        "interaction": "select",
        "prompt": "What did the class decide to do after identifying the rabbit?",
        "options": [
          {
            "text": "Repair the fence and plant extra lettuce outside it for the rabbit."
          },
          {
            "text": "Remove the garden and stop growing lettuce.",
            "errorType": "contradicts_text"
          },
          {
            "text": "Set a trap beside the holes in the fence.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Read Ava’s idea and what the class did in sentences 9 through 11."
      }
    ],
    "expressCcr": {
      "prompt": "Think like the rabbit: how would you clearly explain your message to Room 2?",
      "slots": [
        {
          "key": "say",
          "name": "I would say…",
          "options": [
            "Thank you!",
            "Sorry about your lettuce!",
            "Wow, a garden just for me!",
            "Can I come back tomorrow?"
          ]
        },
        {
          "key": "why",
          "name": "because…",
          "options": [
            "I was very hungry",
            "I did not know it was your garden",
            "now I have my own food",
            "you were kind to me"
          ]
        }
      ],
      "template": "\"{say}\" I would say that because {why}.",
      "otherIdeas": [
        {
          "viewpoint": "Someone thought about Ben",
          "text": "Ben might draw the rabbit and hang the picture on the class wall."
        },
        {
          "viewpoint": "Someone thought about the future",
          "text": "Maybe the rabbit will bring its babies next spring!"
        },
        {
          "viewpoint": "Someone asked a new question",
          "text": "What if a second rabbit comes? Will one row be enough?"
        }
      ],
      "reflectPrompt": "Which idea did you not think of at first?"
    },
    "createCcr": {
      "prompt": "Create a new direction for the class garden by adding a different animal-friendly design, investigation, viewpoint, or class decision.",
      "slots": [
        {
          "key": "newDirection",
          "name": "The class could decide to…",
          "options": [
            "build a separate snack patch for visiting animals",
            "design a gate that protects the garden without blocking small wildlife paths",
            "set up a camera and footprint station to study nighttime visitors",
            "let the rabbit narrate how it found the garden"
          ]
        },
        {
          "key": "newEvidence",
          "name": "They could collect…",
          "options": [
            "drawings of which animals visit each part of the garden",
            "daily counts of tracks, droppings, and nibbled leaves",
            "measurements comparing plants inside and outside the fence",
            "notes showing how visitors behave after the design changes"
          ]
        },
        {
          "key": "newResult",
          "name": "The new story could lead to…",
          "options": [
            "the class improving the design after comparing its evidence",
            "students discovering that different animals leave different clues",
            "the rabbit and the class using separate parts of the garden",
            "another class proposing a different wildlife-friendly solution"
          ]
        }
      ],
      "template": "The class decides to {newDirection}. They collect {newEvidence}, and the new story leads to {newResult}.",
      "otherIdeas": [
        {
          "viewpoint": "Change the narrator",
          "text": "The rabbit tells the story of finding the holes, the lettuce, and the new food patch."
        },
        {
          "viewpoint": "Add a new investigation",
          "text": "Students compare clues left by rabbit, bird, and squirrel visitors."
        },
        {
          "viewpoint": "Add a new design decision",
          "text": "The class creates a garden map with protected crops and a separate wildlife corner."
        }
      ],
      "reflectPrompt": "Which idea creates a genuinely new question, viewpoint, design, or decision instead of retelling how the class found the rabbit?"
    }
  },

    // ── 中文 G1 · 经典古诗 ────────────────────────────────────────────────────
      {
    "id": "zh-g1-goose-poem",
    "lang": "zh",
    "grade": "G1",
    "genre": "poem",
    "source": {
      "type": "public-domain-classic",
      "title": "咏鹅",
      "author": "骆宾王",
      "period": "唐"
    },
    "anchors": {
      "curriculum": [
        "课标2022·第一学段·文学阅读与创意表达",
        "统编语文·古诗词与日积月累"
      ],
      "level": {
        "hanziCount": 18
      }
    },
    "title": "咏鹅",
    "sentences": [
      {
        "id": "s1",
        "text": "鹅，鹅，鹅，"
      },
      {
        "id": "s2",
        "text": "曲项向天歌。"
      },
      {
        "id": "s3",
        "text": "白毛浮绿水，"
      },
      {
        "id": "s4",
        "text": "红掌拨清波。"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "image-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "诗里写了鹅身上的哪两种颜色？",
        "options": [
          {
            "text": "白色和红色"
          },
          {
            "text": "绿色和红色",
            "errorType": "misattribution"
          },
          {
            "text": "白色和蓝色",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "找一找写“毛”和“掌”的两句。"
      },
      {
        "id": "q2",
        "unit": "comprehend",
        "template": "scene-summary",
        "level": "L2",
        "interaction": "select",
        "prompt": "这首诗主要写了什么画面？",
        "options": [
          {
            "text": "一只鹅在水上游动、鸣叫"
          },
          {
            "text": "一只鹅在岸上睡觉",
            "errorType": "fabrication"
          },
          {
            "text": "一个孩子在水里划船",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "把“向天歌”“浮绿水”“拨清波”连起来想一想。"
      },
      {
        "id": "q3",
        "unit": "structure",
        "template": "image-order",
        "level": "L2",
        "interaction": "order",
        "prompt": "按照诗句出现的顺序，把画面排一排。",
        "cards": [
          "鹅伸长脖子向天鸣叫",
          "白色羽毛浮在绿水上",
          "红色脚掌拨动清波"
        ],
        "hint": "先读第二句，再读第三、第四句。"
      },
      {
        "id": "q4",
        "unit": "choose",
        "template": "word-image",
        "level": "L3",
        "interaction": "select",
        "prompt": "“红掌拨清波”中的“拨”让你看到怎样的动作？",
        "options": [
          {
            "text": "鹅掌一下下划动水面"
          },
          {
            "text": "鹅掌静静停在水里",
            "errorType": "contradicts_text"
          },
          {
            "text": "鹅用嘴把水喝光",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "用手做一做“拨”的动作，水会不会动？"
      },
      {
        "id": "q-infer-goose-picture",
        "unit": "infer",
        "template": "claim",
        "level": "L2",
        "interaction": "select",
        "pairId": "goose-vivid-water-picture",
        "prompt": "诗中的颜色词和动作词合在一起，形成了怎样的画面？",
        "promptZh": "诗中的颜色词和动作词合在一起，形成了怎样的画面？",
        "options": [
          {
            "text": "白毛、绿水、红掌形成鲜明颜色，“浮”和“拨”让鹅在水面上动起来。",
            "textZh": "白毛、绿水、红掌形成鲜明颜色，“浮”和“拨”让鹅在水面上动起来。"
          },
          {
            "text": "诗中只写了鹅的颜色，没有写鹅的动作。",
            "textZh": "诗中只写了鹅的颜色，没有写鹅的动作。",
            "errorType": "incomplete_evidence"
          },
          {
            "text": "诗中写鹅飞过高山，所以画面显得很开阔。",
            "textZh": "诗中写鹅飞过高山，所以画面显得很开阔。",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "找一找表示颜色的词和表示动作的词。"
      },
      {
        "id": "q-infer-goose-picture-evidence",
        "unit": "infer",
        "template": "claim-evidence",
        "level": "L2",
        "interaction": "evidence",
        "pairId": "goose-vivid-water-picture",
        "claimItemId": "q-infer-goose-picture",
        "evidenceFor": "q-infer-goose-picture",
        "target": "sentence",
        "prompt": "哪些诗句直接写出了鹅的颜色和水面动作？",
        "promptZh": "哪些诗句直接写出了鹅的颜色和水面动作？",
        "answer": [
          "s3",
          "s4"
        ],
        "hint": "选择含有白毛、绿水、红掌、浮或拨等词的诗句。"
      }
    ],
    "createCcr": {
      "prompt": "如果再给这幅画添一样东西，你会添什么？",
      "slots": [
        {
          "key": "thing",
          "name": "我会添……",
          "options": [
            "一片荷叶",
            "一条小鱼",
            "几朵白云",
            "一只小鸭"
          ]
        },
        {
          "key": "why",
          "name": "因为……",
          "options": [
            "画面会更热闹",
            "它也生活在水边",
            "它能衬托清清的水",
            "它会和鹅一起玩"
          ]
        }
      ],
      "template": "我会添{thing}，因为{why}。",
      "otherIdeas": [
        {
          "viewpoint": "有人注意到声音",
          "text": "添几只小鸟，让鹅的歌声有回应。"
        },
        {
          "viewpoint": "有人注意到颜色",
          "text": "添一朵粉色荷花，让白、红、绿三种颜色更鲜明。"
        },
        {
          "viewpoint": "有人换了观察位置",
          "text": "添水里的倒影，从水面下面看鹅。"
        }
      ],
      "reflectPrompt": "哪一种想法让你看到了原诗里没有直接写出的新画面？"
    },
    "expressCcr": {
      "prompt": "根据原诗，说清楚鹅的动作、颜色和水面画面是怎样联系在一起的。",
      "promptZh": "根据原诗，说清楚鹅的动作、颜色和水面画面是怎样联系在一起的。",
      "slots": [
        {
          "key": "movement",
          "name": "鹅的动作是……",
          "options": [
            "弯着长颈向天歌唱",
            "白毛浮在绿水上",
            "红掌拨动清清的水波",
            "一边歌唱，一边在水中游动"
          ]
        },
        {
          "key": "color",
          "name": "诗中的颜色让人看到……",
          "options": [
            "白色羽毛和绿色水面互相映衬",
            "红色脚掌拨开水波",
            "白、绿、红三种颜色组成鲜明画面",
            "鹅的身体和水面的颜色清楚分开"
          ]
        }
      ],
      "template": "诗中，{movement}；{color}。",
      "otherIdeas": [
        {
          "viewpoint": "先说动作",
          "text": "鹅向天歌唱，又浮在水面上，用红掌拨动清波。"
        },
        {
          "viewpoint": "再说颜色",
          "text": "白毛、绿水和红掌放在一起，使水面画面明亮又鲜明。"
        },
        {
          "viewpoint": "联系语言和画面",
          "text": "“浮”和“拨”让静止的颜色变成了正在发生的动作。"
        }
      ],
      "reflectPrompt": "哪一种表达既引用了原诗动作，也说明了颜色怎样组成画面？"
    }
  },

    // ── 中文 G2 · 经典寓言 ────────────────────────────────────────────────────
      {
    "id": "zh-g2-snipe-clam-adaptation",
    "lang": "zh",
    "grade": "G2",
    "genre": "fable",
    "source": {
      "type": "public-domain-classic-adaptation",
      "title": "鹬蚌相争",
      "origin": "《战国策》传统寓言",
      "adaptation": "MindsEvo age-level retelling"
    },
    "anchors": {
      "curriculum": [
        "课标2022·第一学段·文学阅读与创意表达",
        "课标2022·思辨性阅读与表达"
      ],
      "level": {
        "hanziCount": 154
      }
    },
    "title": "鹬蚌相争",
    "sentences": [
      {
        "id": "s1",
        "text": "河边，一只河蚌张开壳晒太阳。"
      },
      {
        "id": "s2",
        "text": "一只鹬飞来，伸长嘴去啄蚌肉。"
      },
      {
        "id": "s3",
        "text": "河蚌立刻合上壳，紧紧夹住了鹬的长嘴。"
      },
      {
        "id": "s4",
        "text": "鹬说：“今天不下雨，明天也不下雨，你就会干死。”"
      },
      {
        "id": "s5",
        "text": "河蚌说：“今天不放你，明天也不放你，你就会饿死。”"
      },
      {
        "id": "s6",
        "text": "它们谁也不肯先松开。"
      },
      {
        "id": "s7",
        "text": "一个渔夫走过来，不费力气就把它们一起捉走了。"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "detail-key",
        "level": "L2",
        "interaction": "select",
        "prompt": "哪个细节最能说明鹬和河蚌都不肯让步？",
        "options": [
          {
            "text": "它们谁也不肯先松开"
          },
          {
            "text": "河蚌在河边晒太阳",
            "errorType": "irrelevant_detail"
          },
          {
            "text": "渔夫从河边走过",
            "errorType": "sequence_confusion"
          }
        ],
        "answer": 0,
        "hint": "找一找写“谁也不肯”的那一句。"
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "cause-hidden",
        "level": "L3",
        "interaction": "select",
        "pairId": "fisherman-easy-catch",
        "prompt": "为什么渔夫能不费力气地捉住它们？",
        "options": [
          {
            "text": "鹬和河蚌互相夹住，谁也不能逃走"
          },
          {
            "text": "渔夫跑得比它们快",
            "errorType": "fabrication"
          },
          {
            "text": "它们主动请渔夫帮忙",
            "errorType": "contradicts_text"
          }
        ],
        "answer": 0,
        "hint": "渔夫来以前，鹬的嘴和河蚌的壳是什么状态？"
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "cause-evidence",
        "level": "L3",
        "interaction": "evidence",
        "pairId": "fisherman-easy-catch",
        "claimItemId": "q2",
        "evidenceFor": "q2",
        "prompt": "哪一句最能支持“它们谁也不能逃走”？点一点。",
        "target": "sentence",
        "answer": [
          "s6"
        ],
        "hint": "找一找双方都不肯改变做法的那一句。"
      },
      {
        "id": "q4",
        "unit": "structure",
        "template": "cause-chain",
        "level": "L3",
        "interaction": "order",
        "prompt": "按照故事的因果顺序排一排。",
        "cards": [
          "鹬去啄河蚌",
          "河蚌夹住鹬嘴",
          "双方都不肯松开",
          "渔夫把它们一起捉走"
        ],
        "hint": "先找争斗是怎么开始的，再看最后谁得了好处。"
      },
      {
        "id": "q5",
        "unit": "choose",
        "template": "tone-fit",
        "level": "L4",
        "interaction": "select",
        "prompt": "鹬和河蚌说话时，哪一个词最能概括它们的语气？",
        "options": [
          {
            "text": "互相威胁"
          },
          {
            "text": "互相感谢",
            "errorType": "contradicts_text"
          },
          {
            "text": "互相请教",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "两句话都在说对方会有不好的结果。"
      },
      {
        "id": "q-comprehend-snipe-clam-result",
        "unit": "comprehend",
        "template": "text-cause-result",
        "level": "L2",
        "interaction": "select",
        "prompt": "鹬和蚌一直互不相让，最后发生了什么？",
        "promptZh": "鹬和蚌一直互不相让，最后发生了什么？",
        "options": [
          {
            "text": "渔夫趁它们相持不下，把它们一起捉走了。",
            "textZh": "渔夫趁它们相持不下，把它们一起捉走了。"
          },
          {
            "text": "鹬和蚌一起飞到天空中去了。",
            "textZh": "鹬和蚌一起飞到天空中去了。",
            "errorType": "fabrication"
          },
          {
            "text": "蚌立刻松开鹬，双方各自离开。",
            "textZh": "蚌立刻松开鹬，双方各自离开。",
            "errorType": "contradicts_text"
          }
        ],
        "answer": 0,
        "hint": "查看写到s7的结尾部分。"
      }
    ],
    "createCcr": {
      "prompt": "如果鹬和河蚌能在渔夫到来前说一句新话，它们会怎样解决问题？",
      "slots": [
        {
          "key": "speaker",
          "name": "谁先说……",
          "options": [
            "鹬",
            "河蚌",
            "它们一起"
          ]
        },
        {
          "key": "plan",
          "name": "解决办法是……",
          "options": [
            "一起数三下，同时松开",
            "先停止争吵，听听对方想要什么",
            "约定谁也不再伤害对方",
            "先躲开渔夫，再解决分歧"
          ]
        }
      ],
      "template": "{speaker}先提出：{plan}。",
      "otherIdeas": [
        {
          "viewpoint": "有人先处理危险",
          "text": "它们先合作逃开渔夫，再谈谁对谁错。"
        },
        {
          "viewpoint": "有人改变目标",
          "text": "鹬决定去找别的食物，河蚌也不再夹住它。"
        },
        {
          "viewpoint": "有人设计规则",
          "text": "以后谁想靠近，都先开口说明来意。"
        }
      ],
      "reflectPrompt": "哪一个办法既能解决眼前危险，也能减少下一次争斗？"
    },
    "expressCcr": {
      "prompt": "根据原文，说明鹬和蚌为什么会僵持，以及这种僵持带来了什么结果。",
      "promptZh": "根据原文，说明鹬和蚌为什么会僵持，以及这种僵持带来了什么结果。",
      "slots": [
        {
          "key": "conflict",
          "name": "双方的冲突是……",
          "options": [
            "鹬想啄蚌肉，蚌却夹住了鹬的嘴",
            "鹬和蚌都想让对方先松开",
            "它们互相威胁，却都不肯退让",
            "双方一直僵持，谁也没有解决问题"
          ]
        },
        {
          "key": "action",
          "name": "它们的做法是……",
          "options": [
            "继续争执，没有注意周围的危险",
            "只想着让对方认输",
            "都坚持自己的办法，不肯先停下来",
            "把力气用在彼此对抗上"
          ]
        },
        {
          "key": "result",
          "name": "最后的结果是……",
          "options": [
            "渔夫趁机把它们一起捉走",
            "双方都因为僵持而失去了脱身机会",
            "它们的争斗让第三者得到了好处",
            "谁也没有赢，反而一起陷入危险"
          ]
        }
      ],
      "template": "鹬和蚌因为{conflict}。它们{action}，最后{result}。",
      "otherIdeas": [
        {
          "viewpoint": "按原因和结果说明",
          "text": "双方都不肯退让，所以一直僵持，给了渔夫可乘之机。"
        },
        {
          "viewpoint": "比较想法和结果",
          "text": "鹬和蚌都想让自己占上风，结果却一起被捉走。"
        },
        {
          "viewpoint": "引用故事线索",
          "text": "蚌夹住鹬嘴、双方互相威胁和渔夫出现，共同说明争斗怎样造成失败。"
        }
      ],
      "reflectPrompt": "哪一种表达既说明了双方的冲突和做法，也清楚解释了最后的结果？"
    }
  },

    // ── English G1 · Traditional rhyme ─────────────────────────────────────────
      {
    "id": "en-g1-twinkle-rhyme",
    "lang": "en",
    "grade": "G1",
    "genre": "rhyme",
    "source": {
      "type": "public-domain-traditional",
      "title": "Twinkle, Twinkle, Little Star",
      "note": "Traditional public-domain verse"
    },
    "anchors": {
      "curriculum": [
        "CCSS RL.1.1",
        "CCSS RL.1.4",
        "UK KS1 poetry and rhyme"
      ],
      "level": {
        "lines": 6,
        "words": 24
      }
    },
    "title": "Twinkle, Twinkle, Little Star",
    "sentences": [
      {
        "id": "s1",
        "text": "Twinkle, twinkle, little star,"
      },
      {
        "id": "s2",
        "text": "How I wonder what you are!"
      },
      {
        "id": "s3",
        "text": "Up above the world so high,"
      },
      {
        "id": "s4",
        "text": "Like a diamond in the sky."
      },
      {
        "id": "s5",
        "text": "Twinkle, twinkle, little star,"
      },
      {
        "id": "s6",
        "text": "How I wonder what you are!"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "detail-find",
        "level": "L1",
        "interaction": "select",
        "prompt": "Where is the star in the rhyme?",
        "options": [
          {
            "text": "High above the world"
          },
          {
            "text": "Under the sea",
            "errorType": "fabrication"
          },
          {
            "text": "Inside a house",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Look at the line that begins with “Up above”."
      },
      {
        "id": "q2",
        "unit": "comprehend",
        "template": "speaker-question",
        "level": "L2",
        "interaction": "select",
        "prompt": "What is the speaker wondering about?",
        "options": [
          {
            "text": "What the star is"
          },
          {
            "text": "Where the sun went",
            "errorType": "fabrication"
          },
          {
            "text": "How to find a diamond",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "Which line ends with a question-like exclamation?"
      },
      {
        "id": "q3",
        "unit": "choose",
        "template": "comparison-image",
        "level": "L3",
        "interaction": "select",
        "prompt": "Why does the rhyme compare the star to a diamond?",
        "options": [
          {
            "text": "Both can look small, bright, and sparkling"
          },
          {
            "text": "The star is really made of a diamond",
            "errorType": "literal_only"
          },
          {
            "text": "Both are found under the ground",
            "errorType": "contradicts_text"
          }
        ],
        "answer": 0,
        "hint": "Think about how a diamond looks when light shines on it."
      },
      {
        "id": "q4",
        "unit": "structure",
        "template": "refrain-pattern",
        "level": "L3",
        "interaction": "select",
        "prompt": "Which lines return at the end of the rhyme?",
        "options": [
          {
            "text": "The first two lines"
          },
          {
            "text": "Only the diamond line",
            "errorType": "misattribution"
          },
          {
            "text": "No lines return",
            "errorType": "contradicts_text"
          }
        ],
        "answer": 0,
        "hint": "Compare the beginning with the ending."
      },
      {
        "id": "q-infer-twinkle-star-picture",
        "unit": "infer",
        "template": "claim",
        "level": "L2",
        "interaction": "select",
        "pairId": "twinkle-star-picture",
        "prompt": "What picture of the star do the words in the rhyme create?",
        "options": [
          {
            "text": "The star looks small, bright, and sparkling high above the world."
          },
          {
            "text": "The star is lying quietly on the ground beside the speaker.",
            "errorType": "contradicts_text"
          },
          {
            "text": "The star is hidden by rain and cannot be seen.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Use the words that describe how the star shines and where it appears."
      },
      {
        "id": "q-infer-twinkle-star-picture-evidence",
        "unit": "infer",
        "template": "claim-evidence",
        "level": "L2",
        "interaction": "evidence",
        "pairId": "twinkle-star-picture",
        "claimItemId": "q-infer-twinkle-star-picture",
        "evidenceFor": "q-infer-twinkle-star-picture",
        "target": "sentence",
        "answer": [
          "s1",
          "s3",
          "s4"
        ]
      }
    ],
    "createCcr": {
      "prompt": "Choose a new thing in the night sky and compare it to something.",
      "slots": [
        {
          "key": "thing",
          "name": "I see……",
          "options": [
            "the moon",
            "a cloud",
            "a comet",
            "a tiny planet"
          ]
        },
        {
          "key": "image",
          "name": "It is like……",
          "options": [
            "a silver boat",
            "a soft pillow",
            "a bright arrow",
            "a round marble"
          ]
        }
      ],
      "template": "I see {thing}. It is like {image}.",
      "otherIdeas": [
        {
          "viewpoint": "Someone used movement",
          "text": "A comet is like a paintbrush racing across the sky."
        },
        {
          "viewpoint": "Someone used sound",
          "text": "A quiet moon is like a song with no words."
        },
        {
          "viewpoint": "Someone changed the viewpoint",
          "text": "From the moon, Earth might look like a blue marble."
        }
      ],
      "reflectPrompt": "Which comparison helps you see the night sky in a new way?"
    },
    "expressCcr": {
      "prompt": "Use details from the rhyme to explain how its words help a reader picture the star.",
      "slots": [
        {
          "key": "place",
          "name": "Where the star appears",
          "options": [
            "high above the world",
            "up in the dark sky",
            "far overhead where the speaker looks",
            "above everything the speaker can see"
          ]
        },
        {
          "key": "look",
          "name": "How the star looks",
          "options": [
            "small and bright as it twinkles",
            "sparkling like a diamond",
            "shining with a repeated flicker",
            "bright enough to catch the speaker’s attention"
          ]
        },
        {
          "key": "wording",
          "name": "How the rhyme creates the picture",
          "options": [
            "it repeats “twinkle” to emphasize the sparkling light",
            "it compares the star to a diamond",
            "it combines a place detail with a brightness detail",
            "it uses short repeated lines to hold attention on the star"
          ]
        }
      ],
      "template": "The star appears {place}. It looks {look}, and the rhyme strengthens this picture because {wording}.",
      "otherIdeas": [
        {
          "viewpoint": "Explain the comparison",
          "text": "Calling the star a diamond helps the reader picture a small, sharp point of light."
        },
        {
          "viewpoint": "Connect place and appearance",
          "text": "The words place the star high above the world and make its twinkling stand out."
        },
        {
          "viewpoint": "Explain repetition",
          "text": "Repeating “twinkle” keeps the reader focused on the star’s changing sparkle."
        }
      ],
      "reflectPrompt": "Which explanation uses both the rhyme’s exact imagery and its wording to make the picture clear?"
    }
  },

    // ── English G2 · Traditional fable ─────────────────────────────────────────
      {
    "id": "en-g2-north-wind-sun",
    "lang": "en",
    "grade": "G2",
    "genre": "fable",
    "source": {
      "type": "public-domain-classic-adaptation",
      "title": "The North Wind and the Sun",
      "origin": "Aesop tradition",
      "adaptation": "MindsEvo age-level retelling"
    },
    "anchors": {
      "curriculum": [
        "CCSS RL.2.1",
        "CCSS RL.2.2",
        "CCSS RL.2.3",
        "CCSS RL.2.5",
        "UK KS1 traditional tales"
      ],
      "level": {
        "sentences": 12,
        "words": 129
      }
    },
    "title": "The North Wind and the Sun",
    "sentences": [
      {
        "id": "s1",
        "text": "The North Wind and the Sun argued about which one was stronger."
      },
      {
        "id": "s2",
        "text": "They saw a traveler wearing a warm cloak."
      },
      {
        "id": "s3",
        "text": "“Whoever makes him take off that cloak is stronger,” said the Sun."
      },
      {
        "id": "s4",
        "text": "The North Wind blew as hard as it could."
      },
      {
        "id": "s5",
        "text": "The traveler pulled the cloak tightly around his body."
      },
      {
        "id": "s6",
        "text": "The harder the Wind blew, the tighter the traveler held on."
      },
      {
        "id": "s7",
        "text": "At last, the Wind gave up."
      },
      {
        "id": "s8",
        "text": "Then the Sun shone gently."
      },
      {
        "id": "s9",
        "text": "The air grew warmer and warmer."
      },
      {
        "id": "s10",
        "text": "Soon the traveler felt hot."
      },
      {
        "id": "s11",
        "text": "He smiled and took off his cloak."
      },
      {
        "id": "s12",
        "text": "The Sun had won without pushing or shouting."
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "template": "contrast-detail",
        "level": "L2",
        "interaction": "select",
        "prompt": "What did the traveler do when the Wind blew harder?",
        "options": [
          {
            "text": "He held the cloak more tightly."
          },
          {
            "text": "He took the cloak off.",
            "errorType": "contradicts_text"
          },
          {
            "text": "He ran toward the Sun.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Look at the sentence that begins “The harder the Wind blew”."
      },
      {
        "id": "q2",
        "unit": "infer",
        "template": "method-result",
        "level": "L3",
        "interaction": "select",
        "pairId": "sun-method-result",
        "prompt": "Why did the Sun succeed when the Wind did not?",
        "options": [
          {
            "text": "Gentle warmth made the traveler choose to remove the cloak."
          },
          {
            "text": "The Sun ordered the traveler to remove it.",
            "errorType": "fabrication"
          },
          {
            "text": "The Wind had already torn the cloak.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Compare what each one did and how the traveler reacted."
      },
      {
        "id": "q3",
        "unit": "infer",
        "template": "method-evidence",
        "level": "L3",
        "interaction": "evidence",
        "pairId": "sun-method-result",
        "claimItemId": "q2",
        "evidenceFor": "q2",
        "prompt": "Which sentence best shows that the Sun used a gentle method? Tap it.",
        "target": "sentence",
        "answer": [
          "s8"
        ],
        "hint": "Find the sentence that tells how the Sun shone."
      },
      {
        "id": "q4",
        "unit": "structure",
        "template": "contrast-order",
        "level": "L3",
        "interaction": "order",
        "prompt": "Put the two attempts and their results in order.",
        "cards": [
          "The Wind blows hard.",
          "The traveler holds the cloak tighter.",
          "The Sun shines gently.",
          "The traveler takes the cloak off."
        ],
        "hint": "The Wind tries first. The Sun tries after the Wind gives up."
      },
      {
        "id": "q5",
        "unit": "comprehend",
        "template": "lesson",
        "level": "L4",
        "interaction": "select",
        "prompt": "Which lesson best fits the fable?",
        "options": [
          {
            "text": "A gentle approach can work better than force."
          },
          {
            "text": "Warm days are always better than windy days.",
            "errorType": "overgeneralization"
          },
          {
            "text": "Travelers should never wear cloaks.",
            "errorType": "literal_only"
          }
        ],
        "answer": 0,
        "hint": "Think beyond the weather. Which way of changing someone worked?"
      },
      {
        "id": "q6",
        "unit": "choose",
        "template": "word-force",
        "level": "L4",
        "interaction": "select",
        "prompt": "Why is “tightly” important in the sentence about the cloak?",
        "options": [
          {
            "text": "It shows the Wind made the traveler protect himself even more."
          },
          {
            "text": "It shows the cloak was too small.",
            "errorType": "fabrication"
          },
          {
            "text": "It means the traveler dropped the cloak.",
            "errorType": "contradicts_text"
          }
        ],
        "answer": 0,
        "hint": "Would the traveler hold on more loosely or more firmly in a strong wind?"
      }
    ],
    "createCcr": {
      "prompt": "Imagine the Wind asks the Sun for advice. What might the Sun say?",
      "slots": [
        {
          "key": "advice",
          "name": "The Sun might say……",
          "options": [
            "Try a gentler way",
            "Watch how the traveler reacts",
            "Do not turn every problem into a contest",
            "Work with me instead of against me"
          ]
        },
        {
          "key": "reason",
          "name": "because……",
          "options": [
            "force can make people resist",
            "a small change can reveal a better plan",
            "winning is not the only goal",
            "two different strengths can work together"
          ]
        }
      ],
      "template": "The Sun might say, “{advice},” because {reason}.",
      "otherIdeas": [
        {
          "viewpoint": "Someone thought about the traveler",
          "text": "Ask what the traveler needs instead of treating him like part of a contest."
        },
        {
          "viewpoint": "Someone thought about teamwork",
          "text": "The Wind could cool the traveler after the Sun makes the day too hot."
        },
        {
          "viewpoint": "Someone questioned the contest",
          "text": "Being strong may mean knowing when not to use all your power."
        }
      ],
      "reflectPrompt": "Which advice changes the meaning of “strong” most clearly?"
    },
    "expressCcr": {
      "prompt": "Use details from the fable to explain how the North Wind and the Sun use different methods, and why one method succeeds.",
      "slots": [
        {
          "key": "windMethod",
          "name": "The North Wind’s method",
          "options": [
            "uses force by blowing harder",
            "tries to pull the traveler’s cloak away",
            "becomes stronger when the traveler resists",
            "makes the traveler hold the cloak more tightly"
          ]
        },
        {
          "key": "sunMethod",
          "name": "The Sun’s method",
          "options": [
            "uses steady warmth instead of force",
            "shines until the traveler feels hot",
            "changes the traveler’s choice without pulling",
            "makes removing the cloak feel comfortable"
          ]
        },
        {
          "key": "result",
          "name": "What the result shows",
          "options": [
            "gentle warmth succeeds where force fails",
            "the Sun understands how the traveler will respond",
            "the two methods produce opposite reactions",
            "the traveler removes the cloak by choice"
          ]
        }
      ],
      "template": "The North Wind {windMethod}, while the Sun {sunMethod}. The result shows that {result}.",
      "otherIdeas": [
        {
          "viewpoint": "Compare the reactions",
          "text": "The stronger the Wind blows, the tighter the traveler holds the cloak, but the Sun’s warmth makes the traveler remove it."
        },
        {
          "viewpoint": "Explain cause and result",
          "text": "Force causes resistance in the story, while warmth changes what the traveler wants to do."
        },
        {
          "viewpoint": "State the contrast",
          "text": "The Wind tries to overpower the traveler, but the Sun succeeds through a gentler method."
        }
      ],
      "reflectPrompt": "Which explanation best connects each character’s method to the traveler’s reaction and the final result?"
    }
  },
  {
    id: 'zh-g1-library-card',
    lang: 'zh', grade: 'G1', genre: 'dialogue',
    anchors: {
      curriculum: ['课标2022·第一学段·阅读与鉴赏', '课标2022·语言文字积累与梳理', '课标2022·表达与交流'],
      level: { hanziCount: 118 }
    },
    title: '图书角借书',
    sentences: [
      { id: 's1', text: '午休时，小雨来到班级图书角。' },
      { id: 's2', text: '她拿起一本《小种子旅行记》，问值日生：“请问，这本书可以借回家吗？”' },
      { id: 's3', text: '值日生说：“可以，不过要先在借书卡上写名字。”' },
      { id: 's4', text: '小雨写好名字，又问：“什么时候还呢？”' },
      { id: 's5', text: '值日生指着卡片上的字：“星期五以前还回来。”' },
      { id: 's6', text: '小雨点点头，把书轻轻放进书包。' },
      { id: 's7', text: '她说：“谢谢，我看完会按时还回来。”' }
    ],
    items: [
      { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
        prompt: '小雨借书以前，要先做什么？',
        options: [{ text: '在借书卡上写名字' }, { text: '把书放进书包', errorType: 'sequence_confusion' }, { text: '把书送给值日生', errorType: 'fabrication' }],
        answer: 0, hint: '看看值日生说“不过要先……”的那一句。' },
      { id: 'q2', unit: 'comprehend', template: 'purpose', level: 'L2', interaction: 'select',
        prompt: '小雨第二次问“什么时候还呢”，她想知道什么？',
        options: [{ text: '还书的时间' }, { text: '这本书是谁写的', errorType: 'fabrication' }, { text: '图书角什么时候关门', errorType: 'fabrication' }],
        answer: 0, hint: '注意问题里的“什么时候”和“还”。' },
      { id: 'q3', unit: 'infer', template: 'rule-evidence', level: 'L2', interaction: 'select',
        pairId: 'xiaoyu-return-rule',
        prompt: '从最后一句可以看出，小雨明白了什么规则？',
        options: [{ text: '借来的书要在规定时间内归还' }, { text: '借来的书可以一直放在家里', errorType: 'contradicts_text' }, { text: '只有星期五才能看书', errorType: 'overgeneralization' }],
        answer: 0, hint: '小雨答应自己会怎样还书？' },
      { id: 'q4', unit: 'infer', template: 'rule-evidence', level: 'L2', interaction: 'evidence',
        pairId: 'xiaoyu-return-rule', claimItemId: 'q3', evidenceFor: 'q3',
        prompt: '哪一句最能支持“小雨明白要按时还书”？点一点。',
        target: 'sentence', answer: ['s7'], hint: '找小雨最后自己说的话。' },
      { id: 'q5', unit: 'structure', template: 'order-cards', level: 'L3', interaction: 'order',
        prompt: '按照借书过程，把卡片排一排。',
        cards: ['询问能不能借书', '在借书卡上写名字', '询问还书时间', '答应按时归还'],
        hint: '先从小雨第一次开口问的问题开始。' },
      { id: 'q6', unit: 'choose', template: 'language-choice', level: 'L3', interaction: 'select',
        prompt: '小雨为什么说“请问，这本书可以借回家吗”，而不是只说“我要这本书”？',
        options: [{ text: '“请问……可以吗”把请求说得清楚，也更有礼貌' }, { text: '因为这句话字更多', errorType: 'literal_only' }, { text: '因为值日生听不懂短句', errorType: 'fabrication' }],
        answer: 0, hint: '比较两句话是在“提出请求”，还是只说自己的想法。' }
    ],
    expressCcr: {
      prompt: '如果你想借一本已经被同学拿在手里的书，怎样把请求说清楚又有礼貌？',
      slots: [
        { key: 'ask', name: '我可以说……', options: ['请问，你看完以后可以借给我吗', '这本书我也很想看，可以排在你后面吗', '你看完能告诉我一声吗', '请问，我什么时候可以借这本书'] },
        { key: 'detail', name: '还可以补充……', options: ['我不着急，你先看完', '我借到后也会按时还', '谢谢你告诉我', '我可以先去看另一本'] }
      ],
      template: '{ask}。{detail}。',
      otherIdeas: [
        { viewpoint: '有人先尊重别人正在阅读', text: '“你先看完，我可以等一等。”' },
        { viewpoint: '有人把顺序说清楚', text: '“我可以排在你后面借吗？”' },
        { viewpoint: '有人准备了替代办法', text: '如果暂时借不到，就先选另一本书。' }
      ],
      reflectPrompt: '哪一种说法既表达了自己想借书，也照顾到了正在看书的同学？'
    },
    createCcr: {
      prompt: '如果让你给班级图书角设计一张新的“借书提醒卡”，你会写什么？',
      slots: [
        { key: 'rule', name: '提醒卡可以写……', options: ['借书先登记，还书别忘记', '轻轻翻书页，按时送它回', '一次借一本，看完再交换', '书有自己的家，看完送回书架'] },
        { key: 'feature', name: '再加一个新设计……', options: ['画一个还书日期的小日历', '给不同图书画上分类图标', '设置“我推荐这本书”小贴纸', '留一个写读后一句话的位置'] }
      ],
      template: '{rule}；还可以{feature}。',
      otherIdeas: [
        { viewpoint: '有人把规则编成顺口句', text: '短短两句既提醒登记，也提醒归还。' },
        { viewpoint: '有人增加了分享功能', text: '读完不只还书，还可以留下一句推荐。' },
        { viewpoint: '有人用图画帮助理解', text: '用日历、书架和分类图标，让提醒卡一眼就能看明白。' }
      ],
      reflectPrompt: '哪一个设计不只是重复原来的借书步骤，还给图书角增加了新的用法？'
    }
  },
  {
    id: 'zh-g2-paper-bridge',
    lang: 'zh', grade: 'G2', genre: 'procedural',
    anchors: {
      curriculum: ['课标2022·第一学段·实用性阅读与交流', '课标2022·思辨性阅读与表达'],
      level: { hanziCount: 171 }
    },
    title: '让纸桥更结实',
    sentences: [
      { id: 's1', text: '只用一张纸，能搭一座托住硬币的小桥吗？' },
      { id: 's2', text: '准备一张纸、两个一样高的纸盒和几枚硬币。' },
      { id: 's3', text: '先把两个纸盒分开放好，再把平平的纸搭在中间。' },
      { id: 's4', text: '在纸桥中央轻轻放一枚硬币，纸很快弯了下去。' },
      { id: 's5', text: '拿下硬币，把纸像折扇子一样，正一下、反一下，折出许多窄窄的褶。' },
      { id: 's6', text: '再把折好的纸搭回两个纸盒上。' },
      { id: 's7', text: '这一次，一枚、两枚、三枚硬币放上去，纸桥还稳稳的。' },
      { id: 's8', text: '原来，同一张纸换一种形状，就可能承受更大的重量。' }
    ],
    items: [
      { id: 'q1', unit: 'observe', template: 'materials', level: 'L1', interaction: 'select',
        prompt: '实验中，哪一样东西被用来测试纸桥能不能承受重量？',
        options: [{ text: '硬币' }, { text: '纸盒', errorType: 'misattribution' }, { text: '折扇', errorType: 'literal_only' }],
        answer: 0, hint: '看看什么东西被一枚、两枚、三枚地放到桥上。' },
      { id: 'q2', unit: 'structure', template: 'procedure-order', level: 'L2', interaction: 'order',
        prompt: '按照第二次搭纸桥的步骤排一排。',
        cards: ['拿下第一次测试的硬币', '把纸折出许多窄褶', '把折好的纸搭回纸盒', '重新放硬币测试'],
        hint: '先改变纸的形状，再重新测试。' },
      { id: 'q3', unit: 'infer', template: 'comparison', level: 'L3', interaction: 'select',
        pairId: 'bridge-shape-result',
        prompt: '第二次纸桥为什么比第一次更能承受硬币？',
        options: [{ text: '纸被折成了有许多褶的新形状' }, { text: '第二次换了一张更厚的纸', errorType: 'fabrication' }, { text: '第二次两个纸盒变矮了', errorType: 'fabrication' }],
        answer: 0, hint: '两次实验用的是同一张纸，真正改变了什么？' },
      { id: 'q4', unit: 'infer', template: 'comparison-evidence', level: 'L3', interaction: 'evidence',
        pairId: 'bridge-shape-result', claimItemId: 'q3', evidenceFor: 'q3',
        prompt: '哪一句最直接说明第二次改变了纸的形状？点一点。',
        target: 'sentence', answer: ['s5'], hint: '找一找写“正一下、反一下”的句子。' },
      { id: 'q5', unit: 'comprehend', template: 'main-point', level: 'L3', interaction: 'select',
        prompt: '这段文字最想说明什么？',
        options: [{ text: '材料相同，改变形状可能改变它承受重量的能力' }, { text: '硬币越多越适合做桥', errorType: 'overgeneralization' }, { text: '所有纸桥都比真正的桥结实', errorType: 'overgeneralization' }],
        answer: 0, hint: '最后一句把两次结果连起来说明了什么？' },
      { id: 'q6', unit: 'choose', template: 'word-precision', level: 'L4', interaction: 'select',
        prompt: '最后一句为什么说“可能承受更大的重量”，而不是“一定承受更大的重量”？',
        options: [{ text: '“可能”更准确，因为结果还会受到折法等条件影响' }, { text: '“可能”表示作者完全不知道结果', errorType: 'overgeneralization' }, { text: '两个词没有区别', errorType: 'literal_only' }],
        answer: 0, hint: '说明实验结果时，“一定”和“可能”哪个说法更谨慎？' }
    ],
    expressCcr: {
      prompt: '如果同学没有看到实验，你怎样把“第二次为什么更成功”解释清楚？',
      slots: [
        { key: 'change', name: '先说明改变了……', options: ['纸的形状', '折纸的方法', '平纸变成了有褶的纸桥', '同一张纸的结构'] },
        { key: 'result', name: '再说明结果……', options: ['它托住了更多硬币', '纸桥没有像第一次那样马上弯下去', '三枚硬币放上去仍然比较稳', '第二次的承重表现更好'] }
      ],
      template: '第二次改变了{change}，所以我们看到{result}。',
      otherIdeas: [
        { viewpoint: '有人做了前后比较', text: '第一次平纸很快弯下去，折出褶以后能托住更多硬币。' },
        { viewpoint: '有人强调控制条件', text: '纸没有换，纸盒也没有换，主要变化是纸的形状。' },
        { viewpoint: '有人用证据说明', text: '“三枚硬币放上去还稳稳的”就是第二次效果更好的证据。' }
      ],
      reflectPrompt: '哪一种解释同时说清楚了“改变了什么”和“结果怎样”？'
    },
    createCcr: {
      prompt: '如果继续研究纸桥，你想设计一个什么新的比较实验？',
      slots: [
        { key: 'change', name: '这次只改变……', options: ['纸褶的宽窄', '两个纸盒之间的距离', '纸桥折成三角形还是波浪形', '一张纸还是两张纸'] },
        { key: 'measure', name: '然后比较……', options: ['哪一种能托住更多硬币', '哪一种桥弯得更少', '哪一种保持稳定更久', '哪一种用的材料更少'] }
      ],
      template: '我想改变{change}，再比较{measure}。',
      otherIdeas: [
        { viewpoint: '有人研究形状', text: '让材料不变，只比较不同折法。' },
        { viewpoint: '有人研究跨度', text: '把纸盒拉得更远，看看同一种纸桥会怎样。' },
        { viewpoint: '有人改变评价办法', text: '不只数硬币，还可以观察桥弯下去多少。' }
      ],
      reflectPrompt: '哪一个新实验提出了原文没有研究过的问题，而且能比较出结果？'
    }
  },
  {
    id: 'en-g1-night-animals',
    lang: 'en', grade: 'G1', genre: 'informational',
    anchors: {
      curriculum: ['CCSS RI.1.1', 'CCSS RI.1.2', 'CCSS RI.1.4', 'UK KS1 nonfiction comprehension'],
      level: { sentences: 9, words: 78 }
    },
    title: 'Busy After Dark',
    sentences: [
      { id: 's1', text: 'Some animals are busy when people are getting ready for bed.' },
      { id: 's2', text: 'A bat wakes and flies into the dark sky.' },
      { id: 's3', text: 'It uses sound to help find tiny insects.' },
      { id: 's4', text: 'An owl sits quietly on a branch.' },
      { id: 's5', text: 'Its large eyes help it see when the light is low.' },
      { id: 's6', text: 'A raccoon searches near the ground for food.' },
      { id: 's7', text: 'These animals do different things at night.' },
      { id: 's8', text: 'But they share one pattern: night is an active time for them.' },
      { id: 's9', text: 'While many people sleep, their nighttime world is busy.' }
    ],
    items: [
      { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
        prompt: 'Which animal uses sound to help find insects?',
        options: [{ text: 'The bat' }, { text: 'The owl', errorType: 'misattribution' }, { text: 'The raccoon', errorType: 'misattribution' }],
        answer: 0, hint: 'Look at the sentence after the bat flies into the sky.' },
      { id: 'q2', unit: 'comprehend', template: 'detail-purpose', level: 'L2', interaction: 'select',
        prompt: 'How do the owl’s large eyes help it?',
        options: [{ text: 'They help it see in low light.' }, { text: 'They help it make loud sounds.', errorType: 'fabrication' }, { text: 'They help it dig for food.', errorType: 'fabrication' }],
        answer: 0, hint: 'Read the sentence about the owl’s eyes.' },
      { id: 'q3', unit: 'infer', template: 'shared-pattern', level: 'L3', interaction: 'select',
        pairId: 'night-shared-pattern',
        prompt: 'What do the bat, owl, and raccoon have in common in this passage?',
        options: [{ text: 'They are active at night.' }, { text: 'They all eat insects.', errorType: 'overgeneralization' }, { text: 'They all fly.', errorType: 'overgeneralization' }],
        answer: 0, hint: 'The animals do different things. What time pattern do they share?' },
      { id: 'q4', unit: 'infer', template: 'shared-pattern-evidence', level: 'L3', interaction: 'evidence',
        pairId: 'night-shared-pattern', claimItemId: 'q3', evidenceFor: 'q3',
        prompt: 'Which sentence states the shared pattern most clearly? Tap it.',
        target: 'sentence', answer: ['s8'], hint: 'Find the sentence containing the words “share one pattern”.' },
      { id: 'q5', unit: 'structure', template: 'grouping', level: 'L3', interaction: 'order',
        prompt: 'Put the information in the order the passage presents it.',
        cards: ['The bat uses sound.', 'The owl uses its eyes.', 'The raccoon searches for food.', 'The passage names their shared night pattern.'],
        hint: 'Follow the animals from the beginning of the passage to the summary.' },
      { id: 'q6', unit: 'choose', template: 'word-meaning-context', level: 'L3', interaction: 'select',
        prompt: 'What does “active” mean in “night is an active time for them”?',
        options: [{ text: 'They are awake and doing things.' }, { text: 'They are hidden and completely still.', errorType: 'contradicts_text' }, { text: 'They are all making noise.', errorType: 'overgeneralization' }],
        answer: 0, hint: 'Think about all the actions described: flying, sitting and watching, searching.' }
    ],
    expressCcr: {
      prompt: 'How could you clearly explain the passage to someone who asks, “Why is nighttime busy for these animals?”',
      slots: [
        { key: 'example1', name: 'One example is…', options: ['a bat flies out to find insects', 'an owl watches from a branch', 'a raccoon searches for food', 'the bat uses sound in the dark'] },
        { key: 'point', name: 'This shows…', options: ['some animals are active while many people sleep', 'different animals use nighttime in different ways', 'night is not quiet for every animal', 'the passage is about a busy nighttime world'] }
      ],
      template: 'One example is {example1}. This shows {point}.',
      otherIdeas: [
        { viewpoint: 'Someone grouped the examples', text: 'The bat, owl, and raccoon do different things, but all are active after dark.' },
        { viewpoint: 'Someone used a contrast', text: 'People may be sleeping while these animals are flying, watching, and searching.' },
        { viewpoint: 'Someone explained one useful feature', text: 'The owl’s large eyes help it use the low light at night.' }
      ],
      reflectPrompt: 'Which explanation uses a passage detail and also connects it to the main idea?'
    },
    createCcr: {
      prompt: 'Invent one more nighttime-animal entry for this informational passage.',
      slots: [
        { key: 'animal', name: 'Add…', options: ['a moth', 'a fox', 'a frog', 'a firefly'] },
        { key: 'action', name: 'At night it…', options: ['moves toward lights', 'walks quietly while looking for food', 'calls from near the water', 'flashes a tiny light'] }
      ],
      template: 'Add {animal}. At night it {action}.',
      otherIdeas: [
        { viewpoint: 'Someone matched animal and action', text: 'A firefly flashes a tiny light as the sky grows dark.' },
        { viewpoint: 'Someone added a new kind of nighttime clue', text: 'A frog can add sound to the passage instead of another visual detail.' },
        { viewpoint: 'Someone kept the informational pattern', text: 'The new sentence names an animal, then explains what it does at night.' }
      ],
      reflectPrompt: 'Which new entry fits the passage pattern while adding a kind of nighttime activity we have not seen yet?'
    }
  },
  {
    id: 'en-g2-seed-observation',
    lang: 'en', grade: 'G2', genre: 'procedural',
    anchors: {
      curriculum: ['CCSS RI.2.1', 'CCSS RI.2.3', 'CCSS RI.2.4', 'CCSS RI.2.6', 'UK KS1 instructions and nonfiction'],
      level: { sentences: 11, words: 123 }
    },
    title: 'Keep a Seed Observation Log',
    sentences: [
      { id: 's1', text: 'You can learn about a growing seed by keeping a simple observation log.' },
      { id: 's2', text: 'First, place a bean beside a damp paper towel in a clear cup.' },
      { id: 's3', text: 'Write the date at the top of your first log page.' },
      { id: 's4', text: 'Look at the bean at about the same time each day.' },
      { id: 's5', text: 'Draw what you actually see before you write about it.' },
      { id: 's6', text: 'Measure a new root or stem if one appears.' },
      { id: 's7', text: 'Do not write “the plant is happy” just because it looks healthy.' },
      { id: 's8', text: 'Instead, record visible details such as “the stem is three centimeters tall.”' },
      { id: 's9', text: 'Add the new date every time you make an observation.' },
      { id: 's10', text: 'After several entries, place the pages in date order.' },
      { id: 's11', text: 'Now your log can show how the seed changed over time.' }
    ],
    items: [
      { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
        prompt: 'What should you do before writing about what you see?',
        options: [{ text: 'Draw what you actually see.' }, { text: 'Put all pages in date order.', errorType: 'sequence_confusion' }, { text: 'Guess how the plant feels.', errorType: 'contradicts_text' }],
        answer: 0, hint: 'Find the sentence that uses the word “before”.' },
      { id: 'q2', unit: 'comprehend', template: 'purpose', level: 'L2', interaction: 'select',
        prompt: 'Why should each observation include a date?',
        options: [{ text: 'So the entries can show changes over time.' }, { text: 'So the bean will grow faster.', errorType: 'fabrication' }, { text: 'So every drawing looks the same.', errorType: 'fabrication' }],
        answer: 0, hint: 'Think about what you can learn when the pages are put in date order.' },
      { id: 'q3', unit: 'infer', template: 'evidence-vs-opinion', level: 'L3', interaction: 'select',
        pairId: 'log-visible-evidence',
        prompt: 'Why is “the stem is three centimeters tall” better for the log than “the plant is happy”?',
        options: [{ text: 'The height is a visible, measurable observation.' }, { text: 'Happy is a longer and more scientific word.', errorType: 'literal_only' }, { text: 'Plants can never look healthy.', errorType: 'overgeneralization' }],
        answer: 0, hint: 'Which statement records something you can see or measure?' },
      { id: 'q4', unit: 'infer', template: 'evidence-vs-opinion-support', level: 'L3', interaction: 'evidence',
        pairId: 'log-visible-evidence', claimItemId: 'q3', evidenceFor: 'q3',
        prompt: 'Which sentence gives the clearest example of recording visible evidence? Tap it.',
        target: 'sentence', answer: ['s8'], hint: 'Find the sentence with an exact measurement.' },
      { id: 'q5', unit: 'structure', template: 'procedure-order', level: 'L3', interaction: 'order',
        prompt: 'Put these parts of the observation process in order.',
        cards: ['Set up the bean and damp towel.', 'Observe and draw what you see.', 'Add a dated measurement or note.', 'Put several entries in date order.'],
        hint: 'Start with setting up the bean. The final step happens after several observations.' },
      { id: 'q6', unit: 'choose', template: 'word-precision', level: 'L4', interaction: 'select',
        prompt: 'Why does the passage say to draw what you “actually” see?',
        options: [{ text: 'It reminds the observer to record evidence instead of imagined details.' }, { text: 'It means every drawing must be beautiful.', errorType: 'fabrication' }, { text: 'It means drawings are more important than dates.', errorType: 'overgeneralization' }],
        answer: 0, hint: 'Compare “actually see” with guessing how the plant feels.' }
    ],
    expressCcr: {
      prompt: 'A classmate wrote only “My bean changed a lot.” How could you help make that observation clearer?',
      slots: [
        { key: 'detail', name: 'Add a visible detail…', options: ['a white root came out of the bean', 'the stem is three centimeters tall', 'two small leaves appeared', 'the root grew longer than yesterday'] },
        { key: 'measure', name: 'Then make it clearer by…', options: ['adding the date', 'giving a measurement', 'comparing it with yesterday', 'naming the part that changed'] }
      ],
      template: 'Write “{detail},” and make the record clearer by {measure}.',
      otherIdeas: [
        { viewpoint: 'Someone replaced a vague word', text: 'Instead of “changed a lot,” name exactly what appeared or grew.' },
        { viewpoint: 'Someone added a comparison', text: '“The root is longer than it was yesterday” shows change across two entries.' },
        { viewpoint: 'Someone added a number', text: 'A measurement gives another reader evidence they can compare later.' }
      ],
      reflectPrompt: 'Which revision turns the vague statement into the clearest observation supported by evidence?'
    },
    createCcr: {
      prompt: 'Design one new feature for the seed log that could reveal a pattern the original log does not show clearly.',
      slots: [
        { key: 'feature', name: 'Add…', options: ['a tiny weather box for each day', 'a color strip for the leaves', 'a chart of root length', 'a place to record how much water was added'] },
        { key: 'question', name: 'Then ask…', options: ['Does the pattern change on warmer days?', 'How does leaf color change over time?', 'How quickly does the root grow?', 'Does the amount of water match a change in growth?'] }
      ],
      template: 'Add {feature}. Then ask: {question}',
      otherIdeas: [
        { viewpoint: 'Someone added a graphable measure', text: 'Root length can be recorded each day and compared as a pattern.' },
        { viewpoint: 'Someone connected two kinds of evidence', text: 'Water amount and growth could be recorded side by side.' },
        { viewpoint: 'Someone added a new observation dimension', text: 'Leaf color tracks a change that height alone would miss.' }
      ],
      reflectPrompt: 'Which new feature creates a genuinely new question that could be answered from repeated observations?'
    }
  },
  {
    id: 'zh-g1-rhythm-pairs',
    lang: 'zh', grade: 'G1', genre: 'language-play',
    source: {
      type: 'original-traditional-style',
      note: 'MindsEvo original verse using a traditional Chinese paired-rhythm form'
    },
    anchors: {
      curriculum: ['课标2022·第一学段·语言文字积累与梳理', '课标2022·文学阅读与创意表达'],
      level: { lines: 4, hanziCount: 28 }
    },
    title: '轻轻来，弯弯垂',
    sentences: [
      { id: 's1', text: '风儿轻轻吹，' },
      { id: 's2', text: '柳条弯弯垂。' },
      { id: 's3', text: '雨点轻轻落，' },
      { id: 's4', text: '荷叶圆圆托。' }
    ],
    items: [
      { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
        prompt: '韵文里，什么东西“弯弯垂”？',
        options: [
          { text: '柳条' },
          { text: '雨点', errorType: 'misattribution' },
          { text: '荷叶', errorType: 'misattribution' }
        ],
        answer: 0, hint: '读一读第二句。' },
      { id: 'q2', unit: 'comprehend', template: 'image-match', level: 'L2', interaction: 'select',
        prompt: '“荷叶圆圆托”写的是怎样的画面？',
        options: [
          { text: '圆圆的荷叶接住落下的雨点' },
          { text: '荷叶被风吹到天上', errorType: 'fabrication' },
          { text: '柳条托住了荷叶', errorType: 'misattribution' }
        ],
        answer: 0, hint: '把第三句和第四句连起来想。' },
      { id: 'q3', unit: 'infer', template: 'action-relation', level: 'L2', interaction: 'select',
        prompt: '为什么第四句用“托”，而不是“追”？',
        options: [
          { text: '雨点落下来，荷叶在下面接着它' },
          { text: '荷叶在后面追赶雨点', errorType: 'contradicts_text' },
          { text: '柳条把雨点赶走了', errorType: 'fabrication' }
        ],
        answer: 0, hint: '注意“雨点落”和“荷叶托”的上下关系。' },
      { id: 'q4', unit: 'structure', template: 'paired-lines', level: 'L3', interaction: 'order',
        prompt: '按照韵文的顺序，把四幅画面排一排。',
        cards: ['风儿轻轻吹', '柳条弯弯垂', '雨点轻轻落', '荷叶圆圆托'],
        hint: '先读风和柳，再读雨点和荷叶。' },
      { id: 'q5', unit: 'choose', template: 'word-image', level: 'L3', interaction: 'select',
        prompt: '如果把“雨点轻轻落”换成“雨点重重砸”，画面会怎样变化？',
        options: [
          { text: '由轻柔变得突然、有力量' },
          { text: '雨点会变成柳条', errorType: 'literal_only' },
          { text: '两句画面完全一样', errorType: 'literal_only' }
        ],
        answer: 0, hint: '比较“轻轻落”和“重重砸”的声音与动作。' }
    ],
    expressCcr: {
      prompt: '怎样用“先……再……”把韵文里的两组画面说清楚？',
      slots: [
        { key: 'first', name: '先写……', options: [
          '风儿吹，柳条垂',
          '风和柳条的画面',
          '轻轻吹与弯弯垂',
          '柳条随着风摆动'
        ] },
        { key: 'then', name: '再写……', options: [
          '雨点落，荷叶托',
          '雨和荷叶的画面',
          '轻轻落与圆圆托',
          '荷叶接住雨点'
        ] }
      ],
      template: '韵文先写{first}，再写{then}。',
      otherIdeas: [
        { viewpoint: '有人注意到成对画面', text: '前两句写风和柳，后两句写雨和荷叶。' },
        { viewpoint: '有人注意到叠词', text: '“轻轻、弯弯、圆圆”让画面更具体。' },
        { viewpoint: '有人注意到动作', text: '吹、垂、落、托让每一样景物都动了起来。' }
      ],
      reflectPrompt: '哪一种表达既说清顺序，也说出了韵文的语言特点？'
    },
    createCcr: {
      prompt: '照着“景物 + 叠词 + 动作”的节奏，续写一组新的自然画面。',
      slots: [
        { key: 'line1', name: '第一句可以是……', options: [
          '云儿慢慢飘',
          '小溪哗哗跑',
          '花儿轻轻摇',
          '雪花悠悠下'
        ] },
        { key: 'line2', name: '配对的一句是……', options: [
          '山顶高高瞧',
          '石头静静抱',
          '蜜蜂嗡嗡绕',
          '屋顶白白罩'
        ] }
      ],
      template: '{line1}，{line2}。',
      otherIdeas: [
        { viewpoint: '有人保持了叠词节奏', text: '慢慢、静静、悠悠都能延续原来的节奏。' },
        { viewpoint: '有人创造了新动作', text: '让云飘、溪跑、花摇，画面就会动起来。' },
        { viewpoint: '有人创作成对关系', text: '新两句也可以写一个动作和一个回应。' }
      ],
      reflectPrompt: '哪一组既保持原来的节奏，又创造了原文没有的新画面？'
    }
  },
{
  id: 'zh-g2-mark-boat-adaptation',
  lang: 'zh', grade: 'G2', genre: 'fable',
  source: {
    type: 'public-domain-classic-adaptation',
    title: '刻舟求剑',
    origin: '《吕氏春秋》传统寓言',
    adaptation: 'MindsEvo age-level retelling'
  },
  anchors: {
    curriculum: ['课标2022·第一学段·文学阅读与创意表达', '课标2022·思辨性阅读与表达'],
    level: { sentences: 9, hanziCount: 163 }
  },
  title: '刻舟求剑',
  sentences: [
    { id: 's1', text: '从前，有个人坐船过江，腰间挂着一把剑。' },
    { id: 's2', text: '船行到江心，剑不小心掉进了水里。' },
    { id: 's3', text: '他没有马上请船夫停船，只在船边刻了一个记号。' },
    { id: 's4', text: '别人问他为什么这样做。' },
    { id: 's5', text: '他说：“我的剑就是从这个记号旁边掉下去的。”' },
    { id: 's6', text: '船继续向前行，很快到了岸边。' },
    { id: 's7', text: '他从刻着记号的地方跳进水里找剑。' },
    { id: 's8', text: '他找了很久，却什么也没有找到。' },
    { id: 's9', text: '船已经向前走了，水里的剑可没有跟着船走。' }
  ],
  items: [
    { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
      prompt: '剑掉进水里以后，那个人把记号刻在哪里？',
      options: [
        { text: '船边' },
        { text: '岸边', errorType: 'sequence_confusion' },
        { text: '剑柄上', errorType: 'fabrication' }
      ],
      answer: 0, hint: '找一找第三句。' },
    { id: 'q2', unit: 'comprehend', template: 'purpose', level: 'L2', interaction: 'select',
      prompt: '那个人刻记号，是想记住什么？',
      options: [
        { text: '剑从船的哪个位置旁边掉下去' },
        { text: '船夫站在哪里', errorType: 'fabrication' },
        { text: '船最终停在哪个岸边', errorType: 'fabrication' }
      ],
      answer: 0, hint: '读一读他自己解释记号的那句话。' },
    { id: 'q3', unit: 'infer', template: 'cause-hidden', level: 'L3', interaction: 'select',
      pairId: 'sword-search-failure',
      prompt: '他为什么从记号旁边下水也找不到剑？',
      options: [
        { text: '船向前移动了，记号的位置也跟着船变了' },
        { text: '剑自己游走了', errorType: 'fabrication' },
        { text: '记号被水冲掉了', errorType: 'fabrication' }
      ],
      answer: 0, hint: '比较船、记号和水里的剑有没有一起移动。' },
    { id: 'q4', unit: 'infer', template: 'cause-evidence', level: 'L3', interaction: 'evidence',
      pairId: 'sword-search-failure', claimItemId: 'q3', evidenceFor: 'q3',
      prompt: '哪一句最能支持“记号已经不能指出剑的位置”？点一点。',
      target: 'sentence', answer: ['s9'],
      hint: '找一找同时写到船和剑的最后一句。' },
    { id: 'q5', unit: 'structure', template: 'cause-chain', level: 'L3', interaction: 'order',
      prompt: '按照事情发生的顺序排一排。',
      cards: ['剑掉进水里', '在船边刻记号', '船继续向前走', '从记号处下水寻找'],
      hint: '先找剑什么时候掉下去，再看船什么时候到岸。' },
    { id: 'q6', unit: 'choose', template: 'word-precision', level: 'L4', interaction: 'select',
      prompt: '最后一句中的“已经”和“可没有”有什么作用？',
      options: [
        { text: '突出船移动了，而剑仍留在原来的水中' },
        { text: '说明剑比船移动得更快', errorType: 'contradicts_text' },
        { text: '只是让句子变长，没有作用', errorType: 'literal_only' }
      ],
      answer: 0, hint: '这两个词把船和剑的状态放在一起比较。' }
  ],
  expressCcr: {
    prompt: '怎样向故事中的人解释，他原来的判断错在哪里？',
    slots: [
      { key: 'thought', name: '他原来以为……', options: [
        '记号能一直指着剑的位置',
        '从记号处下水就能找到剑',
        '船边的记号和水中位置不会分开',
        '记住船上的位置就等于记住水里的位置'
      ] },
      { key: 'problem', name: '但实际上……', options: [
        '船和记号向前移动了',
        '剑留在掉落处附近',
        '船上的位置不是江水中的固定位置',
        '到岸时记号已离开原处'
      ] }
    ],
    template: '他原来以为{thought}，但实际上{problem}。',
    otherIdeas: [
      { viewpoint: '有人比较了两个位置', text: '记号在移动的船上，剑的位置却留在江水中。' },
      { viewpoint: '有人指出变化', text: '判断问题时，要注意哪些东西已经发生变化。' },
      { viewpoint: '有人说清因果', text: '因为船前进了，所以从旧记号处下水不能找到剑。' }
    ],
    reflectPrompt: '哪一种解释把“原来的想法”和“实际变化”都说清楚了？'
  },
  createCcr: {
    prompt: '改变故事中人的一个决定，让寻找剑的故事出现新走向。',
    slots: [
      { key: 'decision', name: '剑刚落水时，他可以……', options: [
        '马上请船夫停船',
        '观察岸边固定的树木位置',
        '请船上的人一起想办法',
        '用绳子在掉落处附近寻找'
      ] },
      { key: 'ending', name: '新的结果是……', options: [
        '更接近剑真正掉落的位置',
        '大家根据固定线索合作寻找',
        '他及时发现记号必须跟位置变化',
        '故事变成一次有计划的搜寻'
      ] }
    ],
    template: '他决定{decision}，于是{ending}。',
    otherIdeas: [
      { viewpoint: '有人改变了线索', text: '不用船上的记号，改用岸边不会移动的景物。' },
      { viewpoint: '有人改变了行动时间', text: '剑刚落水就采取行动，不等船驶到岸边。' },
      { viewpoint: '有人加入了合作', text: '让船夫和乘客从不同方向观察落水点。' }
    ],
    reflectPrompt: '哪一种改变真正解决了原故事中“位置已经变化”的问题？'
  }
},
  {
  id: 'en-g1-hickory-clock-rhyme',
  lang: 'en',
  grade: 'G1',
  genre: 'rhyme',
  source: {
    type: 'public-domain-traditional',
    title: 'Hickory Dickory Dock',
    note: 'Short traditional public-domain nursery-rhyme version'
  },
  anchors: {
    curriculum: ['CCSS RL.1.1', 'CCSS RL.1.4', 'UK KS1 poetry, rhyme and repetition'],
    level: { lines: 5, words: 19 }
  },
  title: 'Hickory Dickory Dock',
  sentences: [
    { id: 's1', text: 'Hickory, dickory, dock.' },
    { id: 's2', text: 'The mouse ran up the clock.' },
    { id: 's3', text: 'The clock struck one.' },
    { id: 's4', text: 'The mouse ran down.' },
    { id: 's5', text: 'Hickory, dickory, dock.' }
  ],
  items: [
    {
      id: 'q1',
      unit: 'observe',
      template: 'repeated-line',
      level: 'L1',
      interaction: 'select',
      prompt: 'Which line appears at both the beginning and the end?',
      options: [
        { text: 'Hickory, dickory, dock.' },
        { text: 'The clock struck one.', errorType: 'misattribution' },
        { text: 'The mouse ran down.', errorType: 'misattribution' }
      ],
      answer: 0,
      hint: 'Compare the first and last lines.'
    },
    {
      id: 'q2',
      unit: 'comprehend',
      template: 'action-detail',
      level: 'L1',
      interaction: 'select',
      prompt: 'What did the mouse do before the clock struck one?',
      options: [
        { text: 'It ran up the clock.' },
        { text: 'It ran down.', errorType: 'sequence_confusion' },
        { text: 'It stopped the clock.', errorType: 'fabrication' }
      ],
      answer: 0,
      hint: 'Read the line just before “The clock struck one.”'
    },
    {
      id: 'q3',
      unit: 'infer',
      template: 'event-reaction',
      level: 'L2',
      interaction: 'select',
      prompt: 'What change happens after the clock strikes one?',
      options: [
        { text: 'The mouse changes direction and runs down.' },
        { text: 'The clock runs away.', errorType: 'fabrication' },
        { text: 'The mouse climbs higher.', errorType: 'contradicts_text' }
      ],
      answer: 0,
      hint: 'Compare the mouse’s movement before and after the clock strikes.'
    },
    {
      id: 'q4',
      unit: 'structure',
      template: 'event-order',
      level: 'L2',
      interaction: 'order',
      prompt: 'Put the rhyme events in order.',
      cards: [
        'The mouse runs up.',
        'The clock strikes one.',
        'The mouse runs down.',
        'The opening line returns.'
      ],
      hint: 'Follow the lines from top to bottom.'
    },
    {
      id: 'q5',
      unit: 'choose',
      template: 'word-contrast',
      level: 'L3',
      interaction: 'select',
      prompt: 'Why are “up” and “down” important in the rhyme?',
      options: [
        { text: 'They show the mouse moving in opposite directions.' },
        { text: 'They name two different mice.', errorType: 'literal_only' },
        { text: 'They tell the clock what time it is.', errorType: 'misattribution' }
      ],
      answer: 0,
      hint: 'Act out “ran up” and “ran down.”'
    }
  ],
  expressCcr: {
    prompt: 'How could you retell the mouse’s movements clearly using “first” and “then”?',
    slots: [
      {
        key: 'first',
        name: 'First…',
        options: [
          'the mouse ran up the clock',
          'the rhyme began with its repeated line',
          'the mouse climbed toward the top',
          'the clock was quiet'
        ]
      },
      {
        key: 'then',
        name: 'Then…',
        options: [
          'the clock struck one and the mouse ran down',
          'the mouse changed direction',
          'the sound came before the mouse went down',
          'the opening line returned'
        ]
      }
    ],
    template: 'First, {first}. Then, {then}.',
    otherIdeas: [
      {
        viewpoint: 'Someone named both directions',
        text: 'First the mouse ran up; after the strike, it ran down.'
      },
      {
        viewpoint: 'Someone included the sound',
        text: 'The clock struck one between the two movements.'
      },
      {
        viewpoint: 'Someone explained the pattern',
        text: 'The repeated line frames the action at the beginning and end.'
      }
    ],
    reflectPrompt: 'Which retelling makes both the sequence and the direction change clear?'
  },
  createCcr: {
    prompt: 'Create a new short verse that keeps the clock-and-action pattern.',
    slots: [
      {
        key: 'event',
        name: 'The clock could…',
        options: [
          'strike two',
          'strike three',
          'ring at four',
          'chime at five'
        ]
      },
      {
        key: 'action',
        name: 'Then a new character could…',
        options: [
          'a frog could hop through',
          'a bird could flap free',
          'a fox could dive to the floor',
          'a bee could buzz from the hive'
        ]
      }
    ],
    template: 'The clock could {event}; then {action}.',
    otherIdeas: [
      {
        viewpoint: 'Someone kept repetition',
        text: 'Begin and end with “Hickory, dickory, dock.”'
      },
      {
        viewpoint: 'Someone added a new action word',
        text: 'Hop, flap, dive, and buzz create different movements.'
      },
      {
        viewpoint: 'Someone built from sound',
        text: 'Choose words whose sounds make the new verse lively.'
      }
    ],
    reflectPrompt: 'Which idea keeps the old pattern but adds a genuinely new character and action?'
  }
},
  {
  id: 'en-g2-lion-mouse-adaptation',
  lang: 'en',
  grade: 'G2',
  genre: 'fable',
  source: {
    type: 'public-domain-classic-adaptation',
    title: 'The Lion and the Mouse',
    origin: 'Aesop tradition',
    adaptation: 'MindsEvo age-level retelling'
  },
  anchors: {
    curriculum: ['CCSS RL.2.1', 'CCSS RL.2.3', 'CCSS RL.2.4'],
    level: { sentences: 10, words: 127 }
  },
  title: 'The Lion and the Mouse',
  sentences: [
    { id: 's1', text: 'One afternoon, a tiny mouse hurried across a sleeping lion’s paw.' },
    { id: 's2', text: 'The lion woke, caught the mouse, and held it beneath his great paw.' },
    { id: 's3', text: '“Please let me go,” said the mouse. “I promise I may help you someday.”' },
    { id: 's4', text: 'The lion doubted that such a tiny animal could ever help him, but he released the mouse.' },
    { id: 's5', text: 'Several days later, hunters trapped the lion inside a strong rope net.' },
    { id: 's6', text: 'The lion pulled and roared, yet the strong ropes held him fast.' },
    { id: 's7', text: 'The mouse heard the roar, found the lion, and began gnawing one rope after another.' },
    { id: 's8', text: 'At last, the cut ropes opened, and the lion stepped out of the net.' },
    { id: 's9', text: 'The lion thanked the mouse for keeping its promise.' },
    { id: 's10', text: 'He no longer judged how helpful someone could be by their size.' }
  ],
  items: [
    {
      id: 'q1',
      unit: 'observe',
      template: 'text-contrast',
      level: 'L1',
      interaction: 'select',
      prompt: 'Which contrast does the passage repeat?',
      options: [
        { text: 'The mouse is tiny, while the lion and the rope net are described as powerful or strong.' },
        { text: 'The mouse and lion are both described as hunters.', errorType: 'misattribution' },
        { text: 'The net is tiny, while the mouse is strong.', errorType: 'reversed_detail' }
      ],
      answer: 0,
      hint: 'Look for words describing the mouse, the lion, and the ropes.'
    },
    {
      id: 'q2',
      unit: 'comprehend',
      template: 'cause-detail',
      level: 'L1',
      interaction: 'select',
      prompt: 'How did the mouse free the lion?',
      options: [
        { text: 'It gnawed through the ropes until the net opened.' },
        { text: 'It frightened the hunters away with a roar.', errorType: 'fabrication' },
        { text: 'It lifted the whole net with its paws.', errorType: 'fabrication' }
      ],
      answer: 0,
      hint: 'Read what the mouse did after hearing the lion roar.'
    },
    {
      id: 'q3',
      unit: 'infer',
      template: 'claim',
      level: 'L3',
      interaction: 'select',
      pairId: 'lion-changed-belief',
      prompt: 'Which claim best explains how the lion’s belief changed?',
      options: [
        { text: 'At first the lion doubted a tiny animal could help him, but the rescue proved that size does not decide usefulness.' },
        { text: 'The lion decided that only large animals can solve difficult problems.', errorType: 'contradicts_text' },
        { text: 'The lion learned that rope nets are never strong.', errorType: 'overgeneralization' }
      ],
      answer: 0,
      hint: 'Compare the lion’s thought when he released the mouse with his judgment after the rescue.'
    },
    {
      id: 'q3e',
      unit: 'infer',
      template: 'claim-evidence',
      level: 'L3',
      interaction: 'evidence',
      pairId: 'lion-changed-belief',
      claimItemId: 'q3',
      evidenceFor: 'q3',
      target: 'sentence',
      prompt: 'Which sentences directly support the claim that the lion changed his belief about small animals?',
      answer: ['s4', 's10'],
      hint: 'Choose one sentence showing the lion’s first belief and one showing his later judgment.'
    },
    {
      id: 'q4',
      unit: 'structure',
      template: 'event-order',
      level: 'L2',
      interaction: 'order',
      prompt: 'Put the main events in story order.',
      cards: [
        'The lion catches the mouse.',
        'The lion releases the mouse.',
        'Hunters trap the lion in a rope net.',
        'The mouse gnaws through the ropes.',
        'The lion is freed and changes his judgment.'
      ],
      hint: 'Follow the problem, release, new problem, rescue, and lesson.'
    },
    {
      id: 'q5',
      unit: 'choose',
      template: 'word-meaning-context',
      level: 'L3',
      interaction: 'select',
      prompt: 'Why does the passage call the mouse “tiny” and the rope net “strong”?',
      options: [
        { text: 'The words emphasize that a small helper overcame a powerful trap.' },
        { text: 'The words show that the mouse and net were the same size.', errorType: 'contradicts_text' },
        { text: 'The words explain why the mouse made the promise.', errorType: 'misattribution' }
      ],
      answer: 0,
      hint: 'Think about what seemed weak at first and what finally defeated the net.'
    }
  ],
  expressCcr: {
    prompt: 'Explain the story from the lion’s viewpoint. Contrast what the lion first believed with what the rescue proved.',
    slots: [
      {
        key: 'firstBelief',
        name: 'At first, the lion believed…',
        options: [
          'a tiny mouse could never be useful to him',
          'his great size meant he would not need the mouse',
          'releasing the mouse was an act of kindness, not a way to gain help',
          'the mouse’s promise was unlikely to matter'
        ]
      },
      {
        key: 'proof',
        name: 'The rescue proved…',
        options: [
          'the mouse’s small teeth could cut the strong ropes',
          'a small animal could provide exactly the help the lion needed',
          'the mouse kept its promise when the lion was trapped',
          'usefulness cannot be judged by size alone'
        ]
      }
    ],
    template: 'At first, the lion believed {firstBelief}. The rescue proved {proof}.',
    otherIdeas: [
      {
        viewpoint: 'The lion describes his mistake',
        text: 'I judged the mouse by its size instead of considering what it could do.'
      },
      {
        viewpoint: 'The lion explains the evidence',
        text: 'My strength could not break the net, but the mouse’s teeth cut its ropes.'
      },
      {
        viewpoint: 'The lion states the lesson',
        text: 'Someone who seems small may still have the skill a problem requires.'
      }
    ],
    reflectPrompt: 'Which explanation most clearly connects the lion’s first belief to the evidence that changed it?'
  },
  createCcr: {
    prompt: 'Create a genuinely new direction for the fable by changing a decision, narrator, rescue method, or ending.',
    slots: [
      {
        key: 'change',
        name: 'Change the story by…',
        options: [
          'having the lion refuse to release the mouse, then face an unexpected consequence',
          'letting the rope net narrate what it observes about strength',
          'having the mouse organize several forest animals to design a rescue',
          'ending with the lion using the lesson to help another overlooked animal'
        ]
      },
      {
        key: 'newResult',
        name: 'The new direction could show…',
        options: [
          'how one early decision changes everything that follows',
          'how the same events look different to a new narrator',
          'how cooperation solves the problem in a different way',
          'how learning a lesson can lead to a new action'
        ]
      }
    ],
    template: 'I would change the story by {change}. This new direction would show {newResult}.',
    otherIdeas: [
      {
        viewpoint: 'A different decision',
        text: 'The mouse returns with a plan before the hunters finish setting the net.'
      },
      {
        viewpoint: 'A different narrator',
        text: 'A bird watching from above tells how each animal misunderstands strength.'
      },
      {
        viewpoint: 'A different ending',
        text: 'After being rescued, the lion creates a forest rule that every voice must be heard.'
      }
    ],
    reflectPrompt: 'Which idea changes the plot or viewpoint instead of merely replacing the animals?'
  }
},
  {
  id: 'zh-g2-migrating-birds-notes',
  lang: 'zh',
  grade: 'G2',
  genre: 'informational',
  source: {
    type: 'original',
    author: 'MindsEvo',
    note: 'MindsEvo原创候鸟观察短文'
  },
  anchors: {
    curriculum: ['信息提取', '依据文本推理', '说明顺序', '词语准确性'],
    level: { sentences: 9, words: 126 }
  },
  title: '湖边的候鸟观察记录',
  sentences: [
    { id: 's1', text: '十月的一个清晨，小岚和爸爸到湖边观察候鸟。' },
    { id: 's2', text: '湖面上先停着十二只灰雁，它们把头藏在翅膀下休息。' },
    { id: 's3', text: '太阳升高后，三只灰雁开始梳理羽毛，另外几只走到浅水里寻找食物。' },
    { id: 's4', text: '一阵凉风吹来，远处传来短促的叫声。' },
    { id: 's5', text: '湖里的灰雁立刻抬头，并朝叫声传来的方向聚拢。' },
    { id: 's6', text: '不久，一群排成斜线的灰雁从北边飞来，在湖面上低低盘旋。' },
    { id: 's7', text: '原来停在湖里的灰雁也拍动翅膀，跟着新来的雁群向南飞去。' },
    { id: 's8', text: '小岚在记录本上写道：“叫声出现后，湖里的灰雁才集合并起飞。”' },
    { id: 's9', text: '她把“灰雁一定是因为怕冷才飞走”改成“灰雁可能在回应同伴的叫声”。' }
  ],
  items: [
    {
      id: 'q1',
      unit: 'observe',
      template: 'detail-change',
      level: 'L1',
      interaction: 'select',
      prompt: '太阳升高后，三只灰雁正在做什么？',
      options: [
        { text: '梳理羽毛。' },
        { text: '排成斜线飞来。', errorType: 'sequence_confusion' },
        { text: '把头藏在翅膀下休息。', errorType: 'earlier_detail' }
      ],
      answer: 0,
      hint: '查看写“太阳升高后”的句子。'
    },
    {
      id: 'q2',
      unit: 'comprehend',
      template: 'cause-sequence',
      level: 'L2',
      interaction: 'select',
      prompt: '灰雁聚拢之前，湖边先发生了什么？',
      options: [
        { text: '远处传来短促的叫声。' },
        { text: '小岚修改了记录。', errorType: 'later_detail' },
        { text: '所有灰雁都藏起了头。', errorType: 'contradicts_text' }
      ],
      answer: 0,
      hint: '比较第4句和第5句。'
    },
    {
      id: 'q3',
      unit: 'infer',
      template: 'claim',
      level: 'L3',
      interaction: 'select',
      pairId: 'geese-responded-to-call',
      prompt: '哪一个判断最符合这份观察记录？',
      options: [
        { text: '同伴的叫声可能是湖中灰雁集合并起飞的信号。' },
        { text: '灰雁听到任何声音都会立刻向南飞。', errorType: 'overgeneralization' },
        { text: '湖中的灰雁是被小岚赶走的。', errorType: 'fabrication' }
      ],
      answer: 0,
      hint: '把叫声、聚拢和起飞的先后联系起来。'
    },
    {
      id: 'q3e',
      unit: 'infer',
      template: 'claim-evidence',
      level: 'L3',
      interaction: 'evidence',
      pairId: 'geese-responded-to-call',
      claimItemId: 'q3',
      evidenceFor: 'q3',
      target: 'sentence',
      prompt: '哪些句子最直接支持“同伴叫声可能是集合信号”这一判断？',
      answer: ['s4', 's5', 's7'],
      hint: '选择写到叫声、聚拢以及随后起飞的句子。'
    },
    {
      id: 'q4',
      unit: 'structure',
      template: 'event-order',
      level: 'L2',
      interaction: 'order',
      prompt: '按照观察记录排列事件。',
      cards: [
        '远处传来叫声。',
        '湖中的灰雁抬头聚拢。',
        '新来的雁群在湖面盘旋。',
        '湖中的灰雁跟随雁群向南飞。',
        '小岚修改自己的判断。'
      ],
      hint: '按照第4句到第9句的顺序排列。'
    },
    {
      id: 'q5',
      unit: 'choose',
      template: 'word-precision',
      level: 'L3',
      interaction: 'select',
      prompt: '小岚为什么把“一定”改成“可能”？',
      options: [
        { text: '观察能说明叫声和起飞有关，但还不能证明这是唯一原因。' },
        { text: '因为“可能”表示她完全没有观察灰雁。', errorType: 'misread_word' },
        { text: '因为“一定”和“可能”的意思完全相同。', errorType: 'word_confusion' }
      ],
      answer: 0,
      hint: '想一想观察证据能支持到什么程度。'
    }
  ],
  expressCcr: {
    prompt: '根据记录，清楚解释小岚为什么修改自己的判断。',
    slots: [
      {
        key: 'observation',
        name: '她观察到……',
        options: [
          '远处先传来叫声，灰雁随后聚拢并起飞',
          '新雁群飞来后，湖中的灰雁跟随它们向南飞',
          '叫声、聚拢和起飞按顺序发生',
          '记录中没有直接测量气温变化'
        ]
      },
      {
        key: 'revision',
        name: '所以她把判断改为……',
        options: [
          '灰雁可能在回应同伴的叫声',
          '现有证据只能支持一种可能',
          '不能仅凭一次观察断定唯一原因',
          '需要继续观察才能得到更确定的解释'
        ]
      }
    ],
    template: '她观察到{observation}，所以她把判断改为{revision}。',
    otherIdeas: [
      {
        viewpoint: '强调先后顺序',
        text: '叫声在前，聚拢和起飞在后，这使叫声成为合理线索。'
      },
      {
        viewpoint: '强调证据边界',
        text: '记录没有排除天气等其他原因，因此不能使用“一定”。'
      },
      {
        viewpoint: '强调修订',
        text: '新的表达让判断更准确，也更符合实际观察到的证据。'
      }
    ],
    reflectPrompt: '哪一种解释既引用了具体观察，又没有把可能性说成确定事实？'
  },
  createCcr: {
    prompt: '设计一次新的候鸟观察，让记录能够检验另一个问题。',
    slots: [
      {
        key: 'question',
        name: '我要研究……',
        options: [
          '不同时间出现的鸟群数量是否相同',
          '风向变化时灰雁的飞行方向是否变化',
          '有叫声和无叫声时灰雁的反应是否不同',
          '浅水和深水区域中灰雁的活动是否不同'
        ]
      },
      {
        key: 'record',
        name: '我会记录……',
        options: [
          '时间、地点和每次看到的灰雁数量',
          '风向、叫声出现时间和飞行方向',
          '叫声前后灰雁的位置与动作',
          '水深区域和灰雁寻找食物的次数'
        ]
      }
    ],
    template: '我要研究{question}，并记录{record}。',
    otherIdeas: [
      {
        viewpoint: '增加比较条件',
        text: '在两个不同清晨使用相同方法观察，再比较记录。'
      },
      {
        viewpoint: '改变观察问题',
        text: '研究雁群队形变化，而不是重复原文的起飞原因。'
      },
      {
        viewpoint: '增加新证据',
        text: '用简图标出叫声出现前后每只灰雁的位置。'
      }
    ],
    reflectPrompt: '哪一个新方案提出了不同的问题，并说明了需要收集什么证据？'
  }
}



  ,
    {
      "id": "zh-g1-rainy-day-window",
      "lang": "zh",
      "grade": "G1",
      "title": "雨停以后",
      "genre": "story",
      "source": {
        "type": "original",
        "author": "MindsEvo",
        "note": "Original Chinese literacy passage"
      },
      "sentences": [
        {
          "id": "s1",
          "text": "午后，雨点轻轻敲着教室的窗。"
        },
        {
          "id": "s2",
          "text": "雨停后，小满看见花坛里留着一小片水。"
        },
        {
          "id": "s3",
          "text": "一只麻雀落在水边，低头喝了几口水。"
        },
        {
          "id": "s4",
          "text": "风吹过树叶，几滴水珠又落进花坛。"
        },
        {
          "id": "s5",
          "text": "小满说：“雨停了，花坛里还藏着雨的声音。”"
        }
      ],
      "items": [
        {
          "id": "q-observe-rainy-day-window",
          "unit": "observe",
          "template": "text-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "雨停后，什么动物落在花坛的水边？",
          "options": [
            {
              "text": "一只麻雀"
            },
            {
              "text": "一只蝴蝶",
              "errorType": "fabrication"
            },
            {
              "text": "一只小猫",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-comprehend-rainy-day-window",
          "unit": "comprehend",
          "template": "text-cause-result",
          "level": "L2",
          "interaction": "select",
          "prompt": "麻雀为什么能在花坛边喝到水？",
          "options": [
            {
              "text": "雨后花坛里留下了一小片水"
            },
            {
              "text": "小满端来了一碗水",
              "errorType": "fabrication"
            },
            {
              "text": "树叶变成了水杯",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-rainy-day-window",
          "unit": "infer",
          "template": "claim",
          "level": "L2",
          "interaction": "select",
          "pairId": "rain-sound-after-storm",
          "prompt": "小满说花坛里还藏着雨的声音，最可能指什么？",
          "options": [
            {
              "text": "树叶上的水滴落进花坛，声音像雨点还在轻轻落下"
            },
            {
              "text": "大雨马上又开始了",
              "errorType": "contradicts_text"
            },
            {
              "text": "麻雀在模仿雷声",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-rainy-day-window-evidence",
          "unit": "infer",
          "template": "claim-evidence",
          "level": "L2",
          "interaction": "evidence",
          "pairId": "rain-sound-after-storm",
          "claimItemId": "q-infer-rainy-day-window",
          "evidenceFor": "q-infer-rainy-day-window",
          "target": "sentence",
          "answer": [
            "s4",
            "s5"
          ]
        },
        {
          "id": "q-structure-rainy-day-window",
          "unit": "structure",
          "template": "text-sequence",
          "level": "L2",
          "interaction": "order",
          "prompt": "按故事顺序排列。",
          "cards": [
            {
              "id": "o1",
              "text": "雨点敲着教室的窗"
            },
            {
              "id": "o2",
              "text": "麻雀在水边喝水"
            },
            {
              "id": "o3",
              "text": "树叶上的水珠落进花坛"
            }
          ],
          "answer": [
            "o1",
            "o2",
            "o3"
          ]
        },
        {
          "id": "q-choose-rainy-day-window",
          "unit": "choose",
          "template": "word-choice",
          "level": "L2",
          "interaction": "select",
          "prompt": "第一句用哪个词写出了雨点碰到窗户的样子？",
          "options": [
            {
              "text": "敲"
            },
            {
              "text": "抱",
              "errorType": "context_mismatch"
            },
            {
              "text": "藏",
              "errorType": "context_mismatch"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "根据短文，说明雨停以后花坛里还留下了哪些雨的痕迹。",
        "slots": [
          {
            "key": "sight",
            "name": "看见的痕迹",
            "options": [
              "花坛里留下的水",
              "树叶上的水珠",
              "麻雀在水边喝水"
            ]
          },
          {
            "key": "sound",
            "name": "听到或想到的声音",
            "options": [
              "水珠落进花坛的声音",
              "像雨点轻轻落下的声音",
              "雨后细小的水声"
            ]
          }
        ],
        "template": "雨停以后，我从{sight}看见雨留下的痕迹，也从{sound}感到雨的声音还没有完全消失。",
        "otherIdeas": [
          {
            "viewpoint": "观察景物",
            "text": "积水和水珠让雨后的花坛显得湿润。"
          },
          {
            "viewpoint": "联系动作",
            "text": "麻雀来喝水，说明雨水还留在花坛里。"
          },
          {
            "viewpoint": "解释句子",
            "text": "水珠落下的声音让小满觉得雨声还藏在那里。"
          }
        ],
        "reflectPrompt": "哪一种表达同时使用了短文中的景物和声音？"
      },
      "createCcr": {
        "prompt": "想象第二天小满再次来到窗边，创造一个新的发现。",
        "slots": [
          {
            "key": "discovery",
            "name": "新的发现",
            "options": [
              "水边长出一颗小芽",
              "麻雀留下了一根羽毛",
              "阳光照出一小道彩虹"
            ]
          },
          {
            "key": "action",
            "name": "小满的行动",
            "options": [
              "把它画进观察本",
              "请同学一起来看",
              "写下一句新的比喻"
            ]
          }
        ],
        "template": "第二天，小满发现{discovery}，于是他{action}。",
        "otherIdeas": [
          {
            "viewpoint": "自然变化",
            "text": "积水变少了，泥土却仍然湿润。"
          },
          {
            "viewpoint": "动物来访",
            "text": "另一只小鸟也来到花坛寻找水。"
          },
          {
            "viewpoint": "新的表达",
            "text": "小满把阳光下的水珠比作亮晶晶的小灯。"
          }
        ],
        "reflectPrompt": "哪一个新发现既接着原来的场景，又带来了新的内容？"
      }
    },
    {
      "id": "en-g1-lost-mitten",
      "lang": "en",
      "grade": "G1",
      "title": "The Mitten on the Fence",
      "genre": "story",
      "source": {
        "type": "original",
        "author": "MindsEvo",
        "note": "Original English literacy passage"
      },
      "sentences": [
        {
          "id": "s1",
          "text": "Nora found a blue mitten beside the snowy path."
        },
        {
          "id": "s2",
          "text": "It was too large for her hand and had a silver star near the thumb."
        },
        {
          "id": "s3",
          "text": "She placed it on the low fence where someone could see it."
        },
        {
          "id": "s4",
          "text": "After lunch, Mr. Lee hurried back along the path."
        },
        {
          "id": "s5",
          "text": "He saw the silver star and smiled because it matched the mitten in his pocket."
        }
      ],
      "items": [
        {
          "id": "q-observe-lost-mitten",
          "unit": "observe",
          "template": "text-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "What color was the mitten Nora found?",
          "options": [
            {
              "text": "Blue"
            },
            {
              "text": "Red",
              "errorType": "fabrication"
            },
            {
              "text": "Green",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-comprehend-lost-mitten",
          "unit": "comprehend",
          "template": "text-action-purpose",
          "level": "L2",
          "interaction": "select",
          "prompt": "Why did Nora place the mitten on the fence?",
          "options": [
            {
              "text": "So its owner could see and find it"
            },
            {
              "text": "So snow would cover it",
              "errorType": "contradicts_text"
            },
            {
              "text": "So she could take it home later",
              "errorType": "unsupported"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-lost-mitten",
          "unit": "infer",
          "template": "claim",
          "level": "L2",
          "interaction": "select",
          "pairId": "mitten-owner-clue",
          "prompt": "How did Mr. Lee know the mitten was probably his?",
          "options": [
            {
              "text": "Its silver star matched the mitten in his pocket"
            },
            {
              "text": "Nora had written his name on it",
              "errorType": "fabrication"
            },
            {
              "text": "Every mitten on the path belonged to him",
              "errorType": "unsupported"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-lost-mitten-evidence",
          "unit": "infer",
          "template": "claim-evidence",
          "level": "L2",
          "interaction": "evidence",
          "pairId": "mitten-owner-clue",
          "claimItemId": "q-infer-lost-mitten",
          "evidenceFor": "q-infer-lost-mitten",
          "target": "sentence",
          "answer": [
            "s2",
            "s5"
          ]
        },
        {
          "id": "q-structure-lost-mitten",
          "unit": "structure",
          "template": "text-sequence",
          "level": "L2",
          "interaction": "order",
          "prompt": "Put the events in story order.",
          "cards": [
            {
              "id": "o1",
              "text": "Nora finds the mitten"
            },
            {
              "id": "o2",
              "text": "Nora places it on the fence"
            },
            {
              "id": "o3",
              "text": "Mr. Lee recognizes the silver star"
            }
          ],
          "answer": [
            "o1",
            "o2",
            "o3"
          ]
        },
        {
          "id": "q-choose-lost-mitten",
          "unit": "choose",
          "template": "context-word",
          "level": "L2",
          "interaction": "select",
          "prompt": "Which word tells how Mr. Lee moved when he returned?",
          "options": [
            {
              "text": "Hurried"
            },
            {
              "text": "Floated",
              "errorType": "context_mismatch"
            },
            {
              "text": "Crawled",
              "errorType": "context_mismatch"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "Use story details to explain how Nora helped the mitten return to its owner.",
        "slots": [
          {
            "key": "detail",
            "name": "A detail Nora noticed",
            "options": [
              "the mitten was too large for her",
              "it had a silver star",
              "it was beside the snowy path"
            ]
          },
          {
            "key": "action",
            "name": "What Nora did",
            "options": [
              "placed it where people could see it",
              "left it on the low fence",
              "made the mitten easy to notice"
            ]
          },
          {
            "key": "result",
            "name": "What happened",
            "options": [
              "Mr. Lee recognized the matching star",
              "the owner found the missing mitten",
              "the pair of mittens could be together again"
            ]
          }
        ],
        "template": "Nora noticed {detail}. She {action}, so {result}.",
        "otherIdeas": [
          {
            "viewpoint": "Use the clue",
            "text": "The silver star connected the found mitten to the one in Mr. Lee's pocket."
          },
          {
            "viewpoint": "Explain the action",
            "text": "The fence made the mitten visible without Nora taking it away."
          },
          {
            "viewpoint": "Explain the result",
            "text": "Mr. Lee identified the mitten from a detail stated in the story."
          }
        ],
        "reflectPrompt": "Which explanation connects Nora's observation, action, and the result?"
      },
      "createCcr": {
        "prompt": "Create a different safe way Nora could help return the mitten.",
        "slots": [
          {
            "key": "newAction",
            "name": "A new action",
            "options": [
              "take it to the school office",
              "make a small lost-item sign",
              "ask a nearby adult for help"
            ]
          },
          {
            "key": "newResult",
            "name": "A possible result",
            "options": [
              "the owner knows where to look",
              "more people can help identify it",
              "the mitten stays safe until it is claimed"
            ]
          }
        ],
        "template": "Nora could {newAction}. Then {newResult}.",
        "otherIdeas": [
          {
            "viewpoint": "School solution",
            "text": "She could place it in the school's lost-and-found box."
          },
          {
            "viewpoint": "Message solution",
            "text": "She could draw the mitten without showing every identifying detail."
          },
          {
            "viewpoint": "Adult help",
            "text": "She could ask a crossing guard to keep it safe."
          }
        ],
        "reflectPrompt": "Which new solution is safe, practical, and different from the story's solution?"
      }
    }
  ,
    {
      "id": "zh-g2-shadow-riddle",
      "lang": "zh",
      "grade": "G2",
      "title": "会变长短的朋友",
      "genre": "riddle-wordplay",
      "source": {
        "type": "original",
        "author": "MindsEvo",
        "note": "Original Chinese riddle and wordplay material"
      },
      "sentences": [
        {
          "id": "s1",
          "text": "我总跟着你，却从来不拉你的手。"
        },
        {
          "id": "s2",
          "text": "太阳低低的时候，我会变得很长。"
        },
        {
          "id": "s3",
          "text": "太阳升高以后，我又慢慢变短。"
        },
        {
          "id": "s4",
          "text": "走进没有灯的屋子，你就很难找到我。"
        },
        {
          "id": "s5",
          "text": "我不是另一个人，也不是地上的黑布。猜猜我是谁？"
        }
      ],
      "items": [
        {
          "id": "q-observe-shadow-riddle",
          "unit": "observe",
          "template": "riddle-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "谜面说，这个“朋友”在什么时候会变得很长？",
          "options": [
            {
              "text": "太阳低低的时候"
            },
            {
              "text": "太阳升得很高的时候",
              "errorType": "contradicts_text"
            },
            {
              "text": "没有灯的屋子里",
              "errorType": "contradicts_text"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-comprehend-shadow-riddle",
          "unit": "comprehend",
          "template": "clue-combination",
          "level": "L2",
          "interaction": "select",
          "prompt": "哪两个线索合在一起，最能排除“地上的黑布”？",
          "options": [
            {
              "text": "它会跟着人，而且会随着太阳高低改变长短"
            },
            {
              "text": "它看起来是黑的，而且在地面上",
              "errorType": "incomplete_evidence"
            },
            {
              "text": "它不会拉手，而且不是另一个人",
              "errorType": "weak_evidence"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-shadow-riddle",
          "unit": "infer",
          "template": "claim",
          "level": "L3",
          "interaction": "select",
          "pairId": "shadow-riddle-answer",
          "prompt": "综合全部线索，谜底最可能是什么？",
          "options": [
            {
              "text": "影子"
            },
            {
              "text": "黑布",
              "errorType": "contradicts_text"
            },
            {
              "text": "朋友",
              "errorType": "literal_trap"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-shadow-riddle-evidence",
          "unit": "infer",
          "template": "claim-evidence",
          "level": "L3",
          "interaction": "evidence",
          "pairId": "shadow-riddle-answer",
          "claimItemId": "q-infer-shadow-riddle",
          "evidenceFor": "q-infer-shadow-riddle",
          "target": "sentence",
          "answer": [
            "s1",
            "s2",
            "s3",
            "s4"
          ]
        },
        {
          "id": "q-choose-shadow-riddle",
          "unit": "choose",
          "template": "word-meaning",
          "level": "L3",
          "interaction": "select",
          "prompt": "第一句中的“朋友”为什么加引号最合适？",
          "options": [
            {
              "text": "它把影子当作朋友来写，并不是真的指一个人"
            },
            {
              "text": "它表示说话的人忘了朋友的名字",
              "errorType": "fabrication"
            },
            {
              "text": "它说明谜底一定是另一个孩子",
              "errorType": "literal_trap"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "根据谜面，解释几个线索怎样共同指向“影子”。",
        "slots": [
          {
            "key": "movement",
            "name": "跟随线索",
            "options": [
              "影子会随着人一起移动",
              "“总跟着你”说明它和人的位置有关",
              "它不像真正的朋友那样拉手"
            ]
          },
          {
            "key": "light",
            "name": "光线线索",
            "options": [
              "太阳高低会改变影子的长短",
              "没有光时影子很难出现",
              "长短变化排除了不会变化的黑布"
            ]
          }
        ],
        "template": "“{movement}”说明谜底会跟随人；“{light}”进一步说明它和光有关，所以谜底是影子。",
        "otherIdeas": [
          {
            "viewpoint": "组合线索",
            "text": "跟随、变长变短和黑暗中难以找到，三个线索要合起来判断。"
          },
          {
            "viewpoint": "排除错误答案",
            "text": "黑布不会随着太阳高低改变长短，因此不符合全部线索。"
          },
          {
            "viewpoint": "理解拟人",
            "text": "谜面把影子叫作朋友，让线索更生动，也制造了文字上的迷惑。"
          }
        ],
        "reflectPrompt": "哪一种解释既使用了多个线索，又说明了为什么其他答案不合适？"
      },
      "createCcr": {
        "prompt": "保留谜底“影子”，改变观察角度，创作一组新的谜面线索。",
        "slots": [
          {
            "key": "newClue",
            "name": "新线索",
            "options": [
              "路灯亮起时，我又出现在脚边",
              "你跳起来，我也跟着跳",
              "阴天时，我常常变得很淡"
            ]
          },
          {
            "key": "misdirection",
            "name": "迷惑性表达",
            "options": [
              "我像一个不会说话的伙伴",
              "我会变形，却不是橡皮泥",
              "我躺在地上，却不是一张纸"
            ]
          }
        ],
        "template": "{misdirection}。{newClue}。猜猜我是谁？",
        "otherIdeas": [
          {
            "viewpoint": "动作",
            "text": "用跑、跳、转身时影子同步变化来设计线索。"
          },
          {
            "viewpoint": "不同光源",
            "text": "把太阳换成路灯或手电筒，产生新的影子变化。"
          },
          {
            "viewpoint": "排除",
            "text": "加入一句说明它不是人、动物或物品，增加推理过程。"
          }
        ],
        "reflectPrompt": "哪组新线索既没有直接说出答案，又能让读者通过组合信息猜到影子？"
      }
    },
    {
      "id": "en-g2-library-mixup-dialogue",
      "lang": "en",
      "grade": "G2",
      "title": "The Book on the Return Cart",
      "genre": "situational-dialogue",
      "source": {
        "type": "original",
        "author": "MindsEvo",
        "note": "Original English situational dialogue"
      },
      "sentences": [
        {
          "id": "s1",
          "text": "Mia: Excuse me, I think someone took the animal book I left on this table."
        },
        {
          "id": "s2",
          "text": "Jon: I moved a book with a fox on the cover, but I did not check it out."
        },
        {
          "id": "s3",
          "text": "Mia: Oh, I thought you meant you took it home."
        },
        {
          "id": "s4",
          "text": "Jon: Sorry, I meant that I put it on the return cart because I thought someone had finished with it."
        },
        {
          "id": "s5",
          "text": "Librarian: The book is still here. Next time, please leave a note if you are coming back for a book."
        },
        {
          "id": "s6",
          "text": "Mia: Thank you for explaining. I should have asked what you meant before I worried."
        },
        {
          "id": "s7",
          "text": "Jon: And I can ask before moving a book that is sitting at someone’s place."
        }
      ],
      "items": [
        {
          "id": "q-comprehend-library-mixup",
          "unit": "comprehend",
          "template": "dialogue-misunderstanding",
          "level": "L2",
          "interaction": "select",
          "prompt": "What did Jon actually do with the animal book?",
          "options": [
            {
              "text": "He placed it on the return cart."
            },
            {
              "text": "He checked it out and took it home.",
              "errorType": "contradicts_text"
            },
            {
              "text": "He hid it behind another book.",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-library-mixup",
          "unit": "infer",
          "template": "claim",
          "level": "L3",
          "interaction": "select",
          "pairId": "jon-intention-library",
          "prompt": "What was Jon most likely trying to do when he moved the book?",
          "options": [
            {
              "text": "Help return a book he believed someone had finished using."
            },
            {
              "text": "Keep Mia from reading the book.",
              "errorType": "contradicts_text"
            },
            {
              "text": "Take the book without checking it out.",
              "errorType": "contradicts_text"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-library-mixup-evidence",
          "unit": "infer",
          "template": "claim-evidence",
          "level": "L3",
          "interaction": "evidence",
          "pairId": "jon-intention-library",
          "claimItemId": "q-infer-library-mixup",
          "evidenceFor": "q-infer-library-mixup",
          "target": "sentence",
          "answer": [
            "s2",
            "s4"
          ]
        },
        {
          "id": "q-structure-library-mixup",
          "unit": "structure",
          "template": "dialogue-sequence",
          "level": "L2",
          "interaction": "order",
          "prompt": "Put the parts of the conversation in order.",
          "cards": [
            {
              "id": "o1",
              "text": "Mia believes the book was taken."
            },
            {
              "id": "o2",
              "text": "Jon explains that he moved it to the return cart."
            },
            {
              "id": "o3",
              "text": "Mia and Jon suggest what they can do differently next time."
            }
          ],
          "answer": [
            "o1",
            "o2",
            "o3"
          ]
        },
        {
          "id": "q-choose-library-mixup",
          "unit": "choose",
          "template": "polite-wording",
          "level": "L3",
          "interaction": "select",
          "prompt": "Which line most clearly shows Mia checking the meaning politely instead of making an accusation?",
          "options": [
            {
              "text": "“Could you explain what you mean by ‘moved’?”"
            },
            {
              "text": "“You took my book, and I know it.”",
              "errorType": "tone_mismatch"
            },
            {
              "text": "“Give it back right now.”",
              "errorType": "tone_mismatch"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "Use the dialogue to explain how the misunderstanding began and how the speakers cleared it up.",
        "slots": [
          {
            "key": "misunderstanding",
            "name": "What Mia first believed",
            "options": [
              "Mia thought Jon had taken the book home",
              "Mia understood “moved” to mean that the book was gone",
              "Mia worried before asking Jon what he meant"
            ]
          },
          {
            "key": "clarification",
            "name": "What clarified the situation",
            "options": [
              "Jon explained that he had put the book on the return cart",
              "the librarian confirmed that the book was still in the library",
              "the speakers explained their meanings instead of continuing to assume"
            ]
          }
        ],
        "template": "{misunderstanding}. The situation became clear when {clarification}.",
        "otherIdeas": [
          {
            "viewpoint": "Word meaning",
            "text": "The misunderstanding centered on what Jon meant by the word “moved.”"
          },
          {
            "viewpoint": "Speaker intention",
            "text": "Jon intended to help, even though moving the book caused confusion."
          },
          {
            "viewpoint": "Resolution",
            "text": "The speakers listened to one another and agreed on clearer actions for next time."
          }
        ],
        "reflectPrompt": "Which explanation distinguishes Mia’s first assumption from Jon’s actual intention?"
      },
      "createCcr": {
        "prompt": "Create a new polite exchange that could prevent the same misunderstanding before the book is moved.",
        "slots": [
          {
            "key": "question",
            "name": "Jon’s new question",
            "options": [
              "Is someone still using this book?",
              "May I move this book to the return cart?",
              "Does this book belong at this seat?"
            ]
          },
          {
            "key": "reply",
            "name": "Mia’s clear reply",
            "options": [
              "I am still using it, and I will be back soon.",
              "Please leave it here; I have not finished yet.",
              "Yes, I am coming back for it after I find another book."
            ]
          }
        ],
        "template": "Jon asks, “{question}” Mia replies, “{reply}”",
        "otherIdeas": [
          {
            "viewpoint": "Use a note",
            "text": "Mia could leave a short note saying that she is still using the book."
          },
          {
            "viewpoint": "Ask the librarian",
            "text": "Jon could ask the librarian before placing the book on the return cart."
          },
          {
            "viewpoint": "Clarify a word",
            "text": "Mia could ask what “moved” means before deciding that the book was taken away."
          }
        ],
        "reflectPrompt": "Which new exchange is polite, clear, and prevents the confusion before it starts?"
      }
    }
  ],

  // K1–K2 (pre-reading): small emoji scenes, no sentences. `objects` are
  // placed by x/y percent (0=top/left .. 100=bottom/right); face-* objects
  // are the mood options for the `infer` item, tied to a character by
  // proximity in the picture, not by "obvious" weather/event logic.
  SCENES: [
    {
      id: 'zh-k1-rain-shelter', lang: 'zh', grade: 'K1', bg: 'rain',
      objects: [
        { id: 'tree', emoji: '🌳', x: 25, y: 20, labelZh: '大树', labelEn: 'tree' },
        { id: 'rabbit', emoji: '🐰', x: 25, y: 62, labelZh: '小兔', labelEn: 'rabbit' },
        { id: 'face-happy', emoji: '😊', x: 40, y: 55, labelZh: '开心的表情', labelEn: 'happy face' },
        { id: 'duck', emoji: '🦆', x: 72, y: 68, labelZh: '小鸭', labelEn: 'duck' },
        { id: 'puddle', emoji: '💧', x: 72, y: 88, labelZh: '水坑', labelEn: 'puddle' },
        { id: 'face-worried', emoji: '😟', x: 86, y: 55, labelZh: '着急的表情', labelEn: 'worried face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '下雨了，谁站在大树下面？点一点。', promptEn: 'It is raining. Who is standing under the tree? Tap it.',
          target: 'rabbit', distractors: ['duck'],
          hintZh: '大树就在它的头顶上。', hintEn: 'The tree is right above it.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '小鸭站在水坑里，它现在是什么心情？点一点小鸭旁边的表情。', promptEn: 'The duck is standing in a puddle. How does it feel? Tap the face next to the duck.',
          target: 'face-worried', distractors: ['face-happy'],
          hintZh: '找一找离小鸭最近的那个表情，不是小兔旁边的。', hintEn: 'Find the face closest to the duck, not the one near the rabbit.' },
        { id: 'q3', unit: 'comprehend', interaction: 'hotspot',
          promptZh: '听一听：“站在大树下面的小兔”。这句话说的是谁？点一点。', promptEn: 'Listen: “the rabbit under the tree.” Who does that describe? Tap it.',
          target: 'rabbit', distractors: ['duck'],
          hintZh: '注意“在大树下面”这个位置。', hintEn: 'Listen for “under the tree”.' },
        { id: 'q4', unit: 'choose', interaction: 'hotspot',
          promptZh: '哪一个画面最适合“躲在树下”这句话？点一点。', promptEn: 'Which character best matches “sheltering under the tree”? Tap it.',
          target: 'rabbit', distractors: ['duck'],
          hintZh: '“树下”说的是位置，看看谁和树靠在一起。', hintEn: 'The phrase tells you a place. Look for who is under the tree.' },
        { id: 'q5', unit: 'structure', interaction: 'order' }
      ],
      frames: [
        { id: 'f1', emoji: '🌧️🦆', textZh: '下雨了，小鸭站在雨里。', textEn: 'It starts to rain, and the duck is out in the rain.' },
        { id: 'f2', emoji: '🐰🌳', textZh: '小兔发现树下可以躲雨。', textEn: 'The rabbit finds shelter under the tree.' },
        { id: 'f3', emoji: '🐰🦆🌳', textZh: '小兔邀请小鸭一起到树下躲雨。', textEn: 'The rabbit invites the duck to shelter under the tree together.' }
      ],
      expressCcr: {
        promptZh: '如果小兔想邀请小鸭一起躲雨，它可以怎么说？',
        promptEn: 'How could the rabbit invite the duck to shelter together?',
        slots: [
          { key: 'say', nameZh: '小兔会说……', nameEn: 'Rabbit could say…',
            optionsZh: ['快来树下吧', '我们一起躲雨吧', '这里还有位置', '我给你让一点地方'],
            optionsEn: ['Come under the tree', 'Let us shelter together', 'There is room here', 'I can make room for you'] },
          { key: 'why', nameZh: '因为……', nameEn: 'because…',
            optionsZh: ['小鸭正在淋雨', '树下可以挡一点雨', '两个人可以互相帮助', '小兔看见了小鸭'],
            optionsEn: ['the duck is getting wet', 'the tree gives some shelter', 'friends can help each other', 'the rabbit noticed the duck'] }
        ],
        template: '{say}，因为{why}。',
        otherIdeas: [
          { viewpointZh: '有人说得很直接', viewpointEn: 'A direct invitation', textZh: '“快来！这里不会淋得那么湿。”', textEn: '“Come here! You will not get so wet.”' },
          { viewpointZh: '有人先关心小鸭', viewpointEn: 'Someone showed concern first', textZh: '“你淋湿了吗？来我这里吧。”', textEn: '“Are you getting wet? Come over here.”' },
          { viewpointZh: '有人想到一起行动', viewpointEn: 'Someone suggested acting together', textZh: '小兔走过去，把小鸭带到树下。', textEn: 'The rabbit goes over and brings the duck under the tree.' }
        ],
        reflectPromptZh: '哪一种说法既说清楚了意思，又让小鸭听起来舒服？',
        reflectPromptEn: 'Which invitation is clear and also sounds kind?'
      },
      createCcr: {
        promptZh: '如果雨越下越大，小兔和小鸭还能想出什么新的办法？',
        promptEn: 'If the rain gets heavier, what new idea could the rabbit and duck try?',
        slots: [
          { key: 'idea', nameZh: '他们可以……', nameEn: 'They could…',
            optionsZh: ['用大树叶搭一个小棚子', '找更多朋友一起想办法', '把水坑变成一条小河来玩', '做一把特别大的叶子伞'],
            optionsEn: ['build a little shelter from big leaves', 'ask more friends to invent a solution', 'turn the puddle into a tiny river for a game', 'make one giant leaf umbrella'] },
          { key: 'twist', nameZh: '接下来……', nameEn: 'Then…',
            optionsZh: ['风把树叶吹得转了起来', '又来了一只需要帮助的小动物', '他们发现了一个新的躲雨地方', '这个办法变成了一场新游戏'],
            optionsEn: ['the wind starts spinning the leaves', 'another animal arrives needing help', 'they discover a new hiding place', 'their idea turns into a new game'] }
        ],
        template: '{idea}；{twist}。',
        otherIdeas: [
          { viewpointZh: '有人改变了故事里的东西', viewpointEn: 'Someone changed an object in the story', textZh: '把普通树叶想成能拼起来的小屋顶。', textEn: 'Ordinary leaves become pieces of a tiny roof.' },
          { viewpointZh: '有人加入了新角色', viewpointEn: 'Someone added a new character', textZh: '新的小动物来了，原来的办法也要跟着改变。', textEn: 'A new animal arrives, so the first plan has to change.' },
          { viewpointZh: '有人把困难变成游戏', viewpointEn: 'Someone turned the problem into play', textZh: '雨没有停，但故事从躲雨变成了雨天游戏。', textEn: 'The rain does not stop, but the story becomes a rainy-day game.' }
        ],
        reflectPromptZh: '哪一个想法真正给原来的故事增加了新的情节？',
        reflectPromptEn: 'Which idea really adds a new event to the original story?'
      }
    },
      {
    "id": "zh-k1-sunny-shade",
    "lang": "zh",
    "grade": "K1",
    "bg": "sunny",
    "objects": [
      {
        "id": "sun",
        "emoji": "☀️",
        "x": 78,
        "y": 12,
        "labelZh": "太阳",
        "labelEn": "sun"
      },
      {
        "id": "tree",
        "emoji": "🌳",
        "x": 28,
        "y": 22,
        "labelZh": "大树",
        "labelEn": "tree"
      },
      {
        "id": "bear",
        "emoji": "🐻",
        "x": 28,
        "y": 62,
        "labelZh": "小熊",
        "labelEn": "bear"
      },
      {
        "id": "face-happy",
        "emoji": "😊",
        "x": 42,
        "y": 55,
        "labelZh": "开心的表情",
        "labelEn": "happy face"
      },
      {
        "id": "cat",
        "emoji": "🐱",
        "x": 76,
        "y": 68,
        "labelZh": "小猫",
        "labelEn": "cat"
      },
      {
        "id": "face-tired",
        "emoji": "🥵",
        "x": 90,
        "y": 55,
        "labelZh": "又热又累的表情",
        "labelEn": "hot and tired face"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "interaction": "hotspot",
        "promptZh": "谁坐在大树的树荫下面？点一点。",
        "promptEn": "Who is sitting in the shade of the tree? Tap it.",
        "target": "bear",
        "distractors": [
          "cat"
        ],
        "hintZh": "大树在谁的头顶上？",
        "hintEn": "Who has the tree right above them?"
      },
      {
        "id": "q2",
        "unit": "infer",
        "interaction": "hotspot",
        "promptZh": "小猫一直晒着太阳，脸都红了。它现在是什么心情？点一点小猫旁边的表情。",
        "promptEn": "The cat has been sitting in the hot sun. How does it feel? Tap the face next to the cat.",
        "target": "face-tired",
        "distractors": [
          "face-happy"
        ],
        "hintZh": "找一找离小猫最近的那个表情，不是小熊旁边的。",
        "hintEn": "Find the face closest to the cat, not the one near the bear."
      },
      {
        "id": "q-comprehend-shade",
        "unit": "comprehend",
        "template": "scene-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "小朋友最后走到了哪里？",
        "promptZh": "小朋友最后走到了哪里？",
        "options": [
          {
            "text": "树下的阴影里。",
            "textZh": "树下的阴影里。"
          },
          {
            "text": "更亮的阳光里。",
            "textZh": "更亮的阳光里。",
            "errorType": "contradicts_scene"
          },
          {
            "text": "看不见太阳的屋子里。",
            "textZh": "看不见太阳的屋子里。",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "看看最后一幅画，小朋友停在哪里。"
      },
      {
        "id": "q-structure-sunny-shade",
        "unit": "structure",
        "interaction": "order",
        "template": "scene-order",
        "level": "L2",
        "prompt": "按发生的顺序排一排。",
        "promptZh": "按发生的顺序排一排。",
        "cards": [
          "站在阳光下。",
          "看见树下的阴影。",
          "走进树荫里。"
        ],
        "frameIds": [
          "sunny-shade-f1",
          "sunny-shade-f2",
          "sunny-shade-f3"
        ],
        "answer": [
          "sunny-shade-f1",
          "sunny-shade-f2",
          "sunny-shade-f3"
        ],
        "hint": "先看阳光下，再看发现阴影，最后看走到哪里。"
      },
      {
        "id": "q-choose-shade-word",
        "unit": "choose",
        "template": "scene-word-choice",
        "level": "L2",
        "interaction": "select",
        "prompt": "看最后一幅画，哪句话说得最合适？",
        "promptZh": "看最后一幅画，哪句话说得最合适？",
        "options": [
          {
            "text": "小朋友走进凉快的树荫里。",
            "textZh": "小朋友走进凉快的树荫里。"
          },
          {
            "text": "小朋友跑进亮亮的阳光里。",
            "textZh": "小朋友跑进亮亮的阳光里。",
            "errorType": "contradicts_scene"
          },
          {
            "text": "小朋友把大树搬走了。",
            "textZh": "小朋友把大树搬走了。",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "“树荫”要和最后看到的位置相配。"
      }
    ],
    "frames": [
      {
        "id": "sunny-shade-f1",
        "emoji": "🌧️🦆",
        "textZh": "太阳照着，小朋友站在亮亮的阳光下。",
        "textEn": "It starts to rain, and the duck is out in the rain.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "tree",
            "emoji": "🌳",
            "x": 28,
            "y": 22,
            "labelZh": "大树",
            "labelEn": "tree"
          },
          {
            "id": "bear",
            "emoji": "🐻",
            "x": 28,
            "y": 62,
            "labelZh": "小熊",
            "labelEn": "bear"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "cat",
            "emoji": "🐱",
            "x": 76,
            "y": 68,
            "labelZh": "小猫",
            "labelEn": "cat"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 1
      },
      {
        "id": "sunny-shade-f2",
        "emoji": "🐰🌳",
        "textZh": "小朋友觉得晒，抬头看见树下有一片阴影。",
        "textEn": "The rabbit finds shelter under the tree.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "tree",
            "emoji": "🌳",
            "x": 28,
            "y": 22,
            "labelZh": "大树",
            "labelEn": "tree"
          },
          {
            "id": "bear",
            "emoji": "🐻",
            "x": 28,
            "y": 62,
            "labelZh": "小熊",
            "labelEn": "bear"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "cat",
            "emoji": "🐱",
            "x": 76,
            "y": 68,
            "labelZh": "小猫",
            "labelEn": "cat"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 2
      },
      {
        "id": "sunny-shade-f3",
        "emoji": "🐰🦆🌳",
        "textZh": "小朋友走到树荫里，停在凉快的阴影下。",
        "textEn": "The rabbit invites the duck to shelter under the tree together.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "tree",
            "emoji": "🌳",
            "x": 28,
            "y": 22,
            "labelZh": "大树",
            "labelEn": "tree"
          },
          {
            "id": "bear",
            "emoji": "🐻",
            "x": 28,
            "y": 62,
            "labelZh": "小熊",
            "labelEn": "bear"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "cat",
            "emoji": "🐱",
            "x": 76,
            "y": 68,
            "labelZh": "小猫",
            "labelEn": "cat"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 3
      }
    ],
    "expressCcr": {
      "prompt": "看着三幅画，说清楚小朋友为什么从阳光下走到树荫里。",
      "promptZh": "看着三幅画，说清楚小朋友为什么从阳光下走到树荫里。",
      "slots": [
        {
          "key": "first",
          "name": "一开始……",
          "options": [
            "小朋友站在亮亮的阳光下",
            "太阳照着小朋友",
            "小朋友觉得有点晒",
            "树下有一片阴影"
          ]
        },
        {
          "key": "then",
          "name": "后来……",
          "options": [
            "小朋友看见树下的阴影",
            "小朋友走进凉快的树荫里",
            "小朋友从阳光下走开",
            "小朋友停在大树下面"
          ]
        }
      ],
      "template": "一开始，{first}。后来，{then}。",
      "otherIdeas": [
        {
          "viewpoint": "说出位置变化",
          "text": "小朋友先在阳光下，后来走到了树荫里。"
        },
        {
          "viewpoint": "说出原因",
          "text": "阳光下有点晒，所以小朋友去找阴影。"
        },
        {
          "viewpoint": "说出画面线索",
          "text": "最后一幅画里，小朋友站在大树下面。"
        }
      ],
      "reflectPrompt": "哪一种说法既讲清楚先后，也讲清楚为什么要走到树荫里？"
    },
    "createCcr": {
      "prompt": "给这组画增加一个新的变化，让小朋友在树荫里做一件新事情。",
      "promptZh": "给这组画增加一个新的变化，让小朋友在树荫里做一件新事情。",
      "slots": [
        {
          "key": "change",
          "name": "树荫里可以出现……",
          "options": [
            "一张可以休息的小凳子",
            "一只正在喝水的小鸟",
            "几片被风吹动的叶子",
            "一个和小朋友招手的新伙伴"
          ]
        },
        {
          "key": "action",
          "name": "小朋友可以……",
          "options": [
            "坐下来看看树影",
            "给小鸟放一小碗水",
            "学着叶子的样子轻轻摆动",
            "请新伙伴一起在树荫里玩"
          ]
        }
      ],
      "template": "树荫里出现了{change}，小朋友决定{action}。",
      "otherIdeas": [
        {
          "viewpoint": "增加新动作",
          "text": "小朋友用手比一比阳光和树影的形状。"
        },
        {
          "viewpoint": "增加新变化",
          "text": "风吹过以后，地上的树影轻轻动了起来。"
        },
        {
          "viewpoint": "增加新表达",
          "text": "小朋友说：“树荫像一把大大的绿伞。”"
        }
      ],
      "reflectPrompt": "哪一个想法给原来的画面增加了真正的新动作或新变化？"
    }
  },
    {
      id: 'en-k1-puddle-puppies', lang: 'en', grade: 'K1', bg: 'rain',
      objects: [
        { id: 'umbrella', emoji: '☂️', x: 25, y: 20, labelZh: '雨伞', labelEn: 'umbrella' },
        { id: 'dog1', emoji: '🐶', x: 25, y: 62, labelZh: '小狗一', labelEn: 'puppy' },
        { id: 'face-happy', emoji: '😊', x: 40, y: 55, labelZh: '开心的表情', labelEn: 'happy face' },
        { id: 'dog2', emoji: '🐕', x: 74, y: 68, labelZh: '小狗二', labelEn: 'puppy' },
        { id: 'rain', emoji: '🌧️', x: 74, y: 22, labelZh: '雨', labelEn: 'rain cloud' },
        { id: 'face-worried', emoji: '😟', x: 88, y: 55, labelZh: '着急的表情', labelEn: 'worried face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '哪只小狗站在雨伞下面？点一点。', promptEn: 'Which puppy is standing under the umbrella? Tap it.',
          target: 'dog1', distractors: ['dog2'],
          hintZh: '雨伞就在它的头顶上。', hintEn: 'The umbrella is right above it.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '另一只小狗没有伞，全身都湿透了。它现在是什么心情？点一点它旁边的表情。', promptEn: 'The other puppy has no umbrella and is soaking wet. How does it feel? Tap the face next to it.',
          target: 'face-worried', distractors: ['face-happy'],
          hintZh: '找一找离淋湿的小狗最近的表情。', hintEn: 'Find the face closest to the wet puppy.' },
        { id: 'q3', unit: 'comprehend', interaction: 'hotspot',
          promptZh: '听一听：“the puppy under the umbrella”。说的是哪只小狗？', promptEn: 'Listen: “the puppy under the umbrella.” Which puppy is it?',
          target: 'dog1', distractors: ['dog2'],
          hintZh: '注意 under the umbrella。', hintEn: 'Listen for “under the umbrella”.' },
        { id: 'q4', unit: 'choose', interaction: 'hotspot',
          promptZh: '听一听：“the wet puppy”。哪个画面和 wet 最相配？', promptEn: 'Listen: “the wet puppy.” Which puppy best matches the word “wet”?',
          target: 'dog2', distractors: ['dog1'],
          hintZh: '看看哪只小狗没有雨伞。', hintEn: 'Look for the puppy with no umbrella.' },
        { id: 'q5', unit: 'structure', interaction: 'order' }
      ],
      frames: [
        { id: 'f1', emoji: '🌧️🐕', textZh: '下雨了，一只小狗没有雨伞。', textEn: 'It starts to rain, and one puppy has no umbrella.' },
        { id: 'f2', emoji: '🐶☂️', textZh: '另一只小狗站在雨伞下面。', textEn: 'The other puppy is standing under an umbrella.' },
        { id: 'f3', emoji: '🐶🐕☂️', textZh: '有伞的小狗邀请朋友一起躲雨。', textEn: 'The puppy with the umbrella invites its friend to share the shelter.' }
      ],
      expressCcr: {
        promptZh: '有伞的小狗想叫另一只小狗过来，它可以怎么说？',
        promptEn: 'The puppy with the umbrella wants to invite the other puppy over. What could it say?',
        slots: [
          { key: 'say', nameZh: '它会说……', nameEn: 'It could say…',
            optionsZh: ['快到伞下面来', '我们一起撑伞吧', '这里还有地方', '过来和我站一起'],
            optionsEn: ['Come under my umbrella', 'Let us share the umbrella', 'There is room for you', 'Come stand with me'] },
          { key: 'why', nameZh: '因为……', nameEn: 'because…',
            optionsZh: ['另一只小狗淋湿了', '一把伞可以一起用', '它想帮助朋友', '雨还在下'],
            optionsEn: ['the other puppy is wet', 'they can share one umbrella', 'it wants to help a friend', 'it is still raining'] }
        ],
        template: '{say}, because {why}.',
        otherIdeas: [
          { viewpointZh: '有人用了 share', viewpointEn: 'Someone used “share”', textZh: '“Let us share!” 一句话就说清楚了一起用伞。', textEn: '“Let us share!” makes the idea clear in two words.' },
          { viewpointZh: '有人先问问题', viewpointEn: 'Someone asked first', textZh: '“Do you want to come under my umbrella?”', textEn: '“Do you want to come under my umbrella?”' },
          { viewpointZh: '有人想到动作', viewpointEn: 'Someone used an action', textZh: '小狗把伞往朋友那边移过去。', textEn: 'The puppy moves the umbrella toward its friend.' }
        ],
        reflectPromptZh: '哪一种英文说法最像在友好地邀请朋友？',
        reflectPromptEn: 'Which English sentence sounds most like a friendly invitation?'
      },
      createCcr: {
        promptZh: '如果雨伞突然被风吹跑了，两只小狗的故事会怎样继续？',
        promptEn: 'If the umbrella suddenly blows away, how could the puppies’ story continue?',
        slots: [
          { key: 'plan', nameZh: '两只小狗会……', nameEn: 'The puppies could…',
            optionsZh: ['一起追会飞的雨伞', '用纸箱做一个临时屋顶', '跟着雨伞去一个新地方', '请一只大鸟帮忙找伞'],
            optionsEn: ['chase the flying umbrella together', 'make a quick roof from a box', 'follow the umbrella to a new place', 'ask a big bird to help find it'] },
          { key: 'surprise', nameZh: '没想到……', nameEn: 'But then…',
            optionsZh: ['雨伞挂在了一棵树上', '纸箱变成了一艘小船', '他们遇见了另一只迷路的小狗', '雨突然停了，出现了一道彩虹'],
            optionsEn: ['the umbrella gets caught in a tree', 'the box turns into a little boat', 'they meet another lost puppy', 'the rain stops and a rainbow appears'] }
        ],
        template: '{plan}. {surprise}.',
        otherIdeas: [
          { viewpointZh: '有人让物品推动故事', viewpointEn: 'Someone let an object drive the story', textZh: '风把雨伞吹到新的地方，两只小狗只好追过去。', textEn: 'The wind carries the umbrella somewhere new, and the puppies follow it.' },
          { viewpointZh: '有人加了意外', viewpointEn: 'Someone added a surprise', textZh: '原本用来躲雨的东西，后来有了完全不同的用途。', textEn: 'Something meant for shelter ends up being used in a completely different way.' },
          { viewpointZh: '有人加入新朋友', viewpointEn: 'Someone added a new friend', textZh: '寻找雨伞的路上出现了第三个角色。', textEn: 'A third character joins while they search for the umbrella.' }
        ],
        reflectPromptZh: '哪一个续编让故事发生了真正新的变化？',
        reflectPromptEn: 'Which continuation gives the story a genuinely new turn?'
      }
    },
      {
    "id": "en-k1-mushroom-shade",
    "lang": "en",
    "grade": "K1",
    "bg": "sunny",
    "objects": [
      {
        "id": "sun",
        "emoji": "☀️",
        "x": 78,
        "y": 12,
        "labelZh": "太阳",
        "labelEn": "sun"
      },
      {
        "id": "mushroom",
        "emoji": "🍄",
        "x": 28,
        "y": 24,
        "labelZh": "蘑菇",
        "labelEn": "mushroom"
      },
      {
        "id": "chick1",
        "emoji": "🐥",
        "x": 28,
        "y": 62,
        "labelZh": "小鸡一",
        "labelEn": "chick"
      },
      {
        "id": "face-happy",
        "emoji": "😊",
        "x": 42,
        "y": 55,
        "labelZh": "开心的表情",
        "labelEn": "happy face"
      },
      {
        "id": "chick2",
        "emoji": "🐤",
        "x": 76,
        "y": 68,
        "labelZh": "小鸡二",
        "labelEn": "chick"
      },
      {
        "id": "face-tired",
        "emoji": "🥵",
        "x": 90,
        "y": 55,
        "labelZh": "又热又累的表情",
        "labelEn": "hot and tired face"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "interaction": "hotspot",
        "promptZh": "哪只小鸡站在蘑菇下面？点一点。",
        "promptEn": "Which chick is standing under the mushroom? Tap it.",
        "target": "chick1",
        "distractors": [
          "chick2"
        ],
        "hintZh": "蘑菇在谁的头顶上？",
        "hintEn": "Who has the mushroom right above them?"
      },
      {
        "id": "q2",
        "unit": "infer",
        "interaction": "hotspot",
        "promptZh": "另一只小鸡一直站在太阳下面。它现在是什么心情？点一点它旁边的表情。",
        "promptEn": "The other chick has been standing in the hot sun. How does it feel? Tap the face next to it.",
        "target": "face-tired",
        "distractors": [
          "face-happy"
        ],
        "hintZh": "找一找离晒太阳的小鸡最近的表情。",
        "hintEn": "Find the face closest to the chick in the sun."
      },
      {
        "id": "q-comprehend-mushroom-shade",
        "unit": "comprehend",
        "template": "scene-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "Where does the friend rest at the end?",
        "promptEn": "Where does the friend rest at the end?",
        "options": [
          {
            "text": "In the shade beneath the mushroom."
          },
          {
            "text": "In the brightest patch of sunshine.",
            "errorType": "contradicts_scene"
          },
          {
            "text": "Inside a house that is not shown.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Look at the last frame and notice what is above the friend."
      },
      {
        "id": "q-structure-mushroom-shade",
        "unit": "structure",
        "template": "scene-order",
        "level": "L2",
        "interaction": "order",
        "prompt": "Put the picture-story events in order.",
        "promptEn": "Put the picture-story events in order.",
        "cards": [
          "Stand in the bright sunshine.",
          "Notice the shadow under the mushroom.",
          "Move into the mushroom shade."
        ],
        "frameIds": [
          "mushroom-shade-f1",
          "mushroom-shade-f2",
          "mushroom-shade-f3"
        ],
        "answer": [
          "mushroom-shade-f1",
          "mushroom-shade-f2",
          "mushroom-shade-f3"
        ],
        "hint": "Follow what the friend sees and does from the first frame to the last."
      },
      {
        "id": "q-choose-mushroom-shade",
        "unit": "choose",
        "template": "scene-word-choice",
        "level": "L2",
        "interaction": "select",
        "prompt": "Which sentence best matches the last frame?",
        "promptEn": "Which sentence best matches the last frame?",
        "options": [
          {
            "text": "The friend rests in the cool mushroom shade."
          },
          {
            "text": "The friend climbs into brighter sunshine.",
            "errorType": "contradicts_scene"
          },
          {
            "text": "The friend carries the mushroom away.",
            "errorType": "fabrication"
          }
        ],
        "answer": 0,
        "hint": "Choose the sentence that names both the place and what the friend does."
      }
    ],
    "frames": [
      {
        "id": "mushroom-shade-f1",
        "narration": "A friend stands in the bright sunshine near the mushroom.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "mushroom",
            "emoji": "🍄",
            "x": 28,
            "y": 24,
            "labelZh": "蘑菇",
            "labelEn": "mushroom"
          },
          {
            "id": "chick1",
            "emoji": "🐥",
            "x": 28,
            "y": 62,
            "labelZh": "小鸡一",
            "labelEn": "chick"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "chick2",
            "emoji": "🐤",
            "x": 76,
            "y": 68,
            "labelZh": "小鸡二",
            "labelEn": "chick"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 1
      },
      {
        "id": "mushroom-shade-f2",
        "narration": "The friend notices the cool shadow beneath the wide mushroom cap.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "mushroom",
            "emoji": "🍄",
            "x": 28,
            "y": 24,
            "labelZh": "蘑菇",
            "labelEn": "mushroom"
          },
          {
            "id": "chick1",
            "emoji": "🐥",
            "x": 28,
            "y": 62,
            "labelZh": "小鸡一",
            "labelEn": "chick"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "chick2",
            "emoji": "🐤",
            "x": 76,
            "y": 68,
            "labelZh": "小鸡二",
            "labelEn": "chick"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 2
      },
      {
        "id": "mushroom-shade-f3",
        "narration": "The friend moves under the mushroom and rests in its shade.",
        "objects": [
          {
            "id": "sun",
            "emoji": "☀️",
            "x": 78,
            "y": 12,
            "labelZh": "太阳",
            "labelEn": "sun"
          },
          {
            "id": "mushroom",
            "emoji": "🍄",
            "x": 28,
            "y": 24,
            "labelZh": "蘑菇",
            "labelEn": "mushroom"
          },
          {
            "id": "chick1",
            "emoji": "🐥",
            "x": 28,
            "y": 62,
            "labelZh": "小鸡一",
            "labelEn": "chick"
          },
          {
            "id": "face-happy",
            "emoji": "😊",
            "x": 42,
            "y": 55,
            "labelZh": "开心的表情",
            "labelEn": "happy face"
          },
          {
            "id": "chick2",
            "emoji": "🐤",
            "x": 76,
            "y": 68,
            "labelZh": "小鸡二",
            "labelEn": "chick"
          },
          {
            "id": "face-tired",
            "emoji": "🥵",
            "x": 90,
            "y": 55,
            "labelZh": "又热又累的表情",
            "labelEn": "hot and tired face"
          }
        ],
        "order": 3
      }
    ],
    "expressCcr": {
      "prompt": "Use “first” and “then” to explain why the friend moved under the mushroom.",
      "promptEn": "Use “first” and “then” to explain why the friend moved under the mushroom.",
      "slots": [
        {
          "key": "first",
          "name": "First…",
          "options": [
            "the friend stood in the bright sunshine",
            "the friend noticed the wide mushroom",
            "the sunshine felt warm",
            "a shadow appeared beneath the mushroom cap"
          ]
        },
        {
          "key": "then",
          "name": "Then…",
          "options": [
            "the friend moved into the cool shade",
            "the friend rested beneath the mushroom",
            "the friend left the bright patch",
            "the mushroom cap covered the friend from the sun"
          ]
        }
      ],
      "template": "First, {first}. Then, {then}.",
      "otherIdeas": [
        {
          "viewpoint": "Explain the place change",
          "text": "The friend moved from bright sunshine into the mushroom shade."
        },
        {
          "viewpoint": "Explain the reason",
          "text": "The wide mushroom cap made a cooler place to rest."
        },
        {
          "viewpoint": "Use picture evidence",
          "text": "In the last frame, the mushroom is above the resting friend."
        }
      ],
      "reflectPrompt": "Which explanation makes both the order and the reason clear?"
    },
    "createCcr": {
      "prompt": "Add a new event that could happen while the friend rests beneath the mushroom.",
      "promptEn": "Add a new event that could happen while the friend rests beneath the mushroom.",
      "slots": [
        {
          "key": "arrival",
          "name": "Something new arrives…",
          "options": [
            "soft raindrops begin tapping the mushroom cap",
            "a line of ants carries crumbs past the shade",
            "a little snail leaves a shiny trail nearby",
            "a breeze shakes loose a round drop of water"
          ]
        },
        {
          "key": "action",
          "name": "The friend decides to…",
          "options": [
            "listen to the raindrop rhythm",
            "make a safe path around the ants",
            "follow the snail trail with one finger",
            "catch the water drop on a leaf"
          ]
        }
      ],
      "template": "{arrival}, so the friend decides to {action}.",
      "otherIdeas": [
        {
          "viewpoint": "Add sound",
          "text": "The mushroom becomes a tiny drum when rain begins."
        },
        {
          "viewpoint": "Add discovery",
          "text": "The friend finds a small feather hidden at the edge of the shade."
        },
        {
          "viewpoint": "Add cooperation",
          "text": "Another friend arrives, and they make room beneath the mushroom."
        }
      ],
      "reflectPrompt": "Which idea creates a new action instead of only retelling the move into the shade?"
    }
  },
    {
      id: 'zh-k2-lost-kitten', lang: 'zh', grade: 'K2', bg: 'grass',
      objects: [
        { id: 'sign', emoji: '🪧', x: 74, y: 26, labelZh: '公园牌子', labelEn: 'park sign' },
        { id: 'bench', emoji: '🪑', x: 68, y: 68, labelZh: '长椅', labelEn: 'bench' },
        { id: 'kitten', emoji: '🐱', x: 32, y: 62, labelZh: '小猫', labelEn: 'kitten' },
        { id: 'dog', emoji: '🐕', x: 48, y: 64, labelZh: '小狗', labelEn: 'dog' },
        { id: 'face-worried', emoji: '😟', x: 32, y: 38, labelZh: '着急的表情', labelEn: 'worried face' },
        { id: 'face-happy', emoji: '😊', x: 58, y: 40, labelZh: '开心的表情', labelEn: 'happy face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '小猫坐在什么东西旁边？点一点。', promptEn: 'What is the kitten sitting next to? Tap it.',
          target: 'bench', distractors: ['sign'],
          hintZh: '小猫旁边有一个能坐的东西。', hintEn: 'There is something to sit on near the kitten.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '小猫看不到妈妈，心里是什么感觉？点一点小猫旁边的表情。', promptEn: 'The kitten cannot see its mom. How does it feel? Tap the face next to the kitten.',
          target: 'face-worried', distractors: ['face-happy'],
          hintZh: '找一找离小猫最近的那个表情。', hintEn: 'Find the face closest to the kitten.' },
        { id: 'q3', unit: 'structure', interaction: 'order' },
      { id: 'q4', unit: 'comprehend', interaction: 'hotspot',
        promptZh: '听完整个故事，谁告诉小猫妈妈往长椅那边去了？点一点。',
        promptEn: 'Who told the kitten that its mom went toward the bench? Tap it.',
        target: 'dog', distractors: ['kitten', 'sign'],
        hintZh: '故事第二幅里，是谁告诉小猫妈妈往长椅那边去了？',
        hintEn: 'In the second frame, who told the kitten where its mom went?' },
      { id: 'q5', unit: 'choose', interaction: 'hotspot',
        promptZh: '故事里说“小猫跑到长椅那边”。哪一个画面最适合“跑过去找妈妈”？点一点。',
        promptEn: 'Which picture best matches “run toward the bench to find Mom”? Tap it.',
        target: 'kitten', distractors: ['bench'],
        hintZh: '这句话说的是谁在行动，不是行动的地点。',
        hintEn: 'The phrase names who is moving, not the destination.' }
      ],
    expressCcr: {
      promptZh: '小猫找到妈妈以后，会怎么感谢帮助它的小狗？',
      promptEn: 'How could the kitten thank the dog that helped it?',
      slots: [
        { key: 'say', nameZh: '小猫会说……', nameEn: 'The kitten could say…',
          optionsZh: ['谢谢你告诉我方向', '幸好你看见了妈妈', '下次我也会帮助你', '我们一起回家吧'],
          optionsEn: ['Thank you for showing me the way', 'I am glad you saw my mom', 'I will help you next time', 'Let us walk home together'] },
        { key: 'why', nameZh: '因为……', nameEn: 'because…',
          optionsZh: ['小狗给了重要线索', '小猫终于找到了妈妈', '朋友应该互相帮助', '小狗认真听了小猫的话'],
          optionsEn: ['the dog gave an important clue', 'the kitten found its mom', 'friends should help one another', 'the dog listened carefully'] }
      ],
      template: '{say}，因为{why}。',
      otherIdeas: [
        { viewpointZh: '有人感谢具体的帮助', viewpointEn: 'Someone named the exact help',
          textZh: '“谢谢你告诉我妈妈去了哪里。”', textEn: '“Thank you for telling me where Mom went.”' },
        { viewpointZh: '有人想到回报', viewpointEn: 'Someone offered help in return',
          textZh: '小猫说：“以后你需要找路，也来问我。”', textEn: 'The kitten says, “Ask me if you need help finding the way.”' },
        { viewpointZh: '有人用行动表达', viewpointEn: 'Someone used an action',
          textZh: '小猫把小狗介绍给妈妈，三个新朋友一起回家。', textEn: 'The kitten introduces the dog to Mom, and the three friends walk home.' }
      ],
      reflectPromptZh: '哪一种感谢说清楚了“小狗到底帮了什么忙”？',
      reflectPromptEn: 'Which thank-you clearly explains what the dog did?'
    },
    createCcr: {
      promptZh: '如果小猫回家的路上又发现一条陌生的小路，故事可以怎样继续？',
      promptEn: 'If the kitten discovers a new path on the way home, how could the story continue?',
      slots: [
        { key: 'discovery', nameZh: '小猫发现……', nameEn: 'The kitten discovers…',
          optionsZh: ['路边有一串奇怪的脚印', '小路通向一座从没见过的小桥', '草丛里传来轻轻的叫声', '树上挂着一张没有名字的小纸条'],
          optionsEn: ['strange footprints beside the path', 'a bridge it has never seen before', 'a soft call coming from the grass', 'a nameless note hanging from a tree'] },
        { key: 'next', nameZh: '接下来……', nameEn: 'Next…',
          optionsZh: ['它和妈妈一起去找答案', '小狗也赶来帮忙', '他们遇见了一个新朋友', '这条小路引出了另一个故事'],
          optionsEn: ['it explores with Mom', 'the dog comes to help too', 'they meet a new friend', 'the path begins another story'] }
      ],
      template: '{discovery}；{next}。',
      otherIdeas: [
        { viewpointZh: '有人加入了新的谜题', viewpointEn: 'Someone added a mystery', textZh: '找到妈妈不是故事的结束，而是下一次寻找的开始。', textEn: 'Finding Mom becomes the start of a new search.' },
        { viewpointZh: '有人让旧角色再次出现', viewpointEn: 'Someone brought back an earlier character', textZh: '帮助过小猫的小狗又加入了新的冒险。', textEn: 'The dog who helped before joins the new adventure.' },
        { viewpointZh: '有人改变了故事目标', viewpointEn: 'Someone changed the story goal', textZh: '这一次不是寻找妈妈，而是帮助另一个需要帮助的角色。', textEn: 'This time the goal is not finding Mom but helping someone else.' }
      ],
      reflectPromptZh: '哪一个续编真正改变了故事接下来的目标？',
      reflectPromptEn: 'Which continuation gives the story a genuinely new goal?'
    },
      frames: [
        { id: 'f1', emoji: '🐱🔍', textZh: '小猫和妈妈走散了，在公园里到处找。', textEn: 'The kitten got separated from its mom and looked all over the park.' },
        { id: 'f2', emoji: '🐱🐕', textZh: '一只好心的小狗告诉小猫，妈妈往长椅那边去了。', textEn: 'A kind dog told the kitten its mom went toward the bench.' },
        { id: 'f3', emoji: '🐱🐈', textZh: '小猫跑到长椅那边，找到了妈妈。', textEn: 'The kitten ran to the bench and found its mom.' }
      ]
    },
      {
    "id": "zh-k2-broken-kite",
    "lang": "zh",
    "grade": "K2",
    "bg": "sunny",
    "objects": [
      {
        "id": "kite",
        "emoji": "🪁",
        "x": 62,
        "y": 70,
        "labelZh": "风筝",
        "labelEn": "kite"
      },
      {
        "id": "tape",
        "emoji": "🩹",
        "x": 78,
        "y": 42,
        "labelZh": "胶带",
        "labelEn": "tape"
      },
      {
        "id": "ball",
        "emoji": "⚽",
        "x": 82,
        "y": 70,
        "labelZh": "足球",
        "labelEn": "ball"
      },
      {
        "id": "kid",
        "emoji": "🧒",
        "x": 30,
        "y": 62,
        "labelZh": "小男孩",
        "labelEn": "boy"
      },
      {
        "id": "face-sad",
        "emoji": "😢",
        "x": 30,
        "y": 38,
        "labelZh": "难过的表情",
        "labelEn": "sad face"
      },
      {
        "id": "face-happy",
        "emoji": "😊",
        "x": 50,
        "y": 40,
        "labelZh": "开心的表情",
        "labelEn": "happy face"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "interaction": "hotspot",
        "promptZh": "风筝破了，旁边有什么东西可以用来修它？点一点。",
        "promptEn": "The kite is torn. What is next to it that could fix it? Tap it.",
        "target": "tape",
        "distractors": [
          "ball"
        ],
        "hintZh": "找一找能把破洞粘起来的东西。",
        "hintEn": "Find the thing that can stick a tear back together."
      },
      {
        "id": "q2",
        "unit": "infer",
        "interaction": "hotspot",
        "promptZh": "风筝破了，小男孩心里是什么感觉？点一点小男孩旁边的表情。",
        "promptEn": "The kite is torn. How does the boy feel? Tap the face next to the boy.",
        "target": "face-sad",
        "distractors": [
          "face-happy"
        ],
        "hintZh": "找一找离小男孩最近的那个表情。",
        "hintEn": "Find the face closest to the boy."
      },
      {
        "id": "q3",
        "unit": "structure",
        "interaction": "order"
      },
      {
        "id": "q-comprehend-broken-kite",
        "unit": "comprehend",
        "template": "scene-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "风筝坏了以后，小朋友先发现了什么？",
        "promptZh": "风筝坏了以后，小朋友先发现了什么？",
        "options": [
          {
            "text": "风筝的一角破了。",
            "textZh": "风筝的一角破了。"
          },
          {
            "text": "风筝变成了一只小鸟。",
            "textZh": "风筝变成了一只小鸟。",
            "errorType": "fabrication"
          },
          {
            "text": "风筝已经飞到了云上。",
            "textZh": "风筝已经飞到了云上。",
            "errorType": "contradicts_scene"
          }
        ],
        "answer": 0,
        "hint": "仔细看风筝破损的地方。"
      },
      {
        "id": "q-choose-broken-kite",
        "unit": "choose",
        "template": "scene-word-choice",
        "level": "L2",
        "interaction": "select",
        "prompt": "看着坏风筝，哪句话说得最清楚？",
        "promptZh": "看着坏风筝，哪句话说得最清楚？",
        "options": [
          {
            "text": "风筝的一角裂开了，需要补一补。",
            "textZh": "风筝的一角裂开了，需要补一补。"
          },
          {
            "text": "风筝高高地飞在天上。",
            "textZh": "风筝高高地飞在天上。",
            "errorType": "contradicts_scene"
          },
          {
            "text": "风筝把小朋友修好了。",
            "textZh": "风筝把小朋友修好了。",
            "errorType": "role_reversal"
          }
        ],
        "answer": 0,
        "hint": "选择既说出哪里坏了，也说出接下来可以怎么办的话。"
      }
    ],
    "frames": [
      {
        "id": "f1",
        "emoji": "🪁💨",
        "textZh": "风筝被风吹破了一个洞。",
        "textEn": "The wind tears a hole in the kite."
      },
      {
        "id": "f2",
        "emoji": "🧑‍🤝‍🧑🩹",
        "textZh": "朋友拿来胶带，帮忙把风筝粘好。",
        "textEn": "A friend brings tape and helps patch the kite."
      },
      {
        "id": "f3",
        "emoji": "🪁😊",
        "textZh": "风筝又飞起来了，两个人一起笑了。",
        "textEn": "The kite flies again and both kids smile."
      }
    ],
    "expressCcr": {
      "prompt": "看着画面，说清楚风筝哪里坏了，以及小朋友准备怎么办。",
      "promptZh": "看着画面，说清楚风筝哪里坏了，以及小朋友准备怎么办。",
      "slots": [
        {
          "key": "problem",
          "name": "小朋友发现……",
          "options": [
            "风筝的一角裂开了",
            "风筝边上有一个破口",
            "风筝不能像刚才一样好好飞",
            "破损的地方需要修补"
          ]
        },
        {
          "key": "plan",
          "name": "于是准备……",
          "options": [
            "找来纸片补住破口",
            "请大人一起检查风筝线",
            "先把风筝放低再修理",
            "修好以后再试着放飞"
          ]
        }
      ],
      "template": "小朋友发现{problem}，于是准备{plan}。",
      "otherIdeas": [
        {
          "viewpoint": "先说问题",
          "text": "风筝的一角破了，所以现在不能继续放得很高。"
        },
        {
          "viewpoint": "再说办法",
          "text": "小朋友准备先收好风筝，再把破口补牢。"
        },
        {
          "viewpoint": "引用画面",
          "text": "画面里能看到风筝边上有破损，小朋友正在查看它。"
        }
      ],
      "reflectPrompt": "哪一种说法既讲清楚风筝的问题，也讲清楚准备怎样处理？"
    },
    "createCcr": {
      "prompt": "给修风筝的故事增加一个新的方向，让风筝修好后发生一件新事情。",
      "promptZh": "给修风筝的故事增加一个新的方向，让风筝修好后发生一件新事情。",
      "slots": [
        {
          "key": "change",
          "name": "修风筝时可以增加……",
          "options": [
            "一条会在风里摆动的彩色尾巴",
            "一个像笑脸一样的新图案",
            "几片能发出轻响的小纸片",
            "一个帮助看风向的小丝带"
          ]
        },
        {
          "key": "event",
          "name": "修好以后……",
          "options": [
            "风筝带着新尾巴绕过一棵大树",
            "几个朋友根据丝带一起寻找合适的风",
            "纸片在风中发出轻轻的沙沙声",
            "小朋友设计了一场不同图案的风筝展"
          ]
        }
      ],
      "template": "修风筝时加上{change}。修好以后，{event}。",
      "otherIdeas": [
        {
          "viewpoint": "增加新功能",
          "text": "小朋友给风筝加了一条能显示风向的丝带。"
        },
        {
          "viewpoint": "增加新合作",
          "text": "朋友们分工画图、剪纸和测试风筝。"
        },
        {
          "viewpoint": "增加新情节",
          "text": "风筝再次升起后，引来另一位正在学习放风筝的小朋友。"
        }
      ],
      "reflectPrompt": "哪一个想法让修好后的故事真正走向了新的动作或事件？"
    }
  },
    {
      id: 'en-k2-lost-puppy', lang: 'en', grade: 'K2', bg: 'grass',
      objects: [
        { id: 'sign', emoji: '🪧', x: 74, y: 26, labelZh: '公园牌子', labelEn: 'park sign' },
        { id: 'bench', emoji: '🪑', x: 68, y: 68, labelZh: '长椅', labelEn: 'bench' },
        { id: 'puppy', emoji: '🐶', x: 32, y: 62, labelZh: '小狗', labelEn: 'puppy' },
        { id: 'bird', emoji: '🐦', x: 48, y: 64, labelZh: '小鸟', labelEn: 'bird' },
        { id: 'face-worried', emoji: '😟', x: 32, y: 38, labelZh: '着急的表情', labelEn: 'worried face' },
        { id: 'face-happy', emoji: '😊', x: 58, y: 40, labelZh: '开心的表情', labelEn: 'happy face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '小狗坐在什么东西旁边？点一点。', promptEn: 'What is the puppy sitting next to? Tap it.',
          target: 'bench', distractors: ['sign'],
          hintZh: '小狗旁边有一个能坐的东西。', hintEn: 'There is something to sit on near the puppy.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '小狗找不到主人，心里是什么感觉？点一点小狗旁边的表情。', promptEn: 'The puppy cannot find its owner. How does it feel? Tap the face next to the puppy.',
          target: 'face-worried', distractors: ['face-happy'],
          hintZh: '找一找离小狗最近的那个表情。', hintEn: 'Find the face closest to the puppy.' },
        { id: 'q3', unit: 'structure', interaction: 'order' },
      { id: 'q4', unit: 'comprehend', interaction: 'hotspot',
        promptZh: '听完整个故事，是谁告诉小狗主人往长椅那边去了？点一点。',
        promptEn: 'Who told the puppy that its owner went toward the bench? Tap it.',
        target: 'bird', distractors: ['puppy', 'sign'],
        hintZh: '故事第二幅里，是谁给小狗提供了线索？',
        hintEn: 'In the second frame, who gave the puppy the clue?' },
      { id: 'q5', unit: 'choose', interaction: 'hotspot',
        promptZh: '听一听：“The puppy hurried toward the bench.” 哪个画面表示 puppy？',
        promptEn: 'Listen: “The puppy hurried toward the bench.” Which picture shows the puppy?',
        target: 'puppy', distractors: ['bench'],
        hintZh: '选正在行动的角色，不是地点。',
        hintEn: 'Choose the character that moves, not the place.' }
      ],
    expressCcr: {
      promptZh: '小狗找到主人以后，会怎样感谢帮助它的小鸟？',
      promptEn: 'How could the puppy thank the bird that helped it?',
      slots: [
        { key: 'say', nameZh: '小狗会说……', nameEn: 'The puppy could say…',
          optionsZh: ['谢谢你告诉我方向', '你的线索帮了大忙', '下次我也会帮助你', '我们一起去见主人吧'],
          optionsEn: ['Thank you for showing me the way', 'Your clue really helped', 'I will help you next time', 'Come meet my owner'] },
        { key: 'why', nameZh: '因为……', nameEn: 'because…',
          optionsZh: ['小鸟看见主人去了哪里', '小狗终于不再迷路', '朋友可以分享线索', '小鸟认真听了问题'],
          optionsEn: ['the bird saw where the owner went', 'the puppy was no longer lost', 'friends can share clues', 'the bird listened to the question'] }
      ],
      template: '{say}, because {why}.',
      otherIdeas: [
        { viewpointZh: '有人说出具体线索', viewpointEn: 'Someone named the clue',
          textZh: '“谢谢你告诉我主人往长椅去了。”', textEn: '“Thank you for telling me my owner went toward the bench.”' },
        { viewpointZh: '有人想到以后', viewpointEn: 'Someone thought about next time',
          textZh: '小狗记住了公园的路标，下次不会再走丢。', textEn: 'The puppy remembers the park signs so it will not get lost next time.' },
        { viewpointZh: '有人邀请新朋友', viewpointEn: 'Someone invited a new friend',
          textZh: '小狗邀请小鸟一起去见主人。', textEn: 'The puppy invites the bird to meet its owner.' }
      ],
      reflectPromptZh: '哪一句感谢最清楚地说明了小鸟提供的线索？',
      reflectPromptEn: 'Which thank-you most clearly names the clue the bird gave?'
    },
    createCcr: {
      promptZh: 'What if the bird finds something unusual near the bench? How could a new story begin?',
      promptEn: 'What if the bird finds something unusual near the bench? How could a new story begin?',
      slots: [
        { key: 'find', nameZh: '小鸟发现……', nameEn: 'The bird finds…',
          optionsZh: ['一把没有主人的小钥匙', '一张画着路线的纸', '一个会发出声音的小盒子', '一只正在找家的小动物'],
          optionsEn: ['a tiny key with no owner', 'a paper with a path drawn on it', 'a little box making a sound', 'a small animal looking for home'] },
        { key: 'choice', nameZh: '于是朋友们……', nameEn: 'So the friends…',
          optionsZh: ['follow the new clue together', 'ask people nearby what it means', 'turn the search into a new adventure', 'help the newcomer before going home'],
          optionsEn: ['follow the new clue together', 'ask people nearby what it means', 'turn the search into a new adventure', 'help the newcomer before going home'] }
      ],
      template: '{find}. Then the friends {choice}.',
      otherIdeas: [
        { viewpointZh: '有人从一个物件开始故事', viewpointEn: 'Someone began with an object', textZh: 'A mysterious key gives the friends a completely new question to solve.', textEn: 'A mysterious key gives the friends a completely new question to solve.' },
        { viewpointZh: '有人改变了谁需要帮助', viewpointEn: 'Someone changed who needs help', textZh: 'The puppy is safe now, so the friends can help another lost character.', textEn: 'The puppy is safe now, so the friends can help another lost character.' },
        { viewpointZh: '有人把线索变成冒险', viewpointEn: 'Someone turned a clue into an adventure', textZh: 'The bird spots a trail that leads beyond the familiar park.', textEn: 'The bird spots a trail that leads beyond the familiar park.' }
      ],
      reflectPromptZh: 'Which idea takes the characters somewhere the original story never went?',
      reflectPromptEn: 'Which idea takes the characters somewhere the original story never went?'
    },
      frames: [
        { id: 'f1', emoji: '🐶🔍', textZh: '小狗和主人走散了，在公园里到处找。', textEn: 'The puppy got separated from its owner in the park.' },
        { id: 'f2', emoji: '🐶🐦', textZh: '一只好心的小鸟告诉小狗，主人往长椅那边去了。', textEn: 'A kind bird told the puppy its owner went toward the bench.' },
        { id: 'f3', emoji: '🐶🧍', textZh: '小狗跑到长椅那边，找到了主人。', textEn: 'The puppy ran to the bench and found its owner.' }
      ]
    },
{
  id: 'zh-k1-fruit-rhyme', lang: 'zh', grade: 'K1', bg: 'sunny',
  objects: [
    { id: 'apple', emoji: '🍎', x: 22, y: 28, labelZh: '一个苹果', labelEn: 'one apple' },
    { id: 'apples', emoji: '🍎🍎', x: 22, y: 68, labelZh: '两个苹果', labelEn: 'two apples' },
    { id: 'banana', emoji: '🍌', x: 68, y: 28, labelZh: '一根香蕉', labelEn: 'one banana' },
    { id: 'bananas', emoji: '🍌🍌🍌', x: 68, y: 68, labelZh: '三根香蕉', labelEn: 'three bananas' },
    { id: 'basket', emoji: '🧺', x: 46, y: 48, labelZh: '篮子', labelEn: 'basket' }
  ],
  items: [
    { id: 'q1', unit: 'observe', interaction: 'hotspot',
      promptZh: '童谣里说“一个苹果红彤彤”。点一点一个苹果。',
      promptEn: 'The rhyme says, “one red apple.” Tap one apple.',
      target: 'apple', distractors: ['apples', 'banana'],
      hintZh: '注意“一个”，不多不少只有一个。', hintEn: 'Listen for “one.”' },
    { id: 'q2', unit: 'comprehend', interaction: 'hotspot',
      promptZh: '听一听：“两个苹果进篮中。”哪一个画面表示“两个苹果”？',
      promptEn: 'Listen: “Two apples go into the basket.” Which picture shows two apples?',
      target: 'apples', distractors: ['apple', 'bananas'],
      hintZh: '数一数，找到正好两个苹果。', hintEn: 'Count and find exactly two apples.' },
    { id: 'q3', unit: 'choose', interaction: 'hotspot',
      promptZh: '童谣接着说：“三根香蕉弯弯腰。”哪一个画面最合适？',
      promptEn: 'The rhyme continues, “Three bananas bend down low.” Which picture fits?',
      target: 'bananas', distractors: ['banana', 'apples'],
      hintZh: '“三根香蕉”，水果和数量都要对。', hintEn: 'Match both the fruit and the number.' },
    { id: 'q4', unit: 'infer', interaction: 'hotspot',
      promptZh: '苹果和香蕉最后都要“进篮中”。点一点童谣里说的“篮”。',
      promptEn: 'The fruit goes “into the basket.” Tap the basket.',
      target: 'basket', distractors: ['apple', 'banana'],
      hintZh: '听清楚“篮中”，找一找装水果的东西。', hintEn: 'Listen for “basket.”' },
    { id: 'q5', unit: 'structure', interaction: 'order' }
  ],
  frames: [
    { id: 'f1', emoji: '🍎', textZh: '一个苹果红彤彤。', textEn: 'One apple is bright and red.' },
    { id: 'f2', emoji: '🍎🍎🧺', textZh: '两个苹果进篮中。', textEn: 'Two apples go into the basket.' },
    { id: 'f3', emoji: '🍌🍌🍌', textZh: '三根香蕉弯弯腰。', textEn: 'Three bananas bend down low.' }
  ],
  expressCcr: {
    promptZh: '孩子想请朋友一起把水果装进篮子，怎样说得又清楚又有礼貌？',
    promptEn: 'How could the child politely ask a friend to put the fruit in the basket?',
    slots: [
      { key: 'ask', nameZh: '可以说……', nameEn: 'The child could say…',
        optionsZh: ['请帮我把水果放进篮子', '我们一起收水果吧', '请先拿苹果', '请和我一起装篮子'],
        optionsEn: ['Please help put the fruit in the basket', 'Let us gather the fruit together', 'Please take the apples first', 'Please pack the basket with me'] },
      { key: 'detail', nameZh: '再说清楚……', nameEn: 'Then explain…',
        optionsZh: ['先放两个苹果', '再放三根香蕉', '轻轻地放进去', '放好以后数一数'],
        optionsEn: ['put in two apples first', 'add three bananas next', 'place them in gently', 'count them after packing'] }
    ],
    template: '{ask}，{detail}。',
    otherIdeas: [
      { viewpointZh: '有人说清楚了顺序', viewpointEn: 'Someone made the order clear', textZh: '“请先放苹果，再放香蕉。”', textEn: '“Please put in the apples first, then the bananas.”' },
      { viewpointZh: '有人用了礼貌词', viewpointEn: 'Someone used polite words', textZh: '“请你帮帮我，好吗？”', textEn: '“Could you please help me?”' },
      { viewpointZh: '有人邀请一起做', viewpointEn: 'Someone invited teamwork', textZh: '“我们一起收水果吧！”', textEn: '“Let us gather the fruit together!”' }
    ],
    reflectPromptZh: '哪一种说法让朋友最容易听懂要做什么？',
    reflectPromptEn: 'Which request makes the job easiest to understand?'
  },
  createCcr: {
    promptZh: '照着“一个、两个、三根”的数数节奏，你还能给童谣添上什么新水果？',
    promptEn: 'Following the counting rhythm, what new fruit could you add to the rhyme?',
    slots: [
      { key: 'newLine', nameZh: '下一句可以是……', nameEn: 'The next line could be…',
        optionsZh: ['四颗葡萄挤一挤', '四个橘子排成行', '四颗草莓戴红帽', '四片西瓜笑开口'],
        optionsEn: ['four grapes squeeze together', 'four oranges stand in a row', 'four strawberries wear red hats', 'four watermelon slices open wide'] },
      { key: 'ending', nameZh: '童谣最后……', nameEn: 'At the end…',
        optionsZh: ['水果一起开大会', '篮子变得沉甸甸', '大家拍手数一遍', '水果排成一条龙'],
        optionsEn: ['all the fruit holds a meeting', 'the basket grows heavy', 'everyone claps and counts again', 'the fruit forms one long line'] }
    ],
    template: '{newLine}，{ending}。',
    otherIdeas: [
      { viewpointZh: '有人保持了数数节奏', viewpointEn: 'Someone kept the counting rhythm', textZh: '从一数到四，每句都比上一句多。', textEn: 'Each line continues the count from one to four.' },
      { viewpointZh: '有人注意了量词', viewpointEn: 'Someone noticed measure words', textZh: '苹果说“个”，香蕉说“根”，葡萄说“颗”。', textEn: 'Different fruit use different Chinese measure words.' },
      { viewpointZh: '有人让水果动起来', viewpointEn: 'Someone made the fruit move', textZh: '让橘子排队、草莓戴帽，童谣就有了新画面。', textEn: 'Oranges line up and strawberries wear hats, creating new pictures.' }
    ],
    reflectPromptZh: '哪一句既接上了数数节奏，又出现了新的想象画面？',
    reflectPromptEn: 'Which line keeps the counting rhythm and adds a new imagined picture?'
  }
},
{
  id: 'en-k1-cat-rhyme', lang: 'en', grade: 'K1', bg: 'grass',
  objects: [
    { id: 'cat', emoji: '🐱', x: 22, y: 62, labelZh: '小猫', labelEn: 'cat' },
    { id: 'hat', emoji: '🎩', x: 22, y: 25, labelZh: '帽子', labelEn: 'hat' },
    { id: 'mat', emoji: '▰', x: 52, y: 72, labelZh: '垫子', labelEn: 'mat' },
    { id: 'bat', emoji: '🦇', x: 76, y: 25, labelZh: '蝙蝠', labelEn: 'bat' },
    { id: 'moon', emoji: '🌙', x: 88, y: 12, labelZh: '月亮', labelEn: 'moon' },
    { id: 'face-surprised', emoji: '😮', x: 74, y: 58, labelZh: '惊讶的表情', labelEn: 'surprised face' }
  ],
  items: [
    { id: 'q1', unit: 'observe', interaction: 'hotspot',
      promptZh: '听一听：“The cat has a hat.” 点一点 hat。',
      promptEn: 'Listen: “The cat has a hat.” Tap the hat.',
      target: 'hat', distractors: ['cat', 'mat'],
      hintZh: 'Hat 是戴在头上的东西。', hintEn: 'A hat is worn on the head.' },
    { id: 'q2', unit: 'comprehend', interaction: 'hotspot',
      promptZh: '听一听：“The cat sits on the mat.” 小猫坐在哪里？',
      promptEn: 'Listen: “The cat sits on the mat.” Where does the cat sit?',
      target: 'mat', distractors: ['hat', 'moon'],
      hintZh: '听句子最后的 mat。', hintEn: 'Listen to the last word: “mat.”' },
    { id: 'q3', unit: 'choose', interaction: 'hotspot',
      promptZh: '哪个词和 cat、hat、mat 押韵？点一点。',
      promptEn: 'Which picture names a word that rhymes with cat, hat, and mat? Tap it.',
      target: 'bat', distractors: ['moon'],
      hintZh: '听词尾的声音。', hintEn: 'Listen to the ending sound: cat, hat, mat, bat.' },
    { id: 'q4', unit: 'infer', interaction: 'hotspot',
      promptZh: '故事最后说：“A bat flies past, and the cat jumps.” 哪个表情最符合这个线索？',
      promptEn: 'The rhyme ends, “A bat flies past, and the cat jumps.” Which face best matches that clue?',
      target: 'face-surprised', distractors: ['moon'],
      hintZh: '注意“jumps”发生在蝙蝠飞过以后。', hintEn: 'Use the clue that the cat jumps when the bat flies past.' },
    { id: 'q5', unit: 'structure', interaction: 'order' }
  ],
  frames: [
    { id: 'f1', emoji: '🐱🎩', textZh: '小猫戴着一顶帽子。', textEn: 'The cat has a hat.' },
    { id: 'f2', emoji: '🐱▰', textZh: '小猫坐在垫子上。', textEn: 'The cat sits on the mat.' },
    { id: 'f3', emoji: '🦇🐱😮', textZh: '一只蝙蝠飞过，小猫吓了一跳。', textEn: 'A bat flies past, and the cat jumps.' }
  ],
  expressCcr: {
    promptZh: '小猫想告诉朋友刚才发生了什么。它可以怎样按顺序说清楚？',
    promptEn: 'The cat wants to tell a friend what happened. How could it explain the events clearly?',
    slots: [
      { key: 'first', nameZh: '先……', nameEn: 'First…',
        optionsZh: ['我戴上了帽子', '我坐在垫子上', '我看见了月亮', '我在草地上休息'],
        optionsEn: ['I put on my hat', 'I sat on the mat', 'I looked at the moon', 'I rested on the grass'] },
      { key: 'then', nameZh: '后来……', nameEn: 'Then…',
        optionsZh: ['一只蝙蝠飞了过来', '帽子掉到了垫子上', '我听见了奇怪的声音', '我吓得跳了起来'],
        optionsEn: ['a bat flew past', 'the hat fell onto the mat', 'I heard a strange sound', 'I jumped in surprise'] }
    ],
    template: '{first}. Then {then}.',
    otherIdeas: [
      { viewpointZh: '有人用了 first 和 then', viewpointEn: 'Someone used “first” and “then”', textZh: '先说开始发生的事，再说后来的变化。', textEn: '“First I sat on the mat. Then a bat flew past.”' },
      { viewpointZh: '有人说出了感受', viewpointEn: 'Someone included a feeling', textZh: '小猫不仅说看见了什么，也说自己吓了一跳。', textEn: 'The cat explains what it saw and that it felt surprised.' },
      { viewpointZh: '有人用了押韵词', viewpointEn: 'Someone kept the rhyme', textZh: 'cat、hat、mat、bat 让复述听起来有节奏。', textEn: 'Cat, hat, mat, and bat give the retelling a rhythm.' }
    ],
    reflectPromptZh: '哪一种说法最清楚地说明了事情的先后？',
    reflectPromptEn: 'Which explanation makes the event order clearest?'
  },
  createCcr: {
    promptZh: '再想一个和 cat 押韵的词，给这首小韵文添上新的一幕。',
    promptEn: 'Add a new scene to the rhyme using another word that rhymes with “cat.”',
    slots: [
      { key: 'rhyme', nameZh: '新的押韵词是……', nameEn: 'The new rhyming word is…',
        optionsZh: ['flat', 'sat', 'pat', 'chat'],
        optionsEn: ['flat', 'sat', 'pat', 'chat'] },
      { key: 'scene', nameZh: '新的一幕是……', nameEn: 'In the new scene…',
        optionsZh: ['帽子被压得扁扁的', '小猫和朋友坐在一起', '朋友轻轻拍了拍小猫', '小猫和蝙蝠开始聊天'],
        optionsEn: ['the hat becomes flat', 'the cat and a friend sat together', 'a friend gave the cat a pat', 'the cat and bat began to chat'] }
    ],
    template: 'The new word is {rhyme}: {scene}.',
    otherIdeas: [
      { viewpointZh: '有人从声音想故事', viewpointEn: 'Someone built a story from sound', textZh: '先找到押韵词，再想这个词能带来什么新事件。', textEn: 'Start with a rhyming word, then imagine the event it could create.' },
      { viewpointZh: '有人改变了角色关系', viewpointEn: 'Someone changed the characters’ relationship', textZh: '小猫不再害怕蝙蝠，而是和它聊起天来。', textEn: 'Instead of fearing the bat, the cat begins to chat with it.' },
      { viewpointZh: '有人让押韵词推动情节', viewpointEn: 'Someone let the rhyme drive the plot', textZh: 'flat、pat 或 chat 都会让故事走向不同方向。', textEn: 'Flat, pat, and chat each send the story in a different direction.' }
    ],
    reflectPromptZh: '哪一个新押韵词不只是声音相像，还真正带来了新的情节？',
    reflectPromptEn: 'Which new rhyme does more than match the sound and also creates a new event?'
  }
},
{
  id: 'zh-k2-morning-market', lang: 'zh', grade: 'K2', bg: 'sunny',
  objects: [
    { id: 'grandma', emoji: '👵', x: 18, y: 62, labelZh: '奶奶', labelEn: 'grandmother' },
    { id: 'child', emoji: '🧒', x: 35, y: 64, labelZh: '孩子', labelEn: 'child' },
    { id: 'tomatoes', emoji: '🍅🍅', x: 64, y: 38, labelZh: '两颗西红柿', labelEn: 'two tomatoes' },
    { id: 'cucumbers', emoji: '🥒🥒', x: 80, y: 38, labelZh: '两根黄瓜', labelEn: 'two cucumbers' },
    { id: 'basket', emoji: '🧺', x: 64, y: 72, labelZh: '菜篮子', labelEn: 'basket' },
    { id: 'vendor', emoji: '🧑‍🌾', x: 84, y: 65, labelZh: '摊主', labelEn: 'vendor' }
  ],
  items: [
    { id: 'q1', unit: 'observe', interaction: 'hotspot',
      promptZh: '奶奶说：“请把两根黄瓜放进篮子里。”点一点“两根黄瓜”。',
      promptEn: 'Grandma says, “Put two cucumbers in the basket.” Tap the two cucumbers.',
      target: 'cucumbers', distractors: ['tomatoes', 'basket'],
      hintZh: '注意“黄瓜”和量词“根”。', hintEn: 'Listen for “cucumbers.”' },
    { id: 'q2', unit: 'comprehend', interaction: 'hotspot',
      promptZh: '摊主说：“西红柿在黄瓜旁边。”他说的是哪一种菜？点一点。',
      promptEn: 'The vendor says, “The tomatoes are beside the cucumbers.” Tap the tomatoes.',
      target: 'tomatoes', distractors: ['cucumbers', 'basket'],
      hintZh: '句子先说的是“西红柿”。', hintEn: 'The sentence names the tomatoes first.' },
    { id: 'q3', unit: 'infer', interaction: 'hotspot',
      promptZh: '奶奶说：“菜都买好了，我们可以装篮回家了。”接下来最需要用到什么？',
      promptEn: 'Grandma says the vegetables are ready to carry home. What will they need next?',
      target: 'basket', distractors: ['tomatoes', 'vendor'],
      hintZh: '线索是“装篮回家”，找装东西的物品。', hintEn: 'Use the clue “carry them home.”' },
    { id: 'q4', unit: 'choose', interaction: 'hotspot',
      promptZh: '孩子想礼貌地请摊主帮忙，应该对谁说“请问，这些怎么卖？”点一点。',
      promptEn: 'Who should the child politely ask about the vegetables? Tap the person.',
      target: 'vendor', distractors: ['grandma', 'child'],
      hintZh: '找一找负责卖菜的人。', hintEn: 'Find the person selling the vegetables.' },
    { id: 'q5', unit: 'structure', interaction: 'order' }
  ],
  frames: [
    { id: 'f1', emoji: '👵🧒🥬', textZh: '早市上，奶奶和孩子先来到菜摊前。', textEn: 'Grandma and the child arrive at the vegetable stall.' },
    { id: 'f2', emoji: '🍅🥒🧺', textZh: '他们挑好西红柿和黄瓜，放进菜篮子。', textEn: 'They choose tomatoes and cucumbers and put them in the basket.' },
    { id: 'f3', emoji: '👵🧒🏠', textZh: '买好以后，他们提着菜篮子回家。', textEn: 'After shopping, they carry the basket home.' }
  ],
  expressCcr: {
    promptZh: '孩子想自己向摊主买菜，怎样把想买什么、买多少说清楚？',
    promptEn: 'How could the child clearly tell the vendor what and how much to buy?',
    slots: [
      { key: 'request', nameZh: '孩子可以说……', nameEn: 'The child could say…',
        optionsZh: ['请给我两根黄瓜', '我想买两个西红柿', '请帮我拿这些菜', '请问我可以买一点菜吗'],
        optionsEn: ['Please give me two cucumbers', 'I would like two tomatoes', 'Please help me get these vegetables', 'May I buy some vegetables?'] },
      { key: 'detail', nameZh: '还可以补充……', nameEn: 'It could also add…',
        optionsZh: ['请放进这个篮子里', '黄瓜要两根就够了', '还要两个西红柿', '谢谢您帮我拿菜'],
        optionsEn: ['Please put them in this basket', 'Two cucumbers are enough', 'I also need two tomatoes', 'Thank you for helping me'] }
    ],
    template: '{request}，{detail}。',
    otherIdeas: [
      { viewpointZh: '有人把数量说清楚', viewpointEn: 'Someone stated the amount clearly', textZh: '“请给我两根黄瓜，再要两个西红柿。”', textEn: 'The request names both vegetables and their amounts.' },
      { viewpointZh: '有人用了合适的量词', viewpointEn: 'Someone used precise measure words', textZh: '黄瓜说“两根”，西红柿说“两个”。', textEn: 'The Chinese request uses different measure words for different vegetables.' },
      { viewpointZh: '有人注意礼貌表达', viewpointEn: 'Someone used polite language', textZh: '先说“请问”，说完以后再说“谢谢”。', textEn: 'The child opens politely and says thank you afterward.' }
    ],
    reflectPromptZh: '哪一种说法让摊主一听就知道“买什么、买多少”？',
    reflectPromptEn: 'Which request makes both the item and amount clearest?'
  },
  createCcr: {
    promptZh: '如果你给早市编一句有节奏的叫卖声，会怎样把菜名和特点编进去？',
    promptEn: 'What rhythmic market call could you invent using the vegetables and their features?',
    slots: [
      { key: 'call', nameZh: '叫卖声可以是……', nameEn: 'The market call could be…',
        optionsZh: ['红红的西红柿，脆脆的黄瓜', '青黄瓜，红柿子，排排站进小篮子', '一根两根小黄瓜，两个三个红柿子', '新鲜蔬菜摆一排，看看今天买什么'],
        optionsEn: ['red tomatoes and crisp cucumbers', 'green cucumbers and red tomatoes line up for the basket', 'one, two cucumbers and two, three tomatoes', 'fresh vegetables line up at the market'] },
      { key: 'twist', nameZh: '再添一句……', nameEn: 'Add another line…',
        optionsZh: ['小菜篮，装满啦', '你来挑，我来装', '早市声音真热闹', '带着香味一起回家'],
        optionsEn: ['the little basket is full', 'you choose and I will pack', 'the morning market is full of sounds', 'carry the fresh smells home'] }
    ],
    template: '{call}，{twist}。',
    otherIdeas: [
      { viewpointZh: '有人用了叠词', viewpointEn: 'Someone used repeated descriptive words', textZh: '“红红的、脆脆的”让叫卖声更有中文口语节奏。', textEn: 'Repeated describing words give the Chinese market call a lively rhythm.' },
      { viewpointZh: '有人把量词编进节奏', viewpointEn: 'Someone built measure words into the rhythm', textZh: '“一根、两根；一个、两个”既能数，也能形成节奏。', textEn: 'Counting with measure words creates the rhythm.' },
      { viewpointZh: '有人写出了早市的声音', viewpointEn: 'Someone imagined the sound of the market', textZh: '不只列菜名，还让人听见热闹的早市。', textEn: 'The line creates a lively market rather than only listing vegetables.' }
    ],
    reflectPromptZh: '哪一句最像真正能在早市里听见的、有节奏的中文叫卖声？',
    reflectPromptEn: 'Which line sounds most like a lively rhythmic market call?'
  }
},
{
  id: 'en-k2-picnic-directions', lang: 'en', grade: 'K2', bg: 'grass',
  objects: [
    { id: 'tree', emoji: '🌳', x: 18, y: 25, labelZh: '大树', labelEn: 'tree' },
    { id: 'blanket', emoji: '🟦', x: 42, y: 72, labelZh: '野餐垫', labelEn: 'picnic blanket' },
    { id: 'basket', emoji: '🧺', x: 42, y: 48, labelZh: '野餐篮', labelEn: 'picnic basket' },
    { id: 'ball', emoji: '⚽', x: 72, y: 68, labelZh: '球', labelEn: 'ball' },
    { id: 'book', emoji: '📘', x: 24, y: 66, labelZh: '书', labelEn: 'book' },
    { id: 'child', emoji: '🧒', x: 82, y: 45, labelZh: '孩子', labelEn: 'child' }
  ],
  items: [
    { id: 'q1', unit: 'observe', interaction: 'hotspot',
      promptZh: '听一听：“The basket is on the blanket.” 点一点 basket。',
      promptEn: 'Listen: “The basket is on the blanket.” Tap the basket.',
      target: 'basket', distractors: ['blanket', 'ball'],
      hintZh: '听关键词 basket。', hintEn: 'Listen for the word “basket.”' },
    { id: 'q2', unit: 'comprehend', interaction: 'hotspot',
      promptZh: '听一听：“The book is beside the tree.” 哪一样东西在 tree 旁边？',
      promptEn: 'Listen: “The book is beside the tree.” What is beside the tree?',
      target: 'book', distractors: ['ball', 'basket'],
      hintZh: 'Beside 表示“在旁边”。', hintEn: '“Beside” means next to something.' },
    { id: 'q3', unit: 'choose', interaction: 'hotspot',
      promptZh: '朋友说：“Put the ball to the right of the blanket.” 应该点哪一样东西？',
      promptEn: 'A friend says, “Put the ball to the right of the blanket.” Which object should move?',
      target: 'ball', distractors: ['book', 'basket'],
      hintZh: '先听清楚要移动的是 ball。', hintEn: 'First identify the object named: the ball.' },
    { id: 'q4', unit: 'infer', interaction: 'hotspot',
      promptZh: '孩子说：“I want to read in the shade.” 根据画面，它应该走向哪里？',
      promptEn: 'The child says, “I want to read in the shade.” Where should the child go?',
      target: 'tree', distractors: ['ball', 'blanket'],
      hintZh: '用画面里的位置和 shade 这个词找线索。', hintEn: 'Use the word “shade” and the picture clue.' },
    { id: 'q5', unit: 'structure', interaction: 'order' }
  ],
  frames: [
    { id: 'f1', emoji: '🧺🟦', textZh: 'First，把野餐篮放到垫子上。', textEn: 'First, put the picnic basket on the blanket.' },
    { id: 'f2', emoji: '📘🌳', textZh: 'Next，把书放到树旁边。', textEn: 'Next, place the book beside the tree.' },
    { id: 'f3', emoji: '⚽➡️🟦', textZh: 'Last，把球放到垫子的右边。', textEn: 'Last, put the ball to the right of the blanket.' }
  ],
  expressCcr: {
    promptZh: '一个朋友看不到画面。你怎样用英文把三个东西的位置说清楚？',
    promptEn: 'A friend cannot see the picture. How could you clearly describe where the picnic things are?',
    slots: [
      { key: 'where1', nameZh: '先说明……', nameEn: 'First explain…',
        optionsZh: ['篮子在垫子上', '书在树旁边', '球在垫子右边', '孩子站在远处'],
        optionsEn: ['the basket is on the blanket', 'the book is beside the tree', 'the ball is to the right of the blanket', 'the child is far away'] },
      { key: 'where2', nameZh: '再补充……', nameEn: 'Then add…',
        optionsZh: ['书在树旁边', '球在垫子右边', '篮子在垫子上', '树在野餐区旁边'],
        optionsEn: ['the book is beside the tree', 'the ball is to the right of the blanket', 'the basket is on the blanket', 'the tree is beside the picnic area'] }
    ],
    template: '{where1}. Also, {where2}.',
    otherIdeas: [
      { viewpointZh: '有人用了 on', viewpointEn: 'Someone used “on” precisely', textZh: '“The basket is on the blanket.”', textEn: '“The basket is on the blanket.”' },
      { viewpointZh: '有人用了 beside', viewpointEn: 'Someone used “beside” precisely', textZh: '“The book is beside the tree.”', textEn: '“The book is beside the tree.”' },
      { viewpointZh: '有人用了 right of', viewpointEn: 'Someone used “to the right of” precisely', textZh: '“The ball is to the right of the blanket.”', textEn: '“The ball is to the right of the blanket.”' }
    ],
    reflectPromptZh: '哪一种说法让没看到图片的人也最容易摆对位置？',
    reflectPromptEn: 'Which description would help someone who cannot see the picture place the objects correctly?'
  },
  createCcr: {
    promptZh: '给野餐游戏设计一条新的英文位置指令，让朋友照着指令改变画面。',
    promptEn: 'Invent a new English position instruction that changes the picnic scene.',
    slots: [
      { key: 'object', nameZh: '要移动……', nameEn: 'Move…',
        optionsZh: ['the ball', 'the book', 'the basket', 'the blanket'],
        optionsEn: ['the ball', 'the book', 'the basket', 'the blanket'] },
      { key: 'place', nameZh: '新的位置是……', nameEn: 'Its new position is…',
        optionsZh: ['under the tree', 'behind the basket', 'beside the blanket', 'in front of the child'],
        optionsEn: ['under the tree', 'behind the basket', 'beside the blanket', 'in front of the child'] }
    ],
    template: 'Put {object} {place}.',
    otherIdeas: [
      { viewpointZh: '有人换了介词', viewpointEn: 'Someone chose a new preposition', textZh: '可以从 on、beside、right of 扩展到 under、behind、in front of。', textEn: 'The new instruction can extend the scene with “under,” “behind,” or “in front of.”' },
      { viewpointZh: '有人让画面发生变化', viewpointEn: 'Someone changed the scene', textZh: '新的位置指令会让原来的野餐布局真正发生变化。', textEn: 'A new position instruction creates a genuinely different picnic layout.' },
      { viewpointZh: '有人让指令可以执行', viewpointEn: 'Someone made the instruction actionable', textZh: '要同时说清“移动什么”和“移到哪里”。', textEn: 'A useful instruction names both what to move and where to put it.' }
    ],
    reflectPromptZh: '哪一条新指令最清楚，而且真的创造了一个原画面没有的新位置关系？',
    reflectPromptEn: 'Which new instruction is clearest and creates a position relationship that was not in the original scene?'
  }
},
  {
    "id": "en-k2-torn-kite",
    "lang": "en",
    "grade": "K2",
    "bg": "sunny",
    "objects": [
      {
        "id": "kite",
        "emoji": "🪁",
        "x": 62,
        "y": 70,
        "labelZh": "风筝",
        "labelEn": "kite"
      },
      {
        "id": "tape",
        "emoji": "🩹",
        "x": 78,
        "y": 42,
        "labelZh": "胶带",
        "labelEn": "tape"
      },
      {
        "id": "ball",
        "emoji": "⚽",
        "x": 82,
        "y": 70,
        "labelZh": "足球",
        "labelEn": "ball"
      },
      {
        "id": "kid",
        "emoji": "🧒",
        "x": 30,
        "y": 62,
        "labelZh": "小女孩",
        "labelEn": "girl"
      },
      {
        "id": "face-sad",
        "emoji": "😢",
        "x": 30,
        "y": 38,
        "labelZh": "难过的表情",
        "labelEn": "sad face"
      },
      {
        "id": "face-happy",
        "emoji": "😊",
        "x": 50,
        "y": 40,
        "labelZh": "开心的表情",
        "labelEn": "happy face"
      }
    ],
    "items": [
      {
        "id": "q1",
        "unit": "observe",
        "interaction": "hotspot",
        "promptZh": "风筝破了，旁边有什么东西可以用来修它？点一点。",
        "promptEn": "The kite is torn. What is next to it that could fix it? Tap it.",
        "target": "tape",
        "distractors": [
          "ball"
        ],
        "hintZh": "找一找能把破洞粘起来的东西。",
        "hintEn": "Find the thing that can stick a tear back together."
      },
      {
        "id": "q2",
        "unit": "infer",
        "interaction": "hotspot",
        "promptZh": "风筝破了，小女孩心里是什么感觉？点一点小女孩旁边的表情。",
        "promptEn": "The kite is torn. How does the girl feel? Tap the face next to the girl.",
        "target": "face-sad",
        "distractors": [
          "face-happy"
        ],
        "hintZh": "找一找离小女孩最近的那个表情。",
        "hintEn": "Find the face closest to the girl."
      },
      {
        "id": "q3",
        "unit": "structure",
        "interaction": "order"
      },
      {
        "id": "q-comprehend-torn-kite",
        "unit": "comprehend",
        "template": "scene-detail",
        "level": "L1",
        "interaction": "select",
        "prompt": "What problem does the child notice when looking closely at the kite?",
        "promptEn": "What problem does the child notice when looking closely at the kite?",
        "options": [
          {
            "text": "A tear has opened along one edge of the kite."
          },
          {
            "text": "The kite has changed into a bird.",
            "errorType": "fabrication"
          },
          {
            "text": "The kite is already flying high above the clouds.",
            "errorType": "contradicts_scene"
          }
        ],
        "answer": 0,
        "hint": "Look closely at the damaged edge of the kite."
      },
      {
        "id": "q-choose-torn-kite",
        "unit": "choose",
        "template": "scene-word-choice",
        "level": "L2",
        "interaction": "select",
        "prompt": "Which sentence describes the kite problem most precisely?",
        "promptEn": "Which sentence describes the kite problem most precisely?",
        "options": [
          {
            "text": "The kite has a small tear along its edge that needs mending."
          },
          {
            "text": "The kite is resting safely with no damage.",
            "errorType": "contradicts_scene"
          },
          {
            "text": "The kite is mending the child.",
            "errorType": "role_reversal"
          }
        ],
        "answer": 0,
        "hint": "Choose the sentence that names both the damaged place and what it needs."
      }
    ],
    "frames": [
      {
        "id": "f1",
        "emoji": "🪁💨",
        "textZh": "风筝被风吹破了一个洞。",
        "textEn": "The wind tears a hole in the kite."
      },
      {
        "id": "f2",
        "emoji": "🧑‍🤝‍🧑🩹",
        "textZh": "朋友拿来胶带，帮忙把风筝粘好。",
        "textEn": "A friend brings tape and helps patch the kite."
      },
      {
        "id": "f3",
        "emoji": "🪁😊",
        "textZh": "风筝又飞起来了，两个人一起笑了。",
        "textEn": "The kite flies again and both kids smile."
      }
    ],
    "expressCcr": {
      "prompt": "Explain what is wrong with the kite and how the child can respond.",
      "promptEn": "Explain what is wrong with the kite and how the child can respond.",
      "slots": [
        {
          "key": "problem",
          "name": "The child notices…",
          "options": [
            "a tear along one edge of the kite",
            "a loose section that may grow wider in the wind",
            "damage that keeps the kite from flying properly",
            "a spot that needs careful mending"
          ]
        },
        {
          "key": "response",
          "name": "So the child can…",
          "options": [
            "lower the kite before the tear grows",
            "place a light patch over the torn edge",
            "ask someone to hold the kite while it is repaired",
            "check the string before trying to fly it again"
          ]
        }
      ],
      "template": "The child notices {problem}, so the child can {response}.",
      "otherIdeas": [
        {
          "viewpoint": "Name the evidence",
          "text": "The picture shows an opening along the kite edge."
        },
        {
          "viewpoint": "Explain the response",
          "text": "The kite should be brought down before it is mended."
        },
        {
          "viewpoint": "Connect problem and plan",
          "text": "Because the tear may spread in the wind, the child needs to repair it first."
        }
      ],
      "reflectPrompt": "Which explanation clearly connects the visible problem to a sensible response?"
    },
    "createCcr": {
      "prompt": "Give the repaired kite a new purpose or begin a new event after it is fixed.",
      "promptEn": "Give the repaired kite a new purpose or begin a new event after it is fixed.",
      "slots": [
        {
          "key": "idea",
          "name": "The child could redesign the kite with…",
          "options": [
            "a tail that changes shape to show the wind direction",
            "small ribbon loops that flutter at different heights",
            "a pocket that carries a lightweight picture message",
            "two removable wings for testing different flight shapes"
          ]
        },
        {
          "key": "event",
          "name": "Then the new story could continue with…",
          "options": [
            "friends comparing which tail keeps the kite steadiest",
            "the kite delivering a picture greeting across the field",
            "a team recording how each wing shape changes the flight",
            "the ribbons helping the children find a gentle air current"
          ]
        }
      ],
      "template": "The child adds {idea}. Then, {event}.",
      "otherIdeas": [
        {
          "viewpoint": "New design challenge",
          "text": "The children test three patch shapes to see which bends best in the wind."
        },
        {
          "viewpoint": "New collaboration",
          "text": "One friend sketches, one cuts the patch, and another performs the flight test."
        },
        {
          "viewpoint": "New story direction",
          "text": "The repaired kite becomes a signal that guides friends to a picnic spot."
        }
      ],
      "reflectPrompt": "Which idea creates a genuinely new action, design, or story direction after the repair?"
    }
  }
  ,
    {
      "id": "zh-k1-rhyme-rain-boots",
      "lang": "zh",
      "grade": "K1",
      "title": "小雨靴踩水花",
      "genre": "nursery-rhyme-scene",
      "background": "雨后的小路上有三个浅水洼，孩子穿着黄色雨靴。",
      "objects": [
        {
          "id": "child",
          "emoji": "🧒",
          "label": "穿黄色雨靴的孩子"
        },
        {
          "id": "boots",
          "emoji": "🥾",
          "label": "黄色雨靴"
        },
        {
          "id": "puddle-small",
          "emoji": "💧",
          "label": "小水洼"
        },
        {
          "id": "puddle-big",
          "emoji": "💦",
          "label": "大水洼"
        }
      ],
      "narration": "小雨靴，走一走，啪嗒啪嗒踩小沟。小水花，跳一跳，啪嗒啪嗒又来到。",
      "frames": [
        {
          "id": "rain-boots-f1",
          "narration": "孩子穿着黄色雨靴走到第一个小水洼前。",
          "objects": [
            "child",
            "boots",
            "puddle-small"
          ]
        },
        {
          "id": "rain-boots-f2",
          "narration": "左脚踩下去，水花“啪嗒”跳起来。",
          "objects": [
            "child",
            "boots",
            "puddle-small"
          ]
        },
        {
          "id": "rain-boots-f3",
          "narration": "孩子走到大水洼前，准备再踩一下。",
          "objects": [
            "child",
            "boots",
            "puddle-big"
          ]
        }
      ],
      "items": [
        {
          "id": "q-observe-rain-boots",
          "unit": "observe",
          "template": "scene-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "画面里的孩子脚上穿着什么？",
          "options": [
            {
              "text": "黄色雨靴"
            },
            {
              "text": "红色拖鞋",
              "errorType": "scene_mismatch"
            },
            {
              "text": "蓝色袜子",
              "errorType": "scene_mismatch"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-choose-rain-boots",
          "unit": "choose",
          "template": "sound-word",
          "level": "L2",
          "interaction": "select",
          "prompt": "童谣里用哪个声音词写雨靴踩水？",
          "options": [
            {
              "text": "啪嗒啪嗒"
            },
            {
              "text": "呼噜呼噜",
              "errorType": "narration_mismatch"
            },
            {
              "text": "叮铃叮铃",
              "errorType": "narration_mismatch"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-structure-rain-boots",
          "unit": "structure",
          "template": "scene-order",
          "level": "L2",
          "interaction": "order",
          "prompt": "按画面顺序排列。",
          "cards": [
            {
              "id": "rain-boots-o1",
              "text": "走到小水洼前"
            },
            {
              "id": "rain-boots-o2",
              "text": "左脚踩出水花"
            },
            {
              "id": "rain-boots-o3",
              "text": "走向大水洼"
            }
          ],
          "answer": [
            "rain-boots-o1",
            "rain-boots-o2",
            "rain-boots-o3"
          ]
        }
      ],
      "expressCcr": {
        "prompt": "根据童谣和画面，说说雨靴怎样让小水花跳起来。",
        "slots": [
          {
            "key": "action",
            "name": "孩子的动作",
            "options": [
              "穿着雨靴踩进水洼",
              "走到水洼前再抬起脚",
              "左脚踩进浅浅的水里"
            ]
          },
          {
            "key": "sound",
            "name": "听到的声音",
            "options": [
              "啪嗒啪嗒",
              "童谣重复的踩水声",
              "雨靴碰到水的声音"
            ]
          }
        ],
        "template": "孩子{action}，水花跳起来，听起来像{sound}。",
        "otherIdeas": [
          {
            "viewpoint": "看动作",
            "text": "孩子先走到水洼前，再抬脚踩下去。"
          },
          {
            "viewpoint": "听节奏",
            "text": "“啪嗒啪嗒”重复出现，让踩水有节奏。"
          },
          {
            "viewpoint": "看水花",
            "text": "雨靴踩进水里以后，小水花向上跳。"
          }
        ],
        "reflectPrompt": "哪种说法同时用了画面中的动作和童谣里的声音？"
      },
      "createCcr": {
        "prompt": "为下一次踩水创造一句新的、有节奏的童谣。",
        "slots": [
          {
            "key": "newAction",
            "name": "新的动作",
            "options": [
              "轻轻踩一踩",
              "两脚跳一跳",
              "绕过水洼再回来"
            ]
          },
          {
            "key": "newSound",
            "name": "新的声音",
            "options": [
              "扑通扑通",
              "滴答滴答",
              "哗啦哗啦"
            ]
          }
        ],
        "template": "小雨靴，{newAction}，{newSound}水花笑。",
        "otherIdeas": [
          {
            "viewpoint": "改变动作",
            "text": "让孩子从走路变成双脚一起跳。"
          },
          {
            "viewpoint": "改变声音",
            "text": "大水洼可以配上更响的拟声词。"
          },
          {
            "viewpoint": "改变节奏",
            "text": "把重复两次的声音改成三次。"
          }
        ],
        "reflectPrompt": "哪一句既有新动作，又保持了童谣的节奏？"
      }
    },
    {
      "id": "en-k1-riddle-red-ball",
      "lang": "en",
      "grade": "K1",
      "title": "Where Is the Red Ball?",
      "genre": "riddle-scene",
      "background": "A playground with a bench, a blue slide, and a red ball partly visible behind a yellow bucket.",
      "objects": [
        {
          "id": "red-ball",
          "emoji": "🔴",
          "label": "red ball"
        },
        {
          "id": "yellow-bucket",
          "emoji": "🪣",
          "label": "yellow bucket"
        },
        {
          "id": "blue-slide",
          "emoji": "🛝",
          "label": "blue slide"
        },
        {
          "id": "bench",
          "emoji": "🪑",
          "label": "bench"
        }
      ],
      "narration": "I am round. I am red. Part of me peeks out behind the yellow bucket. I am not under the bench. What am I?",
      "frames": [
        {
          "id": "red-ball-f1",
          "narration": "The playground has a blue slide, a bench, and a yellow bucket.",
          "objects": [
            "blue-slide",
            "bench",
            "yellow-bucket"
          ]
        },
        {
          "id": "red-ball-f2",
          "narration": "A small red curve can be seen behind the yellow bucket.",
          "objects": [
            "red-ball",
            "yellow-bucket",
            "blue-slide",
            "bench"
          ]
        },
        {
          "id": "red-ball-f3",
          "narration": "The round red ball rolls out from behind the bucket.",
          "objects": [
            "red-ball",
            "yellow-bucket"
          ]
        }
      ],
      "items": [
        {
          "id": "q-observe-red-ball",
          "unit": "observe",
          "template": "scene-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "What color is the curved part peeking behind the bucket?",
          "options": [
            {
              "text": "Red"
            },
            {
              "text": "Blue",
              "errorType": "scene_mismatch"
            },
            {
              "text": "Green",
              "errorType": "scene_mismatch"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-comprehend-red-ball",
          "unit": "comprehend",
          "template": "riddle-clue",
          "level": "L2",
          "interaction": "select",
          "prompt": "Where does the riddle say the hidden object is?",
          "options": [
            {
              "text": "Behind the yellow bucket"
            },
            {
              "text": "Under the bench",
              "errorType": "contradicts_narration"
            },
            {
              "text": "At the top of the slide",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-red-ball",
          "unit": "infer",
          "template": "clue-combination",
          "level": "L2",
          "interaction": "select",
          "prompt": "Use the picture and all the clues. What is hiding?",
          "options": [
            {
              "text": "The red ball"
            },
            {
              "text": "The blue slide",
              "errorType": "clue_mismatch"
            },
            {
              "text": "The bench",
              "errorType": "clue_mismatch"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "Use the visible clues to explain how you found the red ball.",
        "slots": [
          {
            "key": "look",
            "name": "What it looks like",
            "options": [
              "round and red",
              "a red curve peeking out",
              "the same color as the hidden ball"
            ]
          },
          {
            "key": "place",
            "name": "Where it is",
            "options": [
              "behind the yellow bucket",
              "near the slide but not under the bench",
              "partly covered by the bucket"
            ]
          }
        ],
        "template": "I think it is the ball because it looks {look} and is {place}.",
        "otherIdeas": [
          {
            "viewpoint": "Use color",
            "text": "The visible part is red, just like the clue says."
          },
          {
            "viewpoint": "Use shape",
            "text": "The curved edge suggests a round object."
          },
          {
            "viewpoint": "Use location",
            "text": "The picture places it behind the yellow bucket, not under the bench."
          }
        ],
        "reflectPrompt": "Which explanation uses both a picture clue and a location clue?"
      },
      "createCcr": {
        "prompt": "Create one new clue for the same hidden red ball.",
        "slots": [
          {
            "key": "newClue",
            "name": "A new clue",
            "options": [
              "I can roll across the playground",
              "I can bounce when a child drops me",
              "I fit in two small hands"
            ]
          },
          {
            "key": "hidePlace",
            "name": "A new hiding place",
            "options": [
              "beside the slide",
              "under the bench",
              "inside the open toy box"
            ]
          }
        ],
        "template": "New clue: {newClue}. Look for me {hidePlace}.",
        "otherIdeas": [
          {
            "viewpoint": "Movement clue",
            "text": "Describe how the ball rolls or bounces."
          },
          {
            "viewpoint": "Size clue",
            "text": "Describe how the ball fits in a child’s hands."
          },
          {
            "viewpoint": "Place clue",
            "text": "Hide it somewhere different in the playground."
          }
        ],
        "reflectPrompt": "Which new clue helps a child search without saying the answer?"
      }
    }
  ,
    {
      "id": "zh-k2-market-dialogue",
      "lang": "zh",
      "grade": "K2",
      "title": "小市场里的误会",
      "genre": "situational-dialogue-scene",
      "background": "小市场的蔬菜摊上摆着胡萝卜、玉米和苹果，乐乐拿着小篮子。",
      "objects": [
        {
          "id": "market-child",
          "emoji": "🧒",
          "label": "拿篮子的乐乐"
        },
        {
          "id": "market-seller",
          "emoji": "🧑",
          "label": "摊主"
        },
        {
          "id": "market-carrots",
          "emoji": "🥕",
          "label": "胡萝卜"
        },
        {
          "id": "market-corn",
          "emoji": "🌽",
          "label": "玉米"
        },
        {
          "id": "market-apples",
          "emoji": "🍎",
          "label": "苹果"
        },
        {
          "id": "market-basket",
          "emoji": "🧺",
          "label": "小篮子"
        }
      ],
      "narration": "乐乐指着胡萝卜说：“您好，我想要两根。”摊主听成了两个苹果，把苹果放进篮子。乐乐看了看篮子，礼貌地说：“谢谢，不过我说的是两根胡萝卜。”摊主点点头，把苹果换成了胡萝卜。",
      "frames": [
        {
          "id": "market-dialogue-f1",
          "narration": "乐乐指着胡萝卜，礼貌地说想要两根。",
          "objects": [
            "market-child",
            "market-seller",
            "market-carrots",
            "market-corn",
            "market-apples",
            "market-basket"
          ]
        },
        {
          "id": "market-dialogue-f2",
          "narration": "摊主误以为乐乐要两个苹果，把苹果放进篮子。",
          "objects": [
            "market-child",
            "market-seller",
            "market-apples",
            "market-basket"
          ]
        },
        {
          "id": "market-dialogue-f3",
          "narration": "乐乐看着篮子，礼貌说明自己要的是两根胡萝卜。",
          "objects": [
            "market-child",
            "market-seller",
            "market-carrots",
            "market-apples",
            "market-basket"
          ]
        },
        {
          "id": "market-dialogue-f4",
          "narration": "摊主听明白了，把苹果换成两根胡萝卜。",
          "objects": [
            "market-child",
            "market-seller",
            "market-carrots",
            "market-basket"
          ]
        }
      ],
      "items": [
        {
          "id": "q-comprehend-market-dialogue",
          "unit": "comprehend",
          "template": "scene-misunderstanding",
          "level": "L2",
          "interaction": "select",
          "prompt": "乐乐原来想买什么？",
          "options": [
            {
              "text": "两根胡萝卜"
            },
            {
              "text": "两个苹果",
              "errorType": "frame_mismatch"
            },
            {
              "text": "两根玉米",
              "errorType": "object_mismatch"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-market-dialogue",
          "unit": "infer",
          "template": "speaker-intention",
          "level": "L2",
          "interaction": "select",
          "prompt": "乐乐为什么看了篮子以后又解释一次？",
          "options": [
            {
              "text": "篮子里是苹果，不是他刚才指着的胡萝卜"
            },
            {
              "text": "他决定什么也不买了",
              "errorType": "contradicts_scene"
            },
            {
              "text": "市场马上要关门了",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-structure-market-dialogue",
          "unit": "structure",
          "template": "scene-order",
          "level": "L2",
          "interaction": "order",
          "prompt": "按场景顺序排列。",
          "cards": [
            {
              "id": "market-dialogue-o1",
              "text": "乐乐指着胡萝卜说要两根"
            },
            {
              "id": "market-dialogue-o2",
              "text": "摊主把苹果放进篮子"
            },
            {
              "id": "market-dialogue-o3",
              "text": "乐乐礼貌地说明误会"
            },
            {
              "id": "market-dialogue-o4",
              "text": "摊主换成胡萝卜"
            }
          ],
          "answer": [
            "market-dialogue-o1",
            "market-dialogue-o2",
            "market-dialogue-o3",
            "market-dialogue-o4"
          ]
        },
        {
          "id": "q-choose-market-dialogue",
          "unit": "choose",
          "template": "polite-wording",
          "level": "L2",
          "interaction": "select",
          "prompt": "哪句话既能纠正画面中的误会，又比较有礼貌？",
          "options": [
            {
              "text": "谢谢，不过我说的是两根胡萝卜。"
            },
            {
              "text": "你完全听错了！",
              "errorType": "tone_mismatch"
            },
            {
              "text": "快把苹果拿走！",
              "errorType": "tone_mismatch"
            }
          ],
          "answer": 0
        }
      ],
      "expressCcr": {
        "prompt": "根据连续画面，说明误会怎样发生，又怎样解决。",
        "slots": [
          {
            "key": "mixup",
            "name": "误会怎样发生",
            "options": [
              "乐乐指着胡萝卜说要两根，摊主却拿了苹果",
              "摊主把“两根”听成了“两个苹果”",
              "篮子里的物品和乐乐指的物品不同"
            ]
          },
          {
            "key": "solution",
            "name": "怎样解决",
            "options": [
              "乐乐礼貌地重新说明",
              "乐乐把数量和物品名称一起说清楚",
              "摊主听完解释后换成胡萝卜"
            ]
          }
        ],
        "template": "开始时，{mixup}。后来，{solution}，误会就解决了。",
        "otherIdeas": [
          {
            "viewpoint": "看手势",
            "text": "乐乐指着胡萝卜，画面说明了他真正想买什么。"
          },
          {
            "viewpoint": "听说法",
            "text": "重新说出“两根胡萝卜”比只说“两根”更清楚。"
          },
          {
            "viewpoint": "看结果",
            "text": "最后篮子里换成胡萝卜，说明双方已经听明白。"
          }
        ],
        "reflectPrompt": "哪种表达同时说清了误会和解决方法？"
      },
      "createCcr": {
        "prompt": "创造一种新的礼貌说法或确认方法，让摊主一开始就听清楚。",
        "slots": [
          {
            "key": "request",
            "name": "清楚的请求",
            "options": [
              "您好，请给我两根胡萝卜",
              "我想买这边的两根胡萝卜",
              "请把两根胡萝卜放进篮子"
            ]
          },
          {
            "key": "check",
            "name": "新的确认方法",
            "options": [
              "同时指一指胡萝卜",
              "请摊主重复一次物品和数量",
              "拿起一根胡萝卜再说明数量"
            ]
          }
        ],
        "template": "乐乐可以说：“{request}”，还可以{check}。",
        "otherIdeas": [
          {
            "viewpoint": "说完整",
            "text": "把数量和物品名称放在同一句话里。"
          },
          {
            "viewpoint": "用手势",
            "text": "说话时指向自己想买的蔬菜。"
          },
          {
            "viewpoint": "再确认",
            "text": "请对方重复一次，可以及时发现误会。"
          }
        ],
        "reflectPrompt": "哪种新方法既清楚、礼貌，又最容易避免误会？"
      }
    },
    {
      "id": "en-k2-folktale-lantern",
      "lang": "en",
      "grade": "K2",
      "title": "The Lantern Trail",
      "genre": "cultural-folktale-style-scene",
      "background": "A community evening with paper lanterns, a music table, a welcome table, and a small embroidered pouch.",
      "objects": [
        {
          "id": "lantern-ami",
          "emoji": "🧒",
          "label": "Ami"
        },
        {
          "id": "lantern-red",
          "emoji": "🏮",
          "label": "red lantern"
        },
        {
          "id": "lantern-gold",
          "emoji": "🟡",
          "label": "gold lantern"
        },
        {
          "id": "lantern-music-table",
          "emoji": "🥁",
          "label": "music table"
        },
        {
          "id": "lantern-welcome-table",
          "emoji": "🎟️",
          "label": "welcome table"
        },
        {
          "id": "lantern-pouch",
          "emoji": "👝",
          "label": "embroidered pouch"
        },
        {
          "id": "lantern-owner",
          "emoji": "🧓",
          "label": "elder looking for a pouch"
        }
      ],
      "narration": "During the community lantern evening, Ami found a small embroidered pouch beside the music table. A red ribbon tied to it matched the ribbons on a trail of lanterns leading to the welcome table. There, an elder was asking about a pouch with a stitched moon. Ami showed the pouch, and the elder recognized the moon.",
      "frames": [
        {
          "id": "folktale-lantern-f1",
          "narration": "Ami sees an embroidered pouch beside the music table under a red lantern.",
          "objects": [
            "lantern-ami",
            "lantern-pouch",
            "lantern-music-table",
            "lantern-red"
          ]
        },
        {
          "id": "folktale-lantern-f2",
          "narration": "The pouch has a red ribbon like the ribbons along the lantern trail.",
          "objects": [
            "lantern-ami",
            "lantern-pouch",
            "lantern-red",
            "lantern-gold",
            "lantern-welcome-table"
          ]
        },
        {
          "id": "folktale-lantern-f3",
          "narration": "At the welcome table, an elder asks about a missing pouch with a stitched moon.",
          "objects": [
            "lantern-ami",
            "lantern-owner",
            "lantern-welcome-table",
            "lantern-pouch"
          ]
        },
        {
          "id": "folktale-lantern-f4",
          "narration": "Ami shows the pouch, and the elder recognizes the stitched moon.",
          "objects": [
            "lantern-ami",
            "lantern-owner",
            "lantern-pouch",
            "lantern-gold"
          ]
        }
      ],
      "items": [
        {
          "id": "q-observe-folktale-lantern",
          "unit": "observe",
          "template": "scene-detail",
          "level": "L1",
          "interaction": "select",
          "prompt": "Where did Ami first see the embroidered pouch?",
          "options": [
            {
              "text": "Beside the music table"
            },
            {
              "text": "Inside a tea cup",
              "errorType": "scene_mismatch"
            },
            {
              "text": "On top of the welcome sign",
              "errorType": "scene_mismatch"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-infer-folktale-lantern",
          "unit": "infer",
          "template": "scene-clue-inference",
          "level": "L2",
          "interaction": "select",
          "prompt": "Why did Ami take the pouch toward the welcome table?",
          "options": [
            {
              "text": "The matching lantern ribbons led there, and someone there was asking about a missing pouch."
            },
            {
              "text": "Ami wanted to hide the pouch under the table.",
              "errorType": "contradicts_scene"
            },
            {
              "text": "The music table had disappeared.",
              "errorType": "fabrication"
            }
          ],
          "answer": 0
        },
        {
          "id": "q-structure-folktale-lantern",
          "unit": "structure",
          "template": "scene-order",
          "level": "L2",
          "interaction": "order",
          "prompt": "Put the lantern-evening events in order.",
          "cards": [
            {
              "id": "folktale-lantern-o1",
              "text": "Ami finds the pouch"
            },
            {
              "id": "folktale-lantern-o2",
              "text": "Ami follows the matching lantern ribbons"
            },
            {
              "id": "folktale-lantern-o3",
              "text": "The elder describes the missing pouch"
            },
            {
              "id": "folktale-lantern-o4",
              "text": "The elder recognizes the stitched moon"
            }
          ],
          "answer": [
            "folktale-lantern-o1",
            "folktale-lantern-o2",
            "folktale-lantern-o3",
            "folktale-lantern-o4"
          ]
        }
      ],
      "expressCcr": {
        "prompt": "Use clues from the frames to explain how Ami found the pouch's owner.",
        "slots": [
          {
            "key": "pathClue",
            "name": "The path clue",
            "options": [
              "the pouch ribbon matched the ribbons along the lantern trail",
              "the lantern trail led from the music table to the welcome table",
              "the matching red ribbons showed where Ami should ask for help"
            ]
          },
          {
            "key": "ownerClue",
            "name": "The owner clue",
            "options": [
              "the elder asked about an embroidered pouch",
              "the elder described the stitched moon",
              "the moon on the pouch matched the elder's description"
            ]
          }
        ],
        "template": "Ami followed {pathClue}. At the welcome table, {ownerClue}, so Ami could return the pouch.",
        "otherIdeas": [
          {
            "viewpoint": "Follow the path",
            "text": "The matching ribbons connected the place where the pouch was found to the welcome table."
          },
          {
            "viewpoint": "Match details",
            "text": "The stitched moon matched the detail given by the elder."
          },
          {
            "viewpoint": "Use two frames",
            "text": "Ami used both a location clue and an object clue before returning the pouch."
          }
        ],
        "reflectPrompt": "Which explanation uses clues from more than one frame?"
      },
      "createCcr": {
        "prompt": "Create one new clue or a different safe action Ami could use to return the pouch.",
        "slots": [
          {
            "key": "newClue",
            "name": "A new clue",
            "options": [
              "a matching moon pattern on the elder's bag",
              "a name card tucked inside the pouch",
              "a musician who remembers who sat nearby"
            ]
          },
          {
            "key": "newAction",
            "name": "A different helpful action",
            "options": [
              "ask the event guide for help",
              "make a clear lost-item announcement",
              "leave the pouch safely at the welcome table"
            ]
          }
        ],
        "template": "Ami could notice {newClue} and then {newAction}.",
        "otherIdeas": [
          {
            "viewpoint": "Visual clue",
            "text": "Add a matching stitched symbol without naming the owner immediately."
          },
          {
            "viewpoint": "Ask for help",
            "text": "Ami could involve a trusted event helper."
          },
          {
            "viewpoint": "Safe return place",
            "text": "Ami could bring the pouch to the welcome table."
          }
        ],
        "reflectPrompt": "Which new idea is safe, useful, and different from following the lantern trail?"
      }
    }
  ]
};
