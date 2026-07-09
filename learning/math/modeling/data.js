/**
 * Math Modeling — Game Data  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Modeling 建模
 *
 * RootGene: Multi-dimensional Thinking, Hypothesis
 * Meta-thinking operations:
 *   - See an equation as a BALANCE (both sides equal)
 *   - Hypothesize what □ must be to maintain equality
 *   - Reason from context to build and solve the model
 *
 * Knowledge background ref (design only):
 *   Units 1-3 → G1    (加减法填空，within 20)
 *   Units 4-5 → G1-G2 (天平平衡 / 乘法缺数)
 *   Unit  6   → G2    (情境建模，mixed with real-world hints)
 *
 * Each question uses `display` (equation string with □)
 * instead of `seq` — renderSequence replaces □ with the
 * mystery token and leaves the rest of the expression intact.
 */

var MM_DATA = {
  units: [
    // ── Unit 1: 加法填空  A + □ = B  (within 10, G1) ──────────────────────
    {
      id: '1', icon: '➕',
      nameZh: '加法填空', nameEn: 'Addition: Find □',
      descZh: '已知一个加数和总数，找出另一个加数', descEn: 'Given one addend and the sum, find the missing addend',
      questions: [
        { display:'3 + □ = 7',  answer:4, options:[2,4,5,3], hintZh:'3 加几等于 7？',  hintEn:'3 + what = 7?' },
        { display:'2 + □ = 8',  answer:6, options:[5,6,7,4], hintZh:'2 加几等于 8？',  hintEn:'2 + what = 8?' },
        { display:'5 + □ = 9',  answer:4, options:[3,4,5,6], hintZh:'5 加几等于 9？',  hintEn:'5 + what = 9?' },
        { display:'1 + □ = 6',  answer:5, options:[4,5,6,3], hintZh:'1 加几等于 6？',  hintEn:'1 + what = 6?' },
        { display:'4 + □ = 10', answer:6, options:[5,6,7,4], hintZh:'4 加几等于 10？', hintEn:'4 + what = 10?' },
        { display:'6 + □ = 10', answer:4, options:[3,4,5,6], hintZh:'6 加几等于 10？', hintEn:'6 + what = 10?' },
        { display:'3 + □ = 8',  answer:5, options:[4,5,6,3], hintZh:'3 加几等于 8？',  hintEn:'3 + what = 8?' },
        { display:'2 + □ = 5',  answer:3, options:[2,3,4,1], hintZh:'2 加几等于 5？',  hintEn:'2 + what = 5?' },
        { display:'4 + □ = 7',  answer:3, options:[2,3,4,5], hintZh:'4 加几等于 7？',  hintEn:'4 + what = 7?' },
        { display:'5 + □ = 8',  answer:3, options:[2,3,4,5], hintZh:'5 加几等于 8？',  hintEn:'5 + what = 8?' }
      ]
    },

    // ── Unit 2: 加法填空  □ + A = B  (within 15, G1) ──────────────────────
    {
      id: '2', icon: '🔲',
      nameZh: '未知加数', nameEn: 'Unknown Addend',
      descZh: '方块在左边——同样是等量关系，换了角度看', descEn: 'Box on the left — same equal relationship, different viewpoint',
      questions: [
        { display:'□ + 3 = 9',  answer:6, options:[5,6,7,4], hintZh:'几加 3 等于 9？',  hintEn:'what + 3 = 9?' },
        { display:'□ + 4 = 10', answer:6, options:[5,6,7,4], hintZh:'几加 4 等于 10？', hintEn:'what + 4 = 10?' },
        { display:'□ + 5 = 12', answer:7, options:[6,7,8,5], hintZh:'几加 5 等于 12？', hintEn:'what + 5 = 12?' },
        { display:'□ + 6 = 11', answer:5, options:[4,5,6,7], hintZh:'几加 6 等于 11？', hintEn:'what + 6 = 11?' },
        { display:'□ + 7 = 15', answer:8, options:[7,8,9,6], hintZh:'几加 7 等于 15？', hintEn:'what + 7 = 15?' },
        { display:'□ + 2 = 9',  answer:7, options:[6,7,8,5], hintZh:'几加 2 等于 9？',  hintEn:'what + 2 = 9?' },
        { display:'□ + 8 = 13', answer:5, options:[4,5,6,7], hintZh:'几加 8 等于 13？', hintEn:'what + 8 = 13?' },
        { display:'□ + 3 = 11', answer:8, options:[7,8,9,6], hintZh:'几加 3 等于 11？', hintEn:'what + 3 = 11?' },
        { display:'□ + 6 = 14', answer:8, options:[7,8,9,6], hintZh:'几加 6 等于 14？', hintEn:'what + 6 = 14?' },
        { display:'□ + 4 = 12', answer:8, options:[7,8,9,6], hintZh:'几加 4 等于 12？', hintEn:'what + 4 = 12?' }
      ]
    },

    // ── Unit 3: 减法缺数  A − □ = B  (within 20, G1-G2) ──────────────────
    {
      id: '3', icon: '➖',
      nameZh: '减法填空', nameEn: 'Subtraction: Find □',
      descZh: '减去几得到结果？逆向思考建模', descEn: 'Subtract what to reach the result? Reverse-think to model',
      questions: [
        { display:'9 − □ = 4',  answer:5, options:[4,5,6,3], hintZh:'9 减几等于 4？',  hintEn:'9 − what = 4?' },
        { display:'10 − □ = 3', answer:7, options:[6,7,8,5], hintZh:'10 减几等于 3？', hintEn:'10 − what = 3?' },
        { display:'15 − □ = 8', answer:7, options:[6,7,8,9], hintZh:'15 减几等于 8？', hintEn:'15 − what = 8?' },
        { display:'12 − □ = 5', answer:7, options:[6,7,8,5], hintZh:'12 减几等于 5？', hintEn:'12 − what = 5?' },
        { display:'18 − □ = 9', answer:9, options:[8,9,10,7],hintZh:'18 减几等于 9？', hintEn:'18 − what = 9?' },
        { display:'7 − □ = 2',  answer:5, options:[4,5,6,3], hintZh:'7 减几等于 2？',  hintEn:'7 − what = 2?' },
        { display:'14 − □ = 6', answer:8, options:[7,8,9,6], hintZh:'14 减几等于 6？', hintEn:'14 − what = 6?' },
        { display:'20 − □ = 12',answer:8, options:[7,8,9,6], hintZh:'20 减几等于 12？',hintEn:'20 − what = 12?' },
        { display:'11 − □ = 4', answer:7, options:[6,7,8,5], hintZh:'11 减几等于 4？', hintEn:'11 − what = 4?' },
        { display:'16 − □ = 7', answer:9, options:[8,9,10,7],hintZh:'16 减几等于 7？', hintEn:'16 − what = 7?' }
      ]
    },

    // ── Unit 4: 天平平衡  ⚖️ A + □ = B + C  (G1-G2) ──────────────────────
    {
      id: '4', icon: '⚖️',
      nameZh: '天平平衡', nameEn: 'Balance Scale',
      descZh: '天平两边必须一样重——先算右边，再求方块', descEn: 'Both pans must balance — compute the right side, then find □',
      questions: [
        { display:'⚖️  5 + □ = 4 + 3',  answer:2, options:[1,2,3,4], hintZh:'右边 4+3=7，5+□=7，□=？', hintEn:'Right side 4+3=7; 5+□=7' },
        { display:'⚖️  3 + □ = 5 + 4',  answer:6, options:[5,6,7,4], hintZh:'右边 5+4=9，3+□=9，□=？', hintEn:'Right side 5+4=9; 3+□=9' },
        { display:'⚖️  6 + □ = 5 + 5',  answer:4, options:[3,4,5,6], hintZh:'右边 5+5=10，6+□=10，□=？',hintEn:'Right side 5+5=10; 6+□=10' },
        { display:'⚖️  4 + □ = 3 + 8',  answer:7, options:[6,7,8,5], hintZh:'右边 3+8=11，4+□=11，□=？',hintEn:'Right side 3+8=11; 4+□=11' },
        { display:'⚖️  7 + □ = 4 + 5',  answer:2, options:[1,2,3,4], hintZh:'右边 4+5=9，7+□=9，□=？', hintEn:'Right side 4+5=9; 7+□=9' },
        { display:'⚖️  2 + □ = 6 + 4',  answer:8, options:[7,8,9,6], hintZh:'右边 6+4=10，2+□=10，□=？',hintEn:'Right side 6+4=10; 2+□=10' },
        { display:'⚖️  8 + □ = 6 + 5',  answer:3, options:[2,3,4,5], hintZh:'右边 6+5=11，8+□=11，□=？',hintEn:'Right side 6+5=11; 8+□=11' },
        { display:'⚖️  5 + □ = 3 + 9',  answer:7, options:[6,7,8,5], hintZh:'右边 3+9=12，5+□=12，□=？',hintEn:'Right side 3+9=12; 5+□=12' },
        { display:'⚖️  9 + □ = 6 + 7',  answer:4, options:[3,4,5,6], hintZh:'右边 6+7=13，9+□=13，□=？',hintEn:'Right side 6+7=13; 9+□=13' },
        { display:'⚖️  3 + □ = 4 + 7',  answer:8, options:[7,8,9,6], hintZh:'右边 4+7=11，3+□=11，□=？',hintEn:'Right side 4+7=11; 3+□=11' }
      ]
    },

    // ── Unit 5: 乘法缺数  □ × A = B  (G2) ────────────────────────────────
    {
      id: '5', icon: '✖️',
      nameZh: '乘法缺数', nameEn: 'Multiplication: Find □',
      descZh: '每组有几个？用等量关系建立乘法模型', descEn: 'How many in each group? Build a multiplication model',
      questions: [
        { display:'□ × 2 = 8',  answer:4, options:[3,4,5,2], hintZh:'几个 2 等于 8？', hintEn:'how many 2s = 8?' },
        { display:'□ × 3 = 9',  answer:3, options:[2,3,4,5], hintZh:'几个 3 等于 9？', hintEn:'how many 3s = 9?' },
        { display:'□ × 4 = 12', answer:3, options:[2,3,4,5], hintZh:'几个 4 等于 12？',hintEn:'how many 4s = 12?' },
        { display:'□ × 5 = 20', answer:4, options:[3,4,5,2], hintZh:'几个 5 等于 20？',hintEn:'how many 5s = 20?' },
        { display:'□ × 2 = 10', answer:5, options:[4,5,6,3], hintZh:'几个 2 等于 10？',hintEn:'how many 2s = 10?' },
        { display:'□ × 3 = 12', answer:4, options:[3,4,5,2], hintZh:'几个 3 等于 12？',hintEn:'how many 3s = 12?' },
        { display:'□ × 5 = 15', answer:3, options:[2,3,4,5], hintZh:'几个 5 等于 15？',hintEn:'how many 5s = 15?' },
        { display:'□ × 2 = 14', answer:7, options:[6,7,8,5], hintZh:'几个 2 等于 14？',hintEn:'how many 2s = 14?' },
        { display:'□ × 4 = 16', answer:4, options:[3,4,5,6], hintZh:'几个 4 等于 16？',hintEn:'how many 4s = 16?' },
        { display:'□ × 3 = 15', answer:5, options:[4,5,6,3], hintZh:'几个 3 等于 15？',hintEn:'how many 3s = 15?' }
      ]
    },

    // ── Unit 6: 情境建模  (G2, real-world context — generalization) ────────
    {
      id: '6', icon: '🌍',
      nameZh: '情境建模', nameEn: 'Real-world Modeling',
      descZh: '把生活问题转化为等量关系——元思维：建模与迁移', descEn: 'Turn real problems into equal relationships — meta-op: model & transfer',
      questions: [
        { display:'4 + □ = 10', answer:6, options:[5,6,7,4],
          hintZh:'篮子里有4个苹果，还需要□个才有10个', hintEn:'4 apples in a basket — need □ more to reach 10' },
        { display:'□ + 7 = 12', answer:5, options:[4,5,6,3],
          hintZh:'12颗球，7颗红色，□颗蓝色', hintEn:'12 balls total, 7 red — □ are blue' },
        { display:'15 − □ = 9', answer:6, options:[5,6,7,4],
          hintZh:'15本书，拿走□本还剩9本', hintEn:'15 books — take away □ to have 9 left' },
        { display:'□ × 4 = 20', answer:5, options:[4,5,6,3],
          hintZh:'4排座位，每排□人，共20人', hintEn:'4 rows of seats, □ per row, 20 total' },
        { display:'⚖️  8 + □ = 6 + 5',  answer:3, options:[2,3,4,5],
          hintZh:'天平左边 8+□，右边 6+5，两边要一样重', hintEn:'Scale: left 8+□, right 6+5 — must balance' },
        { display:'3 + □ = 8',  answer:5, options:[4,5,6,3],
          hintZh:'妈妈买了3个橙子和□个苹果，一共8个', hintEn:'3 oranges and □ apples — 8 fruit total' },
        { display:'□ + 6 = 14', answer:8, options:[7,8,9,6],
          hintZh:'花园里14朵花，6朵红色，□朵黄色', hintEn:'14 flowers, 6 red — □ are yellow' },
        { display:'20 − □ = 13',answer:7, options:[6,7,8,5],
          hintZh:'20颗糖果分了□颗，还剩13颗', hintEn:'20 candies — gave away □, 13 remain' },
        { display:'□ × 3 = 18', answer:6, options:[5,6,7,4],
          hintZh:'3个袋子，每袋□颗糖，共18颗', hintEn:'3 bags, □ candies each, 18 total' },
        { display:'⚖️  6 + □ = 4 + 9',  answer:7, options:[6,7,8,5],
          hintZh:'天平左边 6+□，右边 4+9，□等于几？', hintEn:'Scale: left 6+□, right 4+9 — find □' }
      ]
    }
  ]
};
