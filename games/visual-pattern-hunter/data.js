/**
 * Visual Pattern Hunter — Game Data  v2.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * patternType: 'shape' | 'rotate'
 * sequence:    array of items, '?' marks the blank
 * answer:      correct value (must match one of options[])
 */

var VPH_DATA = {
  units: [
    {
      id: '1', icon: '🔵',
      nameZh: '形状交替', nameEn: 'Shape Alternation',
      descZh: '观察图形交替出现的规律', descEn: 'Shapes take turns appearing',
      patternType: 'shape',
      questions: [
        { sequence:['circle','triangle','circle','triangle','circle','?'], answer:'triangle', options:['triangle','circle','square','star'],    hintZh:'观察图形是怎样交替的', hintEn:'Look at how shapes alternate', level:1 },
        { sequence:['square','circle','square','circle','square','?'],     answer:'circle',   options:['circle','square','triangle','star'],   hintZh:'观察图形是怎样交替的', hintEn:'Look at how shapes alternate', level:1 },
        { sequence:['circle','triangle','square','circle','triangle','?'], answer:'square',   options:['square','circle','triangle','star'],   hintZh:'三个一循环', hintEn:'A 3-item cycle', level:2 },
        { sequence:['star','circle','triangle','star','circle','?'],       answer:'triangle', options:['triangle','star','circle','square'],   hintZh:'三个一循环', hintEn:'A 3-item cycle', level:2 },
        { sequence:['circle','circle','triangle','triangle','circle','?'], answer:'circle',   options:['circle','triangle','square','star'],   hintZh:'两个两个地变化', hintEn:'Items appear in pairs', level:3 }
      ]
    },
    {
      id: '2', icon: '🔄',
      nameZh: '方向旋转', nameEn: 'Rotation Pattern',
      descZh: '观察方向的变化规律', descEn: 'Observe direction changes',
      patternType: 'rotate',
      rotateShape: 'arrow',
      questions: [
        { sequence:[0,90,180,270,0,'?'],   answer:90,  options:[90,180,270,0],   hintZh:'每次转 90 度', hintEn:'Rotate 90° each time', level:1 },
        { sequence:[90,180,270,0,90,'?'],  answer:180, options:[180,90,270,0],   hintZh:'每次转 90 度', hintEn:'Rotate 90° each time', level:1 },
        { sequence:[0,45,90,135,180,'?'],  answer:225, options:[225,180,270,135],hintZh:'每次转 45 度', hintEn:'Rotate 45° each time', level:2 },
        { sequence:[0,90,0,90,0,'?'],      answer:90,  options:[90,0,180,270],   hintZh:'0 和 90 交替', hintEn:'Alternating 0° and 90°', level:3 }
      ]
    }
  ]
};
