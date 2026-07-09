/**
 * Math Strategy — Game Data  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Strategy 策略
 *
 * RootGene: Prediction, Multi-dimensional Thinking
 * Meta-thinking operations:
 *   - Step sequencing  (what to do first to reach the goal)
 *   - Optimal choice   (pick the best option from alternatives)
 *   - Fair allocation  (distribute resources optimally)
 *   - Multi-step pred  (predict outcome after several actions)
 *   - Simple game      (anticipate opponent moves, G2)
 *   - Mixed strategy   (balance multiple factors)
 *
 * Knowledge background ref:
 *   Units 1-3 → G1-G2  (planning & allocation)
 *   Units 4-5 → G2     (prediction & game strategy)
 *   Unit  6   → G2     (multi-factor mixed reasoning)
 *
 * Character names: English throughout (Tom, Amy, Bob, Lily, Jack, Eva).
 */

var MS_DATA = {
  units: [

    // ── Unit 1: 做事顺序  (What to do first to reach the goal) ────────────
    {
      id: '1', icon: '📋',
      nameZh: '步骤规划', nameEn: 'Step Planning',
      descZh: '做事有顺序，先做哪步才能最高效到达目标？', descEn: 'What should you do first to reach your goal most efficiently?',
      questions: [
        { premiseZh:'要写一篇文章。',                          premiseEn:'You need to write an essay.',
          questionZh:'应该先做哪一步？',                       questionEn:'What should you do first?',
          options:['直接写正文','先列出大纲','先选好字体','先打印纸张'],
          optionsEn:['Start writing at once','Outline first','Choose font first','Print paper first'],
          answer:'先列出大纲', hintZh:'先规划好大纲，写正文才有方向，效率更高', hintEn:'Outlining first gives you direction — much more efficient' },

        { premiseZh:'Amy要买3样东西，清单写在纸上。',           premiseEn:'Amy needs to buy 3 items; the list is written on paper.',
          questionZh:'进超市前最重要的是？',                   questionEn:'What is most important before entering the supermarket?',
          options:['先挑喜欢的东西','先检查自己的钱','先找购物车','先看价格标签'],
          optionsEn:['Pick favorites first','Check how much money you have','Get a cart first','Look at price tags first'],
          answer:'先检查自己的钱', hintZh:'先知道有多少预算，才能合理选购', hintEn:'Know your budget before shopping so you can plan well' },

        { premiseZh:'要用积木搭一座高塔。',                    premiseEn:'You are building a tall tower with blocks.',
          questionZh:'哪种搭法最稳固？',                       questionEn:'Which approach makes the most stable tower?',
          options:['小块在底，大块在上','大块在底，小块在上','随机堆放','全用同样大小的'],
          optionsEn:['Small blocks on bottom, big on top','Big blocks on bottom, small on top','Stack randomly','All same size'],
          answer:'大块在底，小块在上', hintZh:'底部越宽越重，塔越不容易倒', hintEn:'A wide, heavy base makes the tower much more stable' },

        { premiseZh:'要参加明天的跑步比赛。',                   premiseEn:'You have a running race tomorrow.',
          questionZh:'今天最应该做什么？',                     questionEn:'What is the most important thing to do today?',
          options:['参加比赛','好好休息','立刻剧烈训练','担心输掉'],
          optionsEn:['Join the race','Rest well','Train intensely now','Worry about losing'],
          answer:'好好休息', hintZh:'比赛前好好休息，明天才能发挥最好状态', hintEn:'Rest well before a race so you can perform your best tomorrow' },

        { premiseZh:'Tom做数学题做到一半，遇到一道不会的难题。',  premiseEn:'Tom is halfway through his math homework and hits a hard problem he cannot solve.',
          questionZh:'下一步最好怎么做？',                     questionEn:'What is the best next step?',
          options:['跳过继续做其他题','直接放弃','假装会做','随便填一个答案'],
          optionsEn:['Skip it and do the others first','Give up','Pretend to know','Write any answer'],
          answer:'跳过继续做其他题', hintZh:'先做会的，最后再回来攻克难题', hintEn:'Finish what you can first, then come back to the hard one' },

        { premiseZh:'要浇花。花盆、水、水壶都在不同地方。',      premiseEn:'You need to water the plant. The pot, water, and watering can are in different places.',
          questionZh:'哪个顺序是对的？',                       questionEn:'Which order is correct?',
          options:['先找水壶再倒水再浇','先倒水再找水壶','先浇花再找水','直接用手浇'],
          optionsEn:['Get can → fill → water plant','Fill water first then find can','Water plant then find water','Water by hand'],
          answer:'先找水壶再倒水再浇', hintZh:'工具→准备→行动，这个顺序最合理', hintEn:'Get tool → prepare → act: the correct sequence' },

        { premiseZh:'班里下周有演讲比赛。',                     premiseEn:'Your class has a speech competition next week.',
          questionZh:'本周最重要的准备是什么？',                 questionEn:'What is the most important preparation this week?',
          options:['买新衣服','练习演讲内容','等待比赛到来','告诉所有朋友'],
          optionsEn:['Buy new clothes','Practice the speech','Wait for the day','Tell all your friends'],
          answer:'练习演讲内容', hintZh:'内容和练习是演讲最关键的准备', hintEn:'The content and practice are the most critical preparations' },

        { premiseZh:'要做饭，食材、锅、火都已准备好。',           premiseEn:'You are about to cook. Ingredients, pan, and stove are all ready.',
          questionZh:'哪个步骤要最先完成？',                   questionEn:'Which step should be done first?',
          options:['先装盘','先开火','先洗食材','先吃'],
          optionsEn:['Plate the food','Turn on the stove','Wash the ingredients','Eat first'],
          answer:'先洗食材', hintZh:'食材要先洗干净才能下锅', hintEn:'Wash ingredients before cooking — always' },

        { premiseZh:'Bob爬山，山路分三段，每段坡度越来越陡。',    premiseEn:'Bob is hiking. The trail has three sections, each steeper than the last.',
          questionZh:'哪种节奏最合理？',                       questionEn:'Which pacing strategy is most sensible?',
          options:['开始就全速冲','慢慢走保留体力','中途才加速','到顶再开始跑'],
          optionsEn:['Sprint at full speed from the start','Walk slowly to conserve energy','Speed up midway','Start running at the top'],
          answer:'慢慢走保留体力', hintZh:'保留体力，才能坚持走完越来越陡的路', hintEn:'Conserve energy to handle the increasingly steep sections' },

        { premiseZh:'Lily有5分钟休息时间，有两件事：喝水（1分钟）和整理书包（3分钟）。',
          premiseEn:'Lily has 5 minutes of break time. Two tasks: drink water (1 min) and pack her bag (3 min).',
          questionZh:'最合理的选择是？',                       questionEn:'What is the most sensible choice?',
          options:['只喝水','只整理书包','喝水和整理书包','什么都不做'],
          optionsEn:['Only drink water','Only pack bag','Drink water AND pack bag','Do nothing'],
          answer:'喝水和整理书包', hintZh:'1+3=4分钟，5分钟内能完成两件事', hintEn:'1+3=4 min — both fit within 5 minutes' }
      ]
    },

    // ── Unit 2: 最优选择  (Pick the best option from alternatives) ────────
    {
      id: '2', icon: '🏆',
      nameZh: '最优选择', nameEn: 'Best Choice',
      descZh: '面对多个选项，哪一个最省时、最省钱或最高效？', descEn: 'Given multiple options, which is fastest, cheapest, or most efficient?',
      questions: [
        { premiseZh:'3条路去学校：A路10分钟，B路7分钟，C路15分钟。',
          premiseEn:'3 routes to school: Route A 10 min, Route B 7 min, Route C 15 min.',
          questionZh:'走哪条最省时间？',                       questionEn:'Which route is fastest?',
          options:['A路','B路','C路','都一样'],                optionsEn:['Route A','Route B','Route C','All the same'],
          answer:'B路', hintZh:'B路只需7分钟，是最短的', hintEn:'Route B takes only 7 min — the shortest' },

        { premiseZh:'买苹果：店A卖4元/斤，店B卖3元/斤，店C卖5元/斤。',
          premiseEn:'Buying apples: Shop A ¥4/kg, Shop B ¥3/kg, Shop C ¥5/kg.',
          questionZh:'在哪家买最便宜？',                       questionEn:'Which shop is cheapest?',
          options:['店A','店B','店C','三家一样'],              optionsEn:['Shop A','Shop B','Shop C','All the same'],
          answer:'店B', hintZh:'店B只需3元/斤，最便宜', hintEn:'Shop B is cheapest at ¥3/kg' },

        { premiseZh:'做同一道题有两种方法：方法A要5步，方法B要3步，两种方法都正确。',
          premiseEn:'Two methods to solve a problem: Method A takes 5 steps, Method B takes 3 steps. Both are correct.',
          questionZh:'哪种方法更高效？',                       questionEn:'Which method is more efficient?',
          options:['方法A','方法B','两种一样','不能判断'],       optionsEn:['Method A','Method B','Both the same','Cannot tell'],
          answer:'方法B', hintZh:'步骤更少，同样能解出答案，方法B更高效', hintEn:'Fewer steps with the same correct result → Method B is more efficient' },

        { premiseZh:'4包饼干：A包3块1元，B包4块1元，C包2块1元，D包5块1元，价格一样。',
          premiseEn:'4 packs of biscuits at ¥1 each: Pack A=3, B=4, C=2, D=5 biscuits.',
          questionZh:'哪包饼干最划算？',                       questionEn:'Which pack gives the best value?',
          options:['A包','B包','C包','D包'],                   optionsEn:['Pack A','Pack B','Pack C','Pack D'],
          answer:'D包', hintZh:'D包5块最多，同样1元买得最多', hintEn:'Pack D gives 5 biscuits for ¥1 — the best value' },

        { premiseZh:'从北京去上海：飞机2小时，高铁5小时，汽车15小时，步行200小时。',
          premiseEn:'Beijing to Shanghai: plane 2h, bullet train 5h, bus 15h, walking 200h.',
          questionZh:'赶时间时选哪种最好？',                   questionEn:'If you are in a hurry, which is best?',
          options:['飞机','高铁','汽车','步行'],               optionsEn:['Plane','Bullet train','Bus','Walking'],
          answer:'飞机', hintZh:'飞机2小时最快，赶时间选飞机', hintEn:'Plane takes only 2h — fastest when time matters' },

        { premiseZh:'3个小组完成任务：A组用了20分钟，B组用了15分钟，C组用了30分钟。',
          premiseEn:'3 groups finished a task: Group A: 20 min, Group B: 15 min, Group C: 30 min.',
          questionZh:'哪组效率最高？',                         questionEn:'Which group was most efficient?',
          options:['A组','B组','C组','一样高'],                optionsEn:['Group A','Group B','Group C','All equal'],
          answer:'B组', hintZh:'B组15分钟最快，效率最高', hintEn:'Group B finished fastest at 15 min → most efficient' },

        { premiseZh:'Amy有5分钟。喝水要1分钟，整理书包要3分钟，看一本书要10分钟。',
          premiseEn:'Amy has 5 minutes. Drinking water: 1 min; packing bag: 3 min; reading a book: 10 min.',
          questionZh:'5分钟内能完成哪些？',                   questionEn:'Which tasks can be done within 5 minutes?',
          options:['只喝水','喝水和整理书包','看书','什么都来不及'],
          optionsEn:['Only drink water','Drink water AND pack bag','Read the book','Nothing fits'],
          answer:'喝水和整理书包', hintZh:'1+3=4分钟≤5分钟，两件事都能完成', hintEn:'1+3=4 min ≤ 5 min — both tasks fit' },

        { premiseZh:'Tom有25元，想买零食10元和文具12元。',
          premiseEn:'Tom has ¥25. Snacks cost ¥10, stationery costs ¥12.',
          questionZh:'两样都能买到吗？',                       questionEn:'Can he buy both?',
          options:['能，还剩3元','不能，钱不够','刚好够，一分不剩','无法判断'],
          optionsEn:['Yes, ¥3 left','No, not enough money','Exactly enough — nothing left','Cannot tell'],
          answer:'能，还剩3元', hintZh:'10+12=22，25-22=3，还剩3元', hintEn:'10+12=22; 25-22=3 → ¥3 left over' },

        { premiseZh:'Amy存钱：每天存2元需要5天，每天存1元需要10天，目标是存10元。',
          premiseEn:'Amy wants to save ¥10. Saving ¥2/day takes 5 days; ¥1/day takes 10 days.',
          questionZh:'哪种方式更快存够？',                     questionEn:'Which approach reaches the goal faster?',
          options:['每天1元','每天2元','两种一样','无法存够'],    optionsEn:['¥1/day','¥2/day','Same speed','Cannot save enough'],
          answer:'每天2元', hintZh:'每天存2元只需5天，更快', hintEn:'¥2/day reaches ¥10 in just 5 days — twice as fast' },

        { premiseZh:'Jack要完成3件事：A事5分、B事3分、C事8分，时间只够做2件。',
          premiseEn:'Jack needs to do 3 tasks: A=5pts, B=3pts, C=8pts. He only has time for 2.',
          questionZh:'怎么选能得分最高？',                     questionEn:'Which two tasks maximize his score?',
          options:['选A和B','选A和C','选B和C','哪两件都一样'],   optionsEn:['A+B','A+C','B+C','All pairs equal'],
          answer:'选A和C', hintZh:'A+C=5+8=13分，高于A+B=8或B+C=11', hintEn:'A+C=13 pts, higher than A+B=8 or B+C=11' }
      ]
    },

    // ── Unit 3: 合理分配  (Fair / optimal allocation) ─────────────────────
    {
      id: '3', icon: '⚖️',
      nameZh: '合理分配', nameEn: 'Smart Allocation',
      descZh: '把资源（时间、物品、钱）合理分配，才能让结果最优', descEn: 'Distribute resources (time, items, money) to get the best outcome',
      questions: [
        { premiseZh:'7个苹果分给2个人，要让两人数量最接近。',
          premiseEn:'Share 7 apples between 2 people as equally as possible.',
          questionZh:'应该怎么分？',                           questionEn:'How should they be divided?',
          options:['一人3个一人4个','一人2个一人5个','一人1个一人6个','两人都拿7个'],
          optionsEn:['3 and 4','2 and 5','1 and 6','Both take 7'],
          answer:'一人3个一人4个', hintZh:'7=3+4，差只有1个，是最接近的分法', hintEn:'3+4=7; difference of only 1 — the closest split possible' },

        { premiseZh:'班里有30个同学，要分成5个人数相等的小组。',
          premiseEn:'A class of 30 students is divided into 5 equal groups.',
          questionZh:'每组有几个人？',                         questionEn:'How many students are in each group?',
          options:['5人','6人','7人','8人'],                   optionsEn:['5','6','7','8'],
          answer:'6人', hintZh:'30÷5=6，每组6人', hintEn:'30÷5=6 — 6 students per group' },

        { premiseZh:'Amy要把18块糖平均分给3个朋友。',
          premiseEn:'Amy wants to share 18 candies equally among 3 friends.',
          questionZh:'每人能分到几块？',                       questionEn:'How many candies does each friend get?',
          options:['4块','5块','6块','7块'],                   optionsEn:['4','5','6','7'],
          answer:'6块', hintZh:'18÷3=6，每人6块', hintEn:'18÷3=6 — 6 candies each' },

        { premiseZh:'4个小朋友一起搭积木，只有12块积木，要平均分配。',
          premiseEn:'4 kids share 12 building blocks equally.',
          questionZh:'每人分到几块？',                         questionEn:'How many blocks does each child get?',
          options:['2块','3块','4块','5块'],                   optionsEn:['2','3','4','5'],
          answer:'3块', hintZh:'12÷4=3，每人3块', hintEn:'12÷4=3 — 3 blocks each' },

        { premiseZh:'Tom有24元，想买3样同等重要的东西，每样价格相同。',
          premiseEn:'Tom has ¥24 and wants to buy 3 equally important items at the same price.',
          questionZh:'每样东西最多花多少钱？',                 questionEn:'What is the maximum price per item?',
          options:['6元','8元','10元','12元'],                  optionsEn:['¥6','¥8','¥10','¥12'],
          answer:'8元', hintZh:'24÷3=8，每样最多花8元', hintEn:'24÷3=8 — maximum ¥8 per item' },

        { premiseZh:'一根20厘米的绳子，要剪成5段等长的小段。',
          premiseEn:'A 20 cm rope is cut into 5 equal pieces.',
          questionZh:'每段多长？',                             questionEn:'How long is each piece?',
          options:['2厘米','4厘米','5厘米','10厘米'],            optionsEn:['2 cm','4 cm','5 cm','10 cm'],
          answer:'4厘米', hintZh:'20÷5=4，每段4厘米', hintEn:'20÷5=4 — each piece is 4 cm' },

        { premiseZh:'图书馆有15本书，要放进3个书架，每个书架放一样多。',
          premiseEn:'A library has 15 books to distribute equally among 3 shelves.',
          questionZh:'每个书架放几本？',                       questionEn:'How many books per shelf?',
          options:['3本','4本','5本','6本'],                   optionsEn:['3','4','5','6'],
          answer:'5本', hintZh:'15÷3=5，每个书架5本', hintEn:'15÷3=5 — 5 books per shelf' },

        { premiseZh:'Amy买了两张电影票，一张50元，另一张40元，两人平摊费用。',
          premiseEn:'Amy bought two movie tickets: one for ¥50 and one for ¥40. They split the total cost equally.',
          questionZh:'每人应该付多少？',                       questionEn:'How much does each person pay?',
          options:['40元','45元','50元','55元'],                optionsEn:['¥40','¥45','¥50','¥55'],
          answer:'45元', hintZh:'50+40=90，90÷2=45，每人45元', hintEn:'50+40=90; 90÷2=45 — ¥45 each' },

        { premiseZh:'Tom需要在3小时内完成数学、语文、英语三门作业，每门大约1小时。',
          premiseEn:'Tom must finish 3 subjects in 3 hours. Each takes about 1 hour.',
          questionZh:'时间够吗？',                             questionEn:'Is the time enough?',
          options:['够，刚刚好','不够，时间太短','多出1小时','无法确定'],
          optionsEn:['Yes, exactly enough','No, not enough','1 hour to spare','Cannot tell'],
          answer:'够，刚刚好', hintZh:'1+1+1=3，刚好3小时', hintEn:'1+1+1=3 — exactly 3 hours, just enough' },

        { premiseZh:'要完成3件事：洗碗（2分钟）、打电话（10分钟）、写作业（30分钟）。只有12分钟。',
          premiseEn:'3 tasks: wash dishes (2 min), make a call (10 min), do homework (30 min). You have 12 minutes.',
          questionZh:'最合理的安排是？',                       questionEn:'What is the most sensible plan?',
          options:['洗碗和打电话','只写作业','洗碗和写作业','只洗碗'],
          optionsEn:['Wash dishes + make call','Only homework','Wash dishes + homework','Only wash dishes'],
          answer:'洗碗和打电话', hintZh:'2+10=12分钟，刚好完成两件事', hintEn:'2+10=12 min — exactly fits the available time' }
      ]
    },

    // ── Unit 4: 多步预测  (Predict outcomes after several actions, G2) ─────
    {
      id: '4', icon: '🔮',
      nameZh: '多步预测', nameEn: 'Multi-step Prediction',
      descZh: '预测几个步骤之后的结果——这是策略思维的核心', descEn: 'Predict what happens after several steps — the core of strategic thinking',
      questions: [
        { premiseZh:'Tom有15元，买了6元的笔记本和4元的铅笔。',
          premiseEn:'Tom has ¥15. He buys a notebook for ¥6 and a pencil for ¥4.',
          questionZh:'Tom还剩多少钱？',                        questionEn:'How much money does Tom have left?',
          options:['3元','5元','7元','9元'],                   optionsEn:['¥3','¥5','¥7','¥9'],
          answer:'5元', hintZh:'6+4=10，15-10=5', hintEn:'6+4=10; 15-10=5' },

        { premiseZh:'班里有25人，来了5人后又走了3人。',
          premiseEn:'There are 25 students in class. 5 more arrive, then 3 leave.',
          questionZh:'现在班里有多少人？',                     questionEn:'How many students are in class now?',
          options:['25人','27人','30人','22人'],               optionsEn:['25','27','30','22'],
          answer:'27人', hintZh:'25+5=30，30-3=27', hintEn:'25+5=30; 30-3=27' },

        { premiseZh:'Jack种了一棵每周长2厘米的树苗，现在10厘米高。',
          premiseEn:"Jack's seedling grows 2 cm per week. It is currently 10 cm tall.",
          questionZh:'4周后树苗有多高？',                      questionEn:'How tall will it be in 4 weeks?',
          options:['14厘米','16厘米','18厘米','20厘米'],        optionsEn:['14 cm','16 cm','18 cm','20 cm'],
          answer:'18厘米', hintZh:'4周×2厘米=8厘米，10+8=18厘米', hintEn:'4×2=8 cm growth; 10+8=18 cm' },

        { premiseZh:'Tom有20块糖，送给Amy 5块，又买了8块。',
          premiseEn:'Tom has 20 candies. He gives 5 to Amy, then buys 8 more.',
          questionZh:'Tom现在有多少块糖？',                    questionEn:'How many candies does Tom have now?',
          options:['18块','23块','25块','13块'],               optionsEn:['18','23','25','13'],
          answer:'23块', hintZh:'20-5=15，15+8=23', hintEn:'20-5=15; 15+8=23' },

        { premiseZh:'一条绳子48厘米，剪掉12厘米后再对折。',
          premiseEn:'A rope is 48 cm long. Cut off 12 cm, then fold the remainder in half.',
          questionZh:'对折后每段多长？',                       questionEn:'How long is each half after folding?',
          options:['12厘米','18厘米','24厘米','36厘米'],        optionsEn:['12 cm','18 cm','24 cm','36 cm'],
          answer:'18厘米', hintZh:'48-12=36，36÷2=18', hintEn:'48-12=36; 36÷2=18' },

        { premiseZh:'水池有60升水，每小时流出8升，流入3升。',
          premiseEn:'A pool has 60 L of water. Each hour 8 L flows out and 3 L flows in.',
          questionZh:'2小时后水池还有多少升？',                 questionEn:'How much water is in the pool after 2 hours?',
          options:['50升','55升','46升','60升'],               optionsEn:['50 L','55 L','46 L','60 L'],
          answer:'50升', hintZh:'每小时净流出8-3=5升，2小时=10升，60-10=50', hintEn:'Net out = 8-3=5 L/hr; 2hr×5=10; 60-10=50' },

        { premiseZh:'Amy存钱：第一周5元，第二周7元，第三周9元。',
          premiseEn:'Amy saves: Week 1: ¥5, Week 2: ¥7, Week 3: ¥9.',
          questionZh:'三周共存了多少元？',                     questionEn:'How much has she saved in total after 3 weeks?',
          options:['18元','21元','24元','27元'],               optionsEn:['¥18','¥21','¥24','¥27'],
          answer:'21元', hintZh:'5+7+9=21', hintEn:'5+7+9=21' },

        { premiseZh:'书架上有4层，每层6本书。Tom拿走了第三层的2本。',
          premiseEn:'A bookshelf has 4 shelves, each with 6 books. Tom takes 2 books from the 3rd shelf.',
          questionZh:'书架上还有多少本书？',                   questionEn:'How many books remain on the shelf?',
          options:['20本','22本','24本','26本'],               optionsEn:['20','22','24','26'],
          answer:'22本', hintZh:'4×6=24，24-2=22', hintEn:'4×6=24; 24-2=22' },

        { premiseZh:'Eva骑车平均每分钟300米，骑了5分钟后休息，再骑3分钟。',
          premiseEn:'Eva cycles at 300 m/min. She rides 5 min, rests, then rides 3 more min.',
          questionZh:'一共骑了多少米？',                       questionEn:'What is the total distance cycled?',
          options:['1500米','2100米','2400米','2700米'],        optionsEn:['1500 m','2100 m','2400 m','2700 m'],
          answer:'2400米', hintZh:'(5+3)×300=8×300=2400米', hintEn:'(5+3)×300=2400 m' },

        { premiseZh:'班里每天来3个新同学，也走2个同学，班里现在有20人。',
          premiseEn:'Each day 3 new students join the class and 2 leave. There are currently 20 students.',
          questionZh:'3天后班里有多少人？',                    questionEn:'How many students will there be after 3 days?',
          options:['21人','23人','25人','26人'],               optionsEn:['21','23','25','26'],
          answer:'23人', hintZh:'每天净增1人，3天后20+3=23', hintEn:'Net gain = 1/day; 20+3=23 after 3 days' }
      ]
    },

    // ── Unit 5: 简单博弈  (Simple 2-player game strategy, G2) ──────────────
    {
      id: '5', icon: '🎮',
      nameZh: '简单博弈', nameEn: 'Simple Game Strategy',
      descZh: '在小游戏中预判对方行动，找出最优对策', descEn: 'Anticipate your opponent\'s moves and find the best counter-strategy',
      questions: [
        { premiseZh:'石头剪刀布：Amy每次都出石头，Tom想每次都赢。',
          premiseEn:'Rock Paper Scissors: Amy always plays Rock. Tom wants to win every round.',
          questionZh:'Tom应该出什么？',                        questionEn:'What should Tom play?',
          options:['石头','剪刀','布','每次不同'],              optionsEn:['Rock','Scissors','Paper','Vary each time'],
          answer:'布', hintZh:'布包石头，Amy出石头，Tom出布每次都赢', hintEn:'Paper beats Rock — Amy always plays Rock, so Tom should always play Paper' },

        { premiseZh:'取糖游戏：桌上4颗糖，每次取1或2颗，取最后一颗的人赢，你先取。',
          premiseEn:'Taking game: 4 candies on the table. Each turn take 1 or 2. Whoever takes the last one wins. You go first.',
          questionZh:'你应该先取几颗才能赢？',                  questionEn:'How many should you take first to guarantee a win?',
          options:['1颗','2颗','3颗','随意取'],                optionsEn:['1','2','3','Take any amount'],
          answer:'1颗', hintZh:'取1颗剩3颗，对方取1剩2你取2赢，对方取2剩1你取1赢', hintEn:'Take 1 → leave 3. Opponent takes 1 → you take 2 (win). Opponent takes 2 → you take 1 (win).' },

        { premiseZh:'Amy和Tom玩猜拳：Tom每次都出剪刀，Amy想赢。',
          premiseEn:'Rock Paper Scissors: Tom always plays Scissors. Amy wants to win.',
          questionZh:'Amy应该出什么？',                        questionEn:'What should Amy play?',
          options:['石头','剪刀','布','随机出'],               optionsEn:['Rock','Scissors','Paper','Play randomly'],
          answer:'石头', hintZh:'石头赢剪刀，Tom出剪刀，Amy出石头每次都赢', hintEn:'Rock beats Scissors — Tom always plays Scissors, so Amy should always play Rock' },

        { premiseZh:'猜数字游戏：Bob在1到5中想一个数，Amy要用最少次数猜出来。',
          premiseEn:'Guessing game: Bob picks a number from 1–5. Amy wants to guess it in as few tries as possible.',
          questionZh:'Amy第一次应该猜几？',                    questionEn:'What number should Amy guess first?',
          options:['1','2','3','5'],                          optionsEn:['1','2','3','5'],
          answer:'3', hintZh:'猜3把1-5分成两半，最多再猜2次就能确定', hintEn:'Guess 3 splits 1–5 in half — at most 2 more guesses to pinpoint the number' },

        { premiseZh:'棋盘游戏：轮流走，每次走1步或2步，谁先到第10格谁赢。现在在第7格，轮到你。',
          premiseEn:'Board game: take turns moving 1 or 2 steps. Whoever reaches square 10 first wins. You are on square 7, your turn.',
          questionZh:'你应该走几步才能赢？',                   questionEn:'How many steps should you move to win?',
          options:['1步','2步','3步','走不到'],               optionsEn:['1 step','2 steps','3 steps','Cannot reach'],
          answer:'3步', hintZh:'7+3=10，正好到终点！不过每次最多2步，分两次：走2到9再走1到10', hintEn:'7+3=10 reaches the goal. Take 2 steps (→9) then 1 step (→10).' },

        { premiseZh:'轮流报数游戏：从1开始，每人报1个或2个连续数字，先报到10的人赢。已经报到8了，轮到你。',
          premiseEn:'Number game: take turns saying 1 or 2 consecutive numbers starting from 1. First to say 10 wins. Numbers up to 8 have been said. Your turn.',
          questionZh:'你应该怎么报？',                         questionEn:'What should you say?',
          options:['只报9','报9和10','只报10','不报'],          optionsEn:['Say only 9','Say 9 and 10','Say only 10','Say nothing'],
          answer:'报9和10', hintZh:'报9和10，包含10，你赢了', hintEn:'Say "9, 10" — that includes 10, so you win' },

        { premiseZh:'Tom和Bob玩猜拳，赢了得2分，输了扣1分。Tom想得分。Bob出布。',
          premiseEn:'Rock Paper Scissors: Win = +2 pts, Lose = −1 pt. Tom wants to score. Bob plays Paper.',
          questionZh:'Tom应该出什么？',                        questionEn:'What should Tom play?',
          options:['石头','剪刀','布','随机'],                  optionsEn:['Rock','Scissors','Paper','Random'],
          answer:'剪刀', hintZh:'剪刀赢布，Tom出剪刀得2分', hintEn:'Scissors beats Paper — Tom plays Scissors to gain 2 pts' },

        { premiseZh:'扑克牌游戏：你手里有3、6、9。对方上次出了4，你要出比4大的牌，尽量出最小的。',
          premiseEn:'Card game: you hold 3, 6, 9. Opponent played 4. You must play a higher card — play as small as possible.',
          questionZh:'你应该出几？',                           questionEn:'Which card should you play?',
          options:['3','6','9','不出牌'],                      optionsEn:['3','6','9','Pass'],
          answer:'6', hintZh:'6比4大，比9更小，出6保留最大的9', hintEn:'6 beats 4 and is smaller than 9 — play 6 to save your big card' },

        { premiseZh:'Amy和Bob比跑步：Amy跑100米用20秒，Bob用25秒，同时出发。',
          premiseEn:'Amy and Bob race 100 m. Amy finishes in 20 s, Bob in 25 s. They start together.',
          questionZh:'谁先到终点？',                           questionEn:'Who reaches the finish line first?',
          options:['Amy','Bob','同时','无法判断'],              optionsEn:['Amy','Bob','Same time','Cannot tell'],
          answer:'Amy', hintZh:'Amy用时更少，先到达终点', hintEn:'Amy takes less time → she finishes first' },

        { premiseZh:'石头剪刀布三局两胜：前两局Amy赢了一局，Tom赢了一局。',
          premiseEn:'Rock Paper Scissors, best of 3: Amy won 1 round, Tom won 1 round.',
          questionZh:'还需要几局决出胜负？',                   questionEn:'How many more rounds are needed to determine the winner?',
          options:['0局','1局','2局','3局'],                   optionsEn:['0 more','1 more','2 more','3 more'],
          answer:'1局', hintZh:'各赢1局，再赢1局就是2局，胜负立即揭晓', hintEn:'Each has 1 win; whoever wins the next round wins the match' }
      ]
    },

    // ── Unit 6: 综合策略  (Multi-factor mixed strategy, G2) ────────────────
    {
      id: '6', icon: '🧭',
      nameZh: '综合策略', nameEn: 'Mixed Strategy',
      descZh: '同时考虑多个因素，做出最合理的决策', descEn: 'Consider multiple factors together to make the most reasonable decision',
      questions: [
        { premiseZh:'天气预报：明天下雨概率80%，Amy明天有户外活动。',
          premiseEn:'Weather forecast: 80% chance of rain tomorrow. Amy has an outdoor event tomorrow.',
          questionZh:'Amy今天最应该准备什么？',                 questionEn:'What should Amy prepare today?',
          options:['带雨伞','穿短袖','取消活动','什么都不带'],   optionsEn:['Bring an umbrella','Wear short sleeves','Cancel the event','Bring nothing'],
          answer:'带雨伞', hintZh:'80%概率下雨，最保险的做法是带雨伞', hintEn:'80% rain chance — bringing an umbrella is the safest choice' },

        { premiseZh:'三支队伍比赛。A队赢了B队，B队赢了C队。',
          premiseEn:'Three teams competed. Team A beat Team B; Team B beat Team C.',
          questionZh:'最合理的排名是？',                       questionEn:'What is the most reasonable ranking?',
          options:['A第一B第二C第三','B第一A第二C第三','C第一A第二B第三','无法确定'],
          optionsEn:['A 1st, B 2nd, C 3rd','B 1st, A 2nd, C 3rd','C 1st, A 2nd, B 3rd','Cannot determine'],
          answer:'A第一B第二C第三', hintZh:'A>B>C，所以A第一，B第二，C第三', hintEn:'A beat B, B beat C → A>B>C ranking' },

        { premiseZh:'Tom在超市买了15元东西，身上只有20元。还想买一个5元的零食。',
          premiseEn:'Tom spent ¥15 in a shop and has only ¥20 with him. He wants to also buy a ¥5 snack.',
          questionZh:'Tom能买零食吗？',                        questionEn:'Can Tom buy the snack?',
          options:['能，还剩5元','不能，钱不够','刚好够，一分不剩','无法判断'],
          optionsEn:['Yes, ¥5 left','No, not enough','Exactly right — nothing left','Cannot tell'],
          answer:'能，还剩5元', hintZh:'20-15=5元，正好能买5元的零食', hintEn:'20-15=5; exactly enough to buy the ¥5 snack' },

        { premiseZh:'班里同学投票选班长：Amy 12票，Bob 8票，Jack 10票，共30票。',
          premiseEn:'Class vote for team leader: Amy 12 votes, Bob 8 votes, Jack 10 votes (30 total).',
          questionZh:'谁当选班长？',                           questionEn:'Who is elected team leader?',
          options:['Amy','Bob','Jack','没有人当选'],           optionsEn:['Amy','Bob','Jack','No one elected'],
          answer:'Amy', hintZh:'Amy得票最多（12票），当选班长', hintEn:'Amy has the most votes (12) → she is elected' },

        { premiseZh:'Tom和Amy的作业效率：Tom每小时做10道题，Amy每小时做8道题，两人都要做40道题。',
          premiseEn:'Tom does 10 problems/hr, Amy does 8/hr. Both need to complete 40 problems.',
          questionZh:'Tom比Amy少用多少时间？',                  questionEn:'How much less time does Tom need than Amy?',
          options:['0.5小时','1小时','1.5小时','2小时'],        optionsEn:['0.5 hr','1 hr','1.5 hr','2 hr'],
          answer:'1小时', hintZh:'Tom用40÷10=4小时，Amy用40÷8=5小时，差1小时', hintEn:'Tom: 40÷10=4 hr; Amy: 40÷8=5 hr; difference = 1 hr' },

        { premiseZh:'Bob要选课外活动：游泳课每周2次，绘画课每周1次，时间都不冲突。他喜欢游泳多于绘画，但妈妈希望他学绘画。',
          premiseEn:'Bob can choose: swimming twice/week or painting once/week. He prefers swimming, but his mom prefers painting.',
          questionZh:'最合理的做法是？',                       questionEn:'What is the most reasonable approach?',
          options:['只选游泳','只选绘画','两个都选','什么都不选'],
          optionsEn:['Only swimming','Only painting','Choose both','Choose neither'],
          answer:'两个都选', hintZh:'时间不冲突，两个都选既满足自己也满足妈妈', hintEn:'No schedule conflict — choosing both satisfies his preference and his mom\'s wish' },

        { premiseZh:'Amy买苹果：大苹果2元一个，是小苹果重量的2倍，小苹果1元一个。',
          premiseEn:'Large apple: ¥2, twice the weight of a small apple (¥1 each).',
          questionZh:'只在乎重量，哪种更划算？',                questionEn:'Considering only weight per money, which is better value?',
          options:['大苹果','小苹果','一样划算','无法判断'],     optionsEn:['Large apple','Small apple','Equal value','Cannot tell'],
          answer:'一样划算', hintZh:'大苹果2元2倍重=1元/倍重；小苹果1元1倍重=1元/倍重，一样', hintEn:'Large: ¥2 for 2× weight = ¥1 per unit weight. Small: ¥1 for 1× weight = ¥1 per unit weight. Equal.' },

        { premiseZh:'Jack要去买东西，但路上有两条路：近路要过一条可能很拥挤的桥，远路不经过桥但多走10分钟。今天是节假日，桥上一定很拥挤。',
          premiseEn:'Jack can take a short route over a bridge (likely crowded) or a longer route (10 min more) that avoids the bridge. Today is a holiday — the bridge is definitely crowded.',
          questionZh:'Jack应该选哪条路？',                     questionEn:'Which route should Jack take?',
          options:['走近路过桥','走远路绕开桥','哪条都一样','不去买东西'],
          optionsEn:['Short route over bridge','Long route avoiding bridge','Same either way','Don\'t go'],
          answer:'走远路绕开桥', hintZh:'节假日桥一定拥挤，多走10分钟比堵在桥上合算', hintEn:'Bridge is definitely crowded on holidays — 10 extra min walking beats being stuck in a jam' },

        { premiseZh:'Lily有3个选项：A给她5分好处和3分代价，B给她4分好处和1分代价，C给她6分好处和5分代价。',
          premiseEn:'Lily has 3 options: A gives +5 benefit −3 cost; B gives +4 benefit −1 cost; C gives +6 benefit −5 cost.',
          questionZh:'净得分最高的选项是？',                   questionEn:'Which option gives the highest net score?',
          options:['选A（净得2分）','选B（净得3分）','选C（净得1分）','都一样'],
          optionsEn:['Option A (net +2)','Option B (net +3)','Option C (net +1)','All equal'],
          answer:'选B（净得3分）', hintZh:'A=5-3=2，B=4-1=3，C=6-5=1，B净得分最高', hintEn:'A=5-3=2, B=4-1=3, C=6-5=1 → B has highest net score' },

        { premiseZh:'Eva和Tom赛跑，赛程1000米。Eva每分钟跑200米，Tom每分钟跑250米，同时出发。',
          premiseEn:'Eva and Tom race 1000 m. Eva runs 200 m/min, Tom runs 250 m/min. They start together.',
          questionZh:'Tom比Eva早几分钟到达终点？',              questionEn:'How many minutes earlier does Tom finish?',
          options:['0.5分钟','1分钟','1.5分钟','2分钟'],       optionsEn:['0.5 min','1 min','1.5 min','2 min'],
          answer:'1分钟', hintZh:'Eva用1000÷200=5分钟，Tom用1000÷250=4分钟，差1分钟', hintEn:'Eva: 1000÷200=5 min; Tom: 1000÷250=4 min; difference = 1 min' }
      ]
    }
  ]
};
