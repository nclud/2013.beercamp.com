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
    if (server.global && server.global[uuid]) {
      // cleanup after pushing delta update
      server.global[uuid].setPublic({ 'isDead': true });
    }

    // notify async.forEach that function has completed
    if (typeof callback === 'function') callback();
  };

  var cleanup = function(server, uuid, callback) {
    server.local = _.filter(server.local, function(entity) {
      return entity !== uuid;
    });

    if (server.global && server.global[uuid]) {
      delete server.global[uuid];
    }
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
          if (this.global[uuid].state.private.isDead) {
            cleanup(this, uuid);
          }
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

    store.hgetall('entity:' + uuid, function(err, res) {
      if (res) {
        // init entity and add to global object
        var entity = global[uuid] = new Enemy(parseInt(res.x), parseInt(res.y), parseInt(res.direction), uuid);

        var state = entity.getState();

        // don't pass undefined state
        if (state) {
          data.entities[uuid] = state;
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
