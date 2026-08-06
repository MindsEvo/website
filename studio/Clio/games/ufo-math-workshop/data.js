window.CLIO_UFO_MATH_DATA = {
  id: "clio-ufo-math-workshop",
  title:    { zh: "飞盘登月",   en: "UFO Moon Adventure" },
  subtitle: {
    zh: "点击飞盘，通过数学测试，带小伙伴登上月球！",
    en: "Tap the UFO, pass the math test, land on the moon!"
  },

  TOTAL_QUESTIONS: 5,
  PASS_THRESHOLD:  3,   // correct answers needed out of 5

  // Characters and their moon rewards
  CHARS: {
    bunny: { emoji: "🐰", moonItems: ["🥕","🥕","🥕","🌿","🥕"], label: { zh: "小兔", en: "Bunny" } },
    cat:   { emoji: "🐱", moonItems: ["🐟","🐠","🐟","🐠","🐟"], label: { zh: "小猫", en: "Cat"   } }
  },

  // Generate N math questions (level 1: add/subtract within 10)
  makeQuestions: function (n) {
    var qs = [];
    for (var i = 0; i < n; i++) qs.push(this._oneQ());
    return qs;
  },

  _oneQ: function () {
    var a, b, op, ans;
    if (Math.random() < 0.5) {
      a   = Math.ceil(Math.random() * 9);
      b   = Math.ceil(Math.random() * (10 - a));
      op  = "+"; ans = a + b;
    } else {
      a   = Math.floor(Math.random() * 9) + 2;  // 2–10
      b   = Math.ceil(Math.random() * (a - 1));  // 1…a-1
      op  = "−"; ans = a - b;
    }
    return { a: a, b: b, op: op, ans: ans, opts: this._opts(ans) };
  },

  _opts: function (correct) {
    var pool = [correct], tries = 0;
    while (pool.length < 4 && tries < 60) {
      tries++;
      var d = Math.floor(Math.random() * 4) + 1;
      var c = correct + (Math.random() < 0.5 ? d : -d);
      if (c >= 0 && c <= 10 && pool.indexOf(c) === -1) pool.push(c);
    }
    for (var n = 0; pool.length < 4 && n <= 10; n++) {
      if (pool.indexOf(n) === -1) pool.push(n);
    }
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool;
  }
};
