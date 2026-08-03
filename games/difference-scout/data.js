'use strict';

var DS_DATA = {
  units: [
    {
      id: 'L1',
      icon: '1️⃣',
      nameZh: 'L1 · 基础找不同',
      nameEn: 'L1 · Basic Difference',
      descZh: '4 格对比，差异明显，先建立比较节奏。',
      descEn: '4-slot comparison with clear mismatch for rhythm building.',
      questions: [
        {
          left: ['🍎', '🍋', '🍇', '🍓'],
          right: ['🍎', '🍋', '🍒', '🍓'],
          answer: 3,
          options: [1, 2, 3, 4],
          hintZh: '从左到右一格一格比对，先找最不一样的一格。',
          hintEn: 'Compare slot by slot from left to right and find the strongest mismatch first.'
        },
        {
          left: ['🐶', '🐱', '🐰', '🐼'],
          right: ['🐶', '🐱', '🐻', '🐼'],
          answer: 3,
          options: [1, 2, 3, 4],
          hintZh: '先看动物耳朵和脸型。',
          hintEn: 'Check ear shapes and face outlines first.'
        },
        {
          left: ['🔺', '🔵', '🟩', '⭐'],
          right: ['🔺', '🟣', '🟩', '⭐'],
          answer: 2,
          options: [1, 2, 3, 4],
          hintZh: '先看颜色，再看形状。',
          hintEn: 'Check color first, then shape.'
        },
        {
          left: ['🚗', '🚕', '🚌', '🚙'],
          right: ['🚗', '🚕', '🚓', '🚙'],
          answer: 3,
          options: [1, 2, 3, 4],
          hintZh: '从中间两格开始对比。',
          hintEn: 'Start comparing from the middle slots.'
        }
      ]
    },
    {
      id: 'L2',
      icon: '2️⃣',
      nameZh: 'L2 · 进阶找不同',
      nameEn: 'L2 · Advanced Difference',
      descZh: '6 格对比，干扰项更多，训练稳定注意力。',
      descEn: '6-slot comparison with more distractors for steady attention.',
      questions: [
        {
          left: ['🍎', '🍐', '🍊', '🍇', '🍉', '🍓'],
          right: ['🍎', '🍐', '🍋', '🍇', '🍉', '🍓'],
          answer: 3,
          options: [2, 3, 5, 6],
          hintZh: '同类水果里找颜色最突出的变化。',
          hintEn: 'Within similar fruits, find the strongest color contrast.'
        },
        {
          left: ['⬛', '⬜', '🟥', '🟦', '🟩', '🟨'],
          right: ['⬛', '⬜', '🟥', '🟦', '🟪', '🟨'],
          answer: 5,
          options: [3, 4, 5, 6],
          hintZh: '先锁定后半段，再看色块变化。',
          hintEn: 'Lock onto the second half first, then inspect color changes.'
        },
        {
          left: ['🐟', '🐠', '🦀', '🐙', '🐡', '🦐'],
          right: ['🐟', '🐠', '🦀', '🦑', '🐡', '🦐'],
          answer: 4,
          options: [1, 2, 4, 6],
          hintZh: '看触手形状，章鱼和乌贼最容易混淆。',
          hintEn: 'Check tentacle shapes; octopus and squid are easy to confuse.'
        },
        {
          left: ['📕', '📗', '📘', '📙', '📒', '📓'],
          right: ['📕', '📗', '📘', '📙', '📔', '📓'],
          answer: 5,
          options: [2, 4, 5, 6],
          hintZh: '先看封面颜色，再看本子形状。',
          hintEn: 'Check cover color first, then notebook shape.'
        }
      ]
    }
  ]
};
