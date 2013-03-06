(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('./entities'),
      require('./levels'),
      require('async'),
      require('redis'),
      require('underscore')
    );
  }
})(this, function(entities, levels, async, redis, _) {

  var init = function(socket) {

    // init full state update loop, fixed time step in milliseconds
    setInterval((function() {
      state(socket);
    }), 1000);

    // init delta state update loop, fixed time step in milliseconds
    setInterval((function() {
      delta(socket);
    }), 45);

    return this;

  };

  var state = function(socket) {

    var data = {};
    data.entities = {};

    // get full state, emit to clients
    entities.state(data, function() {
      data.time = Date.now();
      socket.io.sockets.volatile.emit('state:full', data);
      // console.log('full', data.entities);

      /*
      var entity;
      for (var uuid in data.entities) {
        entity = data.entities[uuid];
        console.log(entity.state);
      }
      */
    }); 

  };

  var delta = function(socket) {

    var data = {};
    data.entities = {};

    // get delta update, emit to clients
    entities.delta(data, function() {
      data.time = Date.now();
      socket.io.sockets.volatile.emit('state:delta', data);
      // console.log('delta', data.entities);
    });

  };

  return {
    init: init
  };

});
