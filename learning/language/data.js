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
      id: 'zh-g1-borrow-umbrella',
      lang: 'zh', grade: 'G1', genre: 'story',
      anchors: {
        curriculum: ['课标2022·第一学段·阅读与鉴赏', '课标2022·思辨性阅读与表达', '统编一下·课文单元（童话）'],
        level: { hanziCount: 96 }
      },
      title: '借伞',
      sentences: [
        { id: 's1', text: '下雨了。' },
        { id: 's2', text: '小兔没有带伞，站在大树下，耳朵耷拉下来。' },
        { id: 's3', text: '小熊撑着一把大伞走过来。' },
        { id: 's4', text: '他看看小兔，又看看自己的伞，说：“我们一起走吧！”' },
        { id: 's5', text: '雨越下越大。' },
        { id: 's6', text: '到了小兔家门口，小兔身上干干的，小熊的半边身子却湿透了。' },
        { id: 's7', text: '小兔说：“谢谢你！”小熊笑着摆摆手：“明天见！”' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
          prompt: '下雨的时候，小兔一开始站在哪里？',
          options: [
            { text: '大树下' },
            { text: '屋檐下', errorType: 'fabrication' },
            { text: '小熊的伞下', errorType: 'sequence_confusion' }
          ], answer: 0,
          hint: '找一找第二句，看看小兔站在什么地方。' },
        { id: 'q2', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'select',
          pairId: 'rabbit-feeling',
          prompt: '小兔站在大树下的时候，心里是什么感觉？',
          options: [
            { text: '有点着急、难过' },
            { text: '很开心', errorType: 'contradicts_text' },
            { text: '很生气', errorType: 'fabrication' }
          ], answer: 0,
          hint: '故事没有直接说小兔的心情，看看小兔的耳朵是什么样子的。' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
          pairId: 'rabbit-feeling', claimItemId: 'q2', evidenceFor: 'q2',
          prompt: '你从哪一句看出小兔不开心？点一点那一句。',
          target: 'sentence', answer: ['s2'],
          hint: '找一找写小兔样子的那一句。' },
        { id: 'q4', unit: 'comprehend', template: 'main-point', level: 'L2', interaction: 'select',
          prompt: '这个故事主要讲了什么？',
          options: [
            { text: '下雨天，小熊和小兔一起打伞回家' },
            { text: '小熊有一把很大的伞', errorType: 'detail_as_main' },
            { text: '小兔和小熊在雨里玩水', errorType: 'fabrication' }
          ], answer: 0,
          hint: '想一想，从开头到结尾，一直在发生的是什么事？' },
        { id: 'q5', unit: 'infer', template: 'cause-hidden', level: 'L3', interaction: 'select',
          prompt: '为什么小熊的半边身子湿透了，小兔却干干的？',
          options: [
            { text: '小熊把伞往小兔那边多撑了一些' },
            { text: '小熊的伞破了一个洞', errorType: 'fabrication' },
            { text: '因为雨越下越大', errorType: 'overgeneralization' }
          ], answer: 0,
          hint: '雨越下越大，可是只有小熊湿了。伞更多地挡在谁的头上？' },
        { id: 'q6', unit: 'structure', template: 'order-cards', level: 'L3', interaction: 'order',
          prompt: '按照故事里发生的顺序，把卡片排一排。',
          cards: ['小兔站在大树下', '小熊邀请小兔一起走', '两个人打着一把伞走在雨里', '小兔说谢谢你'],
          hint: '先找故事开头写的是谁，在做什么。' },
        { id: 'q7', unit: 'choose', template: 'word-fit', level: 'L4', interaction: 'select',
          prompt: '“小熊撑着一把大伞”，如果把“撑着”换成“拿着”，哪个更好？',
          options: [
            { text: '“撑着”更好，说明伞是打开的，正在挡雨' },
            { text: '“拿着”更好，因为更简单', errorType: 'literal_only' },
            { text: '两个词意思一样，都可以', errorType: 'literal_only' }
          ], answer: 0,
          hint: '伞“拿着”的时候，可能是合起来的吗？' }
      ],
      expressCcr: {
        prompt: '第二天，小兔见到小熊，会怎么把感谢的话说清楚？',
        slots: [
          { key: 'act', name: '小兔会……', options: [
            '送给小熊一块自己做的胡萝卜饼',
            '把自己的新雨伞借给小熊',
            '帮小熊把湿衣服晒干',
            '请小熊到家里来玩'
          ] },
          { key: 'why', name: '因为……', options: [
            '小熊昨天帮了她',
            '小熊为了她淋湿了',
            '好朋友要互相帮助',
            '她想让小熊也开心'
          ] }
        ],
        template: '第二天，小兔{act}，因为{why}。',
        otherIdeas: [
          { viewpoint: '有人想到了“回报”', text: '小兔送给小熊一把小雨伞，下次下雨，两个人都有伞。' },
          { viewpoint: '有人想到了小熊的感受', text: '小兔先问小熊：“你昨天淋湿了，有没有感冒？”' },
          { viewpoint: '有人把故事换了过来', text: '下一次下雨，小兔撑伞，把伞往小熊那边多撑一些。' }
        ],
        reflectPrompt: '看看别人的想法，哪一个是你一开始没有想到的？'
      }
    },

    // ── 中文 G2 ──────────────────────────────────────────────────────────────
    {
      id: 'zh-g2-snow-footprints',
      lang: 'zh', grade: 'G2', genre: 'story',
      anchors: {
        curriculum: ['课标2022·第一学段·阅读与鉴赏', '课标2022·思辨性阅读与表达', '统编二上·课文单元（生活故事）'],
        level: { hanziCount: 232 }
      },
      title: '雪地上的脚印',
      sentences: [
        { id: 's1', text: '早上，冬冬推开门，院子里铺满了厚厚的雪。' },
        { id: 's2', text: '雪地上有一串小小的脚印，从篱笆下面一直通到厨房的窗户底下。' },
        { id: 's3', text: '脚印旁边，还有几粒撒落的玉米。' },
        { id: 's4', text: '冬冬想起来，昨天晚上，奶奶把一小袋玉米放在了窗台上。' },
        { id: 's5', text: '他赶紧跑过去看，袋子被咬破了一个小洞，玉米少了一大半。' },
        { id: 's6', text: '“是小偷吗？”冬冬有点紧张。' },
        { id: 's7', text: '奶奶走过来，蹲下看了看脚印，笑着说：“小偷的脚可没有这么小。你看，每个脚印前面还有几个小点点呢。”' },
        { id: 's8', text: '冬冬顺着脚印往回找，一直找到篱笆外面的大松树下。' },
        { id: 's9', text: '树洞里，一只小松鼠正抱着一粒玉米，吃得正香。' },
        { id: 's10', text: '冬冬笑了。' },
        { id: 's11', text: '第二天早上，他在窗台上放了一小碟玉米，旁边插了一张纸条：“给小松鼠的早餐。”' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'detail-key', level: 'L2', interaction: 'select',
          prompt: '哪个细节最能说明，来过的不是人？',
          options: [
            { text: '脚印很小，每个脚印前面还有几个小点点' },
            { text: '玉米少了一大半', errorType: 'irrelevant_detail' },
            { text: '院子里铺满了厚厚的雪', errorType: 'irrelevant_detail' }
          ], answer: 0,
          hint: '奶奶一看就知道不是小偷，她看的是什么？' },
        { id: 'q2', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'select',
          pairId: 'dongdong-first-thought',
          prompt: '冬冬看到袋子破了，一开始是怎么想的？',
          options: [
            { text: '担心是小偷来过' },
            { text: '觉得是奶奶把玉米吃了', errorType: 'fabrication' },
            { text: '觉得是雪把袋子压破了', errorType: 'fabrication' }
          ], answer: 0,
          hint: '找一找冬冬说的第一句话。' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
          pairId: 'dongdong-first-thought', claimItemId: 'q2', evidenceFor: 'q2',
          prompt: '你从哪一句看出冬冬一开始的想法？点一点那一句。',
          target: 'sentence', answer: ['s6'],
          hint: '找一找冬冬说的话和他的心情。' },
        { id: 'q4', unit: 'infer', template: 'cause-hidden', level: 'L3', interaction: 'select',
          prompt: '袋子上的小洞，最可能是怎么来的？',
          options: [
            { text: '被小松鼠咬破的' },
            { text: '奶奶不小心剪破的', errorType: 'fabrication' },
            { text: '被厚厚的雪压破的', errorType: 'fabrication' }
          ], answer: 0,
          hint: '袋子是被“咬”破的，谁会咬？再看看故事最后找到了谁。' },
        { id: 'q5', unit: 'structure', template: 'signal-word', level: 'L3', interaction: 'evidence',
          prompt: '故事里有一件事，其实发生在故事开头之前。哪个词告诉了我们？',
          target: 'phrase', phrases: ['昨天晚上', '早上', '第二天早上', '一直'], answer: 0,
          hint: '故事从“早上”开始讲，哪个时间比早上还要早？' },
        { id: 'q6', unit: 'structure', template: 'order-cards', level: 'L3', interaction: 'order',
          prompt: '按照事情真正发生的先后排一排。注意：不是故事里写的先后哦！',
          cards: ['奶奶把玉米放在窗台上', '小松鼠咬破袋子吃玉米', '冬冬发现雪地上的脚印', '冬冬给小松鼠准备早餐'],
          hint: '“昨天晚上”发生的事，比“早上”发生的事更早。' },
        { id: 'q7', unit: 'comprehend', template: 'main-point', level: 'L3', interaction: 'select',
          prompt: '冬冬为什么在窗台上放了一小碟玉米？',
          options: [
            { text: '他想让小松鼠有吃的，不用再咬破袋子' },
            { text: '他想把小松鼠抓住', errorType: 'contradicts_text' },
            { text: '奶奶让他这样做的', errorType: 'fabrication' }
          ], answer: 0,
          hint: '看看纸条上写的是什么。' },
        { id: 'q8', unit: 'choose', template: 'word-fit', level: 'L4', interaction: 'select',
          prompt: '“小松鼠吃得正香”，如果换成“小松鼠正在吃”，哪个更好？',
          options: [
            { text: '“吃得正香”更好，让人感觉小松鼠吃得又开心又满足' },
            { text: '“正在吃”更好，字更少', errorType: 'literal_only' },
            { text: '两句意思完全一样', errorType: 'literal_only' }
          ], answer: 0,
          hint: '读一读两句话，哪一句能让你想象出小松鼠的样子？' }
      ],
      expressCcr: {
        prompt: '换个角色想一想：如果你是小松鼠，看到纸条会怎么把自己的感受说清楚？',
        slots: [
          { key: 'feel', name: '我会觉得……', options: ['很惊讶', '很开心', '有点不好意思', '很感动'] },
          { key: 'why', name: '因为……', options: [
            '原来有人知道我来过',
            '以后不用再咬袋子了',
            '我昨天把奶奶的袋子咬破了',
            '冬天终于有早餐吃了'
          ] }
        ],
        template: '如果我是小松鼠，我会觉得{feel}，因为{why}。',
        otherIdeas: [
          { viewpoint: '有人站在小松鼠的角度', text: '“我有点不好意思，昨天把奶奶的袋子咬破了。”' },
          { viewpoint: '有人想到了以后', text: '小松鼠每天早上都会来，冬冬交到了一个新朋友。' },
          { viewpoint: '有人想到了奶奶', text: '奶奶看到纸条，一定会夸冬冬是个有爱心的孩子。' }
        ],
        reflectPrompt: '看看别人的想法，哪一个是你一开始没有想到的？'
      }
    },

    // ── English G1 ───────────────────────────────────────────────────────────
    {
      id: 'en-g1-max-kite',
      lang: 'en', grade: 'G1', genre: 'story',
      anchors: {
        curriculum: ['CCSS RL.1.1', 'CCSS RL.1.2', 'CCSS RL.1.3', 'CCSS RL.1.4', 'UK KS1 Y1 comprehension'],
        level: { sentences: 8, words: 53 }
      },
      title: 'Max and the Kite',
      sentences: [
        { id: 's1', text: 'Max had a red kite.' },
        { id: 's2', text: 'He ran and ran, but the kite fell down.' },
        { id: 's3', text: '"The wind is too weak," said Grandpa.' },
        { id: 's4', text: 'So Max sat on the grass and waited.' },
        { id: 's5', text: 'Soon the trees began to shake.' },
        { id: 's6', text: 'Max jumped up and ran again.' },
        { id: 's7', text: 'Up, up, up went the kite!' },
        { id: 's8', text: 'Max laughed. "The wind is back!"' }
      ],
      items: [
        { id: 'q1', unit: 'comprehend', template: 'detail-find', level: 'L1', interaction: 'select',
          prompt: 'Why did the kite fall down at first?',
          options: [
            { text: 'The wind was too weak.' },
            { text: 'Max did not run.', errorType: 'contradicts_text' },
            { text: 'The kite was broken.', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Listen to what Grandpa said.' },
        { id: 'q2', unit: 'infer', template: 'cause-hidden', level: 'L2', interaction: 'select',
          prompt: 'Why did Max sit on the grass?',
          options: [
            { text: 'He was waiting for the wind.' },
            { text: 'He did not like his kite.', errorType: 'fabrication' },
            { text: 'Grandpa told him to sit down.', errorType: 'misattribution' }
          ], answer: 0,
          hint: 'What did Max need to fly his kite?' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
          prompt: 'How did Max know the wind was strong again? Tap the sentence.',
          target: 'sentence', answer: ['s5'],
          hint: 'You cannot see wind. What moved?' },
        { id: 'q4', unit: 'structure', template: 'signal-word', level: 'L3', interaction: 'evidence',
          prompt: 'Which word tells us the trees shook after Max waited?',
          target: 'phrase', phrases: ['Soon', 'So', 'but', 'again'], answer: 0,
          hint: 'Look at the start of the sentence about the trees.' },
        { id: 'q5', unit: 'structure', template: 'order-cards', level: 'L3', interaction: 'order',
          prompt: 'Put the story in order.',
          cards: ['The kite fell down.', 'Max waited on the grass.', 'The trees began to shake.', 'The kite went up high.'],
          hint: 'What went wrong at the very beginning?' },
        { id: 'q6', unit: 'comprehend', template: 'main-point', level: 'L2', interaction: 'select',
          prompt: 'What is this story mostly about?',
          options: [
            { text: 'Max waits for the wind and flies his kite.' },
            { text: 'Max has a red kite.', errorType: 'detail_as_main' },
            { text: 'Grandpa buys Max a new kite.', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Think about the beginning, the middle, and the end.' },
        { id: 'q7', unit: 'choose', template: 'word-fit', level: 'L4', interaction: 'select',
          prompt: 'Why does the story say "Up, up, up" and not just "up"?',
          options: [
            { text: 'To show the kite went very, very high.' },
            { text: 'Because there were three kites.', errorType: 'literal_only' },
            { text: 'Because Grandpa said it three times.', errorType: 'misattribution' }
          ], answer: 0,
          hint: 'Say "up" once, then "up, up, up". Which one feels higher?' }
      ],
      expressCcr: {
        prompt: 'How could Max explain his plan for tomorrow if there is no wind at all?',
        slots: [
          { key: 'act', name: 'Max will…', options: [
            'run with the kite anyway',
            'ask Grandpa for a new idea',
            'make a paper boat instead',
            'watch the trees and wait'
          ] },
          { key: 'why', name: 'because…', options: [
            'he still wants to fly his kite',
            'Grandpa always has good ideas',
            'there are other fun things to do',
            'the wind might come back later'
          ] }
        ],
        template: 'Tomorrow, Max will {act}, because {why}.',
        otherIdeas: [
          { viewpoint: 'Someone thought about Grandpa', text: 'Grandpa could tell Max a story about the windiest day ever.' },
          { viewpoint: 'Someone made a new plan', text: 'Max could hold the kite and ride his bike to make his own wind!' },
          { viewpoint: 'Someone thought about the weather', text: 'Max could check the trees every hour to see if the wind comes.' }
        ],
        reflectPrompt: 'Which idea did you not think of at first?'
      }
    },

    // ── English G2 ───────────────────────────────────────────────────────────
    {
      id: 'en-g2-class-garden',
      lang: 'en', grade: 'G2', genre: 'story',
      anchors: {
        curriculum: ['CCSS RL.2.1', 'CCSS RL.2.3', 'CCSS RL.2.4', 'CCSS RL.2.5', 'UK KS1 Y2 comprehension'],
        level: { sentences: 13, words: 145 }
      },
      title: 'The Class Garden',
      sentences: [
        { id: 's1', text: 'Every morning, Room 2 checked on their class garden.' },
        { id: 's2', text: 'One Monday, Ben ran inside. "Our lettuce is gone!" he shouted.' },
        { id: 's3', text: 'Only small stems were left, and there were tiny holes in the fence.' },
        { id: 's4', text: '"Maybe someone took it," said Ava.' },
        { id: 's5', text: 'Ms. Lee knelt down and pointed at the soil. "Look at these little round droppings."' },
        { id: 's6', text: 'Ben looked closer. "And these footprints have long back feet!"' },
        { id: 's7', text: 'The class looked at each other. "A rabbit!" they said together.' },
        { id: 's8', text: 'At first, Ben was upset. He had planted that lettuce himself.' },
        { id: 's9', text: 'Then Ava had an idea. "What if we fix the fence and plant extra lettuce outside it?"' },
        { id: 's10', text: 'The next week, the class worked together.' },
        { id: 's11', text: 'They fixed the holes and planted a small row of lettuce just for the rabbit.' },
        { id: 's12', text: 'On Friday, Ben peeked out the window and smiled.' },
        { id: 's13', text: 'A little brown rabbit was munching on its very own lunch.' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'detail-key', level: 'L2', interaction: 'select',
          prompt: 'Which clue best shows that an animal, not a person, ate the lettuce?',
          options: [
            { text: 'The footprints had long back feet.' },
            { text: 'Only small stems were left.', errorType: 'irrelevant_detail' },
            { text: 'It happened on a Monday.', errorType: 'irrelevant_detail' }
          ], answer: 0,
          hint: 'Which clue would look different if a person did it?' },
        { id: 'q2', unit: 'infer', template: 'claim-check', level: 'L3', interaction: 'select',
          prompt: 'Ava said, "Maybe someone took it." Was she right?',
          options: [
            { text: 'No. The clues showed a rabbit ate it.' },
            { text: 'Yes. A person took the lettuce.', errorType: 'contradicts_text' },
            { text: 'The story never tells us.', errorType: 'literal_only' }
          ], answer: 0,
          hint: 'Look at what the class found in the soil.' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'select',
          pairId: 'ben-friday-feeling',
          prompt: 'How did Ben feel on Friday?',
          options: [
            { text: 'Happy' },
            { text: 'Still upset', errorType: 'sequence_confusion' },
            { text: 'Scared of the rabbit', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'The story does not say "happy". What did Ben do on Friday?' },
        { id: 'q4', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
          pairId: 'ben-friday-feeling', claimItemId: 'q3', evidenceFor: 'q3',
          prompt: 'Which sentence helps you know how Ben felt on Friday? Tap it.',
          target: 'sentence', answer: ['s12'],
          hint: 'Find the sentence that starts with "On Friday".' },
        { id: 'q5', unit: 'infer', template: 'cause-hidden', level: 'L3', interaction: 'select',
          prompt: 'Why did the class plant extra lettuce outside the fence?',
          options: [
            { text: 'So the rabbit had its own food and left the garden alone.' },
            { text: 'To catch the rabbit in a trap.', errorType: 'fabrication' },
            { text: 'Because there was no room inside the fence.', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Who was the extra row "just for"?' },
        { id: 'q6', unit: 'structure', template: 'order-cards', level: 'L3', interaction: 'order',
          prompt: 'Put the beginning, middle, and end of the story in order.',
          cards: ['Ben finds the lettuce is gone.', 'The class looks at the clues.', 'Ava has an idea.', 'The rabbit eats its own lunch.'],
          hint: 'The beginning is the problem. The end is how it was solved.' },
        { id: 'q7', unit: 'choose', template: 'word-fit', level: 'L4', interaction: 'select',
          prompt: 'The rabbit was "munching". Why is "munching" better than "eating" here?',
          options: [
            { text: 'It sounds like the rabbit is chewing happily, bite after bite.' },
            { text: 'It means the rabbit is sleeping.', errorType: 'contradicts_text' },
            { text: 'There is no difference at all.', errorType: 'literal_only' }
          ], answer: 0,
          hint: 'Say "munch, munch, munch". What do you hear and see?' }
      ],
      expressCcr: {
        prompt: 'Think like the rabbit: how would you clearly explain your message to Room 2?',
        slots: [
          { key: 'say', name: 'I would say…', options: ['Thank you!', 'Sorry about your lettuce!', 'Wow, a garden just for me!', 'Can I come back tomorrow?'] },
          { key: 'why', name: 'because…', options: [
            'I was very hungry',
            'I did not know it was your garden',
            'now I have my own food',
            'you were kind to me'
          ] }
        ],
        template: '"{say}" I would say that because {why}.',
        otherIdeas: [
          { viewpoint: 'Someone thought about Ben', text: 'Ben might draw the rabbit and hang the picture on the class wall.' },
          { viewpoint: 'Someone thought about the future', text: 'Maybe the rabbit will bring its babies next spring!' },
          { viewpoint: 'Someone asked a new question', text: 'What if a second rabbit comes? Will one row be enough?' }
        ],
        reflectPrompt: 'Which idea did you not think of at first?'
      }
    },

    // ── 中文 G1 · 经典古诗 ────────────────────────────────────────────────────
    {
      id: 'zh-g1-goose-poem',
      lang: 'zh', grade: 'G1', genre: 'poem',
      source: {
        type: 'public-domain-classic',
        title: '咏鹅',
        author: '骆宾王',
        period: '唐'
      },
      anchors: {
        curriculum: ['课标2022·第一学段·文学阅读与创意表达', '统编语文·古诗词与日积月累'],
        level: { hanziCount: 18 }
      },
      title: '咏鹅',
      sentences: [
        { id: 's1', text: '鹅，鹅，鹅，' },
        { id: 's2', text: '曲项向天歌。' },
        { id: 's3', text: '白毛浮绿水，' },
        { id: 's4', text: '红掌拨清波。' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'image-detail', level: 'L1', interaction: 'select',
          prompt: '诗里写了鹅身上的哪两种颜色？',
          options: [
            { text: '白色和红色' },
            { text: '绿色和红色', errorType: 'misattribution' },
            { text: '白色和蓝色', errorType: 'fabrication' }
          ], answer: 0,
          hint: '找一找写“毛”和“掌”的两句。' },
        { id: 'q2', unit: 'comprehend', template: 'scene-summary', level: 'L2', interaction: 'select',
          prompt: '这首诗主要写了什么画面？',
          options: [
            { text: '一只鹅在水上游动、鸣叫' },
            { text: '一只鹅在岸上睡觉', errorType: 'fabrication' },
            { text: '一个孩子在水里划船', errorType: 'fabrication' }
          ], answer: 0,
          hint: '把“向天歌”“浮绿水”“拨清波”连起来想一想。' },
        { id: 'q3', unit: 'structure', template: 'image-order', level: 'L2', interaction: 'order',
          prompt: '按照诗句出现的顺序，把画面排一排。',
          cards: ['鹅伸长脖子向天鸣叫', '白色羽毛浮在绿水上', '红色脚掌拨动清波'],
          hint: '先读第二句，再读第三、第四句。' },
        { id: 'q4', unit: 'choose', template: 'word-image', level: 'L3', interaction: 'select',
          prompt: '“红掌拨清波”中的“拨”让你看到怎样的动作？',
          options: [
            { text: '鹅掌一下下划动水面' },
            { text: '鹅掌静静停在水里', errorType: 'contradicts_text' },
            { text: '鹅用嘴把水喝光', errorType: 'fabrication' }
          ], answer: 0,
          hint: '用手做一做“拨”的动作，水会不会动？' }
      ],
      createCcr: {
        prompt: '如果再给这幅画添一样东西，你会添什么？',
        slots: [
          { key: 'thing', name: '我会添……', options: ['一片荷叶', '一条小鱼', '几朵白云', '一只小鸭'] },
          { key: 'why', name: '因为……', options: ['画面会更热闹', '它也生活在水边', '它能衬托清清的水', '它会和鹅一起玩'] }
        ],
        template: '我会添{thing}，因为{why}。',
        otherIdeas: [
          { viewpoint: '有人注意到声音', text: '添几只小鸟，让鹅的歌声有回应。' },
          { viewpoint: '有人注意到颜色', text: '添一朵粉色荷花，让白、红、绿三种颜色更鲜明。' },
          { viewpoint: '有人换了观察位置', text: '添水里的倒影，从水面下面看鹅。' }
        ],
        reflectPrompt: '哪一种想法让你看到了原诗里没有直接写出的新画面？'
      }
    },

    // ── 中文 G2 · 经典寓言 ────────────────────────────────────────────────────
    {
      id: 'zh-g2-snipe-clam-adaptation',
      lang: 'zh', grade: 'G2', genre: 'fable',
      source: {
        type: 'public-domain-classic-adaptation',
        title: '鹬蚌相争',
        origin: '《战国策》传统寓言',
        adaptation: 'MindsEvo age-level retelling'
      },
      anchors: {
        curriculum: ['课标2022·第一学段·文学阅读与创意表达', '课标2022·思辨性阅读与表达'],
        level: { hanziCount: 154 }
      },
      title: '鹬蚌相争',
      sentences: [
        { id: 's1', text: '河边，一只河蚌张开壳晒太阳。' },
        { id: 's2', text: '一只鹬飞来，伸长嘴去啄蚌肉。' },
        { id: 's3', text: '河蚌立刻合上壳，紧紧夹住了鹬的长嘴。' },
        { id: 's4', text: '鹬说：“今天不下雨，明天也不下雨，你就会干死。”' },
        { id: 's5', text: '河蚌说：“今天不放你，明天也不放你，你就会饿死。”' },
        { id: 's6', text: '它们谁也不肯先松开。' },
        { id: 's7', text: '一个渔夫走过来，不费力气就把它们一起捉走了。' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'detail-key', level: 'L2', interaction: 'select',
          prompt: '哪个细节最能说明鹬和河蚌都不肯让步？',
          options: [
            { text: '它们谁也不肯先松开' },
            { text: '河蚌在河边晒太阳', errorType: 'irrelevant_detail' },
            { text: '渔夫从河边走过', errorType: 'sequence_confusion' }
          ], answer: 0,
          hint: '找一找写“谁也不肯”的那一句。' },
        { id: 'q2', unit: 'infer', template: 'cause-hidden', level: 'L3', interaction: 'select',
          pairId: 'fisherman-easy-catch',
          prompt: '为什么渔夫能不费力气地捉住它们？',
          options: [
            { text: '鹬和河蚌互相夹住，谁也不能逃走' },
            { text: '渔夫跑得比它们快', errorType: 'fabrication' },
            { text: '它们主动请渔夫帮忙', errorType: 'contradicts_text' }
          ], answer: 0,
          hint: '渔夫来以前，鹬的嘴和河蚌的壳是什么状态？' },
        { id: 'q3', unit: 'infer', template: 'cause-evidence', level: 'L3', interaction: 'evidence',
          pairId: 'fisherman-easy-catch', claimItemId: 'q2', evidenceFor: 'q2',
          prompt: '哪一句最能支持“它们谁也不能逃走”？点一点。',
          target: 'sentence', answer: ['s6'],
          hint: '找一找双方都不肯改变做法的那一句。' },
        { id: 'q4', unit: 'structure', template: 'cause-chain', level: 'L3', interaction: 'order',
          prompt: '按照故事的因果顺序排一排。',
          cards: ['鹬去啄河蚌', '河蚌夹住鹬嘴', '双方都不肯松开', '渔夫把它们一起捉走'],
          hint: '先找争斗是怎么开始的，再看最后谁得了好处。' },
        { id: 'q5', unit: 'choose', template: 'tone-fit', level: 'L4', interaction: 'select',
          prompt: '鹬和河蚌说话时，哪一个词最能概括它们的语气？',
          options: [
            { text: '互相威胁' },
            { text: '互相感谢', errorType: 'contradicts_text' },
            { text: '互相请教', errorType: 'fabrication' }
          ], answer: 0,
          hint: '两句话都在说对方会有不好的结果。' }
      ],
      createCcr: {
        prompt: '如果鹬和河蚌能在渔夫到来前说一句新话，它们会怎样解决问题？',
        slots: [
          { key: 'speaker', name: '谁先说……', options: ['鹬', '河蚌', '它们一起'] },
          { key: 'plan', name: '解决办法是……', options: ['一起数三下，同时松开', '先停止争吵，听听对方想要什么', '约定谁也不再伤害对方', '先躲开渔夫，再解决分歧'] }
        ],
        template: '{speaker}先提出：{plan}。',
        otherIdeas: [
          { viewpoint: '有人先处理危险', text: '它们先合作逃开渔夫，再谈谁对谁错。' },
          { viewpoint: '有人改变目标', text: '鹬决定去找别的食物，河蚌也不再夹住它。' },
          { viewpoint: '有人设计规则', text: '以后谁想靠近，都先开口说明来意。' }
        ],
        reflectPrompt: '哪一个办法既能解决眼前危险，也能减少下一次争斗？'
      }
    },

    // ── English G1 · Traditional rhyme ─────────────────────────────────────────
    {
      id: 'en-g1-twinkle-rhyme',
      lang: 'en', grade: 'G1', genre: 'rhyme',
      source: {
        type: 'public-domain-traditional',
        title: 'Twinkle, Twinkle, Little Star',
        note: 'Traditional public-domain verse'
      },
      anchors: {
        curriculum: ['CCSS RL.1.1', 'CCSS RL.1.4', 'UK KS1 poetry and rhyme'],
        level: { lines: 6, words: 24 }
      },
      title: 'Twinkle, Twinkle, Little Star',
      sentences: [
        { id: 's1', text: 'Twinkle, twinkle, little star,' },
        { id: 's2', text: 'How I wonder what you are!' },
        { id: 's3', text: 'Up above the world so high,' },
        { id: 's4', text: 'Like a diamond in the sky.' },
        { id: 's5', text: 'Twinkle, twinkle, little star,' },
        { id: 's6', text: 'How I wonder what you are!' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'detail-find', level: 'L1', interaction: 'select',
          prompt: 'Where is the star in the rhyme?',
          options: [
            { text: 'High above the world' },
            { text: 'Under the sea', errorType: 'fabrication' },
            { text: 'Inside a house', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Look at the line that begins with “Up above”.' },
        { id: 'q2', unit: 'comprehend', template: 'speaker-question', level: 'L2', interaction: 'select',
          prompt: 'What is the speaker wondering about?',
          options: [
            { text: 'What the star is' },
            { text: 'Where the sun went', errorType: 'fabrication' },
            { text: 'How to find a diamond', errorType: 'literal_only' }
          ], answer: 0,
          hint: 'Which line ends with a question-like exclamation?' },
        { id: 'q3', unit: 'choose', template: 'comparison-image', level: 'L3', interaction: 'select',
          prompt: 'Why does the rhyme compare the star to a diamond?',
          options: [
            { text: 'Both can look small, bright, and sparkling' },
            { text: 'The star is really made of a diamond', errorType: 'literal_only' },
            { text: 'Both are found under the ground', errorType: 'contradicts_text' }
          ], answer: 0,
          hint: 'Think about how a diamond looks when light shines on it.' },
        { id: 'q4', unit: 'structure', template: 'refrain-pattern', level: 'L3', interaction: 'select',
          prompt: 'Which lines return at the end of the rhyme?',
          options: [
            { text: 'The first two lines' },
            { text: 'Only the diamond line', errorType: 'misattribution' },
            { text: 'No lines return', errorType: 'contradicts_text' }
          ], answer: 0,
          hint: 'Compare the beginning with the ending.' }
      ],
      createCcr: {
        prompt: 'Choose a new thing in the night sky and compare it to something.',
        slots: [
          { key: 'thing', name: 'I see……', options: ['the moon', 'a cloud', 'a comet', 'a tiny planet'] },
          { key: 'image', name: 'It is like……', options: ['a silver boat', 'a soft pillow', 'a bright arrow', 'a round marble'] }
        ],
        template: 'I see {thing}. It is like {image}.',
        otherIdeas: [
          { viewpoint: 'Someone used movement', text: 'A comet is like a paintbrush racing across the sky.' },
          { viewpoint: 'Someone used sound', text: 'A quiet moon is like a song with no words.' },
          { viewpoint: 'Someone changed the viewpoint', text: 'From the moon, Earth might look like a blue marble.' }
        ],
        reflectPrompt: 'Which comparison helps you see the night sky in a new way?'
      }
    },

    // ── English G2 · Traditional fable ─────────────────────────────────────────
    {
      id: 'en-g2-north-wind-sun',
      lang: 'en', grade: 'G2', genre: 'fable',
      source: {
        type: 'public-domain-classic-adaptation',
        title: 'The North Wind and the Sun',
        origin: 'Aesop tradition',
        adaptation: 'MindsEvo age-level retelling'
      },
      anchors: {
        curriculum: ['CCSS RL.2.1', 'CCSS RL.2.2', 'CCSS RL.2.3', 'CCSS RL.2.5', 'UK KS1 traditional tales'],
        level: { sentences: 12, words: 129 }
      },
      title: 'The North Wind and the Sun',
      sentences: [
        { id: 's1', text: 'The North Wind and the Sun argued about which one was stronger.' },
        { id: 's2', text: 'They saw a traveler wearing a warm cloak.' },
        { id: 's3', text: '“Whoever makes him take off that cloak is stronger,” said the Sun.' },
        { id: 's4', text: 'The North Wind blew as hard as it could.' },
        { id: 's5', text: 'The traveler pulled the cloak tightly around his body.' },
        { id: 's6', text: 'The harder the Wind blew, the tighter the traveler held on.' },
        { id: 's7', text: 'At last, the Wind gave up.' },
        { id: 's8', text: 'Then the Sun shone gently.' },
        { id: 's9', text: 'The air grew warmer and warmer.' },
        { id: 's10', text: 'Soon the traveler felt hot.' },
        { id: 's11', text: 'He smiled and took off his cloak.' },
        { id: 's12', text: 'The Sun had won without pushing or shouting.' }
      ],
      items: [
        { id: 'q1', unit: 'observe', template: 'contrast-detail', level: 'L2', interaction: 'select',
          prompt: 'What did the traveler do when the Wind blew harder?',
          options: [
            { text: 'He held the cloak more tightly.' },
            { text: 'He took the cloak off.', errorType: 'contradicts_text' },
            { text: 'He ran toward the Sun.', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Look at the sentence that begins “The harder the Wind blew”.' },
        { id: 'q2', unit: 'infer', template: 'method-result', level: 'L3', interaction: 'select',
          pairId: 'sun-method-result',
          prompt: 'Why did the Sun succeed when the Wind did not?',
          options: [
            { text: 'Gentle warmth made the traveler choose to remove the cloak.' },
            { text: 'The Sun ordered the traveler to remove it.', errorType: 'fabrication' },
            { text: 'The Wind had already torn the cloak.', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'Compare what each one did and how the traveler reacted.' },
        { id: 'q3', unit: 'infer', template: 'method-evidence', level: 'L3', interaction: 'evidence',
          pairId: 'sun-method-result', claimItemId: 'q2', evidenceFor: 'q2',
          prompt: 'Which sentence best shows that the Sun used a gentle method? Tap it.',
          target: 'sentence', answer: ['s8'],
          hint: 'Find the sentence that tells how the Sun shone.' },
        { id: 'q4', unit: 'structure', template: 'contrast-order', level: 'L3', interaction: 'order',
          prompt: 'Put the two attempts and their results in order.',
          cards: ['The Wind blows hard.', 'The traveler holds the cloak tighter.', 'The Sun shines gently.', 'The traveler takes the cloak off.'],
          hint: 'The Wind tries first. The Sun tries after the Wind gives up.' },
        { id: 'q5', unit: 'comprehend', template: 'lesson', level: 'L4', interaction: 'select',
          prompt: 'Which lesson best fits the fable?',
          options: [
            { text: 'A gentle approach can work better than force.' },
            { text: 'Warm days are always better than windy days.', errorType: 'overgeneralization' },
            { text: 'Travelers should never wear cloaks.', errorType: 'literal_only' }
          ], answer: 0,
          hint: 'Think beyond the weather. Which way of changing someone worked?' },
        { id: 'q6', unit: 'choose', template: 'word-force', level: 'L4', interaction: 'select',
          prompt: 'Why is “tightly” important in the sentence about the cloak?',
          options: [
            { text: 'It shows the Wind made the traveler protect himself even more.' },
            { text: 'It shows the cloak was too small.', errorType: 'fabrication' },
            { text: 'It means the traveler dropped the cloak.', errorType: 'contradicts_text' }
          ], answer: 0,
          hint: 'Would the traveler hold on more loosely or more firmly in a strong wind?' }
      ],
      createCcr: {
        prompt: 'Imagine the Wind asks the Sun for advice. What might the Sun say?',
        slots: [
          { key: 'advice', name: 'The Sun might say……', options: ['Try a gentler way', 'Watch how the traveler reacts', 'Do not turn every problem into a contest', 'Work with me instead of against me'] },
          { key: 'reason', name: 'because……', options: ['force can make people resist', 'a small change can reveal a better plan', 'winning is not the only goal', 'two different strengths can work together'] }
        ],
        template: 'The Sun might say, “{advice},” because {reason}.',
        otherIdeas: [
          { viewpoint: 'Someone thought about the traveler', text: 'Ask what the traveler needs instead of treating him like part of a contest.' },
          { viewpoint: 'Someone thought about teamwork', text: 'The Wind could cool the traveler after the Sun makes the day too hot.' },
          { viewpoint: 'Someone questioned the contest', text: 'Being strong may mean knowing when not to use all your power.' }
        ],
        reflectPrompt: 'Which advice changes the meaning of “strong” most clearly?'
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
      id: 'zh-k1-sunny-shade', lang: 'zh', grade: 'K1', bg: 'sunny',
      objects: [
        { id: 'sun', emoji: '☀️', x: 78, y: 12, labelZh: '太阳', labelEn: 'sun' },
        { id: 'tree', emoji: '🌳', x: 28, y: 22, labelZh: '大树', labelEn: 'tree' },
        { id: 'bear', emoji: '🐻', x: 28, y: 62, labelZh: '小熊', labelEn: 'bear' },
        { id: 'face-happy', emoji: '😊', x: 42, y: 55, labelZh: '开心的表情', labelEn: 'happy face' },
        { id: 'cat', emoji: '🐱', x: 76, y: 68, labelZh: '小猫', labelEn: 'cat' },
        { id: 'face-tired', emoji: '🥵', x: 90, y: 55, labelZh: '又热又累的表情', labelEn: 'hot and tired face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '谁坐在大树的树荫下面？点一点。', promptEn: 'Who is sitting in the shade of the tree? Tap it.',
          target: 'bear', distractors: ['cat'],
          hintZh: '大树在谁的头顶上？', hintEn: 'Who has the tree right above them?' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '小猫一直晒着太阳，脸都红了。它现在是什么心情？点一点小猫旁边的表情。', promptEn: 'The cat has been sitting in the hot sun. How does it feel? Tap the face next to the cat.',
          target: 'face-tired', distractors: ['face-happy'],
          hintZh: '找一找离小猫最近的那个表情，不是小熊旁边的。', hintEn: 'Find the face closest to the cat, not the one near the bear.' }
      ]
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
      id: 'en-k1-mushroom-shade', lang: 'en', grade: 'K1', bg: 'sunny',
      objects: [
        { id: 'sun', emoji: '☀️', x: 78, y: 12, labelZh: '太阳', labelEn: 'sun' },
        { id: 'mushroom', emoji: '🍄', x: 28, y: 24, labelZh: '蘑菇', labelEn: 'mushroom' },
        { id: 'chick1', emoji: '🐥', x: 28, y: 62, labelZh: '小鸡一', labelEn: 'chick' },
        { id: 'face-happy', emoji: '😊', x: 42, y: 55, labelZh: '开心的表情', labelEn: 'happy face' },
        { id: 'chick2', emoji: '🐤', x: 76, y: 68, labelZh: '小鸡二', labelEn: 'chick' },
        { id: 'face-tired', emoji: '🥵', x: 90, y: 55, labelZh: '又热又累的表情', labelEn: 'hot and tired face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '哪只小鸡站在蘑菇下面？点一点。', promptEn: 'Which chick is standing under the mushroom? Tap it.',
          target: 'chick1', distractors: ['chick2'],
          hintZh: '蘑菇在谁的头顶上？', hintEn: 'Who has the mushroom right above them?' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '另一只小鸡一直站在太阳下面。它现在是什么心情？点一点它旁边的表情。', promptEn: 'The other chick has been standing in the hot sun. How does it feel? Tap the face next to it.',
          target: 'face-tired', distractors: ['face-happy'],
          hintZh: '找一找离晒太阳的小鸡最近的表情。', hintEn: 'Find the face closest to the chick in the sun.' }
      ]
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
      id: 'zh-k2-broken-kite', lang: 'zh', grade: 'K2', bg: 'sunny',
      objects: [
        { id: 'kite', emoji: '🪁', x: 62, y: 70, labelZh: '风筝', labelEn: 'kite' },
        { id: 'tape', emoji: '🩹', x: 78, y: 42, labelZh: '胶带', labelEn: 'tape' },
        { id: 'ball', emoji: '⚽', x: 82, y: 70, labelZh: '足球', labelEn: 'ball' },
        { id: 'kid', emoji: '🧒', x: 30, y: 62, labelZh: '小男孩', labelEn: 'boy' },
        { id: 'face-sad', emoji: '😢', x: 30, y: 38, labelZh: '难过的表情', labelEn: 'sad face' },
        { id: 'face-happy', emoji: '😊', x: 50, y: 40, labelZh: '开心的表情', labelEn: 'happy face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '风筝破了，旁边有什么东西可以用来修它？点一点。', promptEn: 'The kite is torn. What is next to it that could fix it? Tap it.',
          target: 'tape', distractors: ['ball'],
          hintZh: '找一找能把破洞粘起来的东西。', hintEn: 'Find the thing that can stick a tear back together.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '风筝破了，小男孩心里是什么感觉？点一点小男孩旁边的表情。', promptEn: 'The kite is torn. How does the boy feel? Tap the face next to the boy.',
          target: 'face-sad', distractors: ['face-happy'],
          hintZh: '找一找离小男孩最近的那个表情。', hintEn: 'Find the face closest to the boy.' },
        { id: 'q3', unit: 'structure', interaction: 'order' }
      ],
      frames: [
        { id: 'f1', emoji: '🪁💨', textZh: '风筝被风吹破了一个洞。', textEn: 'The wind tears a hole in the kite.' },
        { id: 'f2', emoji: '🧑‍🤝‍🧑🩹', textZh: '朋友拿来胶带，帮忙把风筝粘好。', textEn: 'A friend brings tape and helps patch the kite.' },
        { id: 'f3', emoji: '🪁😊', textZh: '风筝又飞起来了，两个人一起笑了。', textEn: 'The kite flies again and both kids smile.' }
      ]
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
      id: 'en-k2-torn-kite', lang: 'en', grade: 'K2', bg: 'sunny',
      objects: [
        { id: 'kite', emoji: '🪁', x: 62, y: 70, labelZh: '风筝', labelEn: 'kite' },
        { id: 'tape', emoji: '🩹', x: 78, y: 42, labelZh: '胶带', labelEn: 'tape' },
        { id: 'ball', emoji: '⚽', x: 82, y: 70, labelZh: '足球', labelEn: 'ball' },
        { id: 'kid', emoji: '🧒', x: 30, y: 62, labelZh: '小女孩', labelEn: 'girl' },
        { id: 'face-sad', emoji: '😢', x: 30, y: 38, labelZh: '难过的表情', labelEn: 'sad face' },
        { id: 'face-happy', emoji: '😊', x: 50, y: 40, labelZh: '开心的表情', labelEn: 'happy face' }
      ],
      items: [
        { id: 'q1', unit: 'observe', interaction: 'hotspot',
          promptZh: '风筝破了，旁边有什么东西可以用来修它？点一点。', promptEn: 'The kite is torn. What is next to it that could fix it? Tap it.',
          target: 'tape', distractors: ['ball'],
          hintZh: '找一找能把破洞粘起来的东西。', hintEn: 'Find the thing that can stick a tear back together.' },
        { id: 'q2', unit: 'infer', interaction: 'hotspot',
          promptZh: '风筝破了，小女孩心里是什么感觉？点一点小女孩旁边的表情。', promptEn: 'The kite is torn. How does the girl feel? Tap the face next to the girl.',
          target: 'face-sad', distractors: ['face-happy'],
          hintZh: '找一找离小女孩最近的那个表情。', hintEn: 'Find the face closest to the girl.' },
        { id: 'q3', unit: 'structure', interaction: 'order' }
      ],
      frames: [
        { id: 'f1', emoji: '🪁💨', textZh: '风筝被风吹破了一个洞。', textEn: 'The wind tears a hole in the kite.' },
        { id: 'f2', emoji: '🧑‍🤝‍🧑🩹', textZh: '朋友拿来胶带，帮忙把风筝粘好。', textEn: 'A friend brings tape and helps patch the kite.' },
        { id: 'f3', emoji: '🪁😊', textZh: '风筝又飞起来了，两个人一起笑了。', textEn: 'The kite flies again and both kids smile.' }
      ]
    }
  ]
};
