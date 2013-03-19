(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core/core',
      './input',
      './ui',
      './client',
      'underscore'
    ], factory);
  }
})(this, function(core, input, ui, client, _) {

  // game.debug = true;
  core.initGlobalVariables();
  input.init();
  client.createCanvas();
  client.init(client);
  client.play();

});
