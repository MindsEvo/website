/**
 * Math Logic — Game Data  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Logic 逻辑
 *
 * RootGene: Hypothesis, Elimination
 * Meta-thinking operations:
 *   - Deductive ordering   (who is tallest/fastest from clues)
 *   - Category reasoning   (All A are B; is this B an A?)
 *   - Elimination          (rule out options from constraints)
 *   - Conditional          (If A then B; A happened → B?)
 *   - Verification         (who stated the correct fact?)
 *   - Multi-step           (chain two or more steps)
 *
 * Data format:
 *   premiseZh / premiseEn  — scenario / clues
 *   questionZh / questionEn — the logical question
 *   options    — Chinese values (used for comparison in checkAnswer)
 *   optionsEn  — English display labels (parallel array)
 *   answer     — exact string matching one of `options`
 *   hintZh / hintEn — explanation shown on hint button
 */

var ML_DATA = {
  units: [

    // ── Unit 1: 顺序推断  (A > B > C, find min/max) ────────────────────────
    {
      id: '1', icon: '📏',
      nameZh: '顺序推断', nameEn: 'Ordering Reasoning',
      descZh: '从两个比较线索推断出最大或最小', descEn: 'Use two clues to find the biggest or smallest',
      questions: [
        { premiseZh:'小红比小明高，小明比小白高。',      premiseEn:'Xiaohong is taller than Xiaoming; Xiaoming is taller than Xiaobai.',
          questionZh:'谁最矮？',                       questionEn:'Who is the shortest?',
          options:['小红','小明','小白','无法判断'],    optionsEn:['Xiaohong','Xiaoming','Xiaobai','Cannot tell'],
          answer:'小白', hintZh:'从矮到高：小白→小明→小红', hintEn:'Shortest to tallest: Xiaobai→Xiaoming→Xiaohong' },

        { premiseZh:'猫比狗重，狗比兔子重。',            premiseEn:'Cat is heavier than dog; dog is heavier than rabbit.',
          questionZh:'谁最轻？',                       questionEn:'Who is lightest?',
          options:['猫','狗','兔子','无法判断'],        optionsEn:['Cat','Dog','Rabbit','Cannot tell'],
          answer:'兔子', hintZh:'从轻到重：兔子→狗→猫', hintEn:'Lightest to heaviest: Rabbit→Dog→Cat' },

        { premiseZh:'苹果比梨贵，梨比香蕉贵。',          premiseEn:'Apple costs more than pear; pear costs more than banana.',
          questionZh:'哪个最便宜？',                   questionEn:'Which is the cheapest?',
          options:['苹果','梨','香蕉','一样贵'],        optionsEn:['Apple','Pear','Banana','Same price'],
          answer:'香蕉', hintZh:'从便宜到贵：香蕉→梨→苹果', hintEn:'Cheapest to most expensive: Banana→Pear→Apple' },

        { premiseZh:'小A跑得比小B快，小B跑得比小C快。',  premiseEn:'A runs faster than B; B runs faster than C.',
          questionZh:'谁跑得最慢？',                   questionEn:'Who runs slowest?',
          options:['小A','小B','小C','一样快'],         optionsEn:['A','B','C','Same speed'],
          answer:'小C', hintZh:'从慢到快：小C→小B→小A', hintEn:'Slowest to fastest: C→B→A' },

        { premiseZh:'红绳比蓝绳长，蓝绳比黄绳长。',      premiseEn:'Red rope is longer than blue; blue is longer than yellow.',
          questionZh:'哪根最短？',                     questionEn:'Which rope is shortest?',
          options:['红绳','蓝绳','黄绳','一样长'],      optionsEn:['Red','Blue','Yellow','Same length'],
          answer:'黄绳', hintZh:'从短到长：黄绳→蓝绳→红绳', hintEn:'Shortest to longest: Yellow→Blue→Red' },

        { premiseZh:'小明比小李大，小李比小华大。',        premiseEn:'Xiaoming is older than Xiaoli; Xiaoli is older than Xiaohua.',
          questionZh:'谁最小？',                       questionEn:'Who is youngest?',
          options:['小明','小李','小华','无法判断'],     optionsEn:['Xiaoming','Xiaoli','Xiaohua','Cannot tell'],
          answer:'小华', hintZh:'从小到大：小华→小李→小明', hintEn:'Youngest to oldest: Xiaohua→Xiaoli→Xiaoming' },

        { premiseZh:'书架上红书比蓝书多，蓝书比绿书多。', premiseEn:'More red books than blue; more blue than green.',
          questionZh:'哪种书最少？',                   questionEn:'Which color has fewest books?',
          options:['红书','蓝书','绿书','一样多'],      optionsEn:['Red','Blue','Green','Same amount'],
          answer:'绿书', hintZh:'从少到多：绿书→蓝书→红书', hintEn:'Fewest to most: Green→Blue→Red' },

        { premiseZh:'大象比狮子重，狮子比猴子重。',        premiseEn:'Elephant is heavier than lion; lion is heavier than monkey.',
          questionZh:'谁最重？',                       questionEn:'Who is heaviest?',
          options:['大象','狮子','猴子','无法判断'],     optionsEn:['Elephant','Lion','Monkey','Cannot tell'],
          answer:'大象', hintZh:'从轻到重：猴子→狮子→大象', hintEn:'Lightest to heaviest: Monkey→Lion→Elephant' },

        { premiseZh:'今天气温比昨天高，明天气温比今天高。',premiseEn:'Today is warmer than yesterday; tomorrow is warmer than today.',
          questionZh:'哪天最热？',                     questionEn:'Which day is hottest?',
          options:['昨天','今天','明天','一样热'],       optionsEn:['Yesterday','Today','Tomorrow','Same temp'],
          answer:'明天', hintZh:'从冷到热：昨天→今天→明天', hintEn:'Coldest to hottest: Yesterday→Today→Tomorrow' },

        { premiseZh:'足球比篮球大，篮球比乒乓球大。',      premiseEn:'Football is bigger than basketball; basketball is bigger than table-tennis ball.',
          questionZh:'哪个球最大？',                   questionEn:'Which ball is biggest?',
          options:['足球','篮球','乒乓球','一样大'],     optionsEn:['Football','Basketball','Table-tennis','Same size'],
          answer:'足球', hintZh:'从小到大：乒乓球→篮球→足球', hintEn:'Smallest to biggest: Table-tennis→Basketball→Football' }
      ]
    },

    // ── Unit 2: 分类推断  (All A are B; does B → A?) ──────────────────────
    {
      id: '2', icon: '🔍',
      nameZh: '分类推断', nameEn: 'Category Reasoning',
      descZh: '"所有A都是B"—— 反过来成立吗？', descEn: '"All A are B" — does the reverse hold?',
      questions: [
        { premiseZh:'所有的正方形都有4条边。有一个图形有4条边。',
          premiseEn:'All squares have 4 sides. This shape has 4 sides.',
          questionZh:'这个图形一定是正方形吗？',        questionEn:'Is this shape definitely a square?',
          options:['是','不一定','不是','无法判断'],     optionsEn:['Yes','Not necessarily','No','Cannot tell'],
          answer:'不一定', hintZh:'有4条边的还可能是长方形、菱形', hintEn:'A 4-sided shape could also be a rectangle or rhombus' },

        { premiseZh:'所有的狗都是动物。贝贝是一条狗。',
          premiseEn:'All dogs are animals. Beibei is a dog.',
          questionZh:'贝贝是动物吗？',                 questionEn:'Is Beibei an animal?',
          options:['是','不是','不一定','无法判断'],     optionsEn:['Yes','No','Not necessarily','Cannot tell'],
          answer:'是', hintZh:'贝贝是狗，狗都是动物，所以贝贝是动物', hintEn:'Beibei is a dog; all dogs are animals → Beibei is an animal' },

        { premiseZh:'所有的苹果都是水果。我手里有一个水果。',
          premiseEn:'All apples are fruit. I have a fruit in my hand.',
          questionZh:'这个水果一定是苹果吗？',          questionEn:'Is this fruit definitely an apple?',
          options:['一定是','不一定是','一定不是','需更多信息'], optionsEn:['Definitely','Not necessarily','Definitely not','Need more info'],
          answer:'不一定是', hintZh:'水果可以是橙子、梨等，不一定是苹果', hintEn:'The fruit could be an orange, pear, etc.' },

        { premiseZh:'班里所有的同学今天都来上学了。小明是班里的同学。',
          premiseEn:'All classmates came to school today. Xiaoming is a classmate.',
          questionZh:'小明今天来上学了吗？',            questionEn:'Did Xiaoming come to school today?',
          options:['来了','没来','不确定','可能没来'],   optionsEn:['Yes','No','Not sure','Maybe not'],
          answer:'来了', hintZh:'所有人都来了，小明是其中一人，所以来了', hintEn:'All students came; Xiaoming is one of them → he came' },

        { premiseZh:'所有偶数都能被2整除。12是偶数。',
          premiseEn:'All even numbers are divisible by 2. 12 is even.',
          questionZh:'12能被2整除吗？',                questionEn:'Is 12 divisible by 2?',
          options:['能','不能','不一定','需要验证'],     optionsEn:['Yes','No','Not sure','Need to check'],
          answer:'能', hintZh:'12是偶数，偶数都能被2整除', hintEn:'12 is even; all even numbers are divisible by 2' },

        { premiseZh:'所有的正方形都是长方形。ABCD是一个正方形。',
          premiseEn:'All squares are rectangles. ABCD is a square.',
          questionZh:'ABCD是长方形吗？',               questionEn:'Is ABCD a rectangle?',
          options:['是','不是','不一定','只有时候是'],   optionsEn:['Yes','No','Not always','Sometimes'],
          answer:'是', hintZh:'正方形是特殊的长方形，所以是', hintEn:'A square is a special rectangle → yes' },

        { premiseZh:'班里所有喜欢踢球的同学都喜欢运动。小红喜欢运动。',
          premiseEn:'All soccer fans in class like sports. Xiaohong likes sports.',
          questionZh:'小红一定喜欢踢球吗？',            questionEn:'Does Xiaohong definitely like soccer?',
          options:['一定喜欢','不一定','一定不喜欢','无法判断'], optionsEn:['Definitely yes','Not necessarily','Definitely not','Cannot tell'],
          answer:'不一定', hintZh:'喜欢运动不代表一定喜欢踢球', hintEn:'Liking sports does not mean liking soccer specifically' },

        { premiseZh:'所有的鸟都有翅膀。企鹅是一种鸟。',
          premiseEn:'All birds have wings. A penguin is a bird.',
          questionZh:'企鹅有翅膀吗？',                 questionEn:'Does a penguin have wings?',
          options:['有','没有','不确定','只有部分有'],   optionsEn:['Yes','No','Unsure','Only some'],
          answer:'有', hintZh:'企鹅是鸟，所有鸟都有翅膀', hintEn:'Penguins are birds; all birds have wings' },

        { premiseZh:'所有喝牛奶的小朋友都长得高。小明长得很高。',
          premiseEn:'All kids who drink milk are tall. Xiaoming is tall.',
          questionZh:'小明一定喝牛奶吗？',              questionEn:'Does Xiaoming definitely drink milk?',
          options:['一定喝','不一定','一定不喝','无法判断'], optionsEn:['Definitely','Not necessarily','Definitely not','Cannot tell'],
          answer:'不一定', hintZh:'还可能因为其他原因长得高', hintEn:'He could be tall for other reasons' },

        { premiseZh:'所有的红灯亮时，车辆都要停车。红灯亮了。',
          premiseEn:'Whenever the red light is on, vehicles must stop. The red light is on.',
          questionZh:'车辆要停车吗？',                  questionEn:'Must vehicles stop?',
          options:['要','不要','不一定','看情况'],       optionsEn:['Yes','No','Not sure','Depends'],
          answer:'要', hintZh:'红灯亮了，根据规则一定要停', hintEn:'Red light is on → vehicles must stop' }
      ]
    },

    // ── Unit 3: 排除推理  (Eliminate options by constraints) ──────────────
    {
      id: '3', icon: '✂️',
      nameZh: '排除推理', nameEn: 'Process of Elimination',
      descZh: '用已知条件逐一排除，找出唯一可能的答案', descEn: 'Use clues to rule out options one by one',
      questions: [
        { premiseZh:'有衣服颜色：红、蓝、绿各一件。小明不穿红色，也不穿蓝色。',
          premiseEn:'Three shirts: red, blue, green. Xiaoming does not wear red or blue.',
          questionZh:'小明穿哪种颜色？',               questionEn:"What color does Xiaoming wear?",
          options:['红色','蓝色','绿色','无法判断'],    optionsEn:['Red','Blue','Green','Cannot tell'],
          answer:'绿色', hintZh:'排除红和蓝，只剩绿色', hintEn:'Eliminate red and blue → only green remains' },

        { premiseZh:'三张卡片，数字分别是1、2、3。第一张不是1，也不是2。',
          premiseEn:'Cards numbered 1, 2, 3. The first card is not 1 and not 2.',
          questionZh:'第一张卡片是数字几？',            questionEn:'What number is on the first card?',
          options:['1','2','3','无法判断'],            optionsEn:['1','2','3','Cannot tell'],
          answer:'3', hintZh:'排除1和2，只剩3', hintEn:'Eliminate 1 and 2 → only 3 remains' },

        { premiseZh:'小朋友们排队，小明不在第一也不在最后，共3人。',
          premiseEn:'3 kids in a line. Xiaoming is not first and not last.',
          questionZh:'小明排第几？',                   questionEn:'What position is Xiaoming?',
          options:['第一','第二','第三','无法判断'],    optionsEn:['1st','2nd','3rd','Cannot tell'],
          answer:'第二', hintZh:'排除第一和第三，只剩第二', hintEn:'Eliminate 1st and 3rd → 2nd remains' },

        { premiseZh:'2、4、6、8、10、13 这些数字中，哪个不是偶数？',
          premiseEn:'From the numbers 2, 4, 6, 8, 10, 13 — which is NOT even?',
          questionZh:'哪个不是偶数？',                 questionEn:'Which is NOT an even number?',
          options:['6','8','10','13'],                 optionsEn:['6','8','10','13'],
          answer:'13', hintZh:'13不能被2整除，是奇数', hintEn:'13 is not divisible by 2 — it is odd' },

        { premiseZh:'3的倍数有：3、6、9、12、15。下面哪个不是3的倍数？',
          premiseEn:'Multiples of 3: 3, 6, 9, 12, 15. Which of the following is NOT a multiple of 3?',
          questionZh:'哪个不是3的倍数？',              questionEn:'Which is NOT a multiple of 3?',
          options:['9','12','15','11'],                optionsEn:['9','12','15','11'],
          answer:'11', hintZh:'11÷3不整除，所以11不是3的倍数', hintEn:'11 ÷ 3 is not a whole number' },

        { premiseZh:'红色队3人，蓝色队5人，绿色队4人。',
          premiseEn:'Red team: 3, Blue team: 5, Green team: 4 members.',
          questionZh:'人数最少的队是哪队？',            questionEn:'Which team has fewest members?',
          options:['红色队','蓝色队','绿色队','一样多'], optionsEn:['Red','Blue','Green','Same'],
          answer:'红色队', hintZh:'3<4<5，红色队最少', hintEn:'3 < 4 < 5, so Red team is smallest' },

        { premiseZh:'今天是周五。',
          premiseEn:'Today is Friday.',
          questionZh:'再过3天是星期几？',               questionEn:'What day is it 3 days from now?',
          options:['周六','周日','周一','周二'],        optionsEn:['Saturday','Sunday','Monday','Tuesday'],
          answer:'周一', hintZh:'周五+1=周六，+2=周日，+3=周一', hintEn:'Fri+1=Sat, +2=Sun, +3=Mon' },

        { premiseZh:'一个数是偶数，并且大于2，小于6。',
          premiseEn:'A number is even, greater than 2, and less than 6.',
          questionZh:'这个数是几？',                   questionEn:'What is the number?',
          options:['2','3','4','5'],                   optionsEn:['2','3','4','5'],
          answer:'4', hintZh:'偶数且2<n<6，只有4满足条件', hintEn:'Even numbers between 2 and 6: only 4' },

        { premiseZh:'一个数大于5，小于9，而且是奇数。',
          premiseEn:'A number is greater than 5, less than 9, and odd.',
          questionZh:'这个数是几？',                   questionEn:'What is the number?',
          options:['6','7','8','9'],                   optionsEn:['6','7','8','9'],
          answer:'7', hintZh:'5到9之间的奇数只有7', hintEn:'Odd numbers between 5 and 9: only 7' },

        { premiseZh:'动物园有3种动物：老虎、狮子、熊猫。老虎住在1号馆，狮子不住2号馆。',
          premiseEn:'Zoo has 3 animals in halls 1, 2, 3. Tiger is in hall 1. Lion is not in hall 2.',
          questionZh:'狮子住在哪个馆？',               questionEn:'Which hall is the lion in?',
          options:['1号馆','2号馆','3号馆','无法判断'],  optionsEn:['Hall 1','Hall 2','Hall 3','Cannot tell'],
          answer:'3号馆', hintZh:'1号是老虎，狮子不在2号，所以狮子在3号', hintEn:'Hall 1=Tiger; Lion not in Hall 2 → Lion in Hall 3' }
      ]
    },

    // ── Unit 4: 条件推理  (If A then B; does B follow?) ───────────────────
    {
      id: '4', icon: '🔗',
      nameZh: '条件推理', nameEn: 'Conditional Reasoning',
      descZh: '"如果…就…" ——条件成立时，结论一定成立吗？', descEn: '"If A then B" — when A happens, does B always follow?',
      questions: [
        { premiseZh:'如果下雨，小明就带伞。今天下雨了。',
          premiseEn:'If it rains, Xiaoming brings an umbrella. It rained today.',
          questionZh:'小明带伞了吗？',                 questionEn:'Did Xiaoming bring an umbrella?',
          options:['带了','没带','不确定','可能没带'],   optionsEn:['Yes','No','Not sure','Maybe not'],
          answer:'带了', hintZh:'下雨→带伞，今天下雨，所以带了', hintEn:'Rain → umbrella. It rained → he brought one' },

        { premiseZh:'如果今天是晴天，小花就出去玩。今天是阴天。',
          premiseEn:'If it is sunny, Xiaohua goes out to play. Today is cloudy.',
          questionZh:'小花出去玩了吗？',               questionEn:'Did Xiaohua go out to play?',
          options:['出去了','没出去','不确定','一定出去了'], optionsEn:['Yes','No','Not sure','Definitely yes'],
          answer:'不确定', hintZh:'条件是晴天才出去，阴天没说', hintEn:'The condition was sunny; cloudy day is not covered' },

        { premiseZh:'如果做完作业，就可以看电视。小明没做完作业。',
          premiseEn:'If homework is done, TV is allowed. Xiaoming did not finish his homework.',
          questionZh:'小明可以看电视吗？',              questionEn:'Can Xiaoming watch TV?',
          options:['可以','不可以','不确定','要看情况'], optionsEn:['Yes','No','Not sure','Depends'],
          answer:'不可以', hintZh:'没做完作业就不能看电视', hintEn:'Homework not done → no TV' },

        { premiseZh:'如果是偶数，就能被2整除。8是偶数。',
          premiseEn:'If a number is even, it is divisible by 2. 8 is even.',
          questionZh:'8能被2整除吗？',                 questionEn:'Is 8 divisible by 2?',
          options:['能','不能','不一定','需要计算'],    optionsEn:['Yes','No','Not sure','Need to check'],
          answer:'能', hintZh:'8是偶数，偶数都能被2整除', hintEn:'8 is even → divisible by 2' },

        { premiseZh:'如果数字大于5，就亮红灯。数字是3。',
          premiseEn:'If the number is greater than 5, the red light turns on. The number is 3.',
          questionZh:'红灯亮了吗？',                   questionEn:'Did the red light turn on?',
          options:['亮了','没有','不确定','可能亮了'],   optionsEn:['Yes','No','Not sure','Maybe'],
          answer:'没有', hintZh:'3不大于5，条件不满足，红灯没亮', hintEn:'3 is not greater than 5 → condition not met' },

        { premiseZh:'只有会游泳的选手才能参加游泳比赛。小明不会游泳。',
          premiseEn:'Only swimmers can enter the swimming competition. Xiaoming cannot swim.',
          questionZh:'小明能参加游泳比赛吗？',          questionEn:'Can Xiaoming enter the swimming race?',
          options:['能','不能','不确定','要看规定'],     optionsEn:['Yes','No','Not sure','Depends'],
          answer:'不能', hintZh:'不会游泳就不能参加', hintEn:'Cannot swim → cannot enter' },

        { premiseZh:'如果分数高于90分，就能得到奖状。小红考了95分。',
          premiseEn:'If score is above 90, the student gets a certificate. Xiaohong scored 95.',
          questionZh:'小红能得到奖状吗？',              questionEn:'Does Xiaohong get a certificate?',
          options:['能','不能','不确定','要看老师'],     optionsEn:['Yes','No','Not sure','Up to teacher'],
          answer:'能', hintZh:'95>90，满足条件，能得奖状', hintEn:'95 > 90 → condition met → certificate' },

        { premiseZh:'如果有云，可能会下雨。今天有云。',
          premiseEn:'If there are clouds, it might rain. There are clouds today.',
          questionZh:'今天一定会下雨吗？',              questionEn:'Will it definitely rain today?',
          options:['一定会','不一定','一定不会','要看天气'], optionsEn:['Definitely','Not necessarily','Definitely not','Check forecast'],
          answer:'不一定', hintZh:'有云只是"可能"下雨，不是一定', hintEn:'Clouds mean it might rain, not that it will' },

        { premiseZh:'如果你第一个到达终点，就是冠军。小明是冠军。',
          premiseEn:'If you reach the finish line first, you are the champion. Xiaoming is the champion.',
          questionZh:'小明第一个到达终点了吗？',        questionEn:'Did Xiaoming reach the finish line first?',
          options:['是','不是','不一定','无法判断'],     optionsEn:['Yes','No','Not necessarily','Cannot tell'],
          answer:'是', hintZh:'冠军就是第一个到达终点的人', hintEn:'Champion = first to finish → Xiaoming was first' },

        { premiseZh:'如果机器开着，指示灯就亮。指示灯灭了。',
          premiseEn:'If the machine is on, the indicator light is lit. The indicator light is off.',
          questionZh:'机器开着吗？',                   questionEn:'Is the machine on?',
          options:['开着','关着','不确定','可能开着'],   optionsEn:['On','Off','Not sure','Maybe on'],
          answer:'关着', hintZh:'灯灭了说明机器关了（逆否推理）', hintEn:'Light off → machine off (contrapositive reasoning)' }
      ]
    },

    // ── Unit 5: 谁说对了  (Who stated the correct fact?) ──────────────────
    {
      id: '5', icon: '🗣️',
      nameZh: '谁说对了', nameEn: 'Who Is Correct?',
      descZh: '多人给出不同答案，根据事实判断谁说对了', descEn: 'Multiple answers given — use facts to decide who is right',
      questions: [
        { premiseZh:'篮子里有6个苹果。小明说有5个，小红说有6个，小华说有7个。',
          premiseEn:'There are 6 apples. Ming says 5, Hong says 6, Hua says 7.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','小华','都没说对'],    optionsEn:['Ming','Hong','Hua','None'],
          answer:'小红', hintZh:'篮子里有6个，小红说6个，所以小红对', hintEn:'There are 6 apples; Hong said 6 → Hong is correct' },

        { premiseZh:'正方形有4条边。小明说正方形有3条边，小花说有4条边。',
          premiseEn:'A square has 4 sides. Ming says 3 sides, Xiaohua says 4 sides.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小花','两人都对','两人都错'], optionsEn:['Ming','Hua','Both','Neither'],
          answer:'小花', hintZh:'正方形4条边，小花答对了', hintEn:'Square has 4 sides → Hua is correct' },

        { premiseZh:'今天是周三。小明说明天是周四，小红说明天是周五。',
          premiseEn:'Today is Wednesday. Ming says tomorrow is Thursday; Hong says Friday.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','两人都对','两人都错'], optionsEn:['Ming','Hong','Both','Neither'],
          answer:'小明', hintZh:'周三的明天是周四，小明对', hintEn:'Wednesday + 1 = Thursday → Ming is correct' },

        { premiseZh:'2 + 3 的结果。小A说是4，小B说是5，小C说是6。',
          premiseEn:'2 + 3 = ? A says 4, B says 5, C says 6.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小A','小B','小C','都没对'],         optionsEn:['A','B','C','None'],
          answer:'小B', hintZh:'2+3=5，小B对', hintEn:'2+3=5 → B is correct' },

        { premiseZh:'三角形内角和是180度。小明说90度，小红说180度，小华说360度。',
          premiseEn:'Triangle angles sum to 180°. Ming: 90°, Hong: 180°, Hua: 360°.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','小华','没人对'],       optionsEn:['Ming','Hong','Hua','None'],
          answer:'小红', hintZh:'三角形内角和=180度，小红对', hintEn:'Triangle angles sum to 180° → Hong is correct' },

        { premiseZh:'5 × 4 的结果。小明说15，小红说20，小华说25。',
          premiseEn:'5 × 4 = ? Ming: 15, Hong: 20, Hua: 25.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','小华','都错了'],       optionsEn:['Ming','Hong','Hua','None'],
          answer:'小红', hintZh:'5×4=20，小红对', hintEn:'5×4=20 → Hong is correct' },

        { premiseZh:'一年有365天（平年）。小A说100天，小B说365天，小C说400天。',
          premiseEn:'A regular year has 365 days. A: 100, B: 365, C: 400.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小A','小B','小C','都错了'],         optionsEn:['A','B','C','None'],
          answer:'小B', hintZh:'一年365天，小B对', hintEn:'365 days in a year → B is correct' },

        { premiseZh:'1 + 1 是加法。小明说乘法，小红说加法，小华说减法。',
          premiseEn:'1 + 1 is addition. Ming: multiplication, Hong: addition, Hua: subtraction.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','小华','都没对'],       optionsEn:['Ming','Hong','Hua','None'],
          answer:'小红', hintZh:'1+1用的是加法符号，小红对', hintEn:'1 + 1 is addition → Hong is correct' },

        { premiseZh:'水在100℃沸腾。小明说90℃，小红说100℃，小华说110℃。',
          premiseEn:'Water boils at 100°C. Ming: 90°C, Hong: 100°C, Hua: 110°C.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','小华','都不对'],       optionsEn:['Ming','Hong','Hua','None'],
          answer:'小红', hintZh:'水沸点100℃，小红正确', hintEn:'Water boils at 100°C → Hong is correct' },

        { premiseZh:'正方形的四条边一样长。小明说对，小红说边不一样长。',
          premiseEn:'A square has 4 equal sides. Ming says true; Hong says sides are unequal.',
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小明','小红','两人都对','两人都错'], optionsEn:['Ming','Hong','Both','Neither'],
          answer:'小明', hintZh:'正方形四边等长，小明说的对', hintEn:'Squares have equal sides → Ming is correct' }
      ]
    },

    // ── Unit 6: 综合逻辑  (Multi-step, G2) ────────────────────────────────
    {
      id: '6', icon: '🧩',
      nameZh: '综合推理', nameEn: 'Multi-step Reasoning',
      descZh: '把两步或更多推理连起来——逻辑链越长，元思维能力越强', descEn: 'Chain two or more reasoning steps — build your logical thinking',
      questions: [
        { premiseZh:'甲比乙重5斤，乙比丙重3斤，丙重10斤。',
          premiseEn:'A is 5 kg heavier than B; B is 3 kg heavier than C; C weighs 10 kg.',
          questionZh:'甲重多少斤？',                   questionEn:'How heavy is A?',
          options:['13斤','15斤','18斤','20斤'],        optionsEn:['13 kg','15 kg','18 kg','20 kg'],
          answer:'18斤', hintZh:'丙=10，乙=10+3=13，甲=13+5=18', hintEn:'C=10, B=10+3=13, A=13+5=18' },

        { premiseZh:'有3件玩具：球、车、娃娃。小明不要球，也不要车。',
          premiseEn:'3 toys: ball, car, doll. Xiaoming does not want the ball or the car.',
          questionZh:'小明选了什么？',                 questionEn:'What did Xiaoming choose?',
          options:['球','车','娃娃','什么都没选'],      optionsEn:['Ball','Car','Doll','Nothing'],
          answer:'娃娃', hintZh:'排除球和车，只剩娃娃', hintEn:'Eliminate ball and car → doll remains' },

        { premiseZh:'所有奇数都不能被2整除。15是奇数。',
          premiseEn:'All odd numbers are not divisible by 2. 15 is odd.',
          questionZh:'15能被2整除吗？',                questionEn:'Is 15 divisible by 2?',
          options:['能','不能','有时能','不确定'],       optionsEn:['Yes','No','Sometimes','Not sure'],
          answer:'不能', hintZh:'15是奇数，奇数都不能被2整除', hintEn:'15 is odd → not divisible by 2' },

        { premiseZh:'小A排在小B前面，小B排在小C前面，小C是最后一名，共3人。',
          premiseEn:'A is ahead of B; B is ahead of C; C is last. 3 people total.',
          questionZh:'小A是第几名？',                  questionEn:'What place is A?',
          options:['第一名','第二名','第三名','无法判断'], optionsEn:['1st','2nd','3rd','Cannot tell'],
          answer:'第一名', hintZh:'C末，B第二，A第一', hintEn:'C is last → B is 2nd → A is 1st' },

        { premiseZh:'如果下雨就开空调，如果开空调就关窗。今天下雨了。',
          premiseEn:'If rain → AC on; if AC on → close windows. It rained today.',
          questionZh:'窗户是开着还是关着的？',          questionEn:'Are the windows open or closed?',
          options:['开着','关着','不确定','半开半关'],   optionsEn:['Open','Closed','Not sure','Half open'],
          answer:'关着', hintZh:'下雨→开空调→关窗', hintEn:'Rain → AC on → windows closed' },

        { premiseZh:'小明零花钱5元，小红是小明的2倍。小华说小红有8元，小李说有10元。',
          premiseEn:"Xiaoming has ¥5. Xiaohong has twice as much. Xiaohua says ¥8; Xiaoli says ¥10.",
          questionZh:'谁说对了？',                     questionEn:'Who is correct?',
          options:['小华','小李','两人都对','两人都错'], optionsEn:['Hua','Li','Both','Neither'],
          answer:'小李', hintZh:'小明5元×2=10元，小李对', hintEn:'5×2=10 → Li is correct' },

        { premiseZh:'一个数是偶数，大于2，小于6。',
          premiseEn:'A number is even, greater than 2, and less than 6.',
          questionZh:'这个数是几？',                   questionEn:'What is the number?',
          options:['2','3','4','5'],                   optionsEn:['2','3','4','5'],
          answer:'4', hintZh:'偶数且2<n<6，只有4满足', hintEn:'Even numbers between 2 and 6: only 4' },

        { premiseZh:'三条绳子：红绳比蓝绳长2厘米，蓝绳比绿绳长3厘米，绿绳5厘米。',
          premiseEn:'Red rope is 2 cm longer than blue; blue is 3 cm longer than green; green = 5 cm.',
          questionZh:'红绳多长？',                     questionEn:'How long is the red rope?',
          options:['7厘米','8厘米','10厘米','12厘米'],  optionsEn:['7 cm','8 cm','10 cm','12 cm'],
          answer:'10厘米', hintZh:'绿=5，蓝=5+3=8，红=8+2=10', hintEn:'Green=5, Blue=5+3=8, Red=8+2=10' },

        { premiseZh:'不会游泳的小朋友必须戴救生圈。小明不戴救生圈。',
          premiseEn:'Kids who cannot swim must wear a life ring. Xiaoming is not wearing one.',
          questionZh:'小明会游泳吗？',                 questionEn:'Can Xiaoming swim?',
          options:['会','不会','不确定','可能不会'],     optionsEn:['Yes','No','Not sure','Maybe not'],
          answer:'会', hintZh:'不会游泳→戴圈；不戴圈→会游泳', hintEn:'Cannot swim → wears ring; no ring → can swim' },

        { premiseZh:'如果是周末就没有课，如果没有课就可以去公园。今天是周六。',
          premiseEn:'If weekend → no school; if no school → can go to park. Today is Saturday.',
          questionZh:'今天可以去公园吗？',              questionEn:'Can we go to the park today?',
          options:['可以','不可以','不确定','要看家长'], optionsEn:['Yes','No','Not sure','Ask parents'],
          answer:'可以', hintZh:'周六是周末→没有课→可以去公园', hintEn:'Saturday → weekend → no school → can go to park' }
      ]
    }
  ]
};
