(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core/core',
      './input',
      './ui',
      './client'
    ], factory);
  }
})(this, function(core, input, ui, client) {

  // game.debug = true;
  core.initGlobalVariables();
  input.init();
  client.createCanvas();
  client.init(client);
  client.play();

});
