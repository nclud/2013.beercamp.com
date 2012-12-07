(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else {
    // browser globals (root is window)
    root.GAME.time = factory(root.GAME || {});
  }
})(this, function(game) {

  var then = Date.now();

  var setDelta = function() {
    this.now = Date.now();
    this.delta = (this.now - this.then) / 1000; // seconds since last frame
    this.then = this.now;
  };

  return {
    then: then,
    setDelta: setDelta
  };

});