(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('./entities'),
      require('./levels'),
      require('underscore')
    );
  }
})(this, function(entities, levels, _) {

  var init = function(worker) { // store) {
    setInterval((function() {
      loop(worker); // store);
    }).bind(this), 1000);

    return this;
  };

  var loop = function(worker) { // store) {

    var players = _.filter(entities.global, function(entity) {
      return entity.state.public.class === 'Player';
    });

    var powerups = _.filter(entities.global, function(entity) {
      return entity.state.public.class === 'Powerup';
    });

    // if fewer than five powerups per player, attempt to set lock and loadEnemies
    if (powerups.length < 5 * players.length) {
      levels.loadPowerup(worker);
      /*
      // set lock to prevent thundering herd
      store.setnx('lock:npc', Date.now() + 1000, function(err, res) {
        if (res) {
          // no lock previously set, lock acquired
          levels.loadPowerup(worker);
        } else {
          store.getset('lock:npc', Date.now() + 1000, function(err, res) {
            if (res < Date.now()) {
              // timestamp expired, lock acquired
              levels.loadPowerup(worker);
            }
          });
        }
      });
      */
    }

  };

  return {
    init: init
  };

});
