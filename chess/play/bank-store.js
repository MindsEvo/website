(function () {
  'use strict';
  var key = 'cognichess:expert-recommendations';
  var records = window.ChessQuestionBank.records || [];
  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(saved) ? saved.filter(function (id) { return records.some(function (record) { return record.id === id; }); }) : [];
    } catch (error) { return []; }
  }
  function save(ids) {
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new Event('chess-bank-recommendations'));
  }
  function matching(criteria) {
    return records.filter(function (record) {
      return record.category === criteria.category && record.difficulty === criteria.difficulty &&
        (!criteria.subcategory || record.subcategory === criteria.subcategory);
    });
  }
  function sample(criteria) {
    var pool = matching(criteria).slice();
    var count = Math.min(pool.length, Math.max(1, Math.min(10, Math.floor(Number(criteria.count) || 3))));
    for (var index = pool.length - 1; index > 0; index--) {
      var next = Math.floor(Math.random() * (index + 1));
      var current = pool[index]; pool[index] = pool[next]; pool[next] = current;
    }
    return pool.slice(0, count);
  }
  function statistics() {
    var counts = { endgame: 0, mate: 0, tactics: 0, opening: 0, comprehensive: 0 };
    var groups = {};
    records.forEach(function (record) {
      counts[record.category]++;
      var groupKey = record.category + '/' + record.subcategory + '/' + record.difficulty;
      if (!groups[groupKey]) groups[groupKey] = { category: record.category, subcategory: record.subcategory, difficulty: record.difficulty, count: 0 };
      groups[groupKey].count++;
    });
    return { total: records.length, counts: counts, groups: Object.values(groups) };
  }
  window.ChessBankStore = { read: read, save: save, matching: matching, sample: sample, statistics: statistics };
}());