(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core/core'),
      require('../core/time'),
      require('./entities'),
      require('async')
    );
  }
})(this, function(core, time, entities, async) {

  var init = function(worker) {
    // init physics loop, fixed time step in milliseconds
    setInterval((function() {
      loop(worker);
    }), 15);

    return this;
  };

  var update = function(worker) {
    async.forEach(
      Object.keys(entities.global),
      function(uuid, callback) {
        var player = entities.global[uuid];

        if (player.queue.input.length) {
          player.processInput(player.queue.input.shift(), worker);
        }

        // notify async.forEach that function has completed
        if (typeof callback === 'function') callback();
      }
    );
  };

  var loop = function(worker) {
    time.setDelta();
    update(worker);
  }

  return {
    init: init
  };

});
