/**
 * Mixed Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * 6 units, one per 2-dimension combination:
 * Color+Size  |  Color+Quantity  |  Color+Motion
 * Size+Qty    |  Size+Motion     |  Quantity+Motion
 *
 * Option structure (always 4 options, 2×2 diagnostic matrix):
 *   opt_a: both_correct  (the answer)
 *   opt_b: dim1_wrong    (dim1 error, dim2 correct)
 *   opt_c: dim2_wrong    (dim1 correct, dim2 error)
 *   opt_d: both_wrong    (both errors)
 *
 * Dimension keys: color | size | quantity | direction
 * Constraint: dimensions vary INDEPENDENTLY — no cross-dimension rules.
 */

var MXP_DATA = {
  units: [

    // ══════════════════════════════════════════════════════════
    // UNIT 1 — Color + Size
    // ══════════════════════════════════════════════════════════
    {
      id: '1', icon: '🔵🔺',
      nameZh: '颜色 + 大小', nameEn: 'Color + Size',
      descZh: '同时判断颜色规律和大小规律', descEn: 'Read both color and size patterns',
      dimensions: ['color', 'size'],
      dim1Key: 'color', dim2Key: 'size',
      dim1ZhName: '颜色', dim1EnName: 'Color',
      dim2ZhName: '大小', dim2EnName: 'Size',
      questions: [
        {
          cells: [{color:'red',size:'s1'},{color:'blue',size:'s2'},{color:'red',size:'s3'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'blue',size:'s4'}, opt_b:{color:'red',size:'s4'}, opt_c:{color:'blue',size:'s3'}, opt_d:{color:'red',size:'s3'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'红蓝交替', en:'Red-blue alternation' },
          dim2Rule: { zh:'逐步变大', en:'Growing size' },
          hintZh: '颜色：红→蓝交替。大小：从小变大。',
          hintEn: 'Color: red-blue alternation. Size: growing.'
        },
        {
          cells: [{color:'green',size:'s4'},{color:'yellow',size:'s3'},{color:'green',size:'s2'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'yellow',size:'s1'}, opt_b:{color:'green',size:'s1'}, opt_c:{color:'yellow',size:'s2'}, opt_d:{color:'green',size:'s2'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'绿黄交替', en:'Green-yellow alternation' },
          dim2Rule: { zh:'逐步变小', en:'Shrinking size' },
          hintZh: '颜色：绿→黄交替。大小：从大变小。',
          hintEn: 'Color: green-yellow alternation. Size: shrinking.'
        },
        {
          cells: [{color:'purple',size:'s4'},{color:'orange',size:'s3'},{color:'purple',size:'s2'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'orange',size:'s1'}, opt_b:{color:'purple',size:'s1'}, opt_c:{color:'orange',size:'s2'}, opt_d:{color:'purple',size:'s2'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'紫橙交替', en:'Purple-orange alternation' },
          dim2Rule: { zh:'逐步变小', en:'Shrinking size' },
          hintZh: '颜色：紫→橙交替。大小：从大变小。',
          hintEn: 'Color: purple-orange alternation. Size: shrinking.'
        },
        {
          cells: [{color:'blue',size:'s1'},{color:'green',size:'s2'},{color:'blue',size:'s3'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'green',size:'s4'}, opt_b:{color:'blue',size:'s4'}, opt_c:{color:'green',size:'s3'}, opt_d:{color:'blue',size:'s3'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'蓝绿交替', en:'Blue-green alternation' },
          dim2Rule: { zh:'逐步变大', en:'Growing size' },
          hintZh: '颜色：蓝→绿交替。大小：从小变大。',
          hintEn: 'Color: blue-green alternation. Size: growing.'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 2 — Color + Quantity
    // ══════════════════════════════════════════════════════════
    {
      id: '2', icon: '🔵⭐',
      nameZh: '颜色 + 数量', nameEn: 'Color + Quantity',
      descZh: '同时判断颜色规律和数量规律', descEn: 'Read both color and quantity patterns',
      dimensions: ['color', 'quantity'],
      dim1Key: 'color', dim2Key: 'quantity',
      dim1ZhName: '颜色', dim1EnName: 'Color',
      dim2ZhName: '数量', dim2EnName: 'Quantity',
      questions: [
        {
          cells: [{color:'red',quantity:1},{color:'blue',quantity:2},{color:'red',quantity:3},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'blue',quantity:4}, opt_b:{color:'red',quantity:4}, opt_c:{color:'blue',quantity:3}, opt_d:{color:'red',quantity:3} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'红蓝交替', en:'Red-blue alternation' },
          dim2Rule: { zh:'数量增多', en:'Growing quantity' },
          hintZh: '颜色：红→蓝交替。数量：越来越多。',
          hintEn: 'Color: red-blue alternation. Quantity: growing.'
        },
        {
          cells: [{color:'yellow',quantity:4},{color:'green',quantity:3},{color:'yellow',quantity:2},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'green',quantity:1}, opt_b:{color:'yellow',quantity:1}, opt_c:{color:'green',quantity:2}, opt_d:{color:'yellow',quantity:2} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'黄绿交替', en:'Yellow-green alternation' },
          dim2Rule: { zh:'数量减少', en:'Shrinking quantity' },
          hintZh: '颜色：黄→绿交替。数量：越来越少。',
          hintEn: 'Color: yellow-green alternation. Quantity: shrinking.'
        },
        {
          cells: [{color:'red',quantity:4},{color:'blue',quantity:3},{color:'red',quantity:2},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'blue',quantity:1}, opt_b:{color:'red',quantity:1}, opt_c:{color:'blue',quantity:2}, opt_d:{color:'red',quantity:2} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'红蓝交替', en:'Red-blue alternation' },
          dim2Rule: { zh:'数量减少', en:'Shrinking quantity' },
          hintZh: '颜色：红→蓝交替。数量：越来越少。',
          hintEn: 'Color: red-blue alternation. Quantity: shrinking.'
        },
        {
          cells: [{color:'green',quantity:1},{color:'yellow',quantity:2},{color:'green',quantity:3},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'yellow',quantity:4}, opt_b:{color:'green',quantity:4}, opt_c:{color:'yellow',quantity:3}, opt_d:{color:'green',quantity:3} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'绿黄交替', en:'Green-yellow alternation' },
          dim2Rule: { zh:'数量增多', en:'Growing quantity' },
          hintZh: '颜色：绿→黄交替。数量：越来越多。',
          hintEn: 'Color: green-yellow alternation. Quantity: growing.'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 3 — Color + Motion
    // ══════════════════════════════════════════════════════════
    {
      id: '3', icon: '🔴➡️',
      nameZh: '颜色 + 方向', nameEn: 'Color + Direction',
      descZh: '同时判断颜色规律和方向规律', descEn: 'Read both color and direction patterns',
      dimensions: ['color', 'direction'],
      dim1Key: 'color', dim2Key: 'direction',
      dim1ZhName: '颜色', dim1EnName: 'Color',
      dim2ZhName: '方向', dim2EnName: 'Direction',
      questions: [
        {
          cells: [{color:'red',direction:'left'},{color:'blue',direction:'right'},{color:'red',direction:'left'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'blue',direction:'right'}, opt_b:{color:'red',direction:'right'}, opt_c:{color:'blue',direction:'left'}, opt_d:{color:'red',direction:'left'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'红蓝交替', en:'Red-blue alternation' },
          dim2Rule: { zh:'左右交替', en:'Left-right alternation' },
          hintZh: '颜色：红→蓝交替。方向：左→右交替。',
          hintEn: 'Color: red-blue alternation. Direction: left-right alternation.'
        },
        {
          cells: [{color:'green',direction:'up'},{color:'yellow',direction:'down'},{color:'green',direction:'up'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'yellow',direction:'down'}, opt_b:{color:'green',direction:'down'}, opt_c:{color:'yellow',direction:'up'}, opt_d:{color:'green',direction:'up'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'绿黄交替', en:'Green-yellow alternation' },
          dim2Rule: { zh:'上下交替', en:'Up-down alternation' },
          hintZh: '颜色：绿→黄交替。方向：上→下交替。',
          hintEn: 'Color: green-yellow alternation. Direction: up-down alternation.'
        },
        {
          cells: [{color:'purple',direction:'right'},{color:'orange',direction:'up'},{color:'purple',direction:'right'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'orange',direction:'up'}, opt_b:{color:'purple',direction:'up'}, opt_c:{color:'orange',direction:'right'}, opt_d:{color:'purple',direction:'right'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'紫橙交替', en:'Purple-orange alternation' },
          dim2Rule: { zh:'右上交替', en:'Right-up alternation' },
          hintZh: '颜色：紫→橙交替。方向：右→上交替。',
          hintEn: 'Color: purple-orange alternation. Direction: right-up alternation.'
        },
        {
          cells: [{color:'blue',direction:'down'},{color:'red',direction:'left'},{color:'blue',direction:'down'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{color:'red',direction:'left'}, opt_b:{color:'blue',direction:'left'}, opt_c:{color:'red',direction:'down'}, opt_d:{color:'blue',direction:'down'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'蓝红交替', en:'Blue-red alternation' },
          dim2Rule: { zh:'下左交替', en:'Down-left alternation' },
          hintZh: '颜色：蓝→红交替。方向：下→左交替。',
          hintEn: 'Color: blue-red alternation. Direction: down-left alternation.'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 4 — Size + Quantity
    // ══════════════════════════════════════════════════════════
    {
      id: '4', icon: '🔺⭐',
      nameZh: '大小 + 数量', nameEn: 'Size + Quantity',
      descZh: '同时判断大小规律和数量规律', descEn: 'Read both size and quantity patterns',
      dimensions: ['size', 'quantity'],
      dim1Key: 'size', dim2Key: 'quantity',
      dim1ZhName: '大小', dim1EnName: 'Size',
      dim2ZhName: '数量', dim2EnName: 'Quantity',
      questions: [
        {
          cells: [{size:'s1',quantity:1},{size:'s2',quantity:2},{size:'s3',quantity:3},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s4',quantity:4}, opt_b:{size:'s3',quantity:4}, opt_c:{size:'s4',quantity:3}, opt_d:{size:'s3',quantity:3} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'逐步变大', en:'Growing size' },
          dim2Rule: { zh:'数量增多', en:'Growing quantity' },
          hintZh: '大小：越来越大。数量：越来越多。',
          hintEn: 'Size: growing. Quantity: growing.'
        },
        {
          cells: [{size:'s4',quantity:4},{size:'s3',quantity:3},{size:'s2',quantity:2},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s1',quantity:1}, opt_b:{size:'s2',quantity:1}, opt_c:{size:'s1',quantity:2}, opt_d:{size:'s2',quantity:2} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'逐步变小', en:'Shrinking size' },
          dim2Rule: { zh:'数量减少', en:'Shrinking quantity' },
          hintZh: '大小：越来越小。数量：越来越少。',
          hintEn: 'Size: shrinking. Quantity: shrinking.'
        },
        {
          cells: [{size:'s1',quantity:4},{size:'s2',quantity:3},{size:'s3',quantity:2},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s4',quantity:1}, opt_b:{size:'s3',quantity:1}, opt_c:{size:'s4',quantity:2}, opt_d:{size:'s3',quantity:2} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'逐步变大', en:'Growing size' },
          dim2Rule: { zh:'数量减少', en:'Shrinking quantity' },
          hintZh: '大小：越来越大。数量：越来越少。',
          hintEn: 'Size: growing. Quantity: shrinking.'
        },
        {
          cells: [{size:'s4',quantity:1},{size:'s1',quantity:2},{size:'s4',quantity:3},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s1',quantity:4}, opt_b:{size:'s4',quantity:4}, opt_c:{size:'s1',quantity:3}, opt_d:{size:'s4',quantity:3} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'大小交替', en:'Big-small alternation' },
          dim2Rule: { zh:'数量增多', en:'Growing quantity' },
          hintZh: '大小：大→小交替。数量：越来越多。',
          hintEn: 'Size: big-small alternation. Quantity: growing.'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 5 — Size + Motion
    // ══════════════════════════════════════════════════════════
    {
      id: '5', icon: '🔺➡️',
      nameZh: '大小 + 方向', nameEn: 'Size + Direction',
      descZh: '同时判断大小规律和方向规律', descEn: 'Read both size and direction patterns',
      dimensions: ['size', 'direction'],
      dim1Key: 'size', dim2Key: 'direction',
      dim1ZhName: '大小', dim1EnName: 'Size',
      dim2ZhName: '方向', dim2EnName: 'Direction',
      questions: [
        {
          cells: [{size:'s1',direction:'left'},{size:'s2',direction:'right'},{size:'s3',direction:'left'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s4',direction:'right'}, opt_b:{size:'s3',direction:'right'}, opt_c:{size:'s4',direction:'left'}, opt_d:{size:'s3',direction:'left'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'逐步变大', en:'Growing size' },
          dim2Rule: { zh:'左右交替', en:'Left-right alternation' },
          hintZh: '大小：越来越大。方向：左→右交替。',
          hintEn: 'Size: growing. Direction: left-right alternation.'
        },
        {
          cells: [{size:'s4',direction:'up'},{size:'s3',direction:'down'},{size:'s2',direction:'up'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s1',direction:'down'}, opt_b:{size:'s2',direction:'down'}, opt_c:{size:'s1',direction:'up'}, opt_d:{size:'s2',direction:'up'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'逐步变小', en:'Shrinking size' },
          dim2Rule: { zh:'上下交替', en:'Up-down alternation' },
          hintZh: '大小：越来越小。方向：上→下交替。',
          hintEn: 'Size: shrinking. Direction: up-down alternation.'
        },
        {
          cells: [{size:'s1',direction:'right'},{size:'s4',direction:'left'},{size:'s1',direction:'right'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s4',direction:'left'}, opt_b:{size:'s1',direction:'left'}, opt_c:{size:'s4',direction:'right'}, opt_d:{size:'s1',direction:'right'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'大小交替', en:'Big-small alternation' },
          dim2Rule: { zh:'右左交替', en:'Right-left alternation' },
          hintZh: '大小：小→大交替。方向：右→左交替。',
          hintEn: 'Size: small-big alternation. Direction: right-left alternation.'
        },
        {
          cells: [{size:'s4',direction:'down'},{size:'s1',direction:'up'},{size:'s4',direction:'down'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{size:'s1',direction:'up'}, opt_b:{size:'s4',direction:'up'}, opt_c:{size:'s1',direction:'down'}, opt_d:{size:'s4',direction:'down'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'大小交替', en:'Big-small alternation' },
          dim2Rule: { zh:'下上交替', en:'Down-up alternation' },
          hintZh: '大小：大→小交替。方向：下→上交替。',
          hintEn: 'Size: big-small alternation. Direction: down-up alternation.'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 6 — Quantity + Motion
    // ══════════════════════════════════════════════════════════
    {
      id: '6', icon: '⭐➡️',
      nameZh: '数量 + 方向', nameEn: 'Quantity + Direction',
      descZh: '同时判断数量规律和方向规律', descEn: 'Read both quantity and direction patterns',
      dimensions: ['quantity', 'direction'],
      dim1Key: 'quantity', dim2Key: 'direction',
      dim1ZhName: '数量', dim1EnName: 'Quantity',
      dim2ZhName: '方向', dim2EnName: 'Direction',
      questions: [
        {
          cells: [{quantity:1,direction:'left'},{quantity:2,direction:'right'},{quantity:3,direction:'left'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{quantity:4,direction:'right'}, opt_b:{quantity:3,direction:'right'}, opt_c:{quantity:4,direction:'left'}, opt_d:{quantity:3,direction:'left'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'数量增多', en:'Growing quantity' },
          dim2Rule: { zh:'左右交替', en:'Left-right alternation' },
          hintZh: '数量：越来越多。方向：左→右交替。',
          hintEn: 'Quantity: growing. Direction: left-right alternation.'
        },
        {
          cells: [{quantity:4,direction:'up'},{quantity:3,direction:'down'},{quantity:2,direction:'up'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{quantity:1,direction:'down'}, opt_b:{quantity:2,direction:'down'}, opt_c:{quantity:1,direction:'up'}, opt_d:{quantity:2,direction:'up'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'数量减少', en:'Shrinking quantity' },
          dim2Rule: { zh:'上下交替', en:'Up-down alternation' },
          hintZh: '数量：越来越少。方向：上→下交替。',
          hintEn: 'Quantity: shrinking. Direction: up-down alternation.'
        },
        {
          cells: [{quantity:1,direction:'right'},{quantity:2,direction:'up'},{quantity:3,direction:'right'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{quantity:4,direction:'up'}, opt_b:{quantity:3,direction:'up'}, opt_c:{quantity:4,direction:'right'}, opt_d:{quantity:3,direction:'right'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'数量增多', en:'Growing quantity' },
          dim2Rule: { zh:'右上交替', en:'Right-up alternation' },
          hintZh: '数量：越来越多。方向：右→上交替。',
          hintEn: 'Quantity: growing. Direction: right-up alternation.'
        },
        {
          cells: [{quantity:4,direction:'left'},{quantity:3,direction:'down'},{quantity:2,direction:'left'},'?'],
          answer: 'opt_a',
          options: ['opt_a','opt_b','opt_c','opt_d'],
          optionDefs: { opt_a:{quantity:1,direction:'down'}, opt_b:{quantity:2,direction:'down'}, opt_c:{quantity:1,direction:'left'}, opt_d:{quantity:2,direction:'left'} },
          optionTypes: { opt_a:'both_correct', opt_b:'dim1_wrong', opt_c:'dim2_wrong', opt_d:'both_wrong' },
          dim1Rule: { zh:'数量减少', en:'Shrinking quantity' },
          dim2Rule: { zh:'左下交替', en:'Left-down alternation' },
          hintZh: '数量：越来越少。方向：左→下交替。',
          hintEn: 'Quantity: shrinking. Direction: left-down alternation.'
        }
      ]
    }

  ]
};
