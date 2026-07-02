/**
 * MindsEvo Global Strings  v1.0.0
 * ─────────────────────────────────────────────────────────
 * All shared UI text used across the platform shell and games.
 *
 * Each game registers its own additional strings in its own
 * strings.js file, loaded AFTER this file.
 *
 * Load order in any game page:
 *   <script src="../../shell.js"></script>
 *   <script src="../../i18n/strings.js"></script>   ← this file
 *   <script src="./strings.js"></script>             ← game strings
 *   <script src="./game.js"></script>
 * ─────────────────────────────────────────────────────────
 */

shell.registerStrings({

  // ── Navigation ──────────────────────────────────────────────
  'nav.home':        { zh: '主页',       en: 'Home' },
  'nav.back':        { zh: '返回',       en: 'Back' },
  'nav.settings':    { zh: '设置',       en: 'Settings' },
  'nav.profile':     { zh: '我的档案',   en: 'My Profile' },

  // ── Common actions ───────────────────────────────────────────
  'action.start':    { zh: '开始',       en: 'Start' },
  'action.retry':    { zh: '再试一次',   en: 'Try Again' },
  'action.next':     { zh: '下一题',     en: 'Next' },
  'action.prev':     { zh: '上一题',     en: 'Previous' },
  'action.finish':   { zh: '完成',       en: 'Finish' },
  'action.hint':     { zh: '看提示 💡',  en: 'Show Hint 💡' },
  'action.continue': { zh: '继续',       en: 'Continue' },
  'action.cancel':   { zh: '取消',       en: 'Cancel' },
  'action.confirm':  { zh: '确认',       en: 'Confirm' },

  // ── Feedback ─────────────────────────────────────────────────
  'fb.correct':      { zh: '🎉 答对了！',   en: '🎉 Correct!' },
  'fb.wrong':        { zh: '❌ 再想想！',   en: '❌ Try again!' },
  'fb.wrong2':       { zh: '❌ 需要提示吗？', en: '❌ Need a hint?' },
  'fb.perfect':      { zh: '🏆 完美通关！', en: '🏆 Perfect!' },
  'fb.good':         { zh: '⭐ 太棒了！',   en: '⭐ Great job!' },
  'fb.keepgoing':    { zh: '💪 继续加油！', en: '💪 Keep going!' },
  'fb.unlocked':     { zh: '🔓 新关卡已解锁！', en: '🔓 New level unlocked!' },

  // ── Stats labels ─────────────────────────────────────────────
  'stats.score':     { zh: '得分',       en: 'Score' },
  'stats.time':      { zh: '用时',       en: 'Time' },
  'stats.attempts':  { zh: '尝试次数',   en: 'Attempts' },
  'stats.solutions': { zh: '解法数',     en: 'Solutions' },
  'stats.best':      { zh: '最佳',       en: 'Best' },
  'stats.accuracy':  { zh: '正确率',     en: 'Accuracy' },
  'stats.time.fmt':  { zh: '{0}分{1}秒', en: '{0}m {1}s' },

  // ── Unit / Level status ──────────────────────────────────────
  'unit.locked':     { zh: '🔒 未解锁',  en: '🔒 Locked' },
  'unit.completed':  { zh: '✅ 已完成',  en: '✅ Completed' },
  'unit.progress':   { zh: '进行中',     en: 'In Progress' },
  'unit.new':        { zh: '🆕 新',      en: '🆕 New' },

  // ── Question progress ─────────────────────────────────────────
  'q.progress':      { zh: '第 {0} / {1} 题', en: 'Question {0} of {1}' },
  'q.hint.label':    { zh: '💡 提示：{0}',    en: '💡 Hint: {0}' },

  // ── Result screen ────────────────────────────────────────────
  'result.title':        { zh: '完成！',         en: 'Done!' },
  'result.score.detail': { zh: '{0}/{1} 独立完成', en: '{0}/{1} correct' },
  'result.hints.detail': { zh: '{0} 题使用了提示', en: '{0} hints used' },
  'result.msg.perfect':  { zh: '太厉害了！你是大师！', en: 'Amazing! You\'re a master!' },
  'result.msg.good':     { zh: '恭喜通关！下一关已解锁！', en: 'Great! Next level unlocked!' },
  'result.msg.weak':     { zh: '建议再练一次，争取更高分！', en: 'Practice once more for a better score!' },
  'result.msg.all':      { zh: '🎊 恭喜完成所有关卡！', en: '🎊 All levels complete!' },

  // ── Voice toggle ─────────────────────────────────────────────
  'voice.on':        { zh: '🔊 语音',    en: '🔊 Voice' },
  'voice.off':       { zh: '🔇 静音',    en: '🔇 Muted' },

  // ── Language toggle ──────────────────────────────────────────
  'lang.switch.to':  { zh: 'EN',         en: '中文' },

  // ── Error / system ───────────────────────────────────────────
  'sys.offline':     { zh: '当前离线，进度已本地保存', en: 'Offline — progress saved locally' },
  'sys.syncing':     { zh: '同步中…',    en: 'Syncing…' },
  'sys.synced':      { zh: '已同步',     en: 'Synced' },

  // ── User ─────────────────────────────────────────────────────
  'user.guest':      { zh: '访客',       en: 'Guest' },
  'user.level':      { zh: '等级 {0}',   en: 'Level {0}' },
  'user.welcome':    { zh: '你好，{0}！', en: 'Hello, {0}!' }

});
