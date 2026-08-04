document.addEventListener("DOMContentLoaded", function () {
  var placeholders = document.querySelectorAll("[data-coming='true']");
  placeholders.forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      alert("该模块正在迁移中，敬请期待。");
    });
  });
});
