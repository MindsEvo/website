'use strict';
/**
 * Comparison Module — Math Thinking — Learning Foundation
 *
 * RootGene tags: Comparison
 * Meta-thinking operation: Execute a comparison judgment (greater / less than)
 * Knowledge background ref (design only, not curriculum coverage):
 *   L1 → G1 Sem1 (10以内的数)
 *   L2 → G1 Sem2 (20以内的数)
 *   L3 → G2     (100以内的数)
 */

const LEVELS = [
  {
    id: 'L1',
    nameZh: 'L1 · 10以内的数',
    nameEn: 'L1 · Numbers within 10',
    refZh: '参考背景：一年级上学期',
    refEn: 'Ref: Grade 1 Sem 1',
    rounds: 8,
    mode: 'dots',   // show dot arrays + numeral
    min: 1, max: 9,
    minGap: 1,      // minimum difference to avoid near-equal ambiguity
  },
  {
    id: 'L2',
    nameZh: 'L2 · 20以内的数',
    nameEn: 'L2 · Numbers within 20',
    refZh: '参考背景：一年级下学期',
    refEn: 'Ref: Grade 1 Sem 2',
    rounds: 8,
    mode: 'number',
    min: 1, max: 20,
    minGap: 1,
  },
  {
    id: 'L3',
    nameZh: 'L3 · 100以内的数',
    nameEn: 'L3 · Numbers within 100',
    refZh: '参考背景：二年级',
    refEn: 'Ref: Grade 2',
    rounds: 10,
    mode: 'number',
    min: 10, max: 99,
    minGap: 3,
  },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate one question for the given level.
 * Returns { a, b, askBigger, correctSide, mode }
 */
function makeQuestion(level) {
  let a, b;
  let attempts = 0;
  do {
    a = randInt(level.min, level.max);
    b = randInt(level.min, level.max);
    attempts++;
  } while (Math.abs(a - b) < level.minGap && attempts < 100);

  const askBigger = Math.random() < 0.5;
  // correctSide: which button (left=a, right=b) holds the correct answer
  const aIsCorrect = askBigger ? (a > b) : (a < b);
  return {
    a,
    b,
    askBigger,
    correctSide: aIsCorrect ? 'left' : 'right',
    mode: level.mode,
  };
}
