'use strict';
/**
 * ActivityRunner — dispatches non-puzzle templates to their runtime.
 * Mirrors comparison/activity-runner.js exactly; Science currently has one
 * non-puzzle runtime ("explore") instead of comparison's sort/match/group/
 * fit/mini set.
 */
var ActivityRunner = {
  launch: function (template, variant, ctx) {
    var rt = template.runtime || template.mode;
    switch (rt) {
      case 'explore': ExploreRuntime.run(template, variant, ctx); break;
      default:        if (ctx.onPuzzle) ctx.onPuzzle();           break;
    }
  }
};
