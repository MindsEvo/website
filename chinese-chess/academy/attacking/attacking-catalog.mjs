export const ATTACKING_GROUPS = {
  直接将杀: ['白脸将', '八角马', '空头炮', '闷宫杀'],
  单兵种与位置杀法: ['卧槽马', '挂角马', '钓鱼马', '高钓马', '拔簧马', '铁门栓'],
  双子协同: ['双车错', '车马冷着', '车炮抽杀', '马后炮', '双马饮泉', '重炮杀', '夹车炮'],
  组合进攻: ['炮碾丹砂', '海底捞月', '天地炮', '大胆穿心', '二鬼拍门'],
  连续推进与残局攻杀: ['三进兵', '送佛归殿']
};

export const ATTACKING_UNITS = {
  直接将杀: '入门：如何利用将帅的活动限制，直接形成杀棋？重点认识九宫、将帅照面与杀棋条件，区分杀势与将死。',
  单兵种与位置杀法: '位置识别：棋子走到什么位置，才能形成致命威胁？观察关键点，理解位置优势如何转化为杀棋。',
  双子协同: '协同思维：单个棋子做不到的事情，两个棋子如何共同完成？理解支援、借架与配合。',
  组合进攻: '组合推理：如何通过多个棋子的组合，创造对方无法化解的杀势？关注突破防线与多重威胁。',
  连续推进与残局攻杀: '综合运用：如何通过持续推进和连续计算，最终完成将杀？从短变化开始，学习空间压缩与多回合推演。'
};

export const ATTACKING_ROOTS = [
  { id: 'cc.mate.bailianjiang', name: '白脸将', knowledge: '将帅中路控制', aliases: ['白脸将'] },
  { id: 'cc.mate.bajiaoma', name: '八角马', knowledge: '马控制将帅的关键出口', aliases: ['八角马'] },
  { id: 'cc.mate.kongtoupao', name: '空头炮', knowledge: '利用中路炮线形成威胁', aliases: ['空头炮', '空头跑'] },
  { id: 'cc.mate.mengongsha', name: '闷宫杀', knowledge: '限制将帅活动空间', aliases: ['闷宫', '闷杀'] },
  { id: 'cc.mate.wocaoma', name: '卧槽马', knowledge: '马占据关键攻击位置', aliases: ['卧槽马'] },
  { id: 'cc.mate.guajiaoma', name: '挂角马', knowledge: '马控制九宫角位', aliases: ['挂角马'] },
  { id: 'cc.mate.diaoyuma', name: '钓鱼马', knowledge: '利用特殊马位封锁将门', aliases: ['钓鱼马'] },
  { id: 'cc.mate.gaodiaoma', name: '高钓马', knowledge: '高位马控制与侧翼攻击', aliases: ['高钓马', '高掉马'] },
  { id: 'cc.mate.bahuangma', name: '拔簧马', knowledge: '利用马的特殊位置和战术配合', aliases: ['拔簧马'] },
  { id: 'cc.mate.tiemenshuan', name: '铁门栓', knowledge: '封锁关键线路，形成杀势', aliases: ['铁门栓'] },
  { id: 'cc.mate.shuangchecuo', name: '双车错', knowledge: '双车交替攻击', aliases: ['双车错'] },
  { id: 'cc.mate.chemalengzhao', name: '车马冷着', knowledge: '车马配合与意外攻击', aliases: ['车马冷着'] },
  { id: 'cc.mate.chepaochousha', name: '车炮抽杀', knowledge: '车炮配合与抽将战术', aliases: ['车炮抽杀'] },
  { id: 'cc.mate.mahoupao', name: '马后炮', knowledge: '马控制、炮借架', aliases: ['马后炮'] },
  { id: 'cc.mate.shuangmayinquan', name: '双马饮泉', knowledge: '双马连续协同', aliases: ['双马饮泉'] },
  { id: 'cc.mate.chongpaosha', name: '重炮杀', knowledge: '双炮叠加攻击', aliases: ['重炮', '重跑'] },
  { id: 'cc.mate.jiachepao', name: '夹车炮', knowledge: '车炮位置配合', aliases: ['夹车炮'] },
  { id: 'cc.mate.paoniandansha', name: '炮碾丹砂', knowledge: '车炮连续攻击', aliases: ['炮碾丹砂'] },
  { id: 'cc.mate.haidilaoyue', name: '海底捞月', knowledge: '底线车炮配合', aliases: ['海底捞月'] },
  { id: 'cc.mate.tiandipao', name: '天地炮', knowledge: '双炮上下呼应', aliases: ['天地炮'] },
  { id: 'cc.mate.dadanchuanxin', name: '大胆穿心', knowledge: '突破中路防线', aliases: ['大胆穿心'] },
  { id: 'cc.mate.erguipaimen', name: '二鬼拍门', knowledge: '双兵同时威胁将门', aliases: ['二鬼拍门'] },
  { id: 'cc.mate.sanjinbing', name: '三进兵', knowledge: '兵的连续推进与攻杀', aliases: ['三进兵'] },
  { id: 'cc.mate.songfoguidian', name: '送佛归殿', knowledge: '兵卒推进、限制与最终将杀', aliases: ['送佛归殿'] }
];

export const ATTACKING_CATEGORIES = Object.fromEntries(ATTACKING_ROOTS.map(root => [root.name, root.aliases]));

export function selectAttackingPuzzles(manifest, name) {
  const root = ATTACKING_ROOTS.find(root => root.name === name);
  if (!root) throw new Error(`未知杀法：${name}`);
  return manifest.categories.filter(category => category.key.startsWith('attacking/'))
    .flatMap(category => category.items)
    .filter(puzzle => root.aliases.some(alias => puzzle.title.includes(alias)));
}
