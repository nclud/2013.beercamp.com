(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('async'),
      require('redis'),
      require('underscore')
    );
  }
})(this, function(async, redis, _) {

  // uuid keys, npc object values
  var global = {};

  // array of uuids
  var local = [];

  var remove = function(server, uuid, callback) {
    server.local = _.filter(server.local, function(npc) {
      return npc !== uuid;
    });

    if (server.global && server.global[uuid]) {
      delete server.global[uuid];
    }

    // notify async.forEach that function has completed
    if (typeof callback === 'function') callback();
  };

  var state = function(data, callback) {

    async.forEach(
      this.local,
      (function(uuid, callback) {
        var entity = this.global[uuid];
        var state;

        if (entity) {
          state = entity.getState();
        }

        if (state) {
          data.entities[uuid] = state;
        }

        // notify async.forEach that function has completed
        if (typeof callback === 'function') callback();
      }).bind(this), function() {
        // notify calling function that iterator has completed
        if (typeof callback === 'function') callback();
      }
    );

  };

  var delta = function(data, callback) {

    async.forEach(
      this.local,
      (function(uuid, callback) {
        var entity = this.global[uuid];
        var delta;

        if (entity) {
          delta = entity.getDelta(async, _);
        }

        if (delta) {
          data.entities[uuid] = delta;
        }

        // notify async.forEach that function has completed
        if (typeof callback === 'function') callback();
      }).bind(this), function() {
        // notify calling function that iterator has completed
        if (typeof callback === 'function') callback();
      }
    );

  };

  /*
  var add = function(store, data, global, uuid, callback) {

    store.hgetall('npc:' + uuid, function(err, res) {
      if (res) {
        // init npc and add to global object
        var npc = global[uuid] = new Enemy(parseInt(res.x), parseInt(res.y), parseInt(res.direction), uuid);

        var state = npc.getState();

        // don't pass undefined state
        if (state) {
          data.npcs[uuid] = state;
        }
      }

      // notify async.forEach that function has completed
      if (typeof callback === 'function') callback();
    });

  };
  */

  return {
    global: global,
    local: local,
    state: state,
    delta: delta,
    remove: remove
  };

});
