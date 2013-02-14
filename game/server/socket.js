(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('./update'),
      require('./entities'),
      require('../core/types/Rectangle'),
      require('async'),
      require('redis'),
      require('socket.io'),
      require('node-uuid'),
      require('../../config')
    );
  }
})(this, function(update, entities, Rectangle, async, redis, sio, uuid, config) {

  var init = function(app, channel, worker) {
    var io = sio.listen(app);

    // turn off websocket debug spam
    io.set('log level', 1);

    listen(io, worker);

    return {
      io: io
    };

  };

  var listen = function(io, worker) {

    // socket.io client event listeners
    io.sockets.on('connection', function(socket) {

      // switch from socket.id to Connect sessions?
      // TODO: move player init to socket.js
      var player = new Rectangle({
        type: 'dynamic',
        x: Math.random() * 20,
        y: Math.random() * 10,
        angle: 0,
        width: 2,
        height: 2,
        fixed: true,
        skin: false,
        animate: false
      });
      
      // set uuid and send to client
      socket.emit('uuid', player.uuid);

      addPlayer(socket, worker, player);

    });

  };

  var addPlayer = function(socket, worker, player) {

    var data = {};

    // add player to server object
    entities.global[player.uuid] = player;
    entities.local.push(player.uuid);

    // passing full object throws DOM exception, can't pass canvas to worker
    // TODO: replace with getState method
    data[player.uuid] = {
      type: player.state.private.type,
      x: player.state.private.x,
      y: player.state.private.y,
      angle: player.state.private.angle,
      width: player.state.private.width,
      height: player.state.private.height,
      fixed: player.state.private.fixed
    };

    worker.send({
      'cmd': 'add',
      'msg': data
    });

    // TODO: trigger full state update

    socket.on('command:send', function(command) {
      console.log(command);

      // add to server physics queue instead of immeadiately publishing
      entities.global[player.uuid].queue.input.push(command);
    });

    socket.on('disconnect', function() {
      // remove player from server
      entities.remove(entities, player.uuid);
    });

  };

  return {
    init: init
  };

});
