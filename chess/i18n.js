(function () {
  'use strict';

  var STORAGE_KEY = 'chessLanguage';
  var translations = {
    '国际象棋': 'Chess',
    '智慧元中心': 'Chess Academy',
    '返回主页': 'Back to Chess Home',
    '返回智慧元中心': 'Back to Chess Academy',
    '返回入门启航': 'Back to Beginner Course',
    '入门启航': 'Beginner Course',
    '残局入门': 'Endgames',
    '战术运用': 'Tactics',
    '攻杀技巧': 'Checkmate Patterns',
    '开局元思维': 'Opening Principles',
    '实战提升': 'Practical Play',
    '认识棋盘': 'The Chessboard',
    '初步观察': 'First Look',
    '认识棋子': 'Meet the Pieces',
    '棋子走法': 'Piece Movement',
    '对弈模式 | 国际象棋': 'Play Chess | Chess',
    '对弈模式': 'Chess Game',
    '系统介绍': 'About Chess',
    'Lichess 主题': 'Lichess Theme',
    '从现有战术与攻杀题库抽样，作为手工设计参考。': 'Sample from the existing tactics and checkmate libraries as references for manual puzzle design.',
    '当前可按题型、L1–L3 和主题抽样。打包数据未保留 Lichess rating、popularity、plays 等字段，不能按原桌面端的评分/受欢迎度参数筛选；此页抽样不会访问 Lichess 或写入题库。': 'Sample by puzzle type, level (L1–L3), and theme. The bundled data does not retain Lichess rating, popularity, or play-count fields, so those original desktop filters are unavailable. Sampling here does not access Lichess or modify the puzzle library.',
    '逼着': 'Zugzwang',
    '困子': 'Trapped Piece',
    '拦截': 'Interference',
    '弃子': 'Sacrifice',
    '牵制': 'Pin',
    '闪击': 'Discovered Attack',
    '腾挪': 'Clearance',
    '透视攻击': 'X-Ray Attack',
    '消除保护': 'Remove the Defender',
    '引离': 'Deflection',
    '引入': 'Attraction',
    '中间招': 'Zwischenzug',
    '阻塞': 'Blockade',
    '用户名': 'Username',
    '显示设置已应用': 'Display settings applied.',
    '用户管理': 'User Management',
    '智能推荐设置': 'Smart Recommendation Settings',
    '手动选择': 'Select Manually',
    '更新': 'Refresh',
    '清空推荐': 'Clear Recommendations',
    '生成推荐': 'Generate Recommendations',
    '推荐保存失败：': 'Could not save recommendations: ',
    '根据当前条件未找到合适的题目': 'No puzzles match the current filters.',
    '确定清空当前模式的推荐吗？': 'Clear recommendations for the current mode?',
    '已清空当前模式推荐': 'Recommendations cleared for the current mode.',
    '切换失败：': 'Could not switch user: ',
    '记录读取失败：': 'Could not load records: ',
    '清空失败：': 'Could not clear recommendations: ',
    '已生成并保存 ': 'Generated and saved ',
    ' 个推荐题目': ' recommended puzzles',
    ' · L1': ' · L1',
    ' · L2': ' · L2',
    ' · L3': ' · L3',
    '关闭用户管理': 'Close User Management',
    '关闭推荐设置': 'Close Recommendation Settings',
    '确定': 'Confirm',
    '棋力等级': 'Playing Strength Levels',
    '0–10 级沿用原系统等级表，联动技能等级、Elo、搜索深度与每步思考时间。默认 10 级。等级名称与 Elo 是原系统的参考分级，不是浏览器引擎的棋力认证。': 'Levels 0–10 follow the original level table and control Skill Level, Elo, search depth, and time per move. The default is level 10. Level names and Elo values are reference ratings from the original system, not a certification of browser-engine strength.',
    '硬件档位与哈希': 'Hardware Profile and Hash',
    '低配按原表的 25%、自动按原表、高性能按 200% 计算 Hash。浏览器内存信息可能受限；可见内存不超过 4 GB 或未知时上限 128 MB，其余上限 512 MB。当前单线程 WASM 的线程数固定为 1。': 'Hash size is calculated as 25% of the reference value for Low-End, 100% for Automatic, and 200% for High Performance. Browser memory information may be limited: the cap is 128 MB when reported memory is 4 GB or less, or unknown; otherwise it is 512 MB. The current single-threaded WASM engine is fixed at one thread.',
    '限制棋力': 'Limit Strength',
    '开启后发送 UCI_LimitStrength 和等级对应 UCI_Elo；Stockfish 此时优先按 Elo 限制棋力。关闭时按 Skill Level 控制。': 'When enabled, UCI_LimitStrength and the level-matched UCI_Elo are sent; Stockfish then limits strength primarily by Elo. When disabled, strength is controlled by Skill Level.',
    '变化数与着法开销': 'Principal Variations and Move Overhead',
    '变化数为 MultiPV，范围 1–10。着法开销为 Move Overhead，范围 0–5000 毫秒。使用固定每步思考时间时，着法开销通常不改变实际搜索时长。': 'The number of lines is MultiPV, with a range of 1–10. Move Overhead ranges from 0–5000 ms. With a fixed time per move, move overhead usually does not change the actual search duration.',
    '最小思考与 WDL': 'Minimum Think Time and WDL',
    '最小思考时间作为每步搜索预算的下限；深度限制可能使搜索提前结束。WDL 开启后请求胜、和、负概率输出。': 'Minimum Think Time is the lower bound for each move’s search budget; a depth limit may end the search earlier. Enabling WDL requests win, draw, and loss probability output.',
    '浏览器限制': 'Browser Limitations',
    '当前使用 Stockfish 19 Lite 单线程 WASM，内置 NNUE。外部 NNUE 文件、Syzygy 文件路径、多线程、后台思考、Chess960 棋盘规则，以及旧版 Contempt、Slow Mover、分析模式等参数暂不开放，禁用项不保存也不发送。': 'This version uses single-threaded Stockfish 19 Lite WASM with built-in NNUE. External NNUE files, Syzygy paths, multiple threads, pondering, Chess960 rules, and legacy options such as Contempt, Slow Mover, and Analysis Mode are unavailable. Disabled options are neither saved nor sent.',
    '应用范围': 'Where Settings Apply',
    '保存后，对弈模式和棋子走法的对弈练习在“使用引擎设置”预设下分别读取人机、黑方、白方参数。五档快速预设可临时覆盖棋力等级，其他支持参数仍读取保存值。当前正在进行的搜索不会中途更换参数，下一次分析生效。': 'After saving, Chess Game and Piece Movement game practice use the Human-vs-AI, Black, and White settings respectively when the “Use Engine Settings” preset is selected. The five quick presets temporarily override playing strength; other supported options continue using their saved values. Settings do not change during an active search and take effect on the next analysis.',
    '我知道了': 'Got It',
    '📊 局面优势': '📊 Position Advantage',
    '🔍 搜索状态': '🔍 Search Status',
    '🎯 候选走法': '🎯 Candidate Moves',
    '☁️ 局面评估': '☁️ Position Evaluation',
    '🎯 分析设置': '🎯 Analysis Settings',
    '⚡ 引擎设置': '⚡ Engine Settings',
    '等级:': 'Level:',
    '预设:': 'Preset:',
    '使用引擎设置': 'Use Engine Settings',
    'AI引擎设置': 'AI Engine Settings',
    '人机对弈': 'Play vs Computer',
    'AI 难度': 'Computer Difficulty',
    '自定义难度': 'Custom Difficulty',
    '自定义等级': 'Custom Level',
    '当前局面预估': 'Position Estimate',
    '推荐着法': 'Suggested Move',
    '候选变化': 'Candidate Lines',
    '当前行棋方': 'Side to Move',
    '白方行棋': 'White to move',
    '黑方行棋': 'Black to move',
    '局势倾向': 'Position Trend',
    '局势倾向（白方视角）': 'Position Trend (White POV)',
    '引擎分值': 'Engine Score',
    '白方视角分值': 'Engine Score (White POV)',
    '搜索深度': 'Search Depth',
    '等待评估': 'Waiting for evaluation',
    '数据不足': 'Insufficient data',
    '大致均势': 'Roughly equal',
    '白方略优': 'White has a slight edge',
    '黑方略优': 'Black has a slight edge',
    '白方占优': 'White has an advantage',
    '黑方占优': 'Black has an advantage',
    '白方明显优势': 'White has a clear advantage',
    '黑方明显优势': 'Black has a clear advantage',
    '白方有强制将杀': 'White has a forced mate',
    '黑方有强制将杀': 'Black has a forced mate',
    '浅层或评估波动时隐藏胜率百分比；倾向仅作训练参考。': 'WDL percentages are hidden for shallow or unstable searches; the trend is for training only.',
    '深度稳定后的引擎 WDL 估算，并非真人实战胜率。': 'Deep, stable engine WDL estimate; not a human-game win probability.',
    '白胜': 'White Win',
    '和棋': 'Draw',
    '黑胜': 'Black Win',
    '引擎估算，仅供训练参考。': 'Engine estimate, for training only.',
    '残局库精确结论。': 'Exact tablebase result.',
    '走棋后分析': 'Analysis after a move',
    '开始后分析': 'Analysis starts with the game',
    '正在评估': 'Evaluating',
    'Stockfish': 'Stockfish',
    '残局库': 'Tablebase',
    '棋局已结束': 'Game over',
    '白方必胜': 'White is winning',
    '黑方必胜': 'Black is winning',
    '残局库精确结论': 'Exact tablebase result',
    '选择执棋方并开始对弈': 'Choose your color to start playing',
    '等待开始': 'Ready to start',
    'AI 正在思考': 'Computer is thinking',
    '残局库已找到着法': 'Tablebase move found',
    '走法已确定': 'Move ready',
    '轮到你': 'Your turn',
    'AI 即将走棋': 'Computer is about to move',
    '等待你的走棋': 'Waiting for your move',
    '正在思考': 'Thinking',
    'AI 已选定候选，准备走棋': 'Computer selected a line and is about to move',
    '候选已就绪': 'Candidate line ready',
    '即将走棋': 'About to move',
    '已暂停': 'Paused',
    '等待对方走棋': 'Waiting for the other side',
    '连接失败，正在重试': 'Connection issue, retrying',
    'AI 暂不可用': 'Computer is temporarily unavailable',
    '暂不可用': 'Temporarily unavailable',
    'AI 难度设置': 'Computer Difficulty',
    '为人机对弈及 AI 对弈分别设置自定义难度。日常对弈可直接使用棋盘旁的五档选择。': 'Set custom difficulty for player-vs-computer or computer-vs-computer games. For regular play, use the five levels beside the board.',
    '玩家对手': 'Your Opponent',
    'AI 对 AI': 'Computer vs Computer',
    '黑方难度': 'Black Difficulty',
    '白方难度': 'White Difficulty',
    '自定义双方难度': 'Customize Both Levels',
    '自定义对手水平': 'Set a Custom Opponent Level',
    '为人机和 AI 对弈设置自定义难度': 'Set custom difficulty for player-vs-computer and computer-vs-computer games',
    '对弈': 'Play',
    '自定义难度已保存，下次 AI 走棋生效': 'Custom difficulty saved. It will apply on the next computer move.',
    '已恢复为中级，尚未保存': 'Reset to Intermediate. Save to apply.',
    '将三组自定义难度恢复为中级？点击保存后生效。': 'Reset all three custom levels to Intermediate? Save to apply.',
    '等级决定 AI 对弈强度。网页引擎运行在浏览器中，等级和参考棋力用于区分难度，不代表官方棋力认证。保存后，下一次 AI 走棋时生效。': 'The level controls computer playing strength. The browser engine uses these levels to distinguish difficulty; they are not official rating certifications. Changes apply on the next computer move.',
    '黑方和白方可以使用不同难度，用于观察和比较不同水平的走法。': 'Choose different levels for Black and White to observe and compare their moves.',
    '设置说明': 'Settings Guide',
    '保存自定义难度': 'Save Custom Levels',
    '重置为中级': 'Reset to Intermediate',
    '设置已修改，尚未保存': 'Changes are not saved yet.',
    '保存失败：': 'Save failed: ',
    '自定义': 'Custom',
    '业余入门': 'Beginner',
    '业余初级': 'Novice',
    '业余进阶': 'Improving Player',
    '俱乐部选手': 'Club Player',
    '俱乐部好手': 'Strong Club Player',
    '高级俱乐部': 'Advanced Club Player',
    '专家级': 'Expert',
    '候补大师': 'Candidate Master',
    '国际大师': 'International Master',
    '特级大师': 'Grandmaster',
    '等待分析...': 'Waiting for analysis...',
    '🎯 局面评估系统已就绪': '🎯 Position evaluation is ready',
    '开始下棋后，AI将为您分析局面优势，提供专业的棋局建议。': 'Once you start playing, the AI will assess the position and offer guidance.',
    '⚡ 后续将整合 LLM 和专家系统，提供更深入的分析。': '⚡ Deeper analysis with language models and expert systems is planned.',
    '特级大师': 'Grandmaster',
    '🎯 局面评估系统已就绪\n开始下棋后，AI将为您分析局面优势，提供专业的棋局建议。\n⚡ 后续将整合 LLM 和专家系统，提供更深入的分析。': '🎯 Position evaluation is ready\nOnce you start playing, the AI will assess the position and offer guidance.\n⚡ Deeper analysis with language models and expert systems is planned.',
    '等待开始 AI 对弈...': 'Waiting for the AI match to start...',
    '开局位置 — 点击▶开始自动播放，或用↩/→单步查看': 'Starting position — press ▶ to autoplay or use ↩/→ to step through the game',
    '🏁 演示结束': '🏁 Demonstration Complete',
    '暂停自动播放': 'Pause Autoplay',
    '暂停对弈': 'Pause Game',
    '继续对弈': 'Resume Game',
    '暂停AI对战': 'Pause AI Match',
    '继续AI对战': 'Resume AI Match',
    '开始AI对战': 'Start AI Match',
    'AI对战由🤖按钮控制': 'AI matches are controlled by the 🤖 button',
    '仅在对弈练习中生效': 'Only applies to game practice',
    'AI（Stockfish）正在思考最佳走法…': 'AI (Stockfish) is thinking about the best move…',
    '✅ 吃掉了！继续吃掉剩下的黑子。': '✅ Captured! Take the remaining black pieces.',
    '✅ 太棒了，把所有黑子都吃掉了！': '✅ Great! You captured all the black pieces!',
    '🤝 子力不足，和棋！': '🤝 Draw by insufficient material!',
    '🤝 三次重复局面，和棋！': '🤝 Draw by threefold repetition!',
    '🤝 五十步无吃子无兵移动，和棋！': '🤝 Draw by the fifty-move rule!',
    '❌ 这是己方棋子，王不能走到这里。': '❌ That is your own piece; the king cannot move there.',
    '问题：': 'Question: ',
    '被将军': 'In Check',
    '应将方法': 'Ways to Respond to Check',
    '禁止落点': 'Forbidden Squares',
    '练习走法': 'Movement Practice',
    '王车易位练习': 'Castling Practice',
    '易位通道被堵': 'Blocked Castling Path',
    '王的激活': 'King Activation',
    '王的对立': 'King Opposition',
    '移王应将': 'Move the King',
    '遮挡应将': 'Block the Check',
    '吃子应将': 'Capture the Attacker',
    '双将': 'Double Check',
    '异色象演示': 'Opposite-Colored Bishop Demo',
    '单马子力不足': 'Lone Knight: Insufficient Material',
    '双马子力不足': 'Two Knights: Insufficient Material',
    '单象子力不足': 'Lone Bishop: Insufficient Material',
    '斜线队列': 'Pieces on a Diagonal',
    '异色格陷阱': 'Opposite-Colored Square Trap',
    '小兵变后': 'Pawn Promotes to Queen',
    '小兵变车': 'Pawn Promotes to Rook',
    '小兵变象': 'Pawn Promotes to Bishop',
    '小兵变马': 'Pawn Promotes to Knight',
    '兵的升变': 'Pawn Promotion',
    '1.1 练习走法': '1.1 Movement Practice',
    '3.1 王车易位练习': '3.1 Castling Practice',
    '3.2 易位通道被堵': '3.2 Blocked Castling Path',
    '3.4 王的激活': '3.4 King Activation',
    '3.5 王的对立': '3.5 King Opposition',
    '4.1 移王应将': '4.1 Move the King',
    '4.2 遮挡应将': '4.2 Block the Check',
    '4.3 吃子应将': '4.3 Capture the Attacker',
    '4.4 双将': '4.4 Double Check',
    '1.2 异色象演示': '1.2 Opposite-Colored Bishop Demo',
    '1.2 单马子力不足': '1.2 Lone Knight: Insufficient Material',
    '1.3 双马子力不足': '1.3 Two Knights: Insufficient Material',
    '1.3 单象子力不足': '1.3 Lone Bishop: Insufficient Material',
    '2.2 斜线队列': '2.2 Pieces on a Diagonal',
    '2.5 异色格陷阱': '2.5 Opposite-Colored Square Trap',
    '3.1 小兵变后': '3.1 Pawn Promotes to Queen',
    '3.2 小兵变车': '3.2 Pawn Promotes to Rook',
    '3.3 小兵变象': '3.3 Pawn Promotes to Bishop',
    '3.4 小兵变马': '3.4 Pawn Promotes to Knight',
    '3.5 兵的升变': '3.5 Pawn Promotion',
    '3.6 小兵变后': '3.6 Pawn Promotes to Queen',
    '3.6 小兵变车': '3.6 Pawn Promotes to Rook',
    '3.6 小兵变象': '3.6 Pawn Promotes to Bishop',
    '3.1 小兵变马': '3.1 Pawn Promotes to Knight',
    '3.1 王车易位练习': '3.1 Castling Practice',
    '✅ 太棒了，把所有黑子都吃掉了！': '✅ Great! You captured all the black pieces!',
    '✅ 吃掉了！继续吃掉剩下的黑子。': '✅ Captured! Take the remaining black pieces.',
    '❌ 这是己方棋子，王不能走到这里。': '❌ That is your own piece; the king cannot move there.',
    '❌ 这个格子被对方棋子控制，王走过去会被将军，不能这样走。': '❌ This square is controlled by an opponent piece. The king would move into check.',
    '🤝 子力不足，和棋！': '🤝 Draw by insufficient material!',
    '🤝 三次重复局面，和棋！': '🤝 Draw by threefold repetition!',
    '🤝 五十步无吃子无兵移动，和棋！': '🤝 Draw by the fifty-move rule!',
    '问题：王被将军时必须怎么做？': 'Question: What must you do when your king is in check?',
    '王被将军时必须怎么做？': 'What must you do when your king is in check?',
    'A. 可以选择不管': 'A. You may ignore it',
    'B. 可以继续走其他棋子': 'B. You may move another piece',
    'C. 立即解除将军（移王、遮挡或吃掉攻击子）': 'C. Get out of check immediately (move the king, block, or capture the attacking piece)',
    '轮到白方走子。': 'White to move.',
    '轮到黑方走子。': 'Black to move.',
    '← 返回主页': '← Back to Chess Home',
    '平台简介': 'Platform Overview',
    '入门启航：认识棋盘、棋子走法，并通过经典棋局巩固基础。': 'Beginner Course: Learn the board and piece movement, then reinforce the basics with classic games.',
    '国际象棋智慧平台介绍': 'About the Chess Learning Platform',
    '面向国际象棋学习与练习的独立平台': 'A dedicated platform for learning and practicing international chess',
    '从棋盘与棋子开始，逐步学习规则、战术、残局与开局原则。': 'Start with the board and pieces, then build your knowledge of rules, tactics, endgames, and opening principles.',
    '学习路径': 'Learning Path',
    '入门启航': 'Beginner Course',
    '认识棋盘、棋子走法，并通过经典棋局巩固基础。': 'Learn the board and piece movement, then reinforce the basics with classic games.',
    '智慧元中心': 'Chess Academy',
    '系统学习残局、战术、攻杀和开局原则。': 'Study endgames, tactics, checkmate patterns, and opening principles.',
    '对弈与复盘': 'Play and Review',
    '进行人机对弈，查看对局记录，并使用题库分析与推荐工具。': 'Play against the engine, review your game records, and use the puzzle analysis and recommendation tools.',
    '独立的国际象棋学习空间': 'A standalone international-chess learning space',
    '课程、对弈、记录、分析与设置均属于国际象棋模块。': 'Courses, games, records, analysis, and settings are all part of the chess module.',
    '题库统计': 'Puzzle Statistics',
    '题库统计 | 国际象棋': 'Puzzle Statistics | Chess',
    '当前用户头像': 'Current user avatar',
    '敬请期待': 'Coming soon',
    '← 棋类系列': '← Game Series',
    '💎 国际象棋智慧元平台': '💎 Chess Learning Platform',
    '让思维在智慧的世界中闪光': 'Let your mind shine in a world of discovery',
    '© 2026 CogniChess - 国际象棋自学习平台': '© 2026 CogniChess - Self-Guided Chess Learning',
    '从基础到智慧的成长': 'Grow from the Basics to Strategic Thinking',
    '从好奇开始，发现思考的乐趣': 'Start with curiosity and discover the joy of thinking',
    '从好奇开始, 发现思考的乐趣': 'Start with curiosity and discover the joy of thinking',
    '入门': 'Beginner',
    '② 残局入门': '② Endgame Basics',
    '探索残局的奇妙变化': 'Explore the fascinating possibilities of endgames',
    '初级': 'Beginner',
    '③ 战术运用': '③ Tactics in Action',
    '掌握组合战术与应变思维': 'Learn combinations and adaptive thinking',
    '④ 攻杀技巧': '④ Checkmate Techniques',
    '学习常见攻杀与得子手法': 'Learn common checkmates and ways to win material',
    '⑤ 开局元思维': '⑤ Opening Principles',
    '16种元思维:从中心到战略': '16 strategic principles, from the center to the whole game',
    '⑥ 实战提升': '⑥ Practical Play',
    '综合运用所学知识进行实战': 'Apply what you have learned in practical games',
    '观察国际象棋棋盘和棋子的基本构成': 'Explore the chessboard and its pieces',
    '学习国际象棋棋盘的结构和特点': 'Learn the structure and features of the chessboard',
    '认识国际象棋的各种棋子': 'Meet the chess pieces',
    '详细学习每种棋子的走法规则': 'Learn how each chess piece moves',
    '本部分演示几个经典的国际象棋对局，对对弈有个初步认识': 'Watch classic chess games and learn the basics of play',
    '回顾学过的知识，巩固学习成果': 'Review what you have learned and reinforce your skills',
    '白方棋子': 'White Pieces',
    '黑方棋子': 'Black Pieces',
    '棋盘边框': 'Board Border',
    '浅色格子': 'Light Squares',
    '深色格子': 'Dark Squares',
    '边框': 'Border',
    '对阵颜色': 'Piece Colors',
    '白方位置': 'White Side',
    '棋盘格子数': 'Squares on the Board',
    '格子总数': 'Total Squares',
    '棋盘颜色': 'Board Colors',
    '右下角颜色': 'Bottom-Right Square Color',
    '边界': 'Border',
    '横格': 'Ranks',
    '竖格': 'Files',
    '深斜格': 'Dark-Square Diagonals',
    '浅斜格': 'Light-Square Diagonals',
    '坐标': 'Coordinates',
    '左下坐标': 'Bottom-Left Coordinate',
    '右下坐标': 'Bottom-Right Coordinate',
    '左上坐标': 'Top-Left Coordinate',
    '右上坐标': 'Top-Right Coordinate',
    '斜格计数': 'Count Diagonal Squares',
    '王后数量': 'King and Queen Count',
    '车马象数量': 'Rook, Knight, and Bishop Count',
    '兵数量': 'Pawn Count',
    '单方总数': 'Total Pieces per Side',
    '全部总数': 'Total Pieces on the Board',
    '象马': 'Bishops and Knights',
    '车前兵': 'Rook Pawns',
    '马前兵': 'Knight Pawns',
    '象前兵': 'Bishop Pawns',
    '中间兵': 'Center Pawns',
    '认识王、后、车、象、马、兵六种棋子': 'Meet the six chess pieces: king, queen, rook, bishop, knight, and pawn',
    '观察不同棋子在棋盘上的初始位置': 'Explore the starting positions of the pieces',
    '通过操作练习快速区分不同棋子': 'Practice identifying each piece',
    '完成问答练习巩固数量和子力价值概念': 'Review piece counts and values with a quiz',
    '观察棋盘边界、深浅格子的交替排列': 'Observe the board edges and alternating light and dark squares',
    '认识横格、竖格和斜格的方向特征': 'Learn the directions of ranks, files, and diagonals',
    '熟悉棋盘四角坐标与基本定位方法': 'Learn the corner coordinates and how to locate squares',
    '通过操作和问答练习巩固棋盘结构认识': 'Reinforce your understanding of the board with practice and quizzes',
    '本单元是初步认识国际象棋，有一个大致的印象': 'This unit introduces the basics of chess and builds an initial understanding',
    '点击动态观察的按钮，观察高亮': 'Select an Explore option to see the highlighted squares',
    '通过操作练习，进一步加深印象': 'Use Practice to reinforce what you have learned',
    '完成简单的问答练习题目': 'Complete the short quiz',
    '⏹ 停止演示': '⏹ Stop Demo',
    '📋 棋子走法 · 要点总结': '📋 Piece Movement · Key Points',
    '🤴  王': 'King',
    '🏰  车': 'Rook',
    '🐴  马': 'Knight',
    '🎭  象': 'Bishop',
    '👑  后': 'Queen',
    '⚡  王车易位': 'Castling',
    '向8个方向各走1格': 'Move one square in any direction',
    '不能走入被对方控制的格子': 'Cannot move to a square controlled by the opponent',
    '沿横线或竖线走任意格': 'Move any number of squares along a rank or file',
    '控制整行整列，直线上无死角': 'Controls entire ranks and files with unobstructed lines',
    '走L形（2+1格）': 'Move in an L shape (two squares, then one)',
    '唯一能跳过棋子的棋子': 'The only piece that can jump over other pieces',
    '沿斜线走任意格': 'Move any number of squares diagonally',
    '永远只走同色格，异色象互不干扰': 'Always stays on the same color; opposite-colored bishops never cross paths',
    '任意方向走任意格': 'Move any number of squares in any direction',
    '车与象的合体，全场最强棋子': 'Combines rook and bishop movement; the most powerful piece',
    '向前走1格（起步可走2格），斜前方吃子': 'Move forward one square (two from the starting rank); capture diagonally',
    '到达底线升变，最强可升为后': 'Promote on the last rank, usually to a queen',
    '王车易位': 'Castling',
    '王向车的方向移动两格，车跳到王的另一侧': 'The king moves two squares toward a rook, which jumps to the other side',
    '短易位（王翼）和长易位（后翼）': 'Kingside castling and queenside castling',
    '吃过路兵': 'En passant',
    '兵升变': 'Pawn promotion',
    '初学': 'Beginner',
    '中级': 'Intermediate',
    '高级': 'Advanced',
    '专家': 'Expert',
    '大师': 'Master',
    '傻瓜将杀': "Fool's Mate",
    '学者将杀': "Scholar's Mate",
    '不朽之局': 'The Immortal Game',
    '世纪之局': 'The Game of the Century',
    '常青树之局': 'The Evergreen Game',
    '手动模式': 'Manual',
    '人机模式': 'Human vs AI',
    'AI对弈': 'AI vs AI',
    '白方': 'White',
    '黑方': 'Black',
    '王': 'King',
    '后': 'Queen',
    '车': 'Rook',
    '象': 'Bishop',
    '马': 'Knight',
    '兵': 'Pawn',
    'AI预设:': 'AI preset:',
    '走法演示': 'Movement Demo',
    '吃子演示': 'Capture Demo',
    '王车易位': 'Castling',
    '兵升变': 'Pawn Promotion',
    '走法': 'Movement',
    '吃子': 'Captures',
    '对弈': 'Play',
    '将军应将': 'Respond to Check',
    '连续吃子': 'Capture Sequence',
    '先吃保护者': 'Capture the Defender First',
    '角落王': 'King in the Corner',
    '边线王': 'King on the Edge',
    '八方全满': 'Surrounded on All Sides',
    '追击连吃': 'Chase and Capture',
    '决胜角落': 'Corner Checkmate',
    '王帮后逼角': 'King and Queen Drive to the Edge',
    '捉双': 'Fork',
    '串击': 'Skewer',
    '直线四向': 'Four Rook Directions',
    '斜线四向': 'Four Bishop Diagonals',
    '直线清路': 'Clear a File or Rank',
    '斜线清路': 'Clear a Diagonal',
    '八方出击': 'Attack in Eight Directions',
    '后车配合': 'Queen and Rook Coordination',
    '四方千里': 'Rook in Four Directions',
    '竖线队列': 'Pieces on a File',
    '横线队列': 'Pieces on a Rank',
    '竖线清路': 'Clear the File',
    '横线清路': 'Clear the Rank',
    '双轴路障': 'Blockades on Two Lines',
    '车王逼角': 'Rook and King Drive to the Corner',
    '车王对孤王': 'Rook and King vs. Lone King',
    '双车将杀': 'Checkmate with Two Rooks',
    '车的捉双': 'Rook Fork',
    '底线将死': 'Back-Rank Checkmate',
    '双对角路障': 'Blockades on Both Diagonals',
    '象的串击': 'Bishop Skewer',
    '象兵联攻': 'Bishop and Pawn Attack',
    '双象对孤王': 'Two Bishops vs. Lone King',
    '兵链对峙': 'Pawn-Chain Standoff',
    '兵的多数': 'Pawn Majority',
    '通路兵护送': 'Passed-Pawn Escort',
    '易位路线受攻': 'Castling Path Under Attack',
    '异色象困境': 'Opposite-Colored Bishop Draw',
    '双象对孤王': 'Two Bishops vs. Lone King',
    '象的捉双': 'Bishop Fork',
    '象的串击': 'Bishop Skewer',
    '象兵联攻': 'Bishop and Pawn Attack',
    'L形八跳': 'Eight Knight Moves',
    '角落困境': 'Corner Trap',
    '近在咫尺': 'Close but Out of Reach',
    '跳越包围': 'Jump Over the Blockade',
    '踏点前进': 'Knight Path',
    '马的远征': "Knight's Journey",
    '马捉双': 'Knight Fork',
    '牵制的例子': 'Pin Example',
    '斜吃': 'Diagonal Capture',
    '边线斜吃': 'Edge-Pawn Capture',
    '蛇行连续吃': 'Pawn Capture Sequence',
    'Z形连吃': 'Zigzag Pawn Captures',
    '价值有讲究': 'Compare Capture Values',
    '看远一步': 'Look Ahead',
    '吃子兼升变': 'Capture and Promote',
    '边线一侧吃': 'Edge-Pawn Capture',
    '价值有讲究': 'Compare Capture Values',
    '点击上方棋子按钮开始练习': 'Choose a piece above to begin practice',
    '问答练习：先点击上方分类，再选择具体问题。': 'Choose a quiz category, then select a question.',
    '特殊规则': 'Special Rules',
    'AI自动模式': 'AI vs AI',
    '白方：': 'White: ',
    '黑方：': 'Black: ',
    '当前回合：白方': 'White to move',
    '当前回合：黑方': 'Black to move',
    '正在加载棋局...': 'Loading game...',
    '请选择棋子开始练习': 'Choose a piece to start practicing',
    '请点击上方棋子按钮开始练习': 'Choose a piece above to start practicing',
    '已回答': 'Answered',
    '请选择问题': 'Select a question',
    '暂无题目': 'No questions available',
    '暂无数据': 'No data available',
    '应用设置': 'Apply Settings',
    '恢复默认': 'Restore Defaults',
    '棋盘设置': 'Board Settings',
    '棋子样式': 'Piece Style',
    '棋盘主题': 'Board Theme',
    '返回': 'Back',
    '保存': 'Save',
    '取消': 'Cancel',
    '关闭': 'Close',
    '我知道了': 'Got it',
    '音量:': 'Volume:',
    '速度:': 'Speed:',
    '致学生': 'For Students',
    '致家长': 'For Parents',
    '正确': 'Correct',
    '错误': 'Incorrect',
    '和棋': 'Draw',
    '将杀': 'Checkmate',
    '将军': 'Check',
    '轮到白方走子。': "White to move.",
    '轮到黑方走子。': "Black to move.",
    '子力不足，和棋': 'Draw by insufficient material',
    '子力不足，和棋！': 'Draw by insufficient material!',
    '回答正确': 'Correct',
    '回答错误': 'Incorrect',
    '暂无解说内容': 'No commentary available',
    '暂无棋谱解法': 'No game line available',
    '敬请期待': 'Coming soon'
    ,'← 棋类系列': '← Game Series'
    ,'💎 国际象棋智慧元平台': '💎 Chess Learning Platform'
    ,'让思维在智慧的世界中闪光': 'Let your mind shine in a world of discovery'
    ,'© 2026 CogniChess - 国际象棋自学习平台': '© 2026 CogniChess - Self-Guided Chess Learning'
    ,'从基础到智慧的成长': 'Grow from the Basics to Strategic Thinking'
    ,'从好奇开始，发现思考的乐趣': 'Start with curiosity and discover the joy of thinking'
    ,'从好奇开始, 发现思考的乐趣': 'Start with curiosity and discover the joy of thinking'
    ,'入门': 'Beginner'
    ,'② 残局入门': '② Endgame Basics'
    ,'探索残局的奇妙变化': 'Explore the fascinating possibilities of endgames'
    ,'初级': 'Beginner'
    ,'③ 战术运用': '③ Tactics in Action'
    ,'掌握组合战术与应变思维': 'Learn combinations and adaptive thinking'
    ,'④ 攻杀技巧': '④ Checkmate Techniques'
    ,'学习常见攻杀与得子手法': 'Learn common checkmates and ways to win material'
    ,'⑤ 开局元思维': '⑤ Opening Principles'
    ,'16种元思维:从中心到战略': '16 strategic principles, from the center to the whole game'
    ,'⑥ 实战提升': '⑥ Practical Play'
    ,'综合运用所学知识进行实战': 'Apply what you have learned in practical games'
    ,'观察国际象棋棋盘和棋子的基本构成': 'Explore the chessboard and its pieces'
    ,'学习国际象棋棋盘的结构和特点': 'Learn the structure and features of the chessboard'
    ,'认识国际象棋的各种棋子': 'Meet the chess pieces'
    ,'详细学习每种棋子的走法规则': 'Learn how each chess piece moves'
    ,'本部分演示几个经典的国际象棋对局，对对弈有个初步认识': 'Watch classic chess games and learn the basics of play'
    ,'回顾学过的知识，巩固学习成果': 'Review what you have learned and reinforce your skills'
    ,'观察国际象棋棋盘和棋子的基本构成': 'Explore the chessboard and its pieces'
    ,'学习国际象棋棋盘的结构和特点': 'Learn the structure and features of the chessboard'
    ,'认识国际象棋的各种棋子': 'Meet the chess pieces'
    ,'详细学习每种棋子的走法规则': 'Learn how each chess piece moves'
    ,'本部分演示几个经典的国际象棋对局，对对弈有个初步认识': 'Watch classic chess games and learn the basics of play'
    ,'回顾学过的知识，巩固学习成果': 'Review what you have learned and reinforce your skills'
    ,'📚 入门启航': '📚 Beginner Course'
    ,'国际象棋的起点': 'Your Chess Journey Begins'
    ,'从棋盘、棋子到走法，建立扎实的国际象棋基础': 'Build a solid chess foundation, from the board and pieces to their moves'
    ,'残局入门': 'Endgame Basics'
    ,'从基础残局开始，学习王与棋子的配合': 'Learn king and piece coordination through essential endgames'
    ,'战术运用': 'Tactics in Action'
    ,'发现组合、牵制、引离等战术机会': 'Spot forks, pins, deflections, and other tactical opportunities'
    ,'攻杀技巧': 'Checkmate Techniques'
    ,'掌握经典杀王模式与进攻方法': 'Learn classic mating patterns and attacking techniques'
    ,'开局元思维': 'Opening Principles'
    ,'从中心控制、快速出子到整体布局': 'From controlling the center to rapid development and planning'
    ,'实战提升': 'Practical Play'
    ,'综合运用知识提升实战能力': 'Apply your knowledge and improve your practical play'
    ,'棋盘结构': 'Board Structure'
    ,'棋子识别': 'Piece Recognition'
    ,'棋子走法': 'Piece Movement'
    ,'棋局演示': 'Classic Games'
    ,'总结与回顾': 'Review and Summary'
    ,'白方棋子': 'White Pieces'
    ,'棋谱解法': 'Game Line'
    ,'3兵对双兵': 'Three Pawns vs. Two Pawns'
    ,'车双兵对车': 'Rook and Two Pawns vs. Rook'
    ,'单兵和棋': 'Lone Pawn Draw'
    ,'车兵对车': 'Rook and Pawn vs. Rook'
    ,'双兵对双兵': 'Two Pawns vs. Two Pawns'
    ,'双兵对兵': 'Two Pawns vs. Pawn'
    ,'兵升变马后将死': 'Knight Promotion to Checkmate'
    ,'双象对王': 'Two Bishops vs. King'
    ,'双车对王': 'Two Rooks vs. King'
    ,'象马对王': 'Bishop and Knight vs. King'
    ,'象兵对王': 'Bishop and Pawn vs. King'
    ,'马兵对王': 'Knight and Pawn vs. King'
    ,'兵对王': 'Pawn vs. King'
    ,'后车对王': 'Queen and Rook vs. King'
    ,'后对王': 'Queen vs. King'
    ,'后对升变兵': 'Queen vs. Promoted Pawn'
    ,'车对王': 'Rook vs. King'
    ,'车对升变兵': 'Rook vs. Promoted Pawn'
    ,'双兵对单兵': 'Two Pawns vs. Pawn'
    ,'象双兵对象': 'Bishop and Two Pawns vs. Bishop'
    ,'象兵对象': 'Bishop and Pawn vs. Bishop'
    ,'马兵对马': 'Knight and Pawn vs. Knight'
    ,'马对兵': 'Knight vs. Pawn'
    ,'兵对兵': 'Pawn vs. Pawn'
    ,'兵升变后将死练习': 'Queen-Promotion Checkmate Practice'
    ,'兵升变车后将死练习': 'Rook-Promotion Checkmate Practice'
    ,'兵升变象后将死练习': 'Bishop-Promotion Checkmate Practice'
    ,'用对王的方法掩护兵': 'Escorting the Pawn with the Opposition'
    ,'后车对王演示': 'Queen and Rook vs. King Demo'
    ,'3兵对3兵': 'Three Pawns vs. Three Pawns'
    ,'演示棋局': 'Classic Games'
    ,'🎯 控制类元基因': '🎯 Control Principles'
    ,'占领中心': 'Occupying the Center'
    ,'001 - 占领中心 - 第1课：什么是中心？': '001 - Occupying the Center - Lesson 1: What Is the Center?'
    ,'002 - 占领中心 - 第2课：中心优势对比': '002 - Occupying the Center - Lesson 2: Comparing Central Advantages'
    ,'003 - 占领中心 - 第3课：建立巩固双兵中心（伦敦体系）': '003 - Occupying the Center - Lesson 3: Building a Stable Pawn Duo (London System)'
    ,'004 - 占领中心 - 第4课：中心的争夺与反制（西西里防御）': '004 - Occupying the Center - Lesson 4: Contesting the Center and Counterplay (Sicilian Defense)'
    ,'005 - 控制类元基因 - 占领中心 - 意大利开局：焦科钢琴变例': '005 - Control Principles - Occupying the Center - Italian Game: Giuoco Piano Variation'
    ,'006 - 占领中心 - 第6局：中心优势转化王翼进攻（西班牙开局）': '006 - Occupying the Center - Game 6: Turning Central Control into a Kingside Attack (Ruy Lopez)'
    ,'007 - 占领中心 - 第7局：弃兵换中心控制权（国王弃兵）': '007 - Occupying the Center - Game 7: Sacrificing a Pawn for Central Control (King’s Gambit)'
    ,'008 - 占领中心 - 第8局：封闭中心后侧翼突破（国王印度防御）': '008 - Occupying the Center - Game 8: Close the Center, Then Break on the Flank (King’s Indian Defense)'
    ,'009 - 占领中心 - 第9局：中心压制速胜（四马开局）': '009 - Occupying the Center - Game 9: A Quick Win with Central Pressure (Four Knights Game)'
    ,'010 - 占领中心 - 第10局：忽视中心的代价（反面教材）': '010 - Occupying the Center - Game 10: The Cost of Ignoring the Center (Cautionary Example)'
    ,'控制中心': 'Controlling the Center'
    ,'001 - 控制中心 - 第1课：马不占中心，却控制中心（雷帝开局）': '001 - Controlling the Center - Lesson 1: The Knight Controls the Center without Occupying It (Reti Opening)'
    ,'002 - 控制中心 - 第2课：三个轻子协调瞄准要害格（意大利开局）': '002 - Controlling the Center - Lesson 2: Three Minor Pieces Coordinate to Target Key Squares (Italian Game)'
    ,'003 - 控制中心 - 第3课：翼路兵加马象悄悄控住中心四格（英格兰开局）': '003 - Controlling the Center - Lesson 3: A Flank Pawn, Knight, and Bishop Quietly Control the Four Central Squares (English Opening)'
    ,'004 - 控制中心 - 第4课：用象钉住马，阻止中心也是控制（尼姆佐印度）': '004 - Controlling the Center - Lesson 4: Pinning the Knight with a Bishop Is Also a Form of Control (Nimzo-Indian Defense)'
    ,'005 - 控制中心 - 第5课：黑象斜跨棋盘远程狙击d4（国王印度防御）': '005 - Controlling the Center - Lesson 5: Black\'s Bishop Targets d4 from Across the Board (King\'s Indian Defense)'
    ,'006 - 控制中心 - 第6局：观察每步如何让轻子控制格子越来越多（伦敦体系）': '006 - Controlling the Center - Game 6: Watch the Minor Pieces Control More Squares with Each Move (London System)'
    ,'007 - 控制中心 - 第7局：Bb5没有直接占中心，却做了什么（西班牙开局）': '007 - Controlling the Center - Game 7: Bb5 Does Not Occupy the Center. What Does It Do? (Ruy Lopez)'
    ,'008 - 控制中心 - 第8局：双方都用子力控中心，谁更协调谁占优（英格兰对称）': '008 - Controlling the Center - Game 8: Both Sides Use Pieces to Control the Center; Better Coordination Wins (Symmetrical English)'
    ,'009 - 控制中心 - 第9局：Bg2斜线加c4，兵的占领与子的控制完美结合（卡塔兰）': '009 - Controlling the Center - Game 9: The Bg2 Diagonal and c4 Combine Pawn Occupation with Piece Control (Catalan Opening)'
    ,'010 - 控制中心 - 第10局：轻子走边路，中心格彻底失控（反面教材）': '010 - Controlling the Center - Game 10: Minor Pieces Drift to the Flank and the Center Is Lost (Cautionary Example)'
    ,'王车易位': 'Castling'
    ,'001 - 王车易位 - 第1课：易位的时机——轻子出完立即易位（意大利开局）': '001 - Castling - Lesson 1: When to Castle - Castle as Soon as Your Minor Pieces Are Developed (Italian Game)'
    ,'002 - 王车易位 - 第2课：易位后王的安全——防线具体分析（维也纳对局）': '002 - Castling - Lesson 2: King Safety after Castling - Analyze the Defensive Setup (Vienna Game)'
    ,'003 - 王车易位 - 第3课：长易位主动进攻——长易位不只是防御（皮尔斯防御）': '003 - Castling - Lesson 3: Long Castling for Attack - More than Just Defense (Pirc Defense)'
    ,'004 - 王车易位 - 第4课：异侧易位对攻——速度决定一切（西西里防御B57）': '004 - Castling - Lesson 4: Opposite-Side Castling - Speed Is Everything (Sicilian Defense, B57)'
    ,'005 - 王车易位 - 第5课：迟迟不易位的代价——Bg5钉马、叠兵、g线开放（意大利慢棋）': '005 - Castling - Lesson 5: The Cost of Delaying Castling - Bg5 Pins a Knight, Doubles Pawns, and Opens the g-file (Slow Italian Game)'
    ,'006 - 王车易位 - 第6课：短易位连接双车（西班牙封闭C84）': '006 - Castling - Lesson 6: Kingside Castling Connects the Rooks (Closed Ruy Lopez, C84)'
    ,'007 - 王车易位 - 第7课：稳健局面的易位时机（后翼弃兵兑换变例D35）': '007 - Castling - Lesson 7: Choosing When to Castle in a Quiet Position (Queen\'s Gambit Exchange Variation, D35)'
    ,'008 - 王车易位 - 第8课：长易位后车占开放线（西西里纳伊多夫B90）': '008 - Castling - Lesson 8: Long Castle, Then Place the Rooks on Open Files (Sicilian Najdorf, B90)'
    ,'009 - 王车易位 - 第9课：异侧易位的攻防节奏（西西里龙变B78）': '009 - Castling - Lesson 9: The Rhythm of Attack and Defense with Opposite-Side Castling (Sicilian Dragon, B78)'
    ,'010 - 王车易位 - 第10课：不需要易位的特例！（国王弃兵接受变例C33）': '010 - Castling - Lesson 10: A Special Case Where Castling Is Unnecessary (King\'s Gambit Accepted, C33)'
    ,'快速出子': 'Rapid Development'
    ,'⚡ 发展类元基因': '⚡ Development Principles'
    ,'001 - 快速出子 - 第1课：什么是轻子？每步出一个新的（意大利开局）': '001 - Rapid Development - Lesson 1: What Are Minor Pieces? Develop a New One Each Move (Italian Game)'
    ,'002 - 快速出子 - 第2课：轻子先行，重子随后（苏格兰开局）': '002 - Rapid Development - Lesson 2: Develop Minor Pieces First, Then Bring Out the Heavy Pieces (Scotch Game)'
    ,'003 - 快速出子 - 第3课：后早出被轻子追着跑——每次被追就是失去先手（帕勒姆进攻）': '003 - Rapid Development - Lesson 3: An Early Queen Gets Chased by Minor Pieces, Losing Time with Every Move (Parham Attack)'
    ,'004 - 快速出子 - 第4课：重复走子等于放弃先手——马走两次节奏损失（双骑士）': '004 - Rapid Development - Lesson 4: Repeated Moves Waste Time - Moving the Knight Twice Loses Tempo (Two Knights Defense)'
    ,'005 - 快速出子 - 第5课：弃兵换出子速度——丹麦弃兵的爆发力（丹麦弃兵）': '005 - Rapid Development - Lesson 5: Sacrifice a Pawn for Development - The Danish Gambit\'s Explosive Initiative'
    ,'006 - 快速出子 - 第6局：标准出子秩序的完整展示（费隆佐尼变体）': '006 - Rapid Development - Game 6: A Complete Model of Sound Piece Development (Philidor Variation)'
    ,'007 - 快速出子 - 第7局：封闭局面的轻子布置——伦敦体系标准出子（伦敦体系）': '007 - Rapid Development - Game 7: Developing Minor Pieces in a Closed Position (London System)'
    ,'008 - 快速出子 - 第8局：后被追着跑——发展落后的代价（斯堪纳维亚防御）': '008 - Rapid Development - Game 8: The Queen Gets Chased - The Cost of Falling Behind in Development (Scandinavian Defense)'
    ,'009 - 快速出子 - 第9局：弃子换节奏——国王弃兵的出子爆发力（国王弃兵）': '009 - Rapid Development - Game 9: Sacrifice Material for Tempo - The King\'s Gambit\'s Rapid Development'
    ,'010 - 快速出子 - 第10局：非主流开局也需出子完整——特罗姆普开局（特罗姆普）': '010 - Rapid Development - Game 10: Even an Unusual Opening Requires Complete Development (Trompowsky Attack)'
    ,'子力协调': 'Piece Coordination'
    ,'001 - 子力协调 - 第1课：每个棋子都有任务吗？（意大利开局）': '001 - Piece Coordination - Lesson 1: Does Every Piece Have a Job? (Italian Game)'
    ,'002 - 子力协调 - 第2课：马象互补，分工覆盖（西班牙开局）': '002 - Piece Coordination - Lesson 2: Knights and Bishops Complement Each Other (Ruy Lopez)'
    ,'003 - 子力协调 - 第3课：双象体系的覆盖威力（卡塔兰开局）': '003 - Piece Coordination - Lesson 3: The Power and Coverage of the Bishop Pair (Catalan Opening)'
    ,'004 - 子力协调 - 第4课：后是后盾，不是独行侠（维也纳开局）': '004 - Piece Coordination - Lesson 4: The Queen Supports the Team; It Does Not Work Alone (Vienna Game)'
    ,'005 - 子力协调 - 第5课：完美协调模型——每子角色清晰（四马开局）': '005 - Piece Coordination - Lesson 5: A Model of Perfect Coordination, with a Clear Role for Every Piece (Four Knights Game)'
    ,'006 - 子力协调 - 第6局：每个白棋子都有任务（后翼弃兵防御）': '006 - Piece Coordination - Game 6: Every White Piece Has a Purpose (Queen\'s Gambit Declined)'
    ,'007 - 子力协调 - 第7局：用钉子破坏协调——1个象换1个马的奥秘（尼姆佐印度防御）': '007 - Piece Coordination - Game 7: Disrupt Coordination with a Pin - Why Trade a Bishop for a Knight? (Nimzo-Indian Defense)'
    ,'008 - 子力协调 - 第8局：马对象的协调优势——柏林残局（西班牙柏林变例）': '008 - Piece Coordination - Game 8: Knight vs. Bishop Coordination in the Berlin Endgame (Ruy Lopez, Berlin Defense)'
    ,'009 - 子力协调 - 第9局：双方协调竞速——谁先协调完谁占优（焦科钢琴主线）': '009 - Piece Coordination - Game 9: A Race to Coordinate - The First Side to Organize Its Pieces Gains the Edge (Giuoco Piano)'
    ,'010 - 子力协调 - 第10局：极限协调施压——对攻中的子力分工（西西里纳伊多夫）': '010 - Piece Coordination - Game 10: Maximum Coordinated Pressure and Piece Roles in an Attack (Sicilian Najdorf)'
    ,'连接双车': 'Rook Coordination'
    ,'001 - 链接双车 - 第1课：连接双车的三步曲（意大利开局）': '001 - Rook Coordination - Lesson 1: Three Steps to Connect the Rooks (Italian Game)'
    ,'002 - 链接双车 - 第2课：双车分驻两条开放列（后翼弃兵防御）': '002 - Rook Coordination - Lesson 2: Place the Rooks on Separate Open Files (Queen\'s Gambit Declined)'
    ,'003 - 链接双车 - 第3课：叠车压制——双车叠在e列（尼姆佐-印度防御）': '003 - Rook Coordination - Lesson 3: Double the Rooks on the e-file to Build Pressure (Nimzo-Indian Defense)'
    ,'004 - 链接双车 - 第4课：后翼易位与占据通道（卡罗-卡恩古典变例）': '004 - Rook Coordination - Lesson 4: Queenside Castling and Occupying an Open File (Caro-Kann Classical Variation)'
    ,'005 - 链接双车 - 第5课：后+双车三子协调——最强阵型': '005 - Rook Coordination - Lesson 5: Queen and Two Rooks Coordinate as a Powerful Trio'
    ,'006 - 链接双车 - 第6局：逐步清空底线（鲁伊·洛佩兹C65变例）': '006 - Rook Coordination - Game 6: Clear the Back Rank Step by Step (Ruy Lopez, C65)'
    ,'007 - 链接双车 - 第7局：争夺开放列（尼姆佐-印度防御）': '007 - Rook Coordination - Game 7: Fight for the Open File (Nimzo-Indian Defense)'
    ,'008 - 链接双车 - 第8局：叠车接力突破（意大利开局C54）': '008 - Rook Coordination - Game 8: A Rook Battery Breaks Through in Relay (Italian Game, C54)'
    ,'009 - 链接双车 - 第9局：叠车压制（后翼弃兵接受变例D20，Nbd7改良）': '009 - Rook Coordination - Game 9: Rook-Battery Pressure (Queen\'s Gambit Accepted, D20, Nbd7 Improvement)'
    ,'010 - 链接双车 - 第10局：从连接到支配的完整流程（斯拉夫防御）': '010 - Rook Coordination - Game 10: From Connecting the Rooks to Dominating the Position (Slav Defense)'
    ,'兵链方向': 'Pawn-Chain Direction'
    ,'001 - 兵链方向 - 第1课：法国防御古典变例（C11）': '001 - Pawn-Chain Direction - Lesson 1: French Defense, Classical Variation (C11)'
    ,'002 - 兵链方向 - 第2课：法国防御推进变例（C02）': '002 - Pawn-Chain Direction - Lesson 2: French Defense, Advance Variation (C02)'
    ,'003 - 兵链方向 - 第3课：斯坦尼茨变例，攻击根部（C14）': '003 - Pawn-Chain Direction - Lesson 3: Steinitz Variation - Attack the Base (C14)'
    ,'004 - 兵链方向 - 第4课：QGD少数兵突破（D36）': '004 - Pawn-Chain Direction - Lesson 4: The Queen\'s Gambit Declined Minority Attack (D36)'
    ,'005 - 兵链方向 - 第5课：卡罗坎推进变例对比（B12）': '005 - Pawn-Chain Direction - Lesson 5: Comparing Caro-Kann Advance Variations (B12)'
    ,'006 - 兵链方向 - 练习6：法国温洩变例双翼竞速（C18）': '006 - Pawn-Chain Direction - Practice 6: French Winawer Variation - A Race on Both Wings (C18)'
    ,'007 - 兵链方向 - 练习7：国王印度马德普拉塔双链对攻（E97）': '007 - Pawn-Chain Direction - Practice 7: King\'s Indian Mar del Plata - Pawn-Chain Attacks on Both Wings (E97)'
    ,'008 - 兵链方向 - 练习8：尼姆佐古典变例根部反击（E41）': '008 - Pawn-Chain Direction - Practice 8: Nimzo-Indian Classical Variation - Counterattack at the Base (E41)'
    ,'009 - 兵链方向 - 练习9：QGD大中心变例兵链与残局（D55）': '009 - Pawn-Chain Direction - Practice 9: Queen\'s Gambit Declined - Pawn Chains and the Endgame (D55)'
    ,'010 - 兵链方向 - 练习10：英国开局非对称双兵链总结（A25）': '010 - Pawn-Chain Direction - Practice 10: Asymmetric Pawn Chains in the English Opening (A25)'
    ,'弱格利用': 'Weak-Square Exploitation'
    ,'001 - C10 - 弱格是怎么产生的（尼姆佐印度 E32）': '001 - C10 - How Weak Squares Arise (Nimzo-Indian Defense, E32)'
    ,'002 - C10 - 象对弱色格的控制（后翼弃兵 D53）': '002 - C10 - The Bishop Controls Weak Squares of One Color (Queen\'s Gambit Declined, D53)'
    ,'003 - C10 - 马占据弱格强格（国王印度 E91）': '003 - C10 - The Knight Occupies a Weak Square and Establishes an Outpost (King\'s Indian Defense, E91)'
    ,'004 - C10 - 兵前进留下弱格（法国温纳瓦尔 C19）': '004 - C10 - A Pawn Advance Leaves Weak Squares (French Winawer Variation, C19)'
    ,'005 - C10 - 利用d5弱格建立马的据点（尼姆佐印度 E43）': '005 - C10 - Use the Weak d5-Square to Establish a Knight Outpost (Nimzo-Indian Defense, E43)'
    ,'006 - C10 - Ba6瞄准弱格（后翼印度防御 E15）': '006 - C10 - Ba6 Targets a Weak Square (Queen\'s Indian Defense, E15)'
    ,'007 - C10 - 孤立兵制造弱格（英格兰开局 A13）': '007 - C10 - An Isolated Pawn Creates Weak Squares (English Opening, A13)'
    ,'008 - C10 - 兑换后的e5弱格（后翼弃兵 D30）': '008 - C10 - The Weak e5-Square after an Exchange (Queen\'s Gambit, D30)'
    ,'009 - C10 - 黑格弱点链（尼姆佐印度 E47）': '009 - C10 - A Chain of Dark-Square Weaknesses (Nimzo-Indian Defense, E47)'
    ,'010 - C10 - Ne4占据弱格+c3通路兵强制得子（英格兰开局 A17）': '010 - C10 - Ne4 Occupies a Weak Square as the c3-Passer Forces Material Gain (English Opening, A17)'
    ,'开放线': 'Open Files'
    ,'001 - C11 - 什么是半开放线（西西里防御 B20）': '001 - C11 - What Is a Semi-Open File? (Sicilian Defense, B20)'
    ,'002 - C11 - 争夺开放线的控制权（法国防御交换变 C01）': '002 - C11 - Fight for Control of the Open File (French Exchange Variation, C01)'
    ,'003 - C11 - 双车叠压开放线（后翼弃兵 D30）': '003 - C11 - Double the Rooks on an Open File (Queen\'s Gambit, D30)'
    ,'004 - C11 - d线争夺与车占中心格（国王印度 E61）': '004 - C11 - Fight for the d-file and Centralize the Rook (King\'s Indian Defense, E61)'
    ,'005 - C11 - 多线协同作战（西西里斯维什尼科夫 B33）': '005 - C11 - Coordinate Play across Multiple Files (Sicilian Sveshnikov, B33)'
    ,'006 - C11 - 抢占c线主动权（西西里四马变 B45）': '006 - C11 - Seize the Initiative on the c-file (Sicilian Four Knights, B45)'
    ,'007 - C11 - 车借d线入侵（QGD交换变 D35）': '007 - C11 - Invade along the d-file with the Rook (Queen\'s Gambit Declined Exchange Variation, D35)'
    ,'008 - C11 - e线开放后的战术得子（彼得罗夫防御 C42）': '008 - C11 - Win Material Tactically after the e-file Opens (Petrov Defense, C42)'
    ,'009 - C11 - 开放线配合底行弱点（雷蒂开局 A07）': '009 - C11 - Combine an Open File with a Back-Rank Weakness (Reti Opening, A07)'
    ,'010 - C11 - f6挑战楔子打通f线（卡罗-卡恩 B12）': '010 - C11 - Challenge the Pawn Wedge with ...f6 to Open the f-file (Caro-Kann Defense, B12)'
    ,'空间挤压': 'Space Advantage and Cramping'
    ,'001 - C12 - 识别挤压信号：法国推进变中的坏象（C02）': '001 - C12 - Recognize the Signs of a Cramp: The Bad Bishop in the French Advance (C02)'
    ,'002 - C12 - 识别反击点：被压方的自救（卡罗-卡恩推进变 B12）': '002 - C12 - Find a Counterattack: How to Rescue a Cramped Position (Caro-Kann Advance, B12)'
    ,'003 - C12 - 子力拥挤可视化：活动格计数（国王印度 E94）': '003 - C12 - Visualize Piece Congestion by Counting Active Squares (King\'s Indian Defense, E94)'
    ,'004 - C12 - 空间优势的正确跟进：不能空转（法国古典变 C11）': '004 - C12 - Follow Up a Space Advantage Correctly; Do Not Waste Tempi (French Classical Variation, C11)'
    ,'005 - C12 - 弹簧效应：过度压缩被反扑（国王印度四兵进攻 E76）': '005 - C12 - The Spring Effect: Overcompression Invites a Counterattack (King\'s Indian Four Pawns Attack, E76)'
    ,'006 - C12 - 练习6：指出被压子力并找到反击点（卡罗-卡恩推进变 B12）': '006 - C12 - Practice 6: Identify the Cramped Pieces and Find Counterplay (Caro-Kann Advance, B12)'
    ,'007 - C12 - 练习7：吃兵换来空间失衡（后翼弃兵接受变 D20）': '007 - C12 - Practice 7: A Pawn Capture Creates a Space Imbalance (Queen\'s Gambit Accepted, D20)'
    ,'008 - C12 - 练习8：局促中找反击（后印度防御 E12）': '008 - C12 - Practice 8: Find Counterplay in a Cramped Position (Queen\'s Indian Defense, E12)'
    ,'009 - C12 - 练习9：超现代防御：为什么主动让出空间？（现代防御 B06）': '009 - C12 - Practice 9: Hypermodern Defense - Why Give Up Space Deliberately? (Modern Defense, B06)'
    ,'010 - C12 - 练习10：谁的空间更有价值？（雷蒂改良KIA A07）': '010 - C12 - Practice 10: Whose Space Advantage Is More Valuable? (Reti-King\'s Indian Attack, A07)'
    ,'弃兵争先': 'Gambit for the Initiative'
    ,'001 - D13 - 国王弃兵接受变（费舍尔防御）': '001 - D13 - King\'s Gambit Accepted, Fischer Defense'
    ,'002 - D13 - 埃文斯弃兵': '002 - D13 - Evans Gambit'
    ,'003 - D13 - 丹麦弃兵': '003 - D13 - Danish Gambit'
    ,'004 - D13 - 布达佩斯弃兵': '004 - D13 - Budapest Gambit'
    ,'005 - D13 - 苏格兰弃兵': '005 - D13 - Scotch Gambit'
    ,'006 - D13 - 法尔克贝尔反弃兵': '006 - D13 - Falkbeer Countergambit'
    ,'007 - D13 - 埃文斯弃兵拒绝变': '007 - D13 - Evans Gambit Declined'
    ,'008 - D13 - 布莱克马-迪默弃兵': '008 - D13 - Blackmar-Diemer Gambit'
    ,'009 - D13 - 格林弃兵': '009 - D13 - Greco Gambit'
    ,'010 - D13 - 阿尔宾反弃兵': '010 - D13 - Albin Countergambit'
    ,'及时兑子': 'Timely Exchanges'
    ,'001 - D14 - 西班牙开局兑换变（C68）': '001 - D14 - Ruy Lopez Exchange Variation (C68)'
    ,'002 - D14 - 后翼弃兵兑换变（D35）': '002 - D14 - Queen\'s Gambit Exchange Variation (D35)'
    ,'003 - D14 - 后翼弃兵兑换变例': '003 - D14 - Queen\'s Gambit Exchange Variation'
    ,'004 - D14 - 国王印度正统变例': '004 - D14 - King\'s Indian Defense, Orthodox Variation'
    ,'005 - D14 - 彼得罗夫防御古典进攻（C42）': '005 - D14 - Petrov Defense, Classical Attack (C42)'
    ,'006 - D14 - 柏林防御温纳瓦变例': '006 - D14 - Berlin Defense, Winawer Variation'
    ,'007 - D14 - 西西里大奖赛进攻（B23）': '007 - D14 - Sicilian Grand Prix Attack (B23)'
    ,'008 - D14 - 伦敦体系兑换时机（D06）': '008 - D14 - Timing the Exchange in the London System (D06)'
    ,'009 - D14 - 西班牙马歇尔进攻（C84）': '009 - D14 - Ruy Lopez, Marshall Attack (C84)'
    ,'010 - D14 - 国王印度进攻综合练习（A48）': '010 - D14 - King\'s Indian Attack: Comprehensive Practice (A48)'
    ,'反制中心': 'Countering the Center'
    ,'001 - D15 - 斯堪的纳维亚防御': '001 - D15 - Scandinavian Defense'
    ,'002 - D15 - 法式防御古典变例': '002 - D15 - French Defense, Classical Variation'
    ,'003 - D15 - 卡罗-坎恩古典变例': '003 - D15 - Caro-Kann Defense, Classical Variation'
    ,'004 - D15 - 西西里那科多夫变例': '004 - D15 - Sicilian Defense, Najdorf Variation'
    ,'005 - D15 - 皮克防御': '005 - D15 - Pirc Defense'
    ,'006 - D15 - 法式温纳瓦变例': '006 - D15 - French Defense, Winawer Variation'
    ,'007 - D15 - 卡罗-坎恩推进变例': '007 - D15 - Caro-Kann Defense, Advance Variation'
    ,'008 - D15 - 现代防御150攻击': '008 - D15 - Modern Defense, 150 Attack'
    ,'009 - D15 - 老贝诺尼防御': '009 - D15 - Old Benoni Defense'
    ,'010 - D15 - 西西里坎变例': '010 - D15 - Sicilian Defense, Kan Variation'
    ,'关键时机': 'Critical Timing'
    ,'001 - D16 - 彼特罗夫防御': '001 - D16 - Petrov Defense'
    ,'002 - D16 - 西班牙开局开放系统': '002 - D16 - Ruy Lopez, Open Variation'
    ,'003 - D16 - 尼姆佐印度经典变例': '003 - D16 - Nimzo-Indian Defense, Classical Variation'
    ,'004 - D16 - 卡特兰开局封闭变例': '004 - D16 - Catalan Opening, Closed Variation'
    ,'005 - D16 - 国王印度防御经典变例': '005 - D16 - King\'s Indian Defense, Classical Variation'
    ,'006 - D16 - 后翼弃兵防御经典变例': '006 - D16 - Queen\'s Gambit Declined, Classical Variation'
    ,'007 - D16 - 西西里飞龙变例': '007 - D16 - Sicilian Defense, Dragon Variation'
    ,'008 - D16 - 法式温纳瓦进攻变例': '008 - D16 - French Defense, Winawer Attack'
    ,'009 - D16 - 卡罗-卡恩推进变例': '009 - D16 - Caro-Kann Defense, Advance Variation'
    ,'009 - D16 - 卡罗-坎恩推进变例': '009 - D16 - Caro-Kann Defense, Advance Variation'
    ,'010 - D16 - 后翼弃兵接受经典变例': '010 - D16 - Queen\'s Gambit Accepted, Classical Variation'
    ,'空间控制': 'Space Control'
    ,'🏗️ 结构类元基因': '🏗️ Structural Principles'
    ,'⚔️ 战略类元基因': '⚔️ Strategic Principles'
    ,'战略类元基因': 'Strategic Principles'
    ,'009 - D16 - 卡罗-卡恩推进变例': '009 - D16 - Caro-Kann Defense, Advance Variation'
    ,'001 - 空间控制 - 第1课：一步e5，黑方棋子挤成一团（法国推进）': '001 - Space Control - Lesson 1: One Move, e5, Cramp Black\'s Pieces (French Advance)'
    ,'002 - 空间控制 - 第2课：有保护的安全扩展，每步兵推进都有子力支撑（意大利）': '002 - Space Control - Lesson 2: Safe Expansion with Support behind Every Pawn Advance (Italian Game)'
    ,'003 - 空间控制 - 第3课：d5关闭中心，空间分割双方各守一翼（国王印度四兵）': '003 - Space Control - Lesson 3: d5 Closes the Center and Divides the Board into Separate Wings (King\'s Indian Four Pawns Attack)'
    ,'004 - 空间控制 - 第4课：反例——用兵追杀子力，后防空虚，e5无人守护被白送（阿列欣防御）': '004 - Space Control - Lesson 4: Counterexample - Chasing Pieces with Pawns Leaves e5 Undefended (Alekhine Defense)'
    ,'005 - 空间控制 - 第5课：诱敌深入，c5精准反击冒进兵链（法国防御）': '005 - Space Control - Lesson 5: Lure the Opponent Forward, Then Strike the Overextended Pawn Chain with c5 (French Defense)'
    ,'006 - 空间控制 - 第6局：判断空间差，对比双方活动区域（卡罗坎推进）': '006 - Space Control - Game 6: Assess the Space Advantage by Comparing Each Side\'s Activity (Caro-Kann Advance)'
    ,'007 - 空间控制 - 第7局：步步为营扩展，每步兵推进有子力支撑（后翼弃兵）': '007 - Space Control - Game 7: Expand Gradually, Supporting Each Pawn Advance with Pieces (Queen\'s Gambit)'
    ,'008 - 空间控制 - 第8局：双向空间竞赛，找出白方f4冒进漏洞（西西里龙式）': '008 - Space Control - Game 8: A Two-Sided Space Race Exposes White\'s Overextended f4 (Sicilian Dragon)'
    ,'009 - 空间控制 - 第9局：被压制时如何突围，找到c5关键解脱步（法国防御）': '009 - Space Control - Game 9: Break Out of a Cramped Position with the Key Liberating Move c5 (French Defense)'
    ,'010 - 空间控制 - 第10局：f5是安全还是冒进？判断空间推进时机（国王印度）': '010 - Space Control - Game 10: Is f5 Safe or Premature? Judge the Timing of a Space-Gaining Advance (King\'s Indian Defense)'
    ,'线路控制': 'File and Diagonal Control'
    ,'001 - 线路控制 - 第1课：打开e线，车立刻参战（意大利开局）': '001 - File and Diagonal Control - Lesson 1: Open the e-file and Bring the Rook into Play (Italian Game)'
    ,'002 - 线路控制 - 第2课：预判c线，提前布车等待（后翼弃兵）': '002 - File and Diagonal Control - Lesson 2: Anticipate the c-file and Position the Rook in Advance (Queen\'s Gambit)'
    ,'003 - 线路控制 - 第3课：打开斜线，象参战（埃文斯弃兵）': '003 - File and Diagonal Control - Lesson 3: Open a Diagonal to Activate the Bishop (Evans Gambit)'
    ,'004 - 线路控制 - 第4课：反例——c线打开了，车放错位置（斯拉夫防御）': '004 - File and Diagonal Control - Lesson 4: Counterexample - The c-file Opens, but the Rook Is Misplaced (Slav Defense)'
    ,'005 - 线路控制 - 第5课：同时打开多条线路，多子参战（苏格兰开局）': '005 - File and Diagonal Control - Lesson 5: Open Multiple Lines and Bring More Pieces into Play (Scotch Game)'
    ,'006 - 线路控制 - 第6课：弃子打开d线，车入侵d7赢后（菲利多尔防御）': '006 - File and Diagonal Control - Lesson 6: Sacrifice to Open the d-file, Invade on d7, and Win the Queen (Philidor Defense)'
    ,'007 - 线路控制 - 第7课：用兑换主动打开线路（卡洛卡恩兑换变体）': '007 - File and Diagonal Control - Lesson 7: Use an Exchange to Open a Line on Your Terms (Caro-Kann Exchange Variation)'
    ,'008 - 线路控制 - 第8课：封闭对方线路——d5兵封锁d线（尼姆佐印度防御）': '008 - File and Diagonal Control - Lesson 8: Block the Opponent\'s d-file with a Pawn on d5 (Nimzo-Indian Defense)'
    ,'009 - 线路控制 - 第9课：Re1占e线，瞄准第5横线渗透（意大利开局）': '009 - File and Diagonal Control - Lesson 9: Re1 Takes the e-file and Targets Infiltration on the Fifth Rank (Italian Game)'
    ,'010 - 线路控制 - 第10课：纵线+斜线联合——Re1与Bc2构建立体控制（西班牙封闭）': '010 - File and Diagonal Control - Lesson 10: Coordinate the File and Diagonal with Re1 and Bc2 (Closed Ruy Lopez)'
    ,'后兵对后': 'Queen and Pawn vs. Queen'
    ,'后对象': 'Queen vs. Bishop'
    ,'后对象兵': 'Queen vs. Bishop and Pawn'
    ,'后对马': 'Queen vs. Knight'
    ,'后对车': 'Queen vs. Rook'
    ,'车兵对车': 'Rook and Pawn vs. Rook'
    ,'双兵对峙': 'Two Pawns vs. Two Pawns'
    ,'三兵对双兵': 'Three Pawns vs. Two Pawns'
    ,'三兵对峙': 'Three Pawns vs. Three Pawns'
    ,'车双兵对车': 'Rook and Two Pawns vs. Rook'
    ,'车4兵对车3兵': 'Rook and Four Pawns vs. Rook and Three Pawns'
    ,'题库分类': 'Library Category'
    ,'高级工具': 'Advanced Tools'
    ,'高级工具与设置': 'Advanced Tools and Settings'
    ,'根基因局面编辑工作台': 'Root-Gene Position Editor'
    ,'参考题目筛选条件': 'Reference Puzzle Filters'
    ,'棋子颜色': 'Piece Color'
    ,'FEN局面文本': 'FEN Position Text'
    ,'为这道题命名': 'Name this puzzle'
    ,'手动记录候选着法或解题思路': 'Enter candidate moves or a solution outline'
    ,'记录教学目标、关键思路或设计备注': 'Enter the teaching goal, key ideas, or design notes'
    ,'选择棋子': 'Select a Piece'
    ,'选择后点击棋盘移除棋子': 'Select this tool, then click a piece on the board to remove it'
    ,'可编辑国际象棋棋盘': 'Editable chessboard'
    ,'仅在对弈练习中生效': 'Only applies to game practice'
    ,'手动模式：两人轮流点击操作': 'Manual mode: two players take turns making moves'
    ,'人机模式：你执白，AI执黑自动应对': 'Human vs AI: you play White and the AI responds as Black'
    ,'AI对弈：双方由AI自动对局，可暂停/继续': 'AI vs AI: both sides are controlled by the engine; pause or resume at any time'
    ,'自动播放': 'Autoplay'
    ,'悔棋': 'Undo'
    ,'下一步': 'Next Move'
    ,'音效开关': 'Toggle Sound Effects'
    ,'语音讲解开关': 'Toggle Voice Commentary'
    ,'解说开关': 'Toggle Commentary'
    ,'AI对战模式': 'AI Match Mode'
    ,'持子颜色': 'Piece Color'
    ,'高亮': 'Highlights'
    ,'导出日志': 'Export Log'
    ,'重置到开局': 'Reset to Start'
    ,'上一步': 'Previous Move'
    ,'开始自动播放': 'Start Autoplay'
    ,'关闭参数说明': 'Close Parameter Guide'
    ,'题目分组': 'Puzzle Group'
    ,'现有题目': 'Existing Puzzles'
    ,'载入并编辑': 'Load and Edit'
    ,'载入手工编辑': 'Load for Manual Editing'
    ,'摆放棋子': 'Place Pieces'
    ,'移除棋子': 'Remove Piece'
    ,'新题从空局面手动摆放': 'Set up a new puzzle from an empty position'
    ,'导入题目或 FEN': 'Import Puzzle or FEN'
    ,'选择棋子，再点击棋盘格进行摆放。': 'Select a piece, then click a square to place it.'
    ,'载入 FEN': 'Load FEN'
    ,'无': 'None'
    ,'L1 · 基础': 'L1 · Basic'
    ,'L2 · 组合': 'L2 · Combination'
    ,'L3 · 复杂': 'L3 · Advanced'
    ,'清空棋盘': 'Clear Board'
    ,'局面预览': 'Position Preview'
    ,'行棋方': 'Side to Move'
    ,'易位权': 'Castling Rights'
    ,'过路兵格': 'En Passant Target'
    ,'FEN 局面文本': 'FEN Position'
    ,'校验局面': 'Validate Position'
    ,'题目内容': 'Puzzle Details'
    ,'题目名称': 'Puzzle Name'
    ,'参考解答': 'Solution'
    ,'设计说明': 'Design Notes'
    ,'引擎分析': 'Engine Analysis'
    ,'分析当前局面，作为人工复核参考。': 'Analyze the current position as a reference for manual review.'
    ,'分析局面': 'Analyze Position'
    ,'保存设计': 'Save Design'
    ,'导出 JSON': 'Export JSON'
    ,'导出 FEN': 'Export FEN'
    ,'本机设计': 'Local Designs'
    ,'清空列表': 'Clear List'
    ,'还没有保存的设计': 'No saved designs yet'
    ,'题库原件保持不变。本机保存与导出均为修改草案；确认后再合并进正式题库。': 'The source puzzle library remains unchanged. Local saves and exports are drafts; merge them into the official library only after review.'
    ,'← 高级设置': '← Advanced Settings'
    ,'从现有残局题库筛选参考局面，载入后手工修改。': 'Filter positions from the existing endgame library, then load one for manual editing.'
    ,'手工设计台 ↗': 'Manual Design Workbench ↗'
    ,'抽取数量': 'Sample Size'
    ,'抽取参考题': 'Sample Reference Puzzles'
    ,'筛选沿用原生成器的难度级别与题目数量概念。当前题库包未保留 Syzygy 的 WDL/DTZ 分析字段，不能按 DTZ 筛选或生成新的表库局面。': 'Filtering uses the original generator’s difficulty and puzzle-count criteria. This library package does not include Syzygy WDL/DTZ data, so positions cannot be filtered by DTZ or generated from tablebases.'
    ,'参考题目': 'Reference Puzzles'
    ,'调整条件后抽取题目': 'Adjust the filters, then sample puzzles'
    ,'选择筛选条件并抽取，结果将显示在这里。': 'Choose filters and sample puzzles to see results here.'
    ,'抽样来源：已移植的本地题库。': 'Source: the ported local puzzle library.'
    ,'抽样只提供参考，不会运行 Syzygy 或 Lichess 原始生成脚本，也不会修改源题目。': 'Samples are for reference only. This does not run the original Syzygy or Lichess generators or modify source puzzles.'
    ,'残局基因 (endgame)': 'Endgame Puzzles (endgame)'
    ,'战术基因 (tactics)': 'Tactics Puzzles (tactics)'
    ,'攻杀基因 (mate)': 'Checkmate Puzzles (mate)'
    ,'开局基因 (opening)': 'Opening Puzzles (opening)'
    ,'综合基因 (comprehensive)': 'Mixed Puzzles (comprehensive)'
    ,'本次抽取': 'Sampled'
    ,'从': 'from'
    ,'道符合条件的题目中抽样': 'matching puzzles'
    ,'无匹配题目': 'No matching puzzles'
    ,'当前筛选条件没有可用题目，请调整难度或主题。': 'No puzzles match the current filters. Adjust the difficulty or theme.'
    ,'将军与应将': 'Check and Responses'
    ,'棋子样式': 'Piece Style'
    ,'战术A组': 'Tactics Group A'
    ,'战术B组': 'Tactics Group B'
    ,'战术C组': 'Tactics Group C'
    ,'战术D组': 'Tactics Group D'
    ,'要点提示': 'Key Tips'
    ,'操作练习：先点击上方一个选项按钮，再在棋盘上作答。': 'Practice: Select an option above, then answer on the board.'
    ,'问答练习：请选择上方一个问题开始作答。': 'Quiz: Select a question above to begin.'
    ,'请选择右侧的经典棋局开始演示': 'Select a classic game on the right to begin the demonstration'
    ,'使用引擎设置': 'Use Engine Settings'
    ,'黑方:': 'Black:'
    ,'白方:': 'White:'
    ,'🚩  吃过路兵': '🚩  En Passant'
    ,'对方兵走两格后可立即斜吃': 'Capture an opposing pawn en passant immediately after it advances two squares'
    ,'机会只有一步，错过永久消失！': 'You have only one move to do so; the opportunity disappears after that!'
    ,'困毙：无处可走且未被将军 = 和棋': 'Stalemate: no legal moves while not in check = draw'
    ,'子力不足 / 50回合无进展 / 三次重复局面 = 和棋': 'Insufficient material / 50 moves without progress / threefold repetition = draw'
    ,'将军：直接攻击对方的王': 'Check: directly attack the opposing king'
    ,'应将三法：移王 / 遮挡 / 吃掉攻击子': 'Three responses: move the king / block / capture the checking piece'
    ,'点击任意卡片，棋盘会自动演示对应的走法或规则要点': 'Select a card to see the corresponding move or rule demonstrated on the board'
    ,'🎉 恭喜你掌握了全部棋子走法！ ⭐ 下一步：进入「残局入门」继续学习': '🎉 You have learned how all the pieces move! ⭐ Next: continue with Endgame Basics'
    ,'♟️ 棋子样式': '♟️ Piece Style'
    ,'思考时间 ms': 'Move Time (ms)'
    ,'后台思考': 'Ponder'
    ,'变化数': 'Principal Variations'
    ,'着法开销 ms': 'Move Overhead (ms)'
    ,'最小思考 ms': 'Minimum Think Time (ms)'
    ,'时间分配': 'Time Allocation'
    ,'输出与调试': 'Output and Debugging'
    ,'轻视分数': 'Contempt'
    ,'残局库': 'Endgame Tablebase'
    ,'残局深度': 'Tablebase Probe Depth'
    ,'分裂深度': 'Split Depth'
    ,'分析模式': 'Analysis Mode'
    ,'显示 WDL': 'Show WDL'
    ,'高级选项': 'Advanced Options'
    ,'AI/AI 对弈模式': 'AI vs AI Mode'
    ,'黑方引擎': 'Black Engine'
    ,'参数说明': 'Parameter Guide'
    ,'保存所有设置': 'Save All Settings'
    ,'恢复所有默认': 'Restore All Defaults'
    ,'内置 nn-61e7af4bb97d': 'Built-in nn-61e7af4bb97d'
    ,'未设置': 'Not Set'
    ,'Stockfish 19 Lite 内置 NNUE，不支持关闭': 'Stockfish 19 Lite includes NNUE; it cannot be disabled'
    ,'浏览器版使用内置网络，不支持外部文件路径': 'The browser version uses the built-in network; external file paths are not supported'
    ,'当前对弈流程未实现 ponder / ponderhit': 'Ponder and ponderhit are not implemented in the current game flow'
    ,'当前浏览器引擎不支持': 'Not supported by the current browser engine'
    ,'网页棋盘规则暂不支持 Chess960': 'Chess960 is not supported by the web board rules'
    ,'当前 WASM 不支持本地 Syzygy 文件路径': 'The current WASM engine does not support local Syzygy paths'
    ,'思考时间 ms': 'Move Time (ms)'
    ,'等级 0 - 业余入门 (1350 ELO)': 'Level 0 - Beginner (1350 ELO)'
    ,'等级 1 - 业余初级 (1450 ELO)': 'Level 1 - Novice (1450 ELO)'
    ,'等级 2 - 业余进阶 (1550 ELO)': 'Level 2 - Intermediate (1550 ELO)'
    ,'等级 3 - 俱乐部选手 (1650 ELO)': 'Level 3 - Club Player (1650 ELO)'
    ,'等级 4 - 俱乐部好手 (1750 ELO)': 'Level 4 - Strong Club Player (1750 ELO)'
    ,'等级 5 - 高级俱乐部 (1850 ELO)': 'Level 5 - Advanced Club Player (1850 ELO)'
    ,'等级 6 - 专家级 (1950 ELO)': 'Level 6 - Expert (1950 ELO)'
    ,'等级 7 - 候补大师 (2100 ELO)': 'Level 7 - Candidate Master (2100 ELO)'
    ,'等级 8 - 大师 (2200 ELO)': 'Level 8 - Master (2200 ELO)'
    ,'等级 9 - 国际大师 (2300 ELO)': 'Level 9 - International Master (2300 ELO)'
    ,'等级 10 - 特级大师 (2400 ELO)': 'Level 10 - Grandmaster (2400 ELO)'
    ,'解说内容': 'Commentary'
    ,'残局基础': 'Endgame Basics'
    ,'残局基础 | 残局入门': 'Endgame Basics | Endgames'
    ,'战术运用': 'Tactics in Action'
    ,'基本攻杀': 'Basic Checkmates'
    ,'开局基础': 'Opening Basics'
    ,'停止演示': 'Stop Demo'
    ,'动态观察': 'Dynamic Observation'
    ,'操作练习': 'Practice'
    ,'问答练习': 'Quiz'
    ,'黑方棋子': 'Black Pieces'
    ,'棋盘边框': 'Board Border'
    ,'浅色格子': 'Light Squares'
    ,'深色格子': 'Dark Squares'
    ,'边框': 'Border'
    ,'对阵颜色': 'Piece Colors'
    ,'白方位置': 'White Side'
    ,'棋盘格子数': 'Squares on the Board'
    ,'格子总数': 'Total Squares'
    ,'棋盘颜色': 'Board Colors'
    ,'右下角颜色': 'Bottom-Right Square Color'
    ,'边界': 'Border'
    ,'横格': 'Ranks'
    ,'竖格': 'Files'
    ,'深斜格': 'Dark-Square Diagonals'
    ,'浅斜格': 'Light-Square Diagonals'
    ,'坐标': 'Coordinates'
    ,'左下坐标': 'Bottom-Left Coordinate'
    ,'右下坐标': 'Bottom-Right Coordinate'
    ,'左上坐标': 'Top-Left Coordinate'
    ,'右上坐标': 'Top-Right Coordinate'
    ,'斜格计数': 'Count Diagonal Squares'
    ,'王后数量': 'King and Queen Count'
    ,'车马象数量': 'Rook, Knight, and Bishop Count'
    ,'兵数量': 'Pawn Count'
    ,'单方总数': 'Total Pieces per Side'
    ,'全部总数': 'Total Pieces on the Board'
    ,'象马': 'Bishops and Knights'
    ,'车前兵': 'Rook Pawns'
    ,'马前兵': 'Knight Pawns'
    ,'象前兵': 'Bishop Pawns'
    ,'中间兵': 'Center Pawns'
    ,'认识王、后、车、象、马、兵六种棋子': 'Meet the six chess pieces: king, queen, rook, bishop, knight, and pawn'
    ,'观察不同棋子在棋盘上的初始位置': 'Explore the starting positions of the pieces'
    ,'通过操作练习快速区分不同棋子': 'Practice identifying each piece'
    ,'完成问答练习巩固数量和子力价值概念': 'Review piece counts and values with a quiz'
    ,'观察棋盘边界、深浅格子的交替排列': 'Observe the board edges and alternating light and dark squares'
    ,'认识横格、竖格和斜格的方向特征': 'Learn the directions of ranks, files, and diagonals'
    ,'熟悉棋盘四角坐标与基本定位方法': 'Learn the corner coordinates and how to locate squares'
    ,'通过操作和问答练习巩固棋盘结构认识': 'Reinforce your understanding of the board with practice and quizzes'
    ,'本单元是初步认识国际象棋，有一个大致的印象': 'This unit introduces the basics of chess and builds an initial understanding'
    ,'点击动态观察的按钮，观察高亮': 'Select an Explore option to see the highlighted squares'
    ,'通过操作练习，进一步加深印象': 'Use Practice to reinforce what you have learned'
    ,'完成简单的问答练习题目': 'Complete the short quiz'
    ,'⏹ 停止演示': '⏹ Stop Demo'
    ,'📋 棋子走法 · 要点总结': '📋 Piece Movement · Key Points'
    ,'向8个方向各走1格': 'Move one square in any direction'
    ,'不能走入被对方控制的格子': 'Cannot move to a square controlled by the opponent'
    ,'沿横线或竖线走任意格': 'Move any number of squares along a rank or file'
    ,'控制整行整列，直线上无死角': 'Controls entire ranks and files with unobstructed lines'
    ,'走L形（2+1格）': 'Move in an L shape (two squares, then one)'
    ,'唯一能跳过棋子的棋子': 'The only piece that can jump over other pieces'
    ,'沿斜线走任意格': 'Move any number of squares diagonally'
    ,'永远只走同色格，异色象互不干扰': 'Always stays on the same color; opposite-colored bishops never cross paths'
    ,'任意方向走任意格': 'Move any number of squares in any direction'
    ,'车与象的合体，全场最强棋子': 'Combines rook and bishop movement; the most powerful piece'
    ,'向前走1格（起步可走2格），斜前方吃子': 'Move forward one square (two from the starting rank); capture diagonally'
    ,'到达底线升变，最强可升为后': 'Promote on the last rank, usually to a queen'
    ,'王车易位': 'Castling'
    ,'王向车的方向移动两格，车跳到王的另一侧': 'The king moves two squares toward a rook, which jumps to the other side'
    ,'短易位（王翼）和长易位（后翼）': 'Kingside castling and queenside castling'
    ,'吃过路兵': 'En passant'
    ,'兵升变': 'Pawn promotion'
    ,'📊 题库统计': '📊 Puzzle Statistics'
    ,'题库根基因数目': 'Root Gene Puzzle Counts'
    ,'总题目': 'Total Puzzles'
    ,'残局': 'Endgames'
    ,'攻杀': 'Checkmates'
    ,'残局基因': 'Endgame Puzzles'
    ,'攻杀基因': 'Checkmate Puzzles'
    ,'战术基因': 'Tactics Puzzles'
    ,'开局基因': 'Opening Puzzles'
    ,'综合基因': 'Mixed Puzzles'
    ,'综合基因（暂无数据）': 'Mixed Puzzles (no data available)'
    ,'分布图表': 'Distribution Chart'
    ,'详细统计': 'Detailed Statistics'
    ,'类型': 'Type'
    ,'子分类': 'Category'
    ,'难度': 'Difficulty'
    ,'数量': 'Count'
    ,'题目类型': 'Puzzle Type'
    ,'难度级别': 'Difficulty Level'
    ,'推荐数量': 'Recommendation Count'
    ,'全部': 'All'
    ,'生成推荐': 'Generate Recommendations'
    ,'清空推荐': 'Clear Recommendations'
    ,'📁 题库目录': '📁 Puzzle Library'
    ,'暂无专家推荐': 'No expert recommendations yet'
    ,'我的记录': 'My Records'
    ,'用户管理': 'User Management'
    ,'当前用户': 'Current User'
    ,'当前练习用户': 'Current puzzle user'
    ,'用户1': 'User 1'
    ,'用户2': 'User 2'
    ,'用户3': 'User 3'
    ,'本周学习': 'This Week'
    ,'本月学习': 'This Month'
    ,'累计学习': 'All-Time Learning'
    ,'学习统计': 'Learning Statistics'
    ,'分类': 'Category'
    ,'L1级别': 'L1 Level'
    ,'L2级别': 'L2 Level'
    ,'L3级别': 'L3 Level'
    ,'总计': 'Total'
    ,'暂无练习记录，开始你的学习之旅吧！': 'No practice records yet. Start your learning journey!'
    ,'学习趋势': 'Learning Trends'
    ,'周期': 'Period'
    ,'按周': 'Weekly'
    ,'按月': 'Monthly'
    ,'暂无学习记录': 'No learning records yet'
    ,'分类分布': 'Category Distribution'
    ,'暂无分类数据': 'No category data available'
    ,'学习推荐': 'Learning Recommendations'
    ,'智能推荐': 'Smart Recommendations'
    ,'手动选择': 'Select Manually'
    ,'更新': 'Refresh'
    ,'推荐模式': 'Recommendation Mode'
    ,'暂无推荐': 'No recommendations yet'
    ,'⚙️ 系统设置': '⚙️ Chess Settings'
    ,'系统设置 | 国际象棋智慧平台': 'Chess Settings | Chess Learning Platform'
    ,'🤖 AI引擎 AI引擎管理': '🤖 AI Engine AI Engine Management'
    ,'AI引擎': 'AI Engine'
    ,'显示界面': 'Display'
    ,'专业': 'Professional'
    ,'© 2025 CogniChess - 象棋智能学习系统': '© 2025 CogniChess - Chess Learning System'
    ,'🎮 游戏设置': '🎮 Game Settings'
    ,'游戏体验配置': 'Gameplay Configuration'
    ,'游戏体验、时间控制、难度等设置': 'Configure gameplay, time controls, and difficulty'
    ,'基础': 'Basic'
    ,'🤖 AI引擎': '🤖 AI Engine'
    ,'AI引擎管理': 'AI Engine Management'
    ,'引擎管理、性能配置、个性化设置': 'Manage engine performance and preferences'
    ,'核心': 'Core'
    ,'🎵 语音音效': '🎵 Voice and Sound'
    ,'声音配置': 'Audio Configuration'
    ,'音效设置、语音播报、TTS配置': 'Sound effects, narration, and text-to-speech settings'
    ,'体验': 'Experience'
    ,'🎨 显示界面': '🎨 Display'
    ,'界面主题': 'Interface Theme'
    ,'主题外观、棋盘样式、界面布局': 'Themes, board styles, and layout'
    ,'外观': 'Appearance'
    ,'🔧 高级设置': '🔧 Advanced Settings'
    ,'系统配置': 'System Configuration'
    ,'生成工具、题库维护与系统维护': 'Generators, puzzle library, and maintenance'
    ,'高级': 'Advanced'
    ,'🧬 根基因库': '🧬 Root Gene Library'
    ,'题目生成': 'Puzzle Generation'
    ,'浏览现有题库，手动设计、修改与补充题目': 'Browse, create, edit, and add puzzles'
    ,'← 系统设置': '← Chess Settings'
    ,'生成工具与题库维护': 'Generators and Puzzle Library'
    ,'管理工具': 'Management Tools'
    ,'可用': 'Available'
    ,'题库维护': 'Puzzle Library Maintenance'
    ,'手工局面设计': 'Manual Position Editor'
    ,'浏览现有分类与题目，手动修改局面、答案和说明，或补充新题草案。': 'Browse puzzles and edit positions, solutions, explanations, or drafts.'
    ,'打开设计工作台': 'Open Editor'
    ,'精选题库已载入': 'Curated Puzzle Library Loaded'
    ,'ECO 开局': 'ECO Openings'
    ,'开局题库维护': 'Opening Puzzle Library'
    ,'浏览精选开局': 'Browse Curated Openings'
    ,'参考池可用': 'Reference Pool Available'
    ,'残局 · Syzygy': 'Endgames · Syzygy'
    ,'残局参考生成器': 'Endgame Reference Generator'
    ,'参考范围': 'Reference Scope'
    ,'题目类型': 'Puzzle Type'
    ,'战术题': 'Tactics Puzzles'
    ,'攻杀题': 'Checkmate Puzzles'
    ,'全部难度': 'All Levels'
    ,'残局主题': 'Endgame Theme'
    ,'全部主题': 'All Themes'
    ,'抽取残局参考题': 'Select Endgame Reference Puzzles'
    ,'攻杀 · 战术': 'Checkmate · Tactics'
    ,'Lichess 参考生成器': 'Lichess Reference Generator'
    ,'抽取战术 / 攻杀参考': 'Select Tactics / Checkmate References'
    ,'开发中': 'In Development'
    ,'数据维护': 'Data Maintenance'
    ,'数据库管理': 'Database Management'
    ,'数据库备份、导入导出和题库版本管理尚未实现。': 'Database backup, import/export, and puzzle versioning are not yet available.'
    ,'原桌面端也标记为未来功能': 'Also marked as a future feature in the desktop app'
    ,'系统诊断': 'System Diagnostics'
    ,'日志查看器': 'Log Viewer'
    ,'← 返回设置': '← Back to Settings'
    ,'🎨 显示界面设置': '🎨 Display Settings'
    ,'🎨 棋盘主题': '🎨 Board Theme'
    ,'✓ 标准绿': '✓ Classic Green'
    ,'🌊 海洋蓝': '🌊 Ocean Blue'
    ,'🔥 传统棕': '🔥 Traditional Wood'
    ,'♟️ 棋子样式': '♟️ Piece Style'
    ,'✓ 经典图像棋子': '✓ Classic Piece Images'
    ,'🔥 简洁描边填充': '🔥 Outline Pieces'
    ,'· 极简字符': '· Minimal Characters'
    ,'👁️ 实时预览': '👁️ Live Preview'
    ,'🤖 AI引擎设置': '🤖 AI Engine Settings'
    ,'人机对弈模式': 'Human vs AI'
    ,'人机模式设置': 'Human vs AI Settings'
    ,'基础设置': 'Basic Settings'
    ,'硬件档位': 'Hardware Profile'
    ,'低配': 'Low-End'
    ,'自动': 'Automatic'
    ,'高性能': 'High Performance'
    ,'线程数': 'Threads'
    ,'哈希表 MB': 'Hash Table (MB)'
    ,'启用 NNUE（内置）': 'Enable NNUE (Built-in)'
    ,'NNUE 文件': 'NNUE File'
    ,'棋力控制': 'Playing Strength'
    ,'AI等级': 'AI Level'
    ,'技能等级': 'Skill Level'
    ,'限制棋力': 'Limit Strength'
    ,'Elo等级': 'Elo Rating'
    ,'搜索深度': 'Search Depth'
    ,'白方引擎': 'White Engine'
    ,'📊 局面优势': '📊 Position Advantage'
    ,'等待分析...': 'Waiting for analysis...'
    ,'🔍 搜索状态': '🔍 Search Status'
    ,'深度: 等待中...': 'Depth: waiting...'
    ,'节点: 等待中...': 'Nodes: waiting...'
    ,'时间: 等待中...': 'Time: waiting...'
    ,'🎯 候选走法': '🎯 Candidate Moves'
    ,'☁️ 局面评估': '☁️ Position Evaluation'
    ,'🎯 分析设置': '🎯 Analysis Settings'
    ,'棋局': 'Game'
    ,'答案': 'Solution'
    ,'走子记录': 'Move History'
    ,'解说': 'Commentary'
    ,'🔊 解说': '🔊 Commentary'
    ,'保存解说': 'Save Commentary'
    ,'题库练习': 'Puzzle Practice'
    ,'题库目录': 'Puzzle Library'
    ,'当前用户': 'Current User'
    ,'用户1': 'User 1'
    ,'用户2': 'User 2'
    ,'用户3': 'User 3'
    ,'本周学习': 'This Week'
    ,'本月学习': 'This Month'
    ,'累计学习': 'All-Time Learning'
    ,'学习趋势': 'Learning Trends'
    ,'学习统计': 'Learning Statistics'
    ,'学习推荐': 'Learning Recommendations'
    ,'暂无学习记录': 'No learning records yet'
    ,'暂无分类数据': 'No category data available'
    ,'暂无练习记录，开始你的学习之旅吧！': 'No practice records yet. Start your learning journey!'
    ,'残局基因 (endgame)': 'Endgame Puzzles'
    ,'战术基因 (tactics)': 'Tactics Puzzles'
    ,'攻杀基因 (mate)': 'Checkmate Puzzles'
    ,'开局基因 (opening)': 'Opening Puzzles'
    ,'综合基因 (comprehensive)': 'Mixed Puzzles'
    ,'专家推荐': 'Expert Picks'
    ,'🤖 专家推荐': '🤖 Expert Picks'
    ,'当前回合：白方': 'White to move'
    ,'当前回合：黑方': 'Black to move'
    ,'点击答案按钮加载答案内容...': 'Click Solution to load the answer...'
    ,'请选择解说目录或题库题目...': 'Choose a commentary folder or puzzle...'
    ,'运行日志': 'Runtime Log'
    ,'开始记录': 'Start Recording'
    ,'走子记录': 'Move History'
    ,'解说': 'Commentary'
    ,'棋局': 'Game'
    ,'答案': 'Solution'
    ,'保存解说': 'Save Commentary'
    ,'题库练习': 'Puzzle Practice'
    ,'题库目录': 'Puzzle Library'
    ,'未命名棋局': 'Untitled Game'
    ,'从标准开局开始': 'Start from the Standard Position'
    ,'保存成功': 'Saved successfully'
    ,'保存失败': 'Save failed'
    ,'返回对弈': 'Back to Game'
    ,'运行日志已清空': 'Runtime log cleared'
    ,'专家推荐列表为空': 'No expert recommendations'
    ,'没有找到符合条件的题目': 'No puzzles match the selected criteria'
    ,'日志查看器': 'Log Viewer'
    ,'等价分析: ': 'Evaluation: '
    ,'白方略优': 'White is slightly better'
    ,'黑方略优': 'Black is slightly better'
    ,'均势': 'Equal position'
    ,'层': ' ply'
    ,'深度: ': 'Depth: '
    ,'节点: ': 'Nodes: '
    ,'时间: ': 'Time: '
    ,'解说区：后续接入教程与题库解释输出。': 'Commentary panel: lesson and puzzle explanations will appear here.'
    ,'返回设置': 'Back to Settings'
    ,'系统设置': 'Chess Settings'
    ,'高级设置': 'Advanced Settings'
    ,'显示界面设置': 'Display Settings'
    ,'AI引擎设置': 'AI Engine Settings'
    ,'题目参考生成器': 'Puzzle Reference Generator'
    ,'根基因库': 'Root Gene Library'
    ,'游戏设置': 'Game Settings'
    ,'时间控制': 'Time Control'
    ,'难度级别': 'Difficulty Level'
    ,'基础设置': 'Basic Settings'
    ,'硬件档位': 'Hardware Profile'
    ,'低配': 'Low-End'
    ,'自动': 'Automatic'
    ,'高性能': 'High Performance'
    ,'线程数': 'Threads'
    ,'哈希表 MB': 'Hash Table (MB)'
    ,'启用 NNUE（内置）': 'Enable NNUE (Built-in)'
    ,'NNUE 文件': 'NNUE File'
    ,'棋力控制': 'Playing Strength'
    ,'AI等级': 'AI Level'
    ,'技能等级': 'Skill Level'
    ,'限制棋力': 'Limit Strength'
    ,'Elo等级': 'Elo Rating'
    ,'搜索深度': 'Search Depth'
    ,'题库维护': 'Puzzle Library Maintenance'
    ,'数据维护': 'Data Maintenance'
    ,'数据库管理': 'Database Management'
    ,'系统诊断': 'System Diagnostics'
    ,'数据库备份、导入导出和题库版本管理尚未实现。': 'Database backup, import/export, and puzzle versioning are not yet available.'
    ,'原桌面端也标记为未来功能': 'Also marked as a future feature in the desktop app'
    ,'局面设计': 'Position Editor'
    ,'编辑中': 'Editing'
    ,'基因与棋子': 'Genes and Pieces'
    ,'基因类型': 'Gene Type'
    ,'难度级别': 'Difficulty Level'
    ,'L1 基础': 'L1 Basic'
    ,'L2 组合': 'L2 Combination'
    ,'L3 复杂': 'L3 Advanced'
    ,'根基因 / 主题': 'Root Gene / Theme'
    ,'王兵残局': 'King and Pawn Endgames'
    ,'车后残局': 'Rook and Queen Endgames'
    ,'轻子残局': 'Minor-Piece Endgames'
    ,'选择现有根基因主题，或载入已有题目进行修改。': 'Choose a root-gene theme or load an existing puzzle to edit.'
    ,'载入已有题目': 'Load Existing Puzzle'
    ,'题目分组': 'Puzzle Groups'
    ,'运行日志': 'Runtime Log'
    ,'题库目录': 'Puzzle Library'
    ,'残局基因 (endgame)': 'Endgame Puzzles (endgame)'
    ,'战术基因 (tactics)': 'Tactics Puzzles (tactics)'
    ,'攻杀基因 (mate)': 'Checkmate Puzzles (mate)'
    ,'开局基因 (opening)': 'Opening Puzzles (opening)'
    ,'综合基因 (comprehensive)': 'Mixed Puzzles (comprehensive)'
    ,'点击答案按钮加载答案内容...': 'Click Solution to load the answer...'
    ,'请选择解说目录或题库题目...': 'Choose a commentary folder or puzzle...'
    ,'专家推荐': 'Expert Picks'
    ,'🤖 专家推荐': '🤖 Expert Picks'
    ,'本周学习': 'This Week'
    ,'本月学习': 'This Month'
    ,'累计学习': 'All-Time Learning'
    ,'暂无练习记录，开始你的学习之旅吧！': 'No practice records yet. Start your learning journey!'
    ,'学习趋势': 'Learning Trends'
    ,'按周': 'Weekly'
    ,'按月': 'Monthly'
    ,'暂无学习记录': 'No learning records yet'
    ,'分类分布': 'Category Distribution'
    ,'暂无分类数据': 'No category data available'
    ,'学习推荐': 'Learning Recommendations'
    ,'智能推荐': 'Smart Recommendations'
    ,'手动选择': 'Select Manually'
    ,'更新': 'Refresh'
    ,'正在加载棋局...': 'Loading game...'
    ,'请选择题目开始练习': 'Select a puzzle to begin'
    ,'请选择棋局开始演示': 'Select a game to begin'
    ,'请选择右侧的题目开始练习': 'Select a puzzle on the right to begin'
    ,'手动局面设计': 'Manual Position Editor'
    ,'精选题库已载入': 'Curated Puzzle Library Loaded'
    ,'参考池可用': 'Reference Pool Available'
    ,'载入现有 16 个开局元基因的精选演示与练习局面，继续手工修订或补充。': 'Load curated demos and practice positions for 16 opening principles to revise or expand.'
    ,'从已移植残局题库按主题和 L1–L3 抽取参考题目，载入后手工修改。原始 Syzygy 新局面生成尚未接入。': 'Select reference positions by theme and level from the imported endgame library, then edit them. Generating new Syzygy positions is not yet available.'
    ,'从已移植的 Lichess 来源题目按类型、主题和 L1–L3 抽样，作为手工修订的参考。': 'Sample imported Lichess puzzles by type, theme, and level as references for manual editing.'
    ,'浏览器日志采集、筛选与诊断界面尚未实现。': 'Browser log collection, filtering, and diagnostics are not yet available.'
    ,'系统维护': 'System Maintenance'
    ,'缓存与性能': 'Cache and Performance'
    ,'缓存清理、性能优化和系统诊断工具尚未实现。': 'Cache cleanup, performance optimization, and diagnostics are not yet available.'
    ,'生成器仅处理已有题库与明确的数据源。': 'Generators only use existing puzzle libraries and explicitly defined sources.'
    ,'题库原件不会被浏览器草稿直接覆盖。': 'Browser drafts never overwrite original puzzle data.'
    ,'请选择右侧的棋子类型开始动态观察': 'Select a piece type on the right to explore endgames'
    ,'请选择右侧的战术组开始动态观察': 'Select a tactics group on the right to explore'
    ,'请选择右侧的将法类型开始动态观察': 'Select a checkmate pattern on the right to explore'
    ,'请选择右侧的元思维类别开始动态观察': 'Select an opening-principle category on the right to explore'
    ,'请选择问题开始答题': 'Select a question to begin the quiz'
    ,'请选择残局以显示棋谱': 'Select an endgame to show its game line'
    ,'请选择残局以显示解说内容': 'Select an endgame to show commentary'
    ,'请选择棋局以显示棋谱': 'Select a game to show its game line'
    ,'请选择棋局以显示解说内容': 'Select a game to show commentary'
    ,'后': 'Queen'
    ,'车': 'Rook'
    ,'象': 'Bishop'
    ,'马': 'Knight'
    ,'兵': 'Pawn'
    ,'安娜斯塔西亚杀': 'Anastasia Mate'
    ,'底线杀': 'Back-Rank Mate'
    ,'闷杀': 'Smothered Mate'
    ,'钩杀': 'Hook Mate'
    ,'阿拉伯杀': 'Arabian Mate'
    ,'燕尾杀': 'Dovetail Mate'
    ,'博登杀': 'Boden Mate'
    ,'控制类': 'Control',
    '发展类': 'Development',
    '结构类': 'Structure',
    '战略类': 'Strategy',
    '从零基础到进阶': 'From Beginner to Advanced',
    '题库数据统计': 'Puzzle Library Statistics',
    '最近更新': 'Recently Updated',
    '筛选条件': 'Filters',
    '全部难度': 'All Difficulties',
    '全部主题': 'All Themes',
    '全部分类': 'All Categories',
    '兵对兵': 'Pawn vs. Pawn',
    '兵对王': 'Pawn vs. King',
    '车兵对车': 'Rook and Pawn vs. Rook',
    '车对升变兵': 'Rook vs. Passed Pawn',
    '车对王': 'Rook vs. King',
    '车双兵对车': 'Rook and Two Pawns vs. Rook',
    '后兵对后': 'Queen and Pawn vs. Queen',
    '后车对王': 'Queen and Rook vs. King',
    '后对车': 'Queen vs. Rook',
    '后对马': 'Queen vs. Knight',
    '后对升变兵': 'Queen vs. Passed Pawn',
    '后对王': 'Queen vs. King',
    '后对象': 'Queen vs. Bishop',
    '后对象兵': 'Queen vs. Bishop and Pawn',
    '马兵对马': 'Knight and Pawn vs. Knight',
    '马兵对王': 'Knight and Pawn vs. King',
    '车4兵对车3兵': 'Rook and Four Pawns vs. Rook and Three Pawns',
    '进行中': 'In Progress',
    '已完成': 'Completed',
    '未开始': 'Not Started',
    '成功': 'Success',
    '失败': 'Failure',
    '学习次数': 'Study Sessions',
    '完成率': 'Completion Rate',
    '正确率': 'Accuracy',
    '平均用时': 'Average Time',
    '秒': 'sec',
    '次': ' sessions',
    '级别': 'Level',
    '主题': 'Theme',
    '标签': 'Tags',
    '搜索': 'Search',
    '重置': 'Reset',
    '确认': 'Confirm',
    '导入': 'Import',
    '导出': 'Export',
    '备份': 'Backup',
    '恢复': 'Restore',
    '当前没有记录': 'No records yet',
    '暂无数据': 'No data available',
    '加载中...': 'Loading...',
    '保存成功': 'Saved successfully',
    '保存失败': 'Save failed',
    '生成成功': 'Generated successfully',
    '生成失败': 'Generation failed',
    'L1 基础 / 双象对王 · 6': 'L1 Basic / Two Bishops vs. King · 6',
    'L1 入门': 'L1 Beginner',
    'L2 基础': 'L2 Basic',
    'L3 进阶': 'L3 Advanced',
    '该题源文件中的解答尚未补充。': 'The solution for this puzzle has not been added to the source file yet.',
    '有未保存修改': 'Unsaved changes',
    '局面已更改，请重新分析。': 'Position changed. Analyze again.',
    '点击棋盘摆放所选棋子。': 'Click the board to place the selected piece.',
    '点击棋子即可移除。': 'Click a piece to remove it.',
    '选择目标空格移动该棋子。': 'Select an empty square to move this piece.',
    '选择棋子，再点击棋盘格进行摆放。': 'Select a piece, then click a square to place it.',
    '清空棋盘': 'Clear Board',
    '载入 FEN': 'Load FEN',
    '校验局面': 'Validate Position',
    '局面检查通过：FEN结构、棋子数量限制及双方王位置有效。': 'Position is valid: FEN structure, piece-count limit, and both kings are correct.',
    'FEN结构与双方王位置检查通过。': 'FEN structure and king positions are valid.',
    '局面已载入': 'Position Loaded',
    '已载入题库题目': 'Puzzle Loaded',
    '设计已载入': 'Design Loaded',
    '设计已保存': 'Design Saved',
    '草案已保存到本机浏览器，原题库未被修改。': 'Draft saved in this browser. The source puzzle library was not changed.',
    '本机存储不可用或空间不足，未能保存。': 'Local storage is unavailable or full. The design could not be saved.',
    '还没有保存的设计': 'No saved designs yet',
    '本机设计数据无法读取': 'Could not read local design data',
    '本机设计数据格式损坏，未覆盖原数据。': 'Local design data is corrupted. The original data was not overwritten.',
    '源题目不在当前题库中，无法载入。': 'The source puzzle is not in the current library and cannot be loaded.',
    '分析当前局面，作为人工复核参考。': 'Analyze the current position as a reference for manual review.',
    '正在分析…': 'Analyzing…',
    '正在启动 Stockfish…': 'Starting Stockfish…',
    '引擎启动超时': 'Engine startup timed out',
    '局面分析超时': 'Position analysis timed out',
    '评估不可用': 'Evaluation unavailable',
    '仅供人工复核。': 'For manual review only.',
    '兵不能放在升变后的底线。': 'Pawns cannot be placed on their promotion rank.',
    '棋盘上的棋子总数不能超过32枚。': 'A chess position cannot contain more than 32 pieces.',
    '局面必须恰好包含白王和黑王各一枚。': 'A position must contain exactly one White king and one Black king.',
    '双方王不能相邻。': 'The kings cannot be adjacent.',
    'FEN需包含完整六个字段和正确的行棋方。': 'FEN must contain all six fields and a valid side to move.',
    'FEN易位权或吃过路兵格无效。': 'FEN castling rights or en passant target is invalid.',
    'FEN棋盘必须恰好包含8行。': 'The FEN board must contain exactly eight ranks.',
    'FEN同一行不能连续出现多个空格数字。': 'FEN cannot contain consecutive empty-square counts in the same rank.',
    'L1 基础': 'L1 Basic',
    'L2 组合': 'L2 Combination',
    'L3 复杂': 'L3 Advanced'
  };
  var originals = new WeakMap();
  var rendered = new WeakMap();
  var originalAttributes = new WeakMap();
  var renderedAttributes = new WeakMap();
  var language = readLanguage();
  var originalTitle = '';
  var observer;

  function readLanguage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
    } catch (error) {
      return 'zh';
    }
  }

  function translateText(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed) return text;
    var pawnEvaluation = trimmed.match(/^(-?[\d.]+)\s+兵$/);
    if (pawnEvaluation) return pawnEvaluation[1] + ' pawns';
    var prefix = '';
    var suffix = '';
    var content = trimmed;
    var numberMatch = content.match(/^(\d+(?:\.\d+)+\s+|\d+\.\s*|\d+\s+·\s+)/);
    if (numberMatch) {
      prefix = numberMatch[1];
      content = content.slice(prefix.length);
    }
    if (content.endsWith(' ▼')) {
      suffix = ' ▼';
      content = content.slice(0, -2);
    }
    var iconPrefix = content.match(/^(🤖|♟️?|♔|♕|♖|♗|♘|📌|🏁|⚠️|⬆️|⬇️|🚩|🤝|⚔️|✅|❌)\s*/);
    if (iconPrefix) {
      prefix += iconPrefix[0];
      content = content.slice(iconPrefix[0].length);
    }
    var translated = translations[content];
    if (!translated) {
      var invalidFenPiece = content.match(/^FEN中包含无效棋子符号：(.+)$/);
      if (invalidFenPiece) translated = 'FEN contains an invalid piece symbol: ' + invalidFenPiece[1];
    }
    if (!translated) {
      var invalidFenRank = content.match(/^FEN第(\d+)行没有恰好8格。$/);
      if (invalidFenRank) translated = 'FEN rank ' + invalidFenRank[1] + ' does not contain exactly eight squares.';
    }
    if (!translated) {
      var loadedQuestion = content.match(/^已载入「(.+)」，修改后请另存为草案。$/);
      if (loadedQuestion) translated = 'Loaded “' + translateText(loadedQuestion[1]) + '”. Save your changes as a draft.';
    }
    if (!translated) {
      var sourcePath = content.match(/^源题目：(.+)。原题库文件未被修改。$/);
      if (sourcePath) translated = 'Source puzzle: ' + translateText(sourcePath[1]) + '. The original library file was not modified.';
    }
    if (!translated) {
      var suggestedMove = content.match(/^建议着法 (.+?) · 当前行棋方视角 (.+?)。仅供人工复核。$/);
      if (suggestedMove) translated = 'Suggested move: ' + suggestedMove[1] + ' · Evaluation from the side-to-move perspective: ' + translateText(suggestedMove[2]) + '. For manual review only.';
    }
    if (!translated) {
      var mateEvaluation = content.match(/^将杀 (-?\d+)$/);
      if (mateEvaluation) translated = 'Mate in ' + mateEvaluation[1];
    }
    if (!translated) {
      var pawnEvaluationAfterPrefix = content.match(/^(-?[\d.]+) 兵$/);
      if (pawnEvaluationAfterPrefix) translated = pawnEvaluationAfterPrefix[1] + ' pawns';
    }
    if (!translated) {
      var selectedToolPrompt = content.match(/^已选择(.+)，点击棋盘摆放。$/);
      if (selectedToolPrompt) translated = 'Selected ' + selectedToolPrompt[1] + '. Click the board to place it.';
    }
    if (!translated) {
      var categoryLevel = content.match(/^(.+?) · (L[123])$/);
      if (categoryLevel && translations[categoryLevel[1]]) translated = translations[categoryLevel[1]] + ' · ' + categoryLevel[2];
    }
    if (!translated) {
      var recommendationSaved = content.match(/^已生成并保存\s*(\d+)\s*个推荐题目$/);
      if (recommendationSaved) translated = 'Generated and saved ' + recommendationSaved[1] + ' recommended puzzles';
    }
    if (!translated) {
      var currentRecommendations = content.match(/^当前已保存\s*(\d+)\s*个推荐题目$/);
      if (currentRecommendations) translated = currentRecommendations[1] + ' recommended puzzles currently saved';
    }
    if (!translated) {
      var generatedRecommendations = content.match(/^已生成\s*(\d+)\s*个推荐题目，已保存，可在对弈页面查看。(?:其中\s*(\d+)\s*题缺少 FEN，暂不能载入棋盘。)?$/);
      if (generatedRecommendations) {
        translated = 'Generated and saved ' + generatedRecommendations[1] + ' recommended puzzles. View them on the Play page.';
        if (generatedRecommendations[2]) translated += ' ' + generatedRecommendations[2] + ' puzzle(s) lack FEN and cannot be loaded on the board yet.';
      }
    }
    if (!translated) {
      var avatarGroup = content.match(/^(.+)的头像$/);
      if (avatarGroup) translated = avatarGroup[1] + ' avatar';
    }
    if (!translated) {
      var compactLevel = content.match(/^等级\s*(\d+)\s*-\s*(.+?)｜S(\d+) D(\d+) T(\d+)ms$/);
      if (compactLevel) translated = 'Level ' + compactLevel[1] + ' - ' + (translations[compactLevel[2]] || compactLevel[2]) + ' | S' + compactLevel[3] + ' D' + compactLevel[4] + ' T' + compactLevel[5] + 'ms';
    }
    if (!translated && content === '🧪 引擎设置') translated = '🧪 Engine Settings';
    if (!translated) {
      var evaluation = content.match(/^等价分析:\s*(白方略优|黑方略优|均势)$/);
      if (evaluation) translated = 'Evaluation: ' + (translations[evaluation[1]] || evaluation[1]);
    }
    if (!translated) {
      var depthMetric = content.match(/^深度:\s*(.+?)\s*层$/);
      if (depthMetric) translated = 'Depth: ' + (depthMetric[1] === '等待中...' ? 'waiting...' : depthMetric[1]);
    }
    if (!translated) {
      var nodesMetric = content.match(/^节点:\s*(.+)$/);
      if (nodesMetric) translated = 'Nodes: ' + (nodesMetric[1] === '等待中...' ? 'waiting...' : nodesMetric[1]);
    }
    if (!translated) {
      var timeMetric = content.match(/^时间:\s*(.+)$/);
      if (timeMetric) translated = 'Time: ' + (timeMetric[1] === '等待中...' ? 'waiting...' : timeMetric[1]);
    }
    if (!translated) {
      var engineLevel = content.match(/^高级(\d+):\s*(.+?)\s*\((\d+)\)$/);
      if (engineLevel) translated = 'Level ' + engineLevel[1] + ': ' + (translations[engineLevel[2]] || engineLevel[2]) + ' (' + engineLevel[3] + ')';
    }
    if (!translated) {
      var moveRecord = content.match(/^([白黑])\s+([a-h][1-8])\s+([-x])\s+([a-h][1-8])(.*)$/);
      if (moveRecord) translated = (moveRecord[1] === '白' ? 'White' : 'Black') + ' ' + moveRecord[2] + ' ' + moveRecord[3] + ' ' + moveRecord[4] + moveRecord[5];
    }
    if (!translated) {
      var moveStatus = content.match(/^第\s*(\d+)\s*回合\s*·\s*(白方|黑方)：\s*(.+)$/);
      if (moveStatus) translated = 'Move ' + moveStatus[1] + ' · ' + (moveStatus[2] === '白方' ? 'White' : 'Black') + ': ' + moveStatus[3];
    }
    if (!translated) {
      var turnStatus = content.match(/^当前回合：\s*(白方|黑方)(（被将军）)?$/);
      if (turnStatus) translated = (turnStatus[1] === '白方' ? 'White' : 'Black') + ' to move' + (turnStatus[2] ? ' (in check)' : '');
    }
    if (!translated) {
      var playerToMove = content.match(/^轮到(白方|黑方)走子。$/);
      if (playerToMove) translated = (playerToMove[1] === '白方' ? 'White' : 'Black') + ' to move.';
    }
    if (!translated) {
      var selectedPieceQuiz = content.match(/^问答练习：请选择“(.+)”下的具体问题。$/);
      if (selectedPieceQuiz) translated = 'Quiz: Choose a question under ' + (translations[selectedPieceQuiz[1]] || selectedPieceQuiz[1]) + '.';
    }
    if (!translated && content.indexOf('问题：') === 0) translated = 'Question: ' + (translations[content.slice('问题：'.length)] || content.slice('问题：'.length));
    if (!translated && content.indexOf('回答正确：') === 0) translated = 'Correct: ' + (translations[content.slice('回答正确：'.length)] || content.slice('回答正确：'.length));
    if (!translated && content.indexOf('回答错误：') === 0) translated = 'Incorrect: ' + (translations[content.slice('回答错误：'.length)] || content.slice('回答错误：'.length));
    if (!translated) {
      var sessionCount = content.match(/^(\d+)\s*次$/);
      if (sessionCount) translated = sessionCount[1] + (sessionCount[1] === '1' ? ' session' : ' sessions');
    }
    if (!translated) {
      var analysisCount = content.match(/^(\d+)\s*个（([\d.]+%)）$/);
      if (analysisCount) translated = analysisCount[1] + ' (' + analysisCount[2] + ')';
    }
    if (!translated) {
      var distributionCount = content.match(/^(\d+)\s*次（([\d.]+%)）$/);
      if (distributionCount) translated = distributionCount[1] + ' sessions (' + distributionCount[2] + ')';
    }
    if (!translated) {
      var trendPoint = content.match(/^(\d{1,2}\/\d{1,2})：\s*(\d+)\s*次$/);
      if (trendPoint) translated = trendPoint[1] + ': ' + trendPoint[2] + (trendPoint[2] === '1' ? ' session' : ' sessions');
    }
    if (!translated) {
      var rootGroup = content.match(/^(L[123] [^/]+) \/ (.+) · (\d+)$/);
      if (rootGroup && translations[rootGroup[1]] && translations[rootGroup[2]]) {
        translated = translations[rootGroup[1]] + ' / ' + translations[rootGroup[2]] + ' · ' + rootGroup[3];
      }
    }
    if (!translated) {
      var rootPuzzle = content.match(/^(.+?)(练习|题目)\s*(\d+)$/);
      if (rootPuzzle && translations[rootPuzzle[1]]) {
        translated = translations[rootPuzzle[1]] + ' ' + (rootPuzzle[2] === '练习' ? 'Practice ' : 'Puzzle ') + rootPuzzle[3];
      }
    }
    if (!translated) {
      var puzzleTitle = content.match(/^(.+?)\s+(\d{3})$/);
      if (puzzleTitle && translations[puzzleTitle[1]]) translated = translations[puzzleTitle[1]] + ' ' + puzzleTitle[2];
    }
    if (!translated) {
      var compactPuzzleTitle = content.match(/^(.+?)(\d{3})$/);
      if (compactPuzzleTitle && translations[compactPuzzleTitle[1]]) translated = translations[compactPuzzleTitle[1]] + ' ' + compactPuzzleTitle[2];
    }
    if (!translated) {
      var demoTitle = content.match(/^(.+?)演示(\d{3})$/);
      if (demoTitle && translations[demoTitle[1] + '演示']) translated = translations[demoTitle[1] + '演示'] + ' ' + demoTitle[2];
    }
    if (!translated && content.indexOf(' / ') !== -1) {
      var pathParts = content.split(' / ').map(function (part) {
        if (translations[part]) return translations[part];
        var rootItem = part.match(/^(.+?)(练习|题目)\s*(\d+)$/);
        if (rootItem && translations[rootItem[1]]) return translations[rootItem[1]] + ' ' + (rootItem[2] === '练习' ? 'Practice ' : 'Puzzle ') + rootItem[3];
        var titledPuzzle = part.match(/^(.+?)\s+(\d{3})$/);
        if (titledPuzzle && translations[titledPuzzle[1]]) return translations[titledPuzzle[1]] + ' ' + titledPuzzle[2];
        var puzzleWithLevel = part.match(/^(.+?)\s+(\d{3}) · (L[123])$/);
        if (puzzleWithLevel && translations[puzzleWithLevel[1]]) return translations[puzzleWithLevel[1]] + ' ' + puzzleWithLevel[2] + ' · ' + puzzleWithLevel[3];
        var levelSuffix = part.match(/^(L[123] [^·]+) · (L[123])$/);
        if (levelSuffix && translations[levelSuffix[1]]) return translations[levelSuffix[1]] + ' · ' + levelSuffix[2];
        return null;
      });
      if (pathParts.every(function (part) { return part !== null; })) translated = pathParts.join(' / ');
    }
    if (!translated) {
      var sampledSummary = content.match(/^本次抽取 (\d+) 道 · 从 (\d+) 道符合条件的题目中抽样$/);
      if (sampledSummary) translated = 'Sampled ' + sampledSummary[1] + ' · from ' + sampledSummary[2] + ' matching puzzles';
    }
    if (!translated) {
      var positionCount = content.match(/^(\d+) 个局面$/);
      if (positionCount) translated = positionCount[1] + ' positions';
    }
    if (!translated) {
      var referenceCount = content.match(/^(\d+) 道(可用参考题|符合条件)$/);
      if (referenceCount) translated = referenceCount[1] + (referenceCount[2] === '可用参考题' ? ' reference puzzles available' : ' matching puzzles');
    }
    if (!translated) {
      var materialCount = content.match(/^白\s*(\d+)\s*·\s*黑\s*(\d+)$/);
      if (materialCount) translated = 'White ' + materialCount[1] + ' · Black ' + materialCount[2];
    }
    if (!translated) {
      var squareLabel = content.match(/^([a-h][1-8])\s*(白方|黑方)(王|后|车|象|马|兵)$/);
      if (squareLabel && translations[squareLabel[3]]) translated = squareLabel[1] + ' ' + (squareLabel[2] === '白方' ? 'White ' : 'Black ') + translations[squareLabel[3]];
      else {
        var emptySquare = content.match(/^([a-h][1-8])\s*空格$/);
        if (emptySquare) translated = emptySquare[1] + ' empty square';
        else {
          var pieceLabel = content.match(/^(白方|黑方)(王|后|车|象|马|兵)$/);
          if (pieceLabel && translations[pieceLabel[2]]) translated = (pieceLabel[1] === '白方' ? 'White ' : 'Black ') + translations[pieceLabel[2]];
        }
      }
    }
    if (!translated && content.indexOf('，') !== -1) {
      var trendPoints = content.split('，').map(function (point) {
        var match = point.match(/^(\d{1,2}\/\d{1,2})：\s*(\d+)\s*次$/);
        return match ? match[1] + ': ' + match[2] + (match[2] === '1' ? ' session' : ' sessions') : null;
      });
      if (trendPoints.every(function (point) { return point !== null; })) translated = trendPoints.join(', ');
    }
    if (!translated && content.indexOf(' | ') !== -1) {
      var titleParts = content.split(' | ');
      if (titleParts.every(function (part) { return !!translations[part]; })) {
        translated = titleParts.map(function (part) { return translations[part]; }).join(' | ');
      }
    }
    if (translated) return String(text).replace(trimmed, prefix + translated + suffix);
    return text;
  }

  function translateNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    if (node.parentElement.closest('[data-chess-language-switch],script,style,noscript')) return;
    var current = node.nodeValue;
    var original = originals.get(node);
    if (original === undefined || current !== rendered.get(node)) {
      original = current;
      originals.set(node, original);
    }
    var next = language === 'en' ? translateText(original) : original;
    if (next !== current) {
      rendered.set(node, next);
      node.nodeValue = next;
    } else {
      rendered.set(node, current);
    }
  }

  function translateAttributes(element) {
    var attributes = ['title', 'aria-label', 'placeholder', 'alt'];
    var saved = originalAttributes.get(element) || {};
    var lastRendered = renderedAttributes.get(element) || {};
    attributes.forEach(function (name) {
      var current = element.getAttribute(name);
      if (current === null) return;
      if (saved[name] === undefined || current !== lastRendered[name]) saved[name] = current;
      var next = language === 'en' ? translateText(saved[name]) : saved[name];
      if (next !== current) element.setAttribute(name, next);
      lastRendered[name] = next;
    });
    originalAttributes.set(element, saved);
    renderedAttributes.set(element, lastRendered);
  }

  function translateSubtree(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    translateAttributes(element);
    var elementWalker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    var childElement;
    while ((childElement = elementWalker.nextNode())) translateAttributes(childElement);
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    var textNode;
    while ((textNode = walker.nextNode())) translateNode(textNode);
  }

  function applyLanguage() {
    language = readLanguage();
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? translateText(originalTitle) : originalTitle;
    var selector = document.querySelector('[data-chess-language-switch]');
    if (selector) selector.value = language;
    translateSubtree(document.body);
    window.dispatchEvent(new CustomEvent('chesslanguagechange', { detail: { language: language } }));
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === 'en' ? 'en' : 'zh';
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {}
    applyLanguage();
  }

  function addLanguageControl() {
    if (document.querySelector('[data-chess-language-switch]')) return;
    var control = document.createElement('label');
    control.className = 'chess-language-control';
    control.setAttribute('data-chess-language-switch', '');
    control.setAttribute('aria-label', 'Language / 语言');
    control.innerHTML = '<span>文</span><select aria-label="Language"><option value="zh">中文</option><option value="en">English</option></select>';
    control.querySelector('select').addEventListener('change', function (event) {
      setLanguage(event.target.value);
    });
    document.body.appendChild(control);
    control.querySelector('select').value = language;
  }

  function cleanSpeech(text) {
    var source = String(text || '');
    if (language === 'en') source = translateText(source);
    return source.replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  }

  if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
    var nativeSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function (utterance) {
      var spokenText = cleanSpeech(utterance.text);
      if (spokenText !== utterance.text) {
        var cleanUtterance = new SpeechSynthesisUtterance(spokenText);
        ['pitch', 'rate', 'volume', 'voice', 'onboundary', 'onend', 'onerror', 'onmark', 'onpause', 'onresume', 'onstart'].forEach(function (property) {
          cleanUtterance[property] = utterance[property];
        });
        utterance = cleanUtterance;
      }
      utterance.lang = language === 'en' && !/[\u4e00-\u9fff]/.test(utterance.text) ? 'en-US' : 'zh-CN';
      return nativeSpeak(utterance);
    };
  }

  window.ChessI18n = {
    getLanguage: function () { return language; },
    setLanguage: setLanguage,
    t: function (text) { return language === 'en' ? translateText(text) : text; },
    cleanSpeech: cleanSpeech,
    apply: applyLanguage
  };

  function initialize() {
    originalTitle = document.title;
    addLanguageControl();
    applyLanguage();
    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'characterData') {
          translateNode(record.target);
          } else if (record.type === 'attributes') {
            translateAttributes(record.target);
        } else {
          record.addedNodes.forEach(function (added) {
            if (added.nodeType === Node.TEXT_NODE) translateNode(added);
              else translateSubtree(added);
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'], subtree: true });
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) applyLanguage();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}());