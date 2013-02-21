(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('./update'),
      require('./entities'),
      require('../core/types/Player'),
      require('async'),
      require('redis'),
      require('socket.io'),
      require('node-uuid'),
      require('../../config')
    );
  }
})(this, function(update, entities, Player, async, redis, sio, uuid, config) {

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
      var player = new Player({
        type: 'dynamic',
        x: Math.random() * 20,
        y: Math.random() * 10,
        angle: 0,
        width: 4,
        height: 4,
        fixed: true,
        skin: 'images/char1.png',
        animate: false,
        speed: 200
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
    data[player.uuid] = player.state.private;

    worker.send({
      'cmd': 'add',
      'msg': data
    });

    // TODO: trigger full state update

    socket.on('command:send', function(command) {
      // add to server physics queue instead of immeadiately publishing
      entities.global[player.uuid].queue.input.push(command);
    });

    socket.on('disconnect', function() {
      // remove player from server
      entities.remove(entities, player.uuid);

      worker.send({
        'cmd': 'remove',
        'uuid': player.uuid
      });
    });

  };

  return {
    init: init
  };

});
