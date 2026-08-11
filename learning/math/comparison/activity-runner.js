'use strict';
/**
 * ActivityRunner — routes a template to the correct runtime.
 *
 * All runtimes must accept (template, variant, ctx) and call
 * ctx.onComplete(attempt) or ctx.onBack() when done.
 *
 * Adding a new runtime: add a case below. No other files need changing.
 */
var ActivityRunner = {
  launch: function (template, variant, ctx) {
    var rt = template.runtime || template.mode;
    switch (rt) {
      case 'sort': SortRuntime.run(template, variant, ctx); break;
      default:     if (ctx.onPuzzle) ctx.onPuzzle(); break;
    }
  }
};
