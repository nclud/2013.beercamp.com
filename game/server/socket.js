(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../../config'),
      require('../core/types'),
      require('./update'),
      require('./entities'),
      require('async'),
      require('redis'),
      require('socket.io'),
      require('node-uuid')
    );
  }
})(this, function(config, types, update, entities, async, redis, sio, uuid) {

  var Player = types['Player'];

  var init = function(app, worker, channel) {
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
        x: Math.random() * 20,
        y: Math.random() * 10,
        skin: 'images/char1.png'
      });
      
      // set uuid and send to client
      socket.emit('uuid', player.uuid);

      addPlayer(socket, worker, player);

    });

  };

  var addPlayer = function(socket, worker, player) {

    // add player to server object
    entities.global[player.uuid] = player;
    entities.local.push(player.uuid);

    // passing full object throws DOM exception, can't pass canvas to worker
    worker.send({
      'cmd': 'addPlayer',
      'uuid': player.uuid,
      'state': player.state.private
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
