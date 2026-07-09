'use strict';
/**
 * Number Sense Module — Math Thinking — Learning Foundation
 *
 * RootGene tags: Comparison, Multi-dimensional Thinking
 * Meta-thinking operations:
 *   split     → Decompose: see one number as many compositions  (多维看待同一个数)
 *   proximity → Number line intuition: estimate closeness       (数轴直觉)
 *   complete  → Reverse-solve: find the missing part            (逆向求解)
 *
 * Knowledge background ref (design only, not curriculum coverage):
 *   L1 → G1 Sem1 (10以内)
 *   L2 → G1 Sem2 (20以内)
 *   L3 → G2     (100以内)
 */

const LEVELS = [
  {
    id: 'L1',
    nameZh: 'L1 · 10以内数感',
    nameEn: 'L1 · Number Sense within 10',
    refZh: '参考背景：一年级上学期',
    refEn: 'Ref: Grade 1 Sem 1',
    rounds: 8,
    splitMax: 9,       // target range for split questions
    proxMin: 1, proxMax: 9,
    completeMax: 9,
    types: ['split', 'split', 'proximity'], // 2:1 ratio
  },
  {
    id: 'L2',
    nameZh: 'L2 · 20以内数感',
    nameEn: 'L2 · Number Sense within 20',
    refZh: '参考背景：一年级下学期',
    refEn: 'Ref: Grade 1 Sem 2',
    rounds: 8,
    splitMax: 15,
    proxMin: 1, proxMax: 20,
    completeMax: 15,
    types: ['split', 'proximity', 'complete'],
  },
  {
    id: 'L3',
    nameZh: 'L3 · 100以内数感',
    nameEn: 'L3 · Number Sense within 100',
    refZh: '参考背景：二年级',
    refEn: 'Ref: Grade 2',
    rounds: 10,
    splitMax: 20,
    proxMin: 10, proxMax: 99,
    completeMax: 30,
    types: ['split', 'proximity', 'complete'],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Normalized pair key to avoid "3+4" and "4+3" being treated as different
function normKey(a, b) {
  return `${Math.min(a, b)}+${Math.max(a, b)}`;
}

// ── Question generators ───────────────────────────────────────────────────────

/**
 * Split: given target N, which option sums to N?
 * 4 options: 1 correct pair expression, 3 wrong ones.
 */
function makeSplitQ(level) {
  const target = randInt(4, level.splitMax);
  const a = randInt(1, target - 1);
  const b = target - a;

  const seen = new Set([normKey(a, b)]);
  const distractors = [];
  let attempts = 0;
  while (distractors.length < 3 && attempts < 300) {
    attempts++;
    const wa = randInt(1, level.splitMax);
    const wb = randInt(1, level.splitMax);
    if (wa + wb === target) continue;       // accidentally correct → skip
    const key = normKey(wa, wb);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(`${wa}+${wb}`);
  }

  const correctExpr = `${a}+${b}`;
  return {
    type: 'split',
    target,
    correctExpr,
    options: shuffle([correctExpr, ...distractors]),
  };
}

/**
 * Proximity: which of two numbers is closer to the target?
 */
function makeProximityQ(level) {
  let target, a, b;
  let attempts = 0;
  do {
    target = randInt(level.proxMin + 1, level.proxMax - 1);
    a = randInt(level.proxMin, level.proxMax);
    b = randInt(level.proxMin, level.proxMax);
    attempts++;
  } while (
    attempts < 300 && (
      a === b || a === target || b === target ||
      Math.abs(a - target) === Math.abs(b - target)
    )
  );

  const aCloser = Math.abs(a - target) < Math.abs(b - target);
  return {
    type: 'proximity',
    target,
    a, b,
    correctSide: aCloser ? 'left' : 'right',
  };
}

/**
 * Complete: known + ? = sum  (or  ? + known = sum)
 * 4 number options; pick the missing addend.
 */
function makeCompleteQ(level) {
  const sum = randInt(4, level.completeMax);
  const known = randInt(1, sum - 1);
  const missing = sum - known;

  const wrong = new Set();
  let attempts = 0;
  while (wrong.size < 3 && attempts < 200) {
    attempts++;
    const w = randInt(1, level.completeMax);
    if (w !== missing) wrong.add(w);
  }

  return {
    type: 'complete',
    sum,
    known,
    missing,
    flipped: Math.random() < 0.5,          // "? + known" vs "known + ?"
    options: shuffle([missing, ...[...wrong]]),
  };
}

/**
 * Entry point: generate one question for the given level.
 */
function makeQuestion(level) {
  const types = level.types;
  const type  = types[Math.floor(Math.random() * types.length)];
  if (type === 'split')     return makeSplitQ(level);
  if (type === 'proximity') return makeProximityQ(level);
  if (type === 'complete')  return makeCompleteQ(level);
  return makeSplitQ(level);
}
