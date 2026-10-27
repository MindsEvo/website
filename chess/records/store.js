(function () {
  'use strict';
  var key = 'cognichess:learning-records:v1';
  var avatars = ['k', 'q', 'r', 'b', 'n', 'p'];
  function defaults() {
    return { version: 1, activeUser: '1', users: [
      { id: '1', name: '用户1', avatar: 'k' },
      { id: '2', name: '用户2', avatar: 'r' },
      { id: '3', name: '用户3', avatar: 'n' }
    ], activities: [], recommendations: { intelligent: [], manual: [] } };
  }
  function read() {
    var raw = localStorage.getItem(key);
    if (!raw) return defaults();
    var data;
    try { data = JSON.parse(raw); } catch (error) { throw new Error('学习记录数据损坏，未覆盖原数据'); }
    if (data.version !== 1 || !Array.isArray(data.users) || !data.users.length || !Array.isArray(data.activities) || !data.recommendations ||
        !data.users.some(function (user) { return user.id === data.activeUser; }) ||
        !Array.isArray(data.recommendations.intelligent) || !Array.isArray(data.recommendations.manual)) {
      throw new Error('学习记录格式不正确，未覆盖原数据');
    }
    return data;
  }
  function write(data) {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('chess-records-change'));
  }
  function switchUser(id) {
    var data = read();
    if (!data.users.some(function (user) { return user.id === id; })) throw new Error('用户不存在');
    data.activeUser = id;
    write(data);
  }
  function updateUsers(users) {
    var data = read();
    var next = data.users.map(function (user) {
      var changed = users.find(function (item) { return item.id === user.id; });
      if (!changed || !String(changed.name || '').trim() || !avatars.includes(changed.avatar)) throw new Error('请填写用户名并选择头像');
      return { id: user.id, name: changed.name.trim(), avatar: changed.avatar };
    });
    data.users = next;
    write(data);
  }
  function begin(questionId, initialFen) {
    var bank = window.ChessQuestionBank;
    var question = bank && bank.questions[questionId];
    if (questionId && !question) throw new Error('题目不存在');
    var metadata = question ? bank.records.find(function (item) { return item.question === questionId; }) : null;
    var data = read();
    var activity = {
      id: window.crypto.randomUUID(), userId: data.activeUser, timestamp: new Date().toISOString(),
      type: question ? 'practice' : 'battle', questionId: questionId || null, label: question ? question.label : '自由对弈',
      initialFen: question ? question.fen : initialFen,
      category: metadata ? metadata.category : (questionId ? questionId.split('/')[0] : 'comprehensive'),
      difficulty: metadata ? metadata.difficulty : ((questionId || '').match(/L[123]/) || ['L1'])[0],
      completed: false, timeSpent: 0, moves: [], explanation: '', saved: false
    };
    data.activities.push(activity);
    write(data);
    return activity.id;
  }
  function update(id, patch) {
    var data = read();
    var activity = data.activities.find(function (item) { return item.id === id; });
    if (!activity) throw new Error('练习记录不存在');
    ['completed', 'timeSpent', 'moves', 'explanation', 'saved'].forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(patch, field)) activity[field] = patch[field];
    });
    write(data);
  }
  function summary(userId, now) {
    var end = now ? new Date(now) : new Date();
    var rows = read().activities.filter(function (activity) { return activity.userId === userId && new Date(activity.timestamp) <= end; });
    var counts = {};
    rows.forEach(function (activity) {
      if (!counts[activity.category]) counts[activity.category] = { L1: 0, L2: 0, L3: 0, total: 0 };
      var count = counts[activity.category]; count.total++;
      if (Object.prototype.hasOwnProperty.call(count, activity.difficulty)) count[activity.difficulty]++;
    });
    return { total: rows.length, week: rows.filter(function (item) { return end - new Date(item.timestamp) <= 7 * 86400000; }).length,
      month: rows.filter(function (item) { return end - new Date(item.timestamp) <= 30 * 86400000; }).length,
      categories: counts, activities: rows };
  }
  function trend(userId, period, now) {
    var end = now ? new Date(now) : new Date();
    var rows = summary(userId, end).activities;
    var days = period === 'month' ? 30 : 7;
    var output = [];
    for (var offset = days - 1; offset >= 0; offset--) {
      var date = new Date(end); date.setDate(date.getDate() - offset); date.setHours(0, 0, 0, 0);
      var next = new Date(date); next.setDate(next.getDate() + 1);
      output.push({ label: (date.getMonth() + 1) + '/' + date.getDate(), count: rows.filter(function (item) {
        var timestamp = new Date(item.timestamp); return timestamp >= date && timestamp < next;
      }).length });
    }
    return output;
  }
  function recommendations(mode) {
    if (!['intelligent', 'manual'].includes(mode)) throw new Error('推荐模式不正确');
    return read().recommendations[mode];
  }
  function saveRecommendations(mode, ids) {
    if (!['intelligent', 'manual'].includes(mode)) throw new Error('推荐模式不正确');
    var data = read();
    data.recommendations[mode] = Array.from(new Set(ids));
    write(data);
  }
  window.ChessRecords = { read: read, switchUser: switchUser, updateUsers: updateUsers, begin: begin, update: update,
    summary: summary, trend: trend, recommendations: recommendations, saveRecommendations: saveRecommendations };
}());