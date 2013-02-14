(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../core/core', 'input', 'client'], factory);
  }
})(this, function(core, input, client) {

  var stats = new Stats();
  document.body.appendChild(stats.domElement);

  // game.debug = true;
  core.initGlobalVariables();
  input.init();
  client.createCanvas();
  client.init(client);
  client.play();

});
