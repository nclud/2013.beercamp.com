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

  var skins = [
    'images/char1.png',
    'images/char2.png',
    'images/char3.png',
    'images/char4.png',
    'images/char5.png'
 ];

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
      socket.emit('game-loaded');

      socket.on('add-player', function(data) {
        var character_id = parseInt(data['character-id']);
        if(isNaN(character_id) || character_id < 0 || character_id > 4){    
          console.log("Invalid Character '" + character_id + "'. Using default character instead.");      
          character_id = 0;

        }
        console.log("Adding a new player to the game as character '" + character_id + "'.");

        // switch from socket.id to Connect sessions?
        var player = new Player({
          x: (Math.random() * 46) + 1,
          y: Math.random() * 60,
          src: skins[character_id]
        });
        
        // set uuid and send to client
        socket.emit('uuid', player.uuid);

        addPlayer(socket, worker, player); 
      });
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
