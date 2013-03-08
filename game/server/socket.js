(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../../config'),
      require('../core/types'),
      require('./update'),
      require('./entities'),
      require('./bouncer'),
      require('async'),
      require('redis'),
      require('socket.io')
    );
  }
})(this, function(config, types, update, entities, bouncer, async, redis, sio) {

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

    // websockets only
    io.set('transports', ['websocket']);

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
        // queue sockets rather than ids, as Socket.io lacks a clean API
        // to get socket by id
        if (bouncer.isFull()) {
          bouncer.add(socket);
          socket.emit('queue:enter', bouncer.getIndex(socket) + 1);

          wait = setInterval(function() {
            if (socket.disconnected) {
              // clearInterval and remove disconnected socket from queue
              clearInterval(wait);
              bouncer.remove(socket);
              return;
            }

            if (!bouncer.isFull()) {
              // clearInterval, remove socket from queue and connect
              clearInterval(wait);
              bouncer.connect(socket);
              enterGame(character, socket, worker);
              socket.emit('queue:exit');
            } else {
              // update position in queue
              socket.emit('queue:update', bouncer.getIndex(socket) + 1);
            }
          }, 2000);
        } else {
          bouncer.connect(socket);
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
    update.sendClientGameworld(socket);
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
      bouncer.disconnect(socket);

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
