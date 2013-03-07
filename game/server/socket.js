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

  // queue to enter game
  var bouncer = {};
  bouncer.queue = [];
  bouncer.connected = [];

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
      socket.emit('game:load');

      socket.on('player:select', function(data) {
        var character = parseInt(data['character-id']);
        if(isNaN(character) || character < 0 || character > 4) {  
          // console.log("Invalid Character '" + character + "'. Using default character instead.");      
          character = 0;
        }

        var wait;
        var queueLength = 30;

        // queue sockets rather than ids, as Socket.io lacks a clean API
        // to get socket by id
        if (bouncer.connected.length >= queueLength) {
          bouncer.queue.push(socket);
          socket.emit('queue:enter', bouncer.queue.indexOf(socket) + 1);

          wait = setInterval(function() {
            var index = bouncer.queue.indexOf(socket);
            // console.log(index, socket.disconnected);

            // remove disconnected sockets from queue
            if (socket.disconnected) {
              // remove socket from queue and cancel interval
              clearInterval(wait);
              bouncer.queue.splice(index, 1);
              return;
            }

            if (bouncer.connected.length < queueLength) {
              // remove socket from queue and cancel interval
              clearInterval(wait);
              bouncer.queue.splice(index, 1);
              bouncer.connected.push(socket);
              socket.emit('queue:exit');

              enterGame(character, socket, worker);
            } else {
              // update position in queue
              socket.emit('queue:update', index + 1);
            }
          }, 2000);
        } else {
          enterGame(character, socket, worker);
        }

      });
    });

  };

  var enterGame = function(character, socket, worker) {
    // TODO: switch to Connect sessions?
    var player = new Player({
      x: (Math.random() * 44) + 1,
      y: 58, // always spawn on bottom level
      src: skins[character]
    });
    
    // set uuid and send to client
    socket.emit('uuid', player.uuid);

    addPlayer(socket, worker, player); 
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
      // remove player from connected array
      bouncer.connected.splice(bouncer.connected.indexOf(socket), 1);

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
