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
      case 'sort':  SortRuntime.run(template, variant, ctx);  break;
      case 'match': MatchRuntime.run(template, variant, ctx); break;
      case 'group': GroupRuntime.run(template, variant, ctx); break;
      case 'fit':   FitRuntime.run(template, variant, ctx);   break;
      // Mini-game: one continuous timed scene, many rounds, one Attempt. The
      // runtime owns the lifecycle; template.engine picks the game adapter.
      case 'mini':  MiniGameRuntime.run(template, variant, ctx); break;
      default:      if (ctx.onPuzzle) ctx.onPuzzle();         break;
    }
  }
};
