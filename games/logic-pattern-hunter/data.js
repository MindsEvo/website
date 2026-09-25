'use strict';

/**
 * Logic Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Transitive comparison reasoning. generator.js builds every session; there is
 * no static bank.
 *
 * The characters are children, never animals or objects: "a cheetah runs faster
 * than a horse" can be answered from world knowledge without reading the clues,
 * so it does not measure reasoning. Names are chosen per language (小明/小红…,
 * Tom/Amy…) rather than translated, so each version reads natively.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/logic-pattern.json:
 *   K1→K2  question_form (same-word→opposite-word)
 *   K2→G1  premise_count (one→two), question_form (→extreme), option_count
 *   G1→G2  premise_count (two→three), question_form (→rank), premise_order, option_count
 */

var LP_DATA = {

  people: [
    { e: '👦', zh: '小明', en: 'Tom' },
    { e: '👧', zh: '小红', en: 'Amy' },
    { e: '🧒', zh: '小华', en: 'Ben' },
    { e: '👱', zh: '小丽', en: 'Lily' },
    { e: '🧑', zh: '小刚', en: 'Sam' },
    { e: '👩', zh: '小芳', en: 'Mia' }
  ],

  relations: {
    tall: {
      premZh: '{a}比{b}高', premEn: '{a} is taller than {b}',
      orderZh: '从高到矮', orderEn: 'From tallest to shortest',
      pos: { cmpZh: '谁更高？', cmpEn: 'Who is taller?',
             supZh: '谁最高？', supEn: 'Who is the tallest?',
             rankZh: '谁第{n}高？', rankEn: 'Who is the {n} tallest?' },
      neg: { cmpZh: '谁更矮？', cmpEn: 'Who is shorter?',
             supZh: '谁最矮？', supEn: 'Who is the shortest?',
             rankZh: '谁第{n}矮？', rankEn: 'Who is the {n} shortest?' }
    },
    fast: {
      premZh: '{a}比{b}跑得快', premEn: '{a} runs faster than {b}',
      orderZh: '从快到慢', orderEn: 'From fastest to slowest',
      pos: { cmpZh: '谁跑得更快？', cmpEn: 'Who is faster?',
             supZh: '谁跑得最快？', supEn: 'Who is the fastest?',
             rankZh: '谁跑得第{n}快？', rankEn: 'Who is the {n} fastest?' },
      neg: { cmpZh: '谁跑得更慢？', cmpEn: 'Who is slower?',
             supZh: '谁跑得最慢？', supEn: 'Who is the slowest?',
             rankZh: '谁跑得第{n}慢？', rankEn: 'Who is the {n} slowest?' }
    },
    old: {
      premZh: '{a}比{b}年纪大', premEn: '{a} is older than {b}',
      orderZh: '从大到小', orderEn: 'From oldest to youngest',
      pos: { cmpZh: '谁年纪更大？', cmpEn: 'Who is older?',
             supZh: '谁年纪最大？', supEn: 'Who is the oldest?',
             rankZh: '年纪第{n}大的是谁？', rankEn: 'Who is the {n} oldest?' },
      neg: { cmpZh: '谁年纪更小？', cmpEn: 'Who is younger?',
             supZh: '谁年纪最小？', supEn: 'Who is the youngest?',
             rankZh: '年纪第{n}小的是谁？', rankEn: 'Who is the {n} youngest?' }
    }
  },

  ordinals: { 2: { zh: '二', en: 'second' }, 3: { zh: '三', en: 'third' } },

  gradeConfig: {
    K1: { people: 2, form: 'same-word',     order: 'chained' },
    K2: { people: 2, form: 'opposite-word', order: 'chained' },
    G1: { people: 3, form: 'extreme',       order: 'chained' },
    G2: { people: 4, form: 'rank',          order: 'shuffled' }
  },

  units: {
    K1: {
      icon: '🔍',
      nameZh: 'K1 · 谁更…', nameEn: 'K1 · Who Is More?',
      descZh: '一条线索，两个小朋友比一比。',
      descEn: 'One clue, two children to compare.'
    },
    K2: {
      icon: '🔄',
      nameZh: 'K2 · 反过来问', nameEn: 'K2 · Ask It Backwards',
      descZh: '线索说谁更高，问的却是谁更矮。',
      descEn: 'The clue says who is taller, but the question asks who is shorter.'
    },
    G1: {
      icon: '🔗',
      nameZh: 'G1 · 两条线索', nameEn: 'G1 · Two Clues',
      descZh: '把两条线索连起来，找出最…的那个。',
      descEn: 'Link two clues together and find the most or least.'
    },
    G2: {
      icon: '🧠',
      nameZh: 'G2 · 排排队', nameEn: 'G2 · Line Them Up',
      descZh: '三条打乱的线索，排出第二、第三名。',
      descEn: 'Three shuffled clues — work out who is second or third.'
    }
  }
};
