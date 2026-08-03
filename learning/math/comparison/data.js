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

var LEVELS = [
  {
    id: 'L1',
    nameZh: 'L1 · 10以内的数',
    nameEn: 'L1 · Numbers within 10',
    refZh: '参考背景：一年级上学期',
    refEn: 'Ref: Grade 1 Sem 1',
    rounds: 4,
    mode: 'dots',   // show dot arrays + numeral
    min: 1, max: 9,
    minGap: 1,      // minimum difference to avoid near-equal ambiguity
    minLen: 2,
    maxLen: 10,
    minGapLen: 4,
    minVisualGapPct: 35,
    lengthStageZh: '基础长短比较（差异明显）',
    lengthStageEn: 'Basic length comparison (clear gap)'
  },
  {
    id: 'L2',
    nameZh: 'L2 · 20以内的数',
    nameEn: 'L2 · Numbers within 20',
    refZh: '参考背景：一年级下学期',
    refEn: 'Ref: Grade 1 Sem 2',
    rounds: 4,
    mode: 'number',
    min: 1, max: 20,
    minGap: 1,
    minLen: 6,
    maxLen: 22,
    minGapLen: 7,
    minVisualGapPct: 35,
    lengthStageZh: '进阶长短比较（范围更大）',
    lengthStageEn: 'Advanced length comparison (wider range)'
  },
  {
    id: 'L3',
    nameZh: 'L3 · 100以内的数',
    nameEn: 'L3 · Numbers within 100',
    refZh: '参考背景：二年级',
    refEn: 'Ref: Grade 2',
    rounds: 4,
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
  var a, b;
  var attempts = 0;
  do {
    a = randInt(level.min, level.max);
    b = randInt(level.min, level.max);
    attempts++;
  } while (Math.abs(a - b) < level.minGap && attempts < 100);

  var askBigger = Math.random() < 0.5;
  // correctSide: which button (left=a, right=b) holds the correct answer
  var aIsCorrect = askBigger ? (a > b) : (a < b);
  return {
    a: a,
    b: b,
    askBigger: askBigger,
    correctSide: aIsCorrect ? 'left' : 'right',
    mode: level.mode,
  };
}

/**
 * Spatial-visual variant: compare bar lengths directly.
 * Returns { a, b, askBigger, correctSide, mode: 'length' }
 */
function makeLengthQuestion(level) {
  var a, b;
  var attempts = 0;
  var minLen = typeof level.minLen === 'number' ? level.minLen : 3;
  var maxLen = typeof level.maxLen === 'number' ? level.maxLen : 12;
  var defaultGap = level && level.id === 'L1' ? 4 : 5;
  var minGap = typeof level.minGapLen === 'number' ? level.minGapLen : defaultGap;
  var minVisualGapPct = typeof level.minVisualGapPct === 'number' ? level.minVisualGapPct : 30;

  function toVisualPercent(v) {
    if (maxLen <= minLen) return 50;
    var ratio = (v - minLen) / (maxLen - minLen);
    return 28 + ratio * 68;
  }

  do {
    a = randInt(minLen, maxLen);
    b = randInt(minLen, maxLen);
    attempts++;
  } while ((Math.abs(a - b) < minGap || Math.abs(toVisualPercent(a) - toVisualPercent(b)) <= minVisualGapPct) && attempts < 200);

  var askBigger = Math.random() < 0.5;
  var aIsCorrect = askBigger ? (a > b) : (a < b);

  return {
    a: a,
    b: b,
    askBigger: askBigger,
    correctSide: aIsCorrect ? 'left' : 'right',
    lenMin: minLen,
    lenMax: maxLen,
    lengthStageZh: level.lengthStageZh || '',
    lengthStageEn: level.lengthStageEn || '',
    mode: 'length',
  };
}
