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
          prompt: '小兔站在大树下的时候，心里是什么感觉？',
          options: [
            { text: '有点着急、难过' },
            { text: '很开心', errorType: 'contradicts_text' },
            { text: '很生气', errorType: 'fabrication' }
          ], answer: 0,
          hint: '故事没有直接说小兔的心情，看看小兔的耳朵是什么样子的。' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
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
      ccr: {
        prompt: '第二天，小兔见到小熊，会做什么呢？',
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
          prompt: '冬冬看到袋子破了，一开始是怎么想的？',
          options: [
            { text: '担心是小偷来过' },
            { text: '觉得是奶奶把玉米吃了', errorType: 'fabrication' },
            { text: '觉得是雪把袋子压破了', errorType: 'fabrication' }
          ], answer: 0,
          hint: '找一找冬冬说的第一句话。' },
        { id: 'q3', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
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
      ccr: {
        prompt: '换个角色想一想：如果你是小松鼠，看到纸条会怎么想？',
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
      ccr: {
        prompt: 'What might Max do tomorrow if there is no wind at all?',
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
          prompt: 'How did Ben feel on Friday?',
          options: [
            { text: 'Happy' },
            { text: 'Still upset', errorType: 'sequence_confusion' },
            { text: 'Scared of the rabbit', errorType: 'fabrication' }
          ], answer: 0,
          hint: 'The story does not say "happy". What did Ben do on Friday?' },
        { id: 'q4', unit: 'infer', template: 'feeling-evidence', level: 'L2', interaction: 'evidence',
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
      ccr: {
        prompt: 'Think like the rabbit: what would you say to Room 2?',
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
          hintZh: '找一找离小鸭最近的那个表情，不是小兔旁边的。', hintEn: 'Find the face closest to the duck, not the one near the rabbit.' }
      ]
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
          hintZh: '找一找离淋湿的小狗最近的表情。', hintEn: 'Find the face closest to the wet puppy.' }
      ]
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
        { id: 'q3', unit: 'structure', interaction: 'order' }
      ],
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
        { id: 'q3', unit: 'structure', interaction: 'order' }
      ],
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
