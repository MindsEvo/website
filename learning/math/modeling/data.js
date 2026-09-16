/**
 * Math Modeling — Game Data  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Modeling 建模
 *
 * Four meta-types, each question tagged with `type`:
 *   - mapping      RG.MODELING.MAPPING.BASIC      K1-K2 (L1-L2)
 *   - grouping     RG.MODELING.GROUPING.PURPOSE   K2-G2 (L2-L4)
 *   - spatial      RG.MODELING.SPATIAL.BASIC      K1-G1 (L1-L3)
 *   - quantitative RG.MODELING.EQUATION.RELATION  G1-G2 (L3-L4)
 *
 * quantitative units (1-6) are the module's pre-existing equation/
 * balance-scale bank, unchanged in content — only `type`, `levelId`
 * and `difficultyAxis` were added to each question.
 *
 * mapping/grouping/spatial questions use `options` of strings
 * (emoji/text) instead of numbers; `renderOption`/`checkAnswer` in
 * game.js branch on `q.type` to tell the two shapes apart.
 */

var MM_DATA = {
  units: [
    // ── Unit mapping-1: 符号对应 (K1, L1) ──────────────────────────────
    {
      id: 'map-1', icon: '🔗',
      nameZh: '符号对应', nameEn: 'Symbol Correspondence',
      descZh: '哪个符号代表这个事物？', descEn: 'Which symbol stands for this thing?',
      questions: [
        { type:'mapping', levelId:'L1', prompt:'🍎', promptZh:'哪个符号代表苹果？', promptEn:'Which symbol stands for an apple?',
          answer:'🔴', options:['🔴','🟦','⭐','🔺'], hintZh:'苹果是圆圆的，红红的', hintEn:'An apple is round and red',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🐟', promptZh:'哪个符号代表小鱼？', promptEn:'Which symbol stands for a fish?',
          answer:'🔵', options:['🔵','🟩','⭐','🔺'], hintZh:'小鱼在水里游', hintEn:'A fish swims in water',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'☀️', promptZh:'哪个符号代表太阳？', promptEn:'Which symbol stands for the sun?',
          answer:'⭐', options:['⭐','🔵','🟩','🔺'], hintZh:'太阳会发光', hintEn:'The sun shines',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🔺', promptZh:'这个符号 🔺 代表哪个事物？', promptEn:'What does this symbol 🔺 stand for?',
          answer:'⛰️', options:['⛰️','🍎','🐟','☀️'], hintZh:'三角形，尖尖的', hintEn:'A triangle shape, pointed like a peak',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🟩', promptZh:'这个符号 🟩 代表哪个事物？', promptEn:'What does this symbol 🟩 stand for?',
          answer:'🌳', options:['🌳','🍎','🐟','☀️'], hintZh:'方方的，绿绿的', hintEn:'A square, green like a tree',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🐱', promptZh:'哪个符号代表小猫？', promptEn:'Which symbol stands for a cat?',
          answer:'🟦', options:['🟦','🔴','⭐','🔺'], hintZh:'小猫会喵喵叫', hintEn:'A cat says meow',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🍌', promptZh:'哪个符号代表香蕉？', promptEn:'Which symbol stands for a banana?',
          answer:'🟡', options:['🟡','🔴','🔵','⭐'], hintZh:'香蕉是黄色的', hintEn:'A banana is yellow',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🐘', promptZh:'哪个符号代表大象？', promptEn:'Which symbol stands for an elephant?',
          answer:'⬜', options:['⬜','🟢','🔺','🔵'], hintZh:'大象又大又灰', hintEn:'An elephant is big and gray',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'🟠', promptZh:'这个符号 🟠 代表哪个事物？', promptEn:'What does this symbol 🟠 stand for?',
          answer:'🍊', options:['🍊','🐰','🌙','🐘'], hintZh:'橙子是圆圆的橙色', hintEn:'An orange is round and orange',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L1', prompt:'⬛', promptZh:'这个符号 ⬛ 代表哪个事物？', promptEn:'What does this symbol ⬛ stand for?',
          answer:'🐻', options:['🐻','🍌','🐘','🍊'], hintZh:'黑黑的，像熊的影子', hintEn:"Dark like a bear's shadow",
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } }
      ]
    },

    // ── Unit mapping-2: 双向对应 (K2, L2) ──────────────────────────────
    {
      id: 'map-2', icon: '🔗',
      nameZh: '双向对应', nameEn: 'Two-way Correspondence',
      descZh: '事物和符号，从哪边看都要认得出', descEn: 'Thing and symbol — recognise the link from either side',
      questions: [
        { type:'mapping', levelId:'L2', prompt:'🚗', promptZh:'哪个符号代表汽车？', promptEn:'Which symbol stands for a car?',
          answer:'🟨', options:['🟨','🟪','🔷','🔶'], hintZh:'汽车有四个轮子', hintEn:'A car has four wheels',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'🔷', promptZh:'这个符号 🔷 代表哪个事物？', promptEn:'What does this symbol 🔷 stand for?',
          answer:'🏠', options:['🏠','🚗','🐶','🌙'], hintZh:'尖顶的形状像房子', hintEn:'A pointed shape, like a rooftop',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'🐶', promptZh:'哪个符号代表小狗？', promptEn:'Which symbol stands for a dog?',
          answer:'🟪', options:['🟪','🟨','🔷','🔶'], hintZh:'小狗会汪汪叫', hintEn:'A dog says woof',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'🌙', promptZh:'这个符号 🔶 代表哪个事物？', promptEn:'What does this symbol 🔶 stand for?',
          answer:'🌙', options:['🌙','🏠','🚗','🐶'], hintZh:'弯弯的形状，晚上出现', hintEn:'A curved shape that appears at night',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'✏️ 🟨🟨', promptZh:'如果 🟨 代表汽车，这里画的是几辆汽车？', promptEn:'If 🟨 stands for a car, how many cars are drawn here?',
          answer:'2', options:['1','2','3','4'], hintZh:'数一数有几个 🟨', hintEn:'Count the number of 🟨',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'mapping', levelId:'L2', prompt:'✏️ 🟪🟪🟪', promptZh:'如果 🟪 代表小狗，这里画的是几只小狗？', promptEn:'If 🟪 stands for a dog, how many dogs are drawn here?',
          answer:'3', options:['2','3','4','5'], hintZh:'数一数有几个 🟪', hintEn:'Count the number of 🟪',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'mapping', levelId:'L2', prompt:'🐘', promptZh:'哪个符号代表大象？', promptEn:'Which symbol stands for an elephant?',
          answer:'🟫', options:['🟫','🟨','🟪','🔷'], hintZh:'大象是棕灰色的', hintEn:'An elephant is brown-gray',
          difficultyAxis:{ object_complexity:'concrete', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'🟧', promptZh:'这个符号 🟧 代表哪个事物？', promptEn:'What does this symbol 🟧 stand for?',
          answer:'🎈', options:['🎈','🚗','🐶','🌙'], hintZh:'气球圆圆的，像橙色', hintEn:'A balloon is round like the orange color',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'mapping', levelId:'L2', prompt:'✏️ 🟧🟧🟧🟧', promptZh:'如果 🟧 代表气球，这里画的是几个气球？', promptEn:'If 🟧 stands for a balloon, how many balloons are drawn here?',
          answer:'4', options:['3','4','5','2'], hintZh:'数一数有几个 🟧', hintEn:'Count the number of 🟧',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'mapping', levelId:'L2', prompt:'✏️ 🟫🟫', promptZh:'如果 🟫 代表大象，这里画的是几只大象？', promptEn:'If 🟫 stands for an elephant, how many elephants are drawn here?',
          answer:'2', options:['1','2','3','4'], hintZh:'数一数有几个 🟫', hintEn:'Count the number of 🟫',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit grouping-1: 按目的分组 (K2, L2) ───────────────────────────
    {
      id: 'group-1', icon: '🗂️',
      nameZh: '按目的分组', nameEn: 'Group by Purpose',
      descZh: '同样的东西，换个目的，分组会不一样', descEn: 'Same things, different purpose, different grouping',
      questions: [
        { type:'grouping', levelId:'L2', promptZh:'按「能不能吃」分组：🍎 和这些谁一组？', promptEn:'Group by "edible or not": which one goes with 🍎?',
          answer:'🍌', options:['🍌','⚽','🚗','📕'], hintZh:'香蕉也能吃', hintEn:'A banana is also food',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'按「颜色」分组：🔴 和这些谁一组？', promptEn:'Group by "color": which one goes with 🔴?',
          answer:'🍎', options:['🍎','🍋','🟢','🟡'], hintZh:'苹果和它一样是红色', hintEn:'An apple is also red',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'这组是「能滚动的东西」：⚽ 🏀 🎈，哪个不属于这组？', promptEn:'This group is "things that roll": ⚽ 🏀 🎈 — which one does not belong?',
          answer:'📕', options:['📕','⚽','🏀','🎈'], hintZh:'书不会滚', hintEn:'A book does not roll',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'刚才 🍎 按「能不能吃」和 🍌 一组；现在按「形状圆不圆」，🍎 该和谁一组？', promptEn:'Earlier 🍎 grouped with 🍌 by "edible"; now group by "round shape" — who goes with 🍎?',
          answer:'⚽', options:['⚽','📕','🚗','✂️'], hintZh:'球也是圆的', hintEn:'A ball is also round',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L2', promptZh:'按「会不会飞」分组：🐦 和这些谁一组？', promptEn:'Group by "can fly": which one goes with 🐦?',
          answer:'🦋', options:['🦋','🚗','📕','⚽'], hintZh:'蝴蝶也会飞', hintEn:'A butterfly also flies',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'按「生活在水里」分组：🐟 和这些谁一组？', promptEn:'Group by "lives in water": which one goes with 🐟?',
          answer:'🐳', options:['🐳','🐶','🚗','📕'], hintZh:'鲸鱼也住在水里', hintEn:'A whale also lives in water',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'这组是「可以穿的东西」：👕 👗 🧢，哪个不属于这组？', promptEn:'This group is "things you wear": 👕 👗 🧢 — which one does not belong?',
          answer:'⚽', options:['⚽','👕','👗','🧢'], hintZh:'球不能穿', hintEn:'A ball cannot be worn',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'按「形状圆不圆」分组：⚽ 和这些谁一组？', promptEn:'Group by "round shape": which one goes with ⚽?',
          answer:'🍊', options:['🍊','📕','🚗','✂️'], hintZh:'橙子也是圆的', hintEn:'An orange is also round',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'按「颜色：黄色」分组：🍌 和这些谁一组？', promptEn:'Group by "color: yellow": which one goes with 🍌?',
          answer:'🌞', options:['🌞','🍎','🍇','🥦'], hintZh:'太阳也是黄色的', hintEn:'The sun is also yellow',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L2', promptZh:'刚才 🍌 按「颜色：黄色」和 🌞 一组；现在换成按「形状长不长」分组，🍌 该和谁一组？', promptEn:'Just now 🍌 grouped with 🌞 by "color: yellow"; now regroup by "long-shaped" — who goes with 🍌?',
          answer:'🥕', options:['🥕','🌞','🍇','🥦'], hintZh:'香蕉和胡萝卜都是长长的', hintEn:'A banana and a carrot are both long-shaped',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit grouping-2: 多目的切换 (G1-G2, L3-L4) ─────────────────────
    {
      id: 'group-2', icon: '🗂️',
      nameZh: '多目的切换', nameEn: 'Switching Purpose',
      descZh: '同一组物体，目的一变，分组标准也要跟着变', descEn: 'Same objects, new purpose, a different grouping rule',
      questions: [
        { type:'grouping', levelId:'L3', promptZh:'按「用途：交通工具」分组：🚗 和这些谁一组？', promptEn:'Group by "used for transport": which goes with 🚗?',
          answer:'🚲', options:['🚲','🍎','📕','⚽'], hintZh:'自行车也能载人出行', hintEn:'A bike also carries people around',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L3', promptZh:'按「有没有轮子」分组，这组里哪个不属于「有轮子」？', promptEn:'Group by "has wheels" — which one does NOT have wheels?',
          answer:'🐎', options:['🐎','🚗','🚲','🛴'], hintZh:'马没有轮子', hintEn:'A horse has no wheels',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L4', promptZh:'🍎 🍌 🥕 🥔：按「水果还是蔬菜」，哪两个是一组的蔬菜？', promptEn:'🍎 🍌 🥕 🥔: by "fruit vs vegetable", which is a vegetable?',
          answer:'🥕', options:['🥕','🍎','🍌','🥔'], hintZh:'胡萝卜是蔬菜（这里先选一个）', hintEn:'A carrot is a vegetable (pick one here)',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L4', promptZh:'同样这四个 🍎 🍌 🥕 🥔，如果改成按「长长的还是圆圆的」分组，🍌 该和谁一组？', promptEn:'Same four 🍎 🍌 🥕 🥔 — regroup by "long-shaped vs round-shaped": who goes with 🍌?',
          answer:'🥕', options:['🥕','🍎','🥔','🚲'], hintZh:'香蕉和胡萝卜都是长长的', hintEn:'A banana and a carrot are both long-shaped',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L4', promptZh:'按「能不能一口吃完」分组，🍎 🍇 🍉 里哪个不属于「一口吃完」这组？', promptEn:'Group by "can finish in one bite": among 🍎 🍇 🍉, which does NOT belong?',
          answer:'🍉', options:['🍉','🍎','🍇','🍒'], hintZh:'西瓜太大了', hintEn:'A watermelon is too big',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L3', promptZh:'按「用途：交通工具」分组：🛴 和这些谁一组？', promptEn:'Group by "used for transport": which goes with 🛴?',
          answer:'🚲', options:['🚲','🍎','📕','⚽'], hintZh:'自行车也能载人出行', hintEn:'A bike also carries people around',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L3', promptZh:'按「有没有轮子」分组，这组里哪个不属于「有轮子」？(🚗 🚲 🛴 🐟 之中)', promptEn:'Group by "has wheels" — among 🚗 🚲 🛴 🐟, which one does NOT have wheels?',
          answer:'🐟', options:['🐟','🚗','🚲','🛴'], hintZh:'小鱼没有轮子', hintEn:'A fish has no wheels',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'grouping', levelId:'L4', promptZh:'🍎 🍇 🍉 🍒：按「颜色是不是红色」，哪个不是红色的？', promptEn:'🍎 🍇 🍉 🍒: by "red or not", which one is NOT red?',
          answer:'🍇', options:['🍇','🍎','🍉','🍒'], hintZh:'葡萄是紫色/绿色的', hintEn:'Grapes are purple or green',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L4', promptZh:'同样这四个 🍎 🍇 🍉 🍒，如果改成按「个头大不大」分组，🍉 该和谁一组？', promptEn:'Same four 🍎 🍇 🍉 🍒 — regroup by "big vs small": who goes with 🍉?',
          answer:'🥥', options:['🥥','🍇','🍒','🍎'], hintZh:'椰子和西瓜都很大', hintEn:'A coconut and a watermelon are both big',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'grouping', levelId:'L4', promptZh:'按「能不能一口吃完」分组，🍇 🍒 🥭 里哪个不属于「一口吃完」这组？', promptEn:'Group by "can finish in one bite": among 🍇 🍒 🥭, which does NOT belong?',
          answer:'🥭', options:['🥭','🍇','🍒','🍓'], hintZh:'芒果太大了', hintEn:'A mango is too big',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit spatial-1: 方位示意图 (K1, L1) ────────────────────────────
    {
      id: 'spatial-1', icon: '🗺️',
      nameZh: '方位示意图', nameEn: 'Position Diagram',
      descZh: '看图说出谁在哪里', descEn: 'Read the diagram and say where things are',
      questions: [
        { type:'spatial', levelId:'L1', promptZh:'🌳 的上面是 🐦，下面是 🐿️。谁在树的上面？', promptEn:'Above 🌳 is 🐦, below is 🐿️. Who is above the tree?',
          answer:'🐦', options:['🐦','🐿️','🌳'], hintZh:'上面就是鸟', hintEn:'Above means the bird',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'🏠 的左边是 🌳，右边是 🚗。汽车在房子的哪一边？', promptEn:'Left of 🏠 is 🌳, right is 🚗. Which side is the car on?',
          answer:'右边', options:['左边','右边','上面'], hintZh:'汽车画在右边', hintEn:'The car is drawn on the right',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'盒子 📦 里面是 🎁，外面是 🐱。礼物在盒子的哪里？', promptEn:'Inside 📦 is 🎁, outside is 🐱. Where is the gift?',
          answer:'里面', options:['里面','外面','旁边'], hintZh:'礼物画在盒子里', hintEn:'The gift is drawn inside the box',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'桌子 🪑 旁边是 🐶，中间摆着 🍎。苹果在哪个位置？', promptEn:'Next to 🪑 is 🐶, and 🍎 sits between them. Where is the apple?',
          answer:'中间', options:['中间','旁边','外面'], hintZh:'苹果画在中间', hintEn:'The apple is drawn in the middle',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'🐦 在云 ☁️ 的下面，🦋 在云的上面。谁在云的上面？', promptEn:'Below ☁️ is 🐦, above is 🦋. Who is above the cloud?',
          answer:'🦋', options:['🦋','🐦','☁️'], hintZh:'上面就是蝴蝶', hintEn:'Above means the butterfly',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'🚲 的左边是 🏠，右边是 🌳。房子在自行车的哪一边？', promptEn:'Left of 🚲 is 🏠, right is 🌳. Which side is the house on?',
          answer:'左边', options:['左边','右边','上面'], hintZh:'房子画在左边', hintEn:'The house is drawn on the left',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'篮子 🧺 里面是 🍎，外面是 🐰。苹果在篮子的哪里？', promptEn:'Inside 🧺 is 🍎, outside is 🐰. Where is the apple?',
          answer:'里面', options:['里面','外面','旁边'], hintZh:'苹果画在篮子里', hintEn:'The apple is drawn inside the basket',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'🌳 的上面是 🐿️，下面是 🐸。谁在树的下面？', promptEn:'Above 🌳 is 🐿️, below is 🐸. Who is below the tree?',
          answer:'🐸', options:['🐸','🐿️','🌳'], hintZh:'下面就是青蛙', hintEn:'Below means the frog',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'🏫 的左边是 🚗，右边是 🚲。自行车在学校的哪一边？', promptEn:'Left of 🏫 is 🚗, right is 🚲. Which side is the bike on?',
          answer:'右边', options:['左边','右边','上面'], hintZh:'自行车画在右边', hintEn:'The bike is drawn on the right',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L1', promptZh:'花瓶 🏺 的左边是 🌸，右边是 🦋。蝴蝶在花瓶的哪一边？', promptEn:'Left of 🏺 is 🌸, right is 🦋. Which side is the butterfly on?',
          answer:'右边', options:['左边','右边','上面'], hintZh:'蝴蝶画在右边', hintEn:'The butterfly is drawn on the right',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } }
      ]
    },

    // ── Unit spatial-2: 路径示意图 (K2-G1, L2-L3) ──────────────────────
    {
      id: 'spatial-2', icon: '🗺️',
      nameZh: '路径示意图', nameEn: 'Path Diagram',
      descZh: '跟着示意图走一条路', descEn: 'Follow a path on a simplified map',
      questions: [
        { type:'spatial', levelId:'L2', promptZh:'路线：🏠 → 向右 → 🌳 → 向上 → 🏫。从家出发先往哪走？', promptEn:'Route: 🏠 → right → 🌳 → up → 🏫. From home, which way first?',
          answer:'向右', options:['向右','向左','向上','向下'], hintZh:'路线的第一步是向右', hintEn:'The first step in the route is right',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L2', promptZh:'路线：🏠 → 向右 → 🌳 → 向上 → 🏫。到了 🌳 之后往哪走能到学校？', promptEn:'Route: 🏠 → right → 🌳 → up → 🏫. After 🌳, which way reaches school?',
          answer:'向上', options:['向上','向下','向左','向右'], hintZh:'第二步是向上', hintEn:'The second step is up',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L3', promptZh:'地图：🏠 在左上角，🏫 在右下角，🏞️ 在中间。从家到学校最短要经过哪里？', promptEn:'Map: 🏠 top-left, 🏫 bottom-right, 🏞️ in the middle. Shortest way from home to school passes through where?',
          answer:'🏞️', options:['🏞️','🏠','🏫'], hintZh:'中间是必经之路', hintEn:'The middle point lies on the way',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'spatial', levelId:'L3', promptZh:'地图：从 🏠 向右走 2 格到 🌳，再向下走 1 格到 🏫。这条路一共走了几格？', promptEn:'Map: from 🏠 go right 2 cells to 🌳, then down 1 cell to 🏫. How many cells total?',
          answer:'3', options:['2','3','4','5'], hintZh:'2 格加 1 格', hintEn:'2 cells plus 1 cell',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'spatial', levelId:'L2', promptZh:'路线：🏫 → 向左 → 🌳 → 向下 → 🏠。从学校出发先往哪走？', promptEn:'Route: 🏫 → left → 🌳 → down → 🏠. From school, which way first?',
          answer:'向左', options:['向左','向右','向上','向下'], hintZh:'路线的第一步是向左', hintEn:'The first step in the route is left',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L2', promptZh:'路线：🏫 → 向左 → 🌳 → 向下 → 🏠。到了 🌳 之后往哪走能到家？', promptEn:'Route: 🏫 → left → 🌳 → down → 🏠. After 🌳, which way reaches home?',
          answer:'向下', options:['向下','向上','向左','向右'], hintZh:'第二步是向下', hintEn:'The second step is down',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L3', promptZh:'地图：🏠 在右上角，🏫 在左下角，🏞️ 在中间。从学校到家最短要经过哪里？', promptEn:'Map: 🏠 top-right, 🏫 bottom-left, 🏞️ in the middle. Shortest way from school to home passes through where?',
          answer:'🏞️', options:['🏞️','🏠','🏫'], hintZh:'中间是必经之路', hintEn:'The middle point lies on the way',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'spatial', levelId:'L3', promptZh:'路线：🏞️ → 向右 → 🏠 → 向下 → 🏫。从公园出发先往哪走？', promptEn:'Route: 🏞️ → right → 🏠 → down → 🏫. From the park, which way first?',
          answer:'向右', options:['向右','向左','向上','向下'], hintZh:'路线第一步是向右', hintEn:'The first step is right',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'spatial', levelId:'L3', promptZh:'地图：从 🏠 向下走 1 格到 🏫，再向右走 4 格到 🏞️。这条路一共走了几格？', promptEn:'Map: from 🏠 go down 1 cell to 🏫, then right 4 cells to 🏞️. How many cells total?',
          answer:'5', options:['4','5','6','7'], hintZh:'1 格加 4 格', hintEn:'1 cell plus 4 cells',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'spatial', levelId:'L3', promptZh:'地图：从 🏫 向左走 3 格到 🌳，再向上走 2 格到 🏠。这条路一共走了几格？', promptEn:'Map: from 🏫 go left 3 cells to 🌳, then up 2 cells to 🏠. How many cells total?',
          answer:'5', options:['4','5','6','3'], hintZh:'3 格加 2 格', hintEn:'3 cells plus 2 cells',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit 1: 加法填空  A + □ = B  (within 10, G1) ──────────────────────
    {
      id: '1', icon: '➕',
      nameZh: '加法填空', nameEn: 'Addition: Find □',
      descZh: '已知一个加数和总数，找出另一个加数', descEn: 'Given one addend and the sum, find the missing addend',
      questions: [
        { type:'quantitative', levelId:'L3', display:'3 + □ = 7',  answer:4, options:[2,4,5,3], hintZh:'3 加几等于 7？',  hintEn:'3 + what = 7?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'2 + □ = 8',  answer:6, options:[5,6,7,4], hintZh:'2 加几等于 8？',  hintEn:'2 + what = 8?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'5 + □ = 9',  answer:4, options:[3,4,5,6], hintZh:'5 加几等于 9？',  hintEn:'5 + what = 9?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'1 + □ = 6',  answer:5, options:[4,5,6,3], hintZh:'1 加几等于 6？',  hintEn:'1 + what = 6?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'4 + □ = 10', answer:6, options:[5,6,7,4], hintZh:'4 加几等于 10？', hintEn:'4 + what = 10?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'6 + □ = 10', answer:4, options:[3,4,5,6], hintZh:'6 加几等于 10？', hintEn:'6 + what = 10?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'3 + □ = 8',  answer:5, options:[4,5,6,3], hintZh:'3 加几等于 8？',  hintEn:'3 + what = 8?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'2 + □ = 5',  answer:3, options:[2,3,4,1], hintZh:'2 加几等于 5？',  hintEn:'2 + what = 5?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'4 + □ = 7',  answer:3, options:[2,3,4,5], hintZh:'4 加几等于 7？',  hintEn:'4 + what = 7?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'5 + □ = 8',  answer:3, options:[2,3,4,5], hintZh:'5 加几等于 8？',  hintEn:'5 + what = 8?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'direct', language_complexity:'question', transfer_complexity:'within-domain' } }
      ]
    },

    // ── Unit 2: 加法填空  □ + A = B  (within 15, G1) ──────────────────────
    {
      id: '2', icon: '🔲',
      nameZh: '未知加数', nameEn: 'Unknown Addend',
      descZh: '方块在左边——同样是等量关系，换了角度看', descEn: 'Box on the left — same equal relationship, different viewpoint',
      questions: [
        { type:'quantitative', levelId:'L3', display:'□ + 3 = 9',  answer:6, options:[5,6,7,4], hintZh:'几加 3 等于 9？',  hintEn:'what + 3 = 9?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 4 = 10', answer:6, options:[5,6,7,4], hintZh:'几加 4 等于 10？', hintEn:'what + 4 = 10?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 5 = 12', answer:7, options:[6,7,8,5], hintZh:'几加 5 等于 12？', hintEn:'what + 5 = 12?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 6 = 11', answer:5, options:[4,5,6,7], hintZh:'几加 6 等于 11？', hintEn:'what + 6 = 11?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 7 = 15', answer:8, options:[7,8,9,6], hintZh:'几加 7 等于 15？', hintEn:'what + 7 = 15?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 2 = 9',  answer:7, options:[6,7,8,5], hintZh:'几加 2 等于 9？',  hintEn:'what + 2 = 9?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 8 = 13', answer:5, options:[4,5,6,7], hintZh:'几加 8 等于 13？', hintEn:'what + 8 = 13?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 3 = 11', answer:8, options:[7,8,9,6], hintZh:'几加 3 等于 11？', hintEn:'what + 3 = 11?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 6 = 14', answer:8, options:[7,8,9,6], hintZh:'几加 6 等于 14？', hintEn:'what + 6 = 14?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'□ + 4 = 12', answer:8, options:[7,8,9,6], hintZh:'几加 4 等于 12？', hintEn:'what + 4 = 12?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } }
      ]
    },

    // ── Unit 3: 减法缺数  A − □ = B  (within 20, G1-G2) ──────────────────
    {
      id: '3', icon: '➖',
      nameZh: '减法填空', nameEn: 'Subtraction: Find □',
      descZh: '减去几得到结果？逆向思考建模', descEn: 'Subtract what to reach the result? Reverse-think to model',
      questions: [
        { type:'quantitative', levelId:'L3', display:'9 − □ = 4',  answer:5, options:[4,5,6,3], hintZh:'9 减几等于 4？',  hintEn:'9 − what = 4?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'10 − □ = 3', answer:7, options:[6,7,8,5], hintZh:'10 减几等于 3？', hintEn:'10 − what = 3?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'15 − □ = 8', answer:7, options:[6,7,8,9], hintZh:'15 减几等于 8？', hintEn:'15 − what = 8?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'12 − □ = 5', answer:7, options:[6,7,8,5], hintZh:'12 减几等于 5？', hintEn:'12 − what = 5?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'18 − □ = 9', answer:9, options:[8,9,10,7],hintZh:'18 减几等于 9？', hintEn:'18 − what = 9?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'7 − □ = 2',  answer:5, options:[4,5,6,3], hintZh:'7 减几等于 2？',  hintEn:'7 − what = 2?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'14 − □ = 6', answer:8, options:[7,8,9,6], hintZh:'14 减几等于 6？', hintEn:'14 − what = 6?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'20 − □ = 12',answer:8, options:[7,8,9,6], hintZh:'20 减几等于 12？',hintEn:'20 − what = 12?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'11 − □ = 4', answer:7, options:[6,7,8,5], hintZh:'11 减几等于 4？', hintEn:'11 − what = 4?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } },
        { type:'quantitative', levelId:'L3', display:'16 − □ = 7', answer:9, options:[8,9,10,7],hintZh:'16 减几等于 7？', hintEn:'16 − what = 7?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'within-domain' } }
      ]
    },

    // ── Unit 4: 天平平衡  ⚖️ A + □ = B + C  (G1-G2) ──────────────────────
    {
      id: '4', icon: '⚖️',
      nameZh: '天平平衡', nameEn: 'Balance Scale',
      descZh: '天平两边必须一样重——先算右边，再求方块', descEn: 'Both pans must balance — compute the right side, then find □',
      questions: [
        { type:'quantitative', levelId:'L4', display:'⚖️  5 + □ = 4 + 3',  answer:2, options:[1,2,3,4], hintZh:'右边 4+3=7，5+□=7，□=？', hintEn:'Right side 4+3=7; 5+□=7',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  3 + □ = 5 + 4',  answer:6, options:[5,6,7,4], hintZh:'右边 5+4=9，3+□=9，□=？', hintEn:'Right side 5+4=9; 3+□=9',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  6 + □ = 5 + 5',  answer:4, options:[3,4,5,6], hintZh:'右边 5+5=10，6+□=10，□=？',hintEn:'Right side 5+5=10; 6+□=10',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  4 + □ = 3 + 8',  answer:7, options:[6,7,8,5], hintZh:'右边 3+8=11，4+□=11，□=？',hintEn:'Right side 3+8=11; 4+□=11',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  7 + □ = 4 + 5',  answer:2, options:[1,2,3,4], hintZh:'右边 4+5=9，7+□=9，□=？', hintEn:'Right side 4+5=9; 7+□=9',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  2 + □ = 6 + 4',  answer:8, options:[7,8,9,6], hintZh:'右边 6+4=10，2+□=10，□=？',hintEn:'Right side 6+4=10; 2+□=10',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  8 + □ = 6 + 5',  answer:3, options:[2,3,4,5], hintZh:'右边 6+5=11，8+□=11，□=？',hintEn:'Right side 6+5=11; 8+□=11',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  5 + □ = 3 + 9',  answer:7, options:[6,7,8,5], hintZh:'右边 3+9=12，5+□=12，□=？',hintEn:'Right side 3+9=12; 5+□=12',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  9 + □ = 6 + 7',  answer:4, options:[3,4,5,6], hintZh:'右边 6+7=13，9+□=13，□=？',hintEn:'Right side 6+7=13; 9+□=13',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  3 + □ = 4 + 7',  answer:8, options:[7,8,9,6], hintZh:'右边 4+7=11，3+□=11，□=？',hintEn:'Right side 4+7=11; 3+□=11',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit 5: 乘法缺数  □ × A = B  (G2) ────────────────────────────────
    {
      id: '5', icon: '✖️',
      nameZh: '乘法缺数', nameEn: 'Multiplication: Find □',
      descZh: '每组有几个？用等量关系建立乘法模型', descEn: 'How many in each group? Build a multiplication model',
      questions: [
        { type:'quantitative', levelId:'L4', display:'□ × 2 = 8',  answer:4, options:[3,4,5,2], hintZh:'几个 2 等于 8？', hintEn:'how many 2s = 8?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 3 = 9',  answer:3, options:[2,3,4,5], hintZh:'几个 3 等于 9？', hintEn:'how many 3s = 9?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 4 = 12', answer:3, options:[2,3,4,5], hintZh:'几个 4 等于 12？',hintEn:'how many 4s = 12?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 5 = 20', answer:4, options:[3,4,5,2], hintZh:'几个 5 等于 20？',hintEn:'how many 5s = 20?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 2 = 10', answer:5, options:[4,5,6,3], hintZh:'几个 2 等于 10？',hintEn:'how many 2s = 10?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 3 = 12', answer:4, options:[3,4,5,2], hintZh:'几个 3 等于 12？',hintEn:'how many 3s = 12?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 5 = 15', answer:3, options:[2,3,4,5], hintZh:'几个 5 等于 15？',hintEn:'how many 5s = 15?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 2 = 14', answer:7, options:[6,7,8,5], hintZh:'几个 2 等于 14？',hintEn:'how many 2s = 14?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 4 = 16', answer:4, options:[3,4,5,6], hintZh:'几个 4 等于 16？',hintEn:'how many 4s = 16?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 3 = 15', answer:5, options:[4,5,6,3], hintZh:'几个 3 等于 15？',hintEn:'how many 3s = 15?',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'single', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    },

    // ── Unit 6: 情境建模  (G2, real-world context — generalization) ────────
    {
      id: '6', icon: '🌍',
      nameZh: '情境建模', nameEn: 'Real-world Modeling',
      descZh: '把生活问题转化为等量关系——元思维：建模与迁移', descEn: 'Turn real problems into equal relationships — meta-op: model & transfer',
      questions: [
        { type:'quantitative', levelId:'L4', display:'4 + □ = 10', answer:6, options:[5,6,7,4],
          hintZh:'篮子里有4个苹果，还需要□个才有10个', hintEn:'4 apples in a basket — need □ more to reach 10',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ + 7 = 12', answer:5, options:[4,5,6,3],
          hintZh:'12颗球，7颗红色，□颗蓝色', hintEn:'12 balls total, 7 red — □ are blue',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'15 − □ = 9', answer:6, options:[5,6,7,4],
          hintZh:'15本书，拿走□本还剩9本', hintEn:'15 books — take away □ to have 9 left',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 4 = 20', answer:5, options:[4,5,6,3],
          hintZh:'4排座位，每排□人，共20人', hintEn:'4 rows of seats, □ per row, 20 total',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  8 + □ = 6 + 5',  answer:3, options:[2,3,4,5],
          hintZh:'天平左边 8+□，右边 6+5，两边要一样重', hintEn:'Scale: left 8+□, right 6+5 — must balance',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'3 + □ = 8',  answer:5, options:[4,5,6,3],
          hintZh:'妈妈买了3个橙子和□个苹果，一共8个', hintEn:'3 oranges and □ apples — 8 fruit total',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ + 6 = 14', answer:8, options:[7,8,9,6],
          hintZh:'花园里14朵花，6朵红色，□朵黄色', hintEn:'14 flowers, 6 red — □ are yellow',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'20 − □ = 13',answer:7, options:[6,7,8,5],
          hintZh:'20颗糖果分了□颗，还剩13颗', hintEn:'20 candies — gave away □, 13 remain',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'□ × 3 = 18', answer:6, options:[5,6,7,4],
          hintZh:'3个袋子，每袋□颗糖，共18颗', hintEn:'3 bags, □ candies each, 18 total',
          difficultyAxis:{ object_complexity:'pictorial', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } },
        { type:'quantitative', levelId:'L4', display:'⚖️  6 + □ = 4 + 9',  answer:7, options:[6,7,8,5],
          hintZh:'天平左边 6+□，右边 4+9，□等于几？', hintEn:'Scale: left 6+□, right 4+9 — find □',
          difficultyAxis:{ object_complexity:'symbolic', dimension_complexity:'dual', relation_complexity:'indirect', language_complexity:'question', transfer_complexity:'strategy' } }
      ]
    }
  ]
};
