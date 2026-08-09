/* global EGG_MATH_DATA */
var EGG_MATH_DATA = (function () {
  'use strict';

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function makeQuestion() {
    var op = Math.random() < 0.5 ? '+' : '-';
    var a, b, answer;

    if (op === '+') {
      a = rand(1, 9);
      b = rand(1, 10 - a);
      answer = a + b;
    } else {
      a = rand(2, 10);
      b = rand(1, a - 1);
      answer = a - b;
    }

    // All valid options in range 0–10 except the answer
    var pool = [];
    for (var v = 0; v <= 10; v++) {
      if (v !== answer) pool.push(v);
    }
    shuffle(pool);
    var options = shuffle([answer, pool[0], pool[1], pool[2]]);

    return { a: a, b: b, op: op, answer: answer, options: options };
  }

  return { makeQuestion: makeQuestion };
}());
