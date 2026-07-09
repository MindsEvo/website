/**
 * Math Pattern — Game Data  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Pattern 规律
 *
 * RootGene: Prediction, Generalization
 * Knowledge background ref (design only):
 *   Units 1-3 → G1    (10/20以内跳数)
 *   Units 4-5 → G1-G2 (递减 / 倍增)
 *   Unit  6   → G2    (情境应用 · 归纳迁移)
 *
 * Difficulty curve: math concept complexity (NOT visual complexity).
 * Engine shared with Sprite Pattern Hunter; stats recorded independently.
 */

var MP_DATA = {
  units: [
    // ── Unit 1: 数数规律  (count by 1, within 20) ──────────────────────────
    {
      id: '1', icon: '1️⃣',
      nameZh: '数数规律', nameEn: 'Count-up Pattern',
      descZh: '每次加 1，找出序列里缺少的数', descEn: 'Add 1 each time — find the missing number',
      questions: [
        { seq:[3,4,5,'?',7],     answer:6,  options:[5,6,7,8],       hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[8,9,'?',11,12],   answer:10, options:[9,10,11,12],    hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[11,12,13,'?',15], answer:14, options:[12,13,14,15],   hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[6,'?',8,9,10],    answer:7,  options:[5,6,7,8],       hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[14,15,'?',17,18], answer:16, options:[14,15,16,17],   hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:['?',2,3,4,5],     answer:1,  options:[1,2,3,4],       hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[16,17,18,'?',20], answer:19, options:[17,18,19,20],   hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[5,6,'?',8,9],     answer:7,  options:[5,6,7,8],       hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[9,10,11,12,'?'],  answer:13, options:[11,12,13,14],   hintZh:'每次加 1', hintEn:'Add 1 each time' },
        { seq:[13,'?',15,16,17], answer:14, options:[12,13,14,15],   hintZh:'每次加 1', hintEn:'Add 1 each time' }
      ]
    },

    // ── Unit 2: 跳数规律  (+2, +3, within 30) ─────────────────────────────
    {
      id: '2', icon: '2️⃣',
      nameZh: '跳数规律', nameEn: 'Skip-count Pattern',
      descZh: '每次加 2 或 3，发现规律再预测', descEn: 'Add 2 or 3 — spot the pattern then predict',
      questions: [
        { seq:[2,4,6,'?',10],    answer:8,  options:[7,8,9,10],     hintZh:'每次加 2', hintEn:'Skip-count by 2' },
        { seq:[1,3,5,'?',9],     answer:7,  options:[6,7,8,9],      hintZh:'每次加 2', hintEn:'Skip-count by 2' },
        { seq:[3,6,9,'?',15],    answer:12, options:[10,11,12,13],  hintZh:'每次加 3', hintEn:'Skip-count by 3' },
        { seq:[4,6,8,'?',12],    answer:10, options:[9,10,11,12],   hintZh:'每次加 2', hintEn:'Skip-count by 2' },
        { seq:['?',6,9,12,15],   answer:3,  options:[2,3,4,5],      hintZh:'每次加 3', hintEn:'Skip-count by 3' },
        { seq:[10,12,14,'?',18], answer:16, options:[15,16,17,18],  hintZh:'每次加 2', hintEn:'Skip-count by 2' },
        { seq:[6,9,12,'?',18],   answer:15, options:[13,14,15,16],  hintZh:'每次加 3', hintEn:'Skip-count by 3' },
        { seq:[0,2,4,'?',8],     answer:6,  options:[5,6,7,8],      hintZh:'每次加 2', hintEn:'Skip-count by 2' },
        { seq:[15,18,21,'?'],    answer:24, options:[22,23,24,25],  hintZh:'每次加 3', hintEn:'Skip-count by 3' },
        { seq:[12,14,16,'?',20], answer:18, options:[16,17,18,19],  hintZh:'每次加 2', hintEn:'Skip-count by 2' }
      ]
    },

    // ── Unit 3: 五和十  (+5, +10) ──────────────────────────────────────────
    {
      id: '3', icon: '5️⃣',
      nameZh: '五和十的规律', nameEn: 'Fives & Tens Pattern',
      descZh: '每次加 5 或 10，是乘法表的早期基础', descEn: 'Add 5 or 10 — the early foundation of times tables',
      questions: [
        { seq:[5,10,15,'?',25],   answer:20, options:[18,19,20,21],  hintZh:'每次加 5',  hintEn:'Count by 5' },
        { seq:[10,20,30,'?',50],  answer:40, options:[35,40,45,50],  hintZh:'每次加 10', hintEn:'Count by 10' },
        { seq:['?',15,20,25,30],  answer:10, options:[8,9,10,11],    hintZh:'每次加 5',  hintEn:'Count by 5' },
        { seq:[20,30,40,'?',60],  answer:50, options:[45,50,55,60],  hintZh:'每次加 10', hintEn:'Count by 10' },
        { seq:[25,30,35,'?',45],  answer:40, options:[38,39,40,41],  hintZh:'每次加 5',  hintEn:'Count by 5' },
        { seq:[50,60,70,'?',90],  answer:80, options:[75,78,80,82],  hintZh:'每次加 10', hintEn:'Count by 10' },
        { seq:[5,10,'?',20,25],   answer:15, options:[13,14,15,16],  hintZh:'每次加 5',  hintEn:'Count by 5' },
        { seq:[40,50,60,'?'],     answer:70, options:[65,68,70,72],  hintZh:'每次加 10', hintEn:'Count by 10' },
        { seq:[0,5,10,'?',20],    answer:15, options:[13,14,15,16],  hintZh:'每次加 5',  hintEn:'Count by 5' },
        { seq:[30,40,'?',60,70],  answer:50, options:[45,48,50,52],  hintZh:'每次加 10', hintEn:'Count by 10' }
      ]
    },

    // ── Unit 4: 递减规律  (descending sequences) ──────────────────────────
    {
      id: '4', icon: '📉',
      nameZh: '递减规律', nameEn: 'Count-down Pattern',
      descZh: '每次减同样的数——递减也是一种规律', descEn: 'Subtract the same number — descending is a pattern too',
      questions: [
        { seq:[10,8,6,'?',2],    answer:4,  options:[3,4,5,6],      hintZh:'每次减 2',  hintEn:'Subtract 2' },
        { seq:[20,15,10,'?',0],  answer:5,  options:[3,4,5,6],      hintZh:'每次减 5',  hintEn:'Subtract 5' },
        { seq:[15,12,9,'?',3],   answer:6,  options:[5,6,7,8],      hintZh:'每次减 3',  hintEn:'Subtract 3' },
        { seq:[50,40,30,'?',10], answer:20, options:[15,18,20,22],  hintZh:'每次减 10', hintEn:'Subtract 10' },
        { seq:[12,10,8,'?',4],   answer:6,  options:[5,6,7,8],      hintZh:'每次减 2',  hintEn:'Subtract 2' },
        { seq:[18,15,12,'?',6],  answer:9,  options:[7,8,9,10],     hintZh:'每次减 3',  hintEn:'Subtract 3' },
        { seq:[30,25,20,'?',10], answer:15, options:[13,14,15,16],  hintZh:'每次减 5',  hintEn:'Subtract 5' },
        { seq:[20,18,16,'?',12], answer:14, options:[12,13,14,15],  hintZh:'每次减 2',  hintEn:'Subtract 2' },
        { seq:['?',16,12,8,4],   answer:20, options:[18,19,20,21],  hintZh:'每次减 4',  hintEn:'Subtract 4' },
        { seq:[25,20,15,'?',5],  answer:10, options:[8,9,10,11],    hintZh:'每次减 5',  hintEn:'Subtract 5' }
      ]
    },

    // ── Unit 5: 倍增规律  (×2, ×3) ────────────────────────────────────────
    {
      id: '5', icon: '✖️',
      nameZh: '倍增规律', nameEn: 'Doubling Pattern',
      descZh: '每次乘 2 或 3——数字增长越来越快', descEn: 'Multiply by 2 or 3 — numbers grow faster and faster',
      questions: [
        { seq:[2,4,8,'?',32],     answer:16,  options:[12,14,16,18],   hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[1,3,9,'?',81],     answer:27,  options:[18,24,27,30],   hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:[3,6,12,'?',48],    answer:24,  options:[18,20,24,28],   hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[1,2,4,8,'?'],      answer:16,  options:[12,14,16,18],   hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[2,6,18,'?'],       answer:54,  options:[36,48,54,60],   hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:['?',4,8,16,32],    answer:2,   options:[1,2,3,4],       hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[5,10,20,'?',80],   answer:40,  options:[30,35,40,45],   hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[1,3,9,27,'?'],     answer:81,  options:[54,63,72,81],   hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:[4,8,16,'?',64],    answer:32,  options:[24,28,32,36],   hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[2,4,8,16,'?'],     answer:32,  options:[24,28,32,36],   hintZh:'每次乘 2', hintEn:'Multiply by 2' }
      ]
    },

    // ── Unit 6: 情境应用  (Generalization — real-world context) ───────────
    {
      id: '6', icon: '🌍',
      nameZh: '情境应用', nameEn: 'Real-world Patterns',
      descZh: '在生活情境中识别规律，训练归纳迁移能力', descEn: 'Spot patterns in real contexts — train generalization',
      questions: [
        { seq:[2,4,6,'?',10],    answer:8,  options:[7,8,9,10],
          hintZh:'小明每天多读 2 页，第4天读第几页？',           hintEn:'2 more pages each day — which page on day 4?' },
        { seq:[7,14,21,'?',35],  answer:28, options:[25,27,28,30],
          hintZh:'一周 7 天，4 周共有几天？',                   hintEn:'7 days per week — how many days in 4 weeks?' },
        { seq:[5,10,15,'?',25],  answer:20, options:[18,19,20,21],
          hintZh:'每节课休息 5 分钟，4 节课共休息多少分钟？',   hintEn:'5-minute break per class — total after 4 classes?' },
        { seq:[10,20,30,'?',50], answer:40, options:[35,38,40,42],
          hintZh:'存钱罐每月存 10 元，4 个月存了多少？',        hintEn:'Save ¥10/month — how much after 4 months?' },
        { seq:[3,6,9,'?',15],    answer:12, options:[10,11,12,13],
          hintZh:'三角形有 3 条边，4 个三角形共有几条边？',     hintEn:'Triangle has 3 sides — how many sides for 4 triangles?' },
        { seq:[6,9,12,'?',18],   answer:15, options:[13,14,15,16],
          hintZh:'公共汽车每 3 小时一班，第4班几点出发？',      hintEn:'Bus every 3 hours — when does the 4th bus depart?' },
        { seq:[24,22,20,'?',16], answer:18, options:[17,18,19,20],
          hintZh:'气温每天降 2 度，第4天是几度？',              hintEn:'Temperature drops 2° per day — what on day 4?' },
        { seq:[2,4,8,'?',32],    answer:16, options:[12,14,16,18],
          hintZh:'折纸每折一次层数翻倍，折4次后有几层？',       hintEn:'Paper layers double per fold — how many after 4 folds?' },
        { seq:[100,90,80,'?',60],answer:70, options:[65,68,70,72],
          hintZh:'每次花 10 元，用了 3 次后还剩多少？',         hintEn:'Spend ¥10 each time — how much left after 3 times?' },
        { seq:[1,2,4,'?',16],    answer:8,  options:[6,7,8,9],
          hintZh:'细菌每小时繁殖成两倍，第4小时有多少？',       hintEn:'Bacteria double each hour — how many at hour 4?' }
      ]
    }
  ]
};
