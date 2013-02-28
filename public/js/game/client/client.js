(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core/core',
      '../core/time',
      '../core/types',
      './input'
    ], factory);
  }
})(this, function(core, time, types, input) {

  // init stats
  var stats = new Stats();
  document.body.appendChild(stats.domElement);

  var entities = {};

  var init = function(client) {

    // init physics worker
    var worker = new Worker('js/game/core/worker.js');

    // update predicted state from worker
    worker.onmessage = function(event) {
      debugger;
      var data = event.data;

      for (var id in data) {
        var entity = entities[id];

        if (entity) {
          entity.update(data[id]);
        }
      }
    };

    // set methods to run every frame
    // TODO: decouple this asynchronously?
    this.actions = [
      this.clearCanvas,
      this.updateEntities
    ];

    // socket.io client connection
    var socket = this.socket = io.connect();

    // set client.uuid
    socket.on('uuid', function(data) {
      client.uuid = data;
    });

    // listen for full state updates
    socket.on('state:full', function(data) {

      // update server time (used for entity interpolation)
      time.server = data.time;
      time.client = time.server - core.offset;

      var uuid;

      var entities = _.union(Object.keys(client.entities), Object.keys(data.entities));
      var entity;

      var state;
      var skin;

      var msg = {};

      // iterate over union of client and server players
      for (var i = 0; i < entities.length; i++) {
        uuid = entities[i]
        entity = data.entities[uuid];

        if (entity && client.entities[uuid]) {
          // TODO: if defined on server and client, update state
          state = entity.state;
          client.entities[uuid].setPublic(state);
          client.entities[uuid].queue.server.push(client.entities[uuid].getState());
        } else if (entity) {
          // if defined on server but not on client, create new Entity on client
          state = entity.state;
          skin = state.skin;

          // TODO: create correct entity type
          if (skin) {
            var img = new Image();

            // encapsulate to keep correct state and uuid in callback
            (function(state, uuid) {
              img.addEventListener('load', function() {
                state.skin = this;
                client.entities[uuid] = new types[state.class](state, uuid, client);
              });
            })(state, uuid);

            img.src = skin;
          } else {
            console.log(state.class);
            client.entities[uuid] = new types[state.class](state, uuid);
          }

          msg[entity.uuid] = state;
        } else {
          delete client.entities[uuid];
        }
      }

      if (Object.keys(msg).length) {
        // add entity to prediction worker
        worker.postMessage({
          'cmd': 'add',
          'msg': msg
        });
      }
    });

    // listen for delta updates
    socket.on('state:delta', function(data) {

      // update server time (used for entity interpolation)
      time.server = data.time;
      time.client = time.server - core.offset;

      // update entities
      var entities = Object.keys(data.entities);
      var length = entities.length;

      var uuid;
      var entity;
      var state;

      // update server state, interpolate foreign entities
      for (var i = 0; i < length; i++) {
        uuid = entities[i];
        entity = data.entities[uuid];

        if (client.entities[uuid]) {

          // authoritatively set internal state if player exists on client
          client.entities[uuid].setPublic(entity.state);

          // get full snapshot for interpolation
          // queue server updates for entity interpolation
          client.entities[uuid].queue.server.push(client.entities[uuid].getState());

          // remove all updates older than one second from interpolation queue
          client.entities[uuid].queue.server = client.entities[uuid].queue.server.filter(core.filterQueue);

        }
      }

    });
  };

  var frame = function() {
    loop(this);

    // TODO: why does this occaisionally spike from 0.016 to 0.4?
    // doesn't seem to coincide with garbage collection steps
    // could possibly be some long blocking operation?
    /*
    if (time.delta > 0.2) {
      console.log(time.delta);
    }
    */
  };

  var loop = function(client) {
    var client = client || this;

    // this bind necessary because of scope change on successive calls
    client.animationFrame = window.requestAnimationFrame(frame.bind(client));

    time.setDelta();
    runFrameActions(client);
    stats.update();
  };

  var pause = function() {
    window.cancelAnimationFrame(this.animationFrame);
    this.areRunning = false;
  };

  var play = function() {
    if(!this.areRunning) {
      this.then = Date.now();

      // init animation loop, variable time step
      this.loop();

      this.areRunning = true;
    }
  };

  var runFrameActions = function(client) {
    for (var i = 0; i < client.actions.length; i++) {
      client.actions[i](client);
    }
  };

  var clearCanvas = function(client) {
    client.ctx.clearRect(0, 0, client.canvas.width, client.canvas.height);
  };

  var createCanvas = function() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.setScale(window.innerWidth, window.innerHeight);

    // make scale and canvas dynamic based on screen size
    window.addEventListener('resize', (function(event) {
      this.setScale(window.innerWidth, window.innerHeight);
    }).bind(this));

    document.getElementById('main').appendChild(this.canvas);
  };

  var setScale = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.scale = width / 48;
  };

  var updateEntities = function(client) {
    var entities = Object.keys(client.entities);
    var length = entities.length;
    var uuid;
    var entity;

    // TODO: is this loop syntax faster?
    for (var i = 0; i < length; i++) {
      uuid = entities[i];
      entity = client.entities[uuid];

      // TODO: switch to array of player-originated entities
      interpolate = (uuid !== client.uuid);

      if (interpolate) {

        // interpolate position of other players
        entity.interpolate();

      } else {

        // TODO: switch this to reconcile
        entity.interpolate();

        // client prediction only for active player
        entity.respondToInput(input.pressed, function(input) {
          client.socket.emit('command:send', input);
        });

      }

      entity.draw(client);
    }
  };

  var followPlayer = function(client) {
    // follow player with camera
    // TODO: parallax background
    var player = client.entities[client.uuid];

    if (player) {
      var value = (window.innerHeight / 2) - player.state.private.y * client.canvas.scale;
      client.canvas.setAttribute('style', 'top:' + value.toString() + 'px');
    }
  };

  return {
    entities: entities,
    init: init,
    loop: loop,
    pause: pause,
    play: play,
    runFrameActions: runFrameActions,
    clearCanvas: clearCanvas,
    createCanvas: createCanvas,
    setScale: setScale,
    updateEntities: updateEntities,
    followPlayer: followPlayer
  };

});
