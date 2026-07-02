/**
 * Pattern Hunter — Question Bank  v1.0.0
 * ─────────────────────────────────────────────────────────
 * Data only. No logic here.
 *
 * Gene IDs format: {domain}.{subdomain}.{type}.{level}.{name}.{series}.{ver}
 * L1 = elementary level (小学)
 *
 * Each unit maps to one cognitive level and a set of root genes.
 * Each question:
 *   seq      — number sequence, '?' marks the blank
 *   answer   — correct value
 *   options  — 4 choices (answer is among them)
 *   hint_zh  — Chinese hint
 *   hint_en  — English hint
 *   solutions — number of valid solution approaches (for multi-solution tracking)
 */

var PH_DATA = {

  geneIds: [
    'PTRN.numeric.sequence.L1.rule-induction.PH001.v1',
    'PTRN.numeric.sequence.L1.pattern-recognition.PH002.v1'
  ],

  units: [
    {
      id: 1,
      icon: '➕',
      nameKey: 'ph.unit1.name',
      descKey: 'ph.unit1.desc',
      cogLevel: 'L1',
      questions: [
        { seq:[2,4,6,'?',10],    answer:8,   options:[7,8,9,5],        hint_zh:'每次加 2',  hint_en:'Add 2 each time',   solutions:1 },
        { seq:[1,3,5,'?',9],     answer:7,   options:[6,7,8,4],        hint_zh:'每次加 2',  hint_en:'Add 2 each time',   solutions:1 },
        { seq:[5,10,15,'?',25],  answer:20,  options:[18,19,20,22],    hint_zh:'每次加 5',  hint_en:'Add 5 each time',   solutions:1 },
        { seq:[3,6,9,12,'?'],    answer:15,  options:[13,14,15,16],    hint_zh:'每次加 3',  hint_en:'Add 3 each time',   solutions:1 },
        { seq:[10,20,30,'?',50], answer:40,  options:[35,40,45,25],    hint_zh:'每次加 10', hint_en:'Add 10 each time',  solutions:1 },
        { seq:[4,8,12,'?',20],   answer:16,  options:[14,15,16,17],    hint_zh:'每次加 4',  hint_en:'Add 4 each time',   solutions:1 },
        { seq:[7,14,21,'?',35],  answer:28,  options:[25,27,28,30],    hint_zh:'每次加 7',  hint_en:'Add 7 each time',   solutions:1 },
        { seq:[6,11,16,'?',26],  answer:21,  options:[20,21,22,23],    hint_zh:'每次加 5',  hint_en:'Add 5 each time',   solutions:1 },
        { seq:[1,4,7,10,'?'],    answer:13,  options:[11,12,13,14],    hint_zh:'每次加 3',  hint_en:'Add 3 each time',   solutions:1 },
        { seq:[2,9,16,'?',30],   answer:23,  options:[21,22,23,24],    hint_zh:'每次加 7',  hint_en:'Add 7 each time',   solutions:1 }
      ]
    },
    {
      id: 2,
      icon: '➖',
      nameKey: 'ph.unit2.name',
      descKey: 'ph.unit2.desc',
      cogLevel: 'L1',
      questions: [
        { seq:[20,16,12,'?',4],    answer:8,  options:[6,7,8,9],      hint_zh:'每次减 4',  hint_en:'Subtract 4 each time',   solutions:1 },
        { seq:[50,40,30,'?',10],   answer:20, options:[15,18,20,25],   hint_zh:'每次减 10', hint_en:'Subtract 10 each time',  solutions:1 },
        { seq:[30,25,20,'?',10],   answer:15, options:[13,14,15,16],   hint_zh:'每次减 5',  hint_en:'Subtract 5 each time',   solutions:1 },
        { seq:[100,90,80,'?',60],  answer:70, options:[65,70,75,68],   hint_zh:'每次减 10', hint_en:'Subtract 10 each time',  solutions:1 },
        { seq:[18,15,12,'?',6],    answer:9,  options:[7,8,9,10],      hint_zh:'每次减 3',  hint_en:'Subtract 3 each time',   solutions:1 },
        { seq:[40,33,26,'?',12],   answer:19, options:[17,18,19,20],   hint_zh:'每次减 7',  hint_en:'Subtract 7 each time',   solutions:1 },
        { seq:[25,20,15,'?',5],    answer:10, options:[8,9,10,11],     hint_zh:'每次减 5',  hint_en:'Subtract 5 each time',   solutions:1 },
        { seq:[36,30,24,'?',12],   answer:18, options:[16,17,18,19],   hint_zh:'每次减 6',  hint_en:'Subtract 6 each time',   solutions:1 },
        { seq:[55,44,33,'?',11],   answer:22, options:[20,21,22,23],   hint_zh:'每次减 11', hint_en:'Subtract 11 each time',  solutions:1 },
        { seq:[48,40,32,'?',16],   answer:24, options:[22,23,24,25],   hint_zh:'每次减 8',  hint_en:'Subtract 8 each time',   solutions:1 }
      ]
    },
    {
      id: 3,
      icon: '✖️',
      nameKey: 'ph.unit3.name',
      descKey: 'ph.unit3.desc',
      cogLevel: 'L1',
      questions: [
        { seq:[2,4,8,'?',32],       answer:16,  options:[12,14,16,18],    hint_zh:'每次乘 2', hint_en:'Multiply by 2',  solutions:1 },
        { seq:[1,3,9,'?',81],       answer:27,  options:[18,24,27,30],    hint_zh:'每次乘 3', hint_en:'Multiply by 3',  solutions:1 },
        { seq:[5,10,20,'?',80],     answer:40,  options:[30,35,40,45],    hint_zh:'每次乘 2', hint_en:'Multiply by 2',  solutions:1 },
        { seq:[2,6,18,'?',162],     answer:54,  options:[36,48,54,60],    hint_zh:'每次乘 3', hint_en:'Multiply by 3',  solutions:1 },
        { seq:[3,6,12,'?',48],      answer:24,  options:[18,20,24,28],    hint_zh:'每次乘 2', hint_en:'Multiply by 2',  solutions:1 },
        { seq:[1,5,25,'?',625],     answer:125, options:[100,110,125,150],hint_zh:'每次乘 5', hint_en:'Multiply by 5',  solutions:1 },
        { seq:[4,8,16,'?',64],      answer:32,  options:[24,28,32,36],    hint_zh:'每次乘 2', hint_en:'Multiply by 2',  solutions:1 },
        { seq:[2,10,50,'?',1250],   answer:250, options:[150,200,250,300],hint_zh:'每次乘 5', hint_en:'Multiply by 5',  solutions:1 },
        { seq:[3,9,27,'?',243],     answer:81,  options:[54,63,81,90],    hint_zh:'每次乘 3', hint_en:'Multiply by 3',  solutions:1 },
        { seq:[1,4,16,'?',256],     answer:64,  options:[48,56,64,72],    hint_zh:'每次乘 4', hint_en:'Multiply by 4',  solutions:1 }
      ]
    },
    {
      id: 4,
      icon: '📈',
      nameKey: 'ph.unit4.name',
      descKey: 'ph.unit4.desc',
      cogLevel: 'L2',
      questions: [
        { seq:[1,2,4,7,'?'],    answer:11, options:[9,10,11,12],   hint_zh:'差是 1,2,3,4… 每次多1',   hint_en:'Gap 1,2,3,4… +1 each time',    solutions:1 },
        { seq:[0,1,3,6,'?'],    answer:10, options:[8,9,10,11],    hint_zh:'差是 1,2,3,4… 每次多1',   hint_en:'Gap 1,2,3,4… +1 each time',    solutions:1 },
        { seq:[2,3,5,8,'?'],    answer:12, options:[10,11,12,13],  hint_zh:'差是 1,2,3,4… 每次多1',   hint_en:'Gap 1,2,3,4… +1 each time',    solutions:1 },
        { seq:[1,3,7,13,'?'],   answer:21, options:[17,19,21,23],  hint_zh:'差是 2,4,6,8… 每次多2',   hint_en:'Gap 2,4,6,8… +2 each time',    solutions:1 },
        { seq:[0,2,6,12,'?'],   answer:20, options:[16,18,20,22],  hint_zh:'差是 2,4,6,8… 每次多2',   hint_en:'Gap 2,4,6,8… +2 each time',    solutions:1 },
        { seq:[1,2,4,8,'?'],    answer:16, options:[12,14,16,18],  hint_zh:'差是 1,2,4,8… 每次翻倍',  hint_en:'Gap 1,2,4,8… doubles',         solutions:2 },
        { seq:[3,4,6,10,'?'],   answer:18, options:[14,16,18,20],  hint_zh:'差是 1,2,4,8… 每次翻倍',  hint_en:'Gap 1,2,4,8… doubles',         solutions:2 },
        { seq:[1,4,9,16,'?'],   answer:25, options:[20,22,25,28],  hint_zh:'1²,2²,3²,4²,5²',        hint_en:'1²,2²,3²,4²,5²',              solutions:2 },
        { seq:[1,1,2,3,5,'?'],  answer:8,  options:[6,7,8,9],      hint_zh:'前两个相加得下一个',       hint_en:'Add previous two numbers',     solutions:1 },
        { seq:[1,2,3,5,8,'?'],  answer:13, options:[10,11,12,13],  hint_zh:'前两个相加得下一个',       hint_en:'Add previous two numbers',     solutions:1 }
      ]
    },
    {
      id: 5,
      icon: '🌟',
      nameKey: 'ph.unit5.name',
      descKey: 'ph.unit5.desc',
      cogLevel: 'L2',
      questions: [
        { seq:[3,6,9,'?',15],     answer:12, options:[10,11,12,13],   hint_zh:'加法：每次加 3',     hint_en:'Addition: +3',           solutions:1 },
        { seq:[64,32,16,'?',4],   answer:8,  options:[6,7,8,9],       hint_zh:'除法：每次除以 2',   hint_en:'Division: ÷2',           solutions:1 },
        { seq:[1,3,6,10,'?'],     answer:15, options:[13,14,15,16],   hint_zh:'差是 2,3,4,5… 多1', hint_en:'Gap 2,3,4,5… +1',        solutions:2 },
        { seq:[50,45,40,'?',30],  answer:35, options:[33,34,35,36],   hint_zh:'减法：每次减 5',     hint_en:'Subtraction: −5',        solutions:1 },
        { seq:[2,4,8,16,'?'],     answer:32, options:[24,28,30,32],   hint_zh:'乘法：每次乘 2',     hint_en:'Multiplication: ×2',     solutions:1 },
        { seq:[5,8,11,'?',17],    answer:14, options:[12,13,14,15],   hint_zh:'加法：每次加 3',     hint_en:'Addition: +3',           solutions:1 },
        { seq:[1,2,4,7,11,'?'],   answer:16, options:[14,15,16,17],   hint_zh:'差是 1,2,3,4,5…',   hint_en:'Gap 1,2,3,4,5…',         solutions:1 },
        { seq:[81,27,9,'?',1],    answer:3,  options:[2,3,4,5],       hint_zh:'除法：每次除以 3',   hint_en:'Division: ÷3',           solutions:1 },
        { seq:[2,3,5,8,13,'?'],   answer:21, options:[18,19,20,21],   hint_zh:'前两个相加得下一个', hint_en:'Add previous two',       solutions:1 },
        { seq:[100,80,60,'?',20], answer:40, options:[30,35,40,45],   hint_zh:'减法：每次减 20',    hint_en:'Subtraction: −20',       solutions:1 }
      ]
    }
  ]
};
