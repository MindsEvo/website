/**
 * Number Pattern Hunter — Game Data  v2.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Standard Shell-1 unit/question structure:
 *   unit:     { id, icon, nameZh, nameEn, descZh, descEn, questions[] }
 *   question: { answer, options[], hintZh, hintEn, seq[] }
 */

var NPH_DATA = {
  units: [
    {
      id: '1', icon: '➕',
      nameZh: '加法规律', nameEn: 'Addition Pattern',
      descZh: '每次加同样的数', descEn: 'Add the same number each time',
      questions: [
        { seq:[2,4,6,'?',10],    answer:8,   options:[7,8,9,5],         hintZh:'每次加 2',  hintEn:'Add 2 each time' },
        { seq:[1,3,5,'?',9],     answer:7,   options:[6,7,8,4],         hintZh:'每次加 2',  hintEn:'Add 2 each time' },
        { seq:[5,10,15,'?',25],  answer:20,  options:[18,19,20,22],     hintZh:'每次加 5',  hintEn:'Add 5 each time' },
        { seq:[3,6,9,12,'?'],    answer:15,  options:[13,14,15,16],     hintZh:'每次加 3',  hintEn:'Add 3 each time' },
        { seq:[10,20,30,'?',50], answer:40,  options:[35,40,45,25],     hintZh:'每次加 10', hintEn:'Add 10 each time' },
        { seq:[4,8,12,'?',20],   answer:16,  options:[14,15,16,17],     hintZh:'每次加 4',  hintEn:'Add 4 each time' },
        { seq:[7,14,21,'?',35],  answer:28,  options:[25,27,28,30],     hintZh:'每次加 7',  hintEn:'Add 7 each time' },
        { seq:[6,11,16,'?',26],  answer:21,  options:[20,21,22,23],     hintZh:'每次加 5',  hintEn:'Add 5 each time' },
        { seq:[1,4,7,10,'?'],    answer:13,  options:[11,12,13,14],     hintZh:'每次加 3',  hintEn:'Add 3 each time' },
        { seq:[2,9,16,'?',30],   answer:23,  options:[21,22,23,24],     hintZh:'每次加 7',  hintEn:'Add 7 each time' }
      ]
    },
    {
      id: '2', icon: '➖',
      nameZh: '减法规律', nameEn: 'Subtraction Pattern',
      descZh: '每次减同样的数', descEn: 'Subtract the same number each time',
      questions: [
        { seq:[20,16,12,'?',4],    answer:8,  options:[6,7,8,9],       hintZh:'每次减 4',  hintEn:'Subtract 4 each time' },
        { seq:[50,40,30,'?',10],   answer:20, options:[15,18,20,25],    hintZh:'每次减 10', hintEn:'Subtract 10 each time' },
        { seq:[30,25,20,'?',10],   answer:15, options:[13,14,15,16],    hintZh:'每次减 5',  hintEn:'Subtract 5 each time' },
        { seq:[100,90,80,'?',60],  answer:70, options:[65,70,75,68],    hintZh:'每次减 10', hintEn:'Subtract 10 each time' },
        { seq:[18,15,12,'?',6],    answer:9,  options:[7,8,9,10],       hintZh:'每次减 3',  hintEn:'Subtract 3 each time' },
        { seq:[40,33,26,'?',12],   answer:19, options:[17,18,19,20],    hintZh:'每次减 7',  hintEn:'Subtract 7 each time' },
        { seq:[25,20,15,'?',5],    answer:10, options:[8,9,10,11],      hintZh:'每次减 5',  hintEn:'Subtract 5 each time' },
        { seq:[36,30,24,'?',12],   answer:18, options:[16,17,18,19],    hintZh:'每次减 6',  hintEn:'Subtract 6 each time' },
        { seq:[55,44,33,'?',11],   answer:22, options:[20,21,22,23],    hintZh:'每次减 11', hintEn:'Subtract 11 each time' },
        { seq:[48,40,32,'?',16],   answer:24, options:[22,23,24,25],    hintZh:'每次减 8',  hintEn:'Subtract 8 each time' }
      ]
    },
    {
      id: '3', icon: '✖️',
      nameZh: '乘法规律', nameEn: 'Multiplication Pattern',
      descZh: '每次乘同样的数', descEn: 'Multiply by the same number each time',
      questions: [
        { seq:[2,4,8,'?',32],       answer:16,  options:[12,14,16,18],    hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[1,3,9,'?',81],       answer:27,  options:[18,24,27,30],    hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:[5,10,20,'?',80],     answer:40,  options:[30,35,40,45],    hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[2,6,18,'?',162],     answer:54,  options:[36,48,54,60],    hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:[3,6,12,'?',48],      answer:24,  options:[18,20,24,28],    hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[1,5,25,'?',625],     answer:125, options:[100,110,125,150],hintZh:'每次乘 5', hintEn:'Multiply by 5' },
        { seq:[4,8,16,'?',64],      answer:32,  options:[24,28,32,36],    hintZh:'每次乘 2', hintEn:'Multiply by 2' },
        { seq:[2,10,50,'?',1250],   answer:250, options:[150,200,250,300],hintZh:'每次乘 5', hintEn:'Multiply by 5' },
        { seq:[3,9,27,'?',243],     answer:81,  options:[54,63,81,90],    hintZh:'每次乘 3', hintEn:'Multiply by 3' },
        { seq:[1,4,16,'?',256],     answer:64,  options:[48,56,64,72],    hintZh:'每次乘 4', hintEn:'Multiply by 4' }
      ]
    },
    {
      id: '4', icon: '📈',
      nameZh: '差值规律', nameEn: 'Growing Gaps',
      descZh: '差本身也在变化', descEn: 'The gap itself changes each time',
      questions: [
        { seq:[1,2,4,7,'?'],    answer:11, options:[9,10,11,12],    hintZh:'差是 1,2,3,4… 每次多1',  hintEn:'Gap 1,2,3,4… +1 each time' },
        { seq:[0,1,3,6,'?'],    answer:10, options:[8,9,10,11],     hintZh:'差是 1,2,3,4… 每次多1',  hintEn:'Gap 1,2,3,4… +1 each time' },
        { seq:[2,3,5,8,'?'],    answer:12, options:[10,11,12,13],   hintZh:'差是 1,2,3,4… 每次多1',  hintEn:'Gap 1,2,3,4… +1 each time' },
        { seq:[1,3,7,13,'?'],   answer:21, options:[17,19,21,23],   hintZh:'差是 2,4,6,8… 每次多2',  hintEn:'Gap 2,4,6,8… +2 each time' },
        { seq:[0,2,6,12,'?'],   answer:20, options:[16,18,20,22],   hintZh:'差是 2,4,6,8… 每次多2',  hintEn:'Gap 2,4,6,8… +2 each time' },
        { seq:[1,2,4,8,'?'],    answer:16, options:[12,14,16,18],   hintZh:'差是 1,2,4,8… 每次翻倍', hintEn:'Gap 1,2,4,8… doubles' },
        { seq:[3,4,6,10,'?'],   answer:18, options:[14,16,18,20],   hintZh:'差是 1,2,4,8… 每次翻倍', hintEn:'Gap 1,2,4,8… doubles' },
        { seq:[1,4,9,16,'?'],   answer:25, options:[20,22,25,28],   hintZh:'1²,2²,3²,4²,5²',       hintEn:'1²,2²,3²,4²,5²' },
        { seq:[1,1,2,3,5,'?'],  answer:8,  options:[6,7,8,9],       hintZh:'前两个相加得下一个',     hintEn:'Add previous two numbers' },
        { seq:[1,2,3,5,8,'?'],  answer:13, options:[10,11,12,13],   hintZh:'前两个相加得下一个',     hintEn:'Add previous two numbers' }
      ]
    },
    {
      id: '5', icon: '🌟',
      nameZh: '综合规律', nameEn: 'Mixed Patterns',
      descZh: '先判断是哪种规律', descEn: 'Identify the pattern type first',
      questions: [
        { seq:[3,6,9,'?',15],     answer:12, options:[10,11,12,13],   hintZh:'加法：每次加 3',    hintEn:'Addition: +3' },
        { seq:[64,32,16,'?',4],   answer:8,  options:[6,7,8,9],       hintZh:'除法：每次除以 2',  hintEn:'Division: ÷2' },
        { seq:[1,3,6,10,'?'],     answer:15, options:[13,14,15,16],   hintZh:'差是 2,3,4,5…多1', hintEn:'Gap 2,3,4,5… +1' },
        { seq:[50,45,40,'?',30],  answer:35, options:[33,34,35,36],   hintZh:'减法：每次减 5',    hintEn:'Subtraction: −5' },
        { seq:[2,4,8,16,'?'],     answer:32, options:[24,28,30,32],   hintZh:'乘法：每次乘 2',    hintEn:'Multiplication: ×2' },
        { seq:[5,8,11,'?',17],    answer:14, options:[12,13,14,15],   hintZh:'加法：每次加 3',    hintEn:'Addition: +3' },
        { seq:[1,2,4,7,11,'?'],   answer:16, options:[14,15,16,17],   hintZh:'差是 1,2,3,4,5…',  hintEn:'Gap 1,2,3,4,5…' },
        { seq:[81,27,9,'?',1],    answer:3,  options:[2,3,4,5],       hintZh:'除法：每次除以 3',  hintEn:'Division: ÷3' },
        { seq:[2,3,5,8,13,'?'],   answer:21, options:[18,19,20,21],   hintZh:'前两个相加得下一个',hintEn:'Add previous two' },
        { seq:[100,80,60,'?',20], answer:40, options:[30,35,40,45],   hintZh:'减法：每次减 20',   hintEn:'Subtraction: −20' }
      ]
    }
  ]
};
