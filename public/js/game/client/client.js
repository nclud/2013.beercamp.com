(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../core/core', '../core/time', './input', '../core/types/Rectangle'], factory);
  }
})(this, function(core, time, input, Rectangle) {

  var entities = {};
  var players = {};
  var npcs = {};

  var init = function(client) {

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
      var uuid;

      var entities = _.union(Object.keys(client.entities), Object.keys(data.entities));
      var entity;

      // iterate over union of client and server players
      for (var i = 0; i < entities.length; i++) {
        uuid = entities[i];
        entity = data.entities[uuid];

        if (entity && client.entities[uuid]) {
          // TODO: if defined on server and client, update state
          var state = entity.state;
          client.entities[uuid].setPublic(state);
          client.entities[uuid].queue.server.push(entity);
        } else if (entity) {
          // if defined on server but not on client, create new Entity on client
          client.entities[uuid] = new Rectangle({
            uuid: uuid,
            x: entity.state.x,
            y: entity.state.y,
            width: entity.state.width,
            height: entity.state.height
          });
        } else {
          delete client.npcs[uuid];
        }
      }
    });

    // listen for delta updates
    socket.on('state:delta', function(data) {
      // update server time (used for entity interpolation)
      time.server = data.time;
      time.client = time.server - core.offset;

      // update entities
      var entities = Object.keys(data.entities);
      var length_entities = entities.length;

      var uuid;
      var entity;
      var client_entity;

      // update server state, interpolate foreign entities
      if (length_entities) {

        for (var i = 0; i < length_entities; i++) {
          uuid = entities[i];
          entity = data.entities[uuid];

          // authoritatively set internal state if player exists on client
          client_entity = client.entities[uuid];

          if (client_entity) {

            // interpolate destroy animation?
            if (entity.state.isHit) {
              client_entity.state.public.isHit = parseInt(entity.state.isHit);
            } else {
              entity.state.isHit = client_entity.state.public.isHit;
            }

            if (entity.state.y) {
              client_entity.state.public.y = parseInt(entity.state.y);
            } else {
              entity.state.y = client_entity.state.public.y;
            }

            if (entity.state.x) {
              client_entity.state.public.x = parseInt(entity.state.x);
            } else {
              entity.state.x = client_entity.state.public.x;
            }

            if (entity.state.rotation) {
              client_entity.state.public.rotation = parseInt(entity.state.rotation);
            } else {
              entity.state.rotation = client_entity.state.public.rotation;
            }

            if (entity.state.rotation) {
              client_entity.state.public.rotation = parseInt(entity.state.rotation);
            } else {
              entity.state.rotation = client_entity.state.public.rotation;
            }

            // set timestamp for interpolation
            entity.time = time.client;

            // queue server updates for entity interpolation
            client_entity.queue.server.push(entity);
            
            // remove all updates older than one second from interpolation queue
            client_entity.queue.server = client_entity.queue.server.filter(function(el, index, array) {
              return el.time > (Date.now() - 1000);
            });
          }
        }
      }

    });
  };

  var loop = function(client) {
    client = client || this;

    // this bind necessary because of scope change on successive calls
    client.animationFrame = window.requestAnimationFrame((function() {
      loop(client);
    }).bind(client));

    time.setDelta();
    runFrameActions(client);
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

        entity.interpolate();

        /*
        // client prediction only for active player
        entity.respondToInput(input.pressed, function(input) {
          console.log(input);
          client.socket.emit('command:send', input);
        });
        */

      }

      entity.draw(client);
    }
  };

  return {
    entities: entities,
    players: players,
    npcs: npcs,
    init: init,
    loop: loop,
    pause: pause,
    play: play,
    runFrameActions: runFrameActions,
    clearCanvas: clearCanvas,
    createCanvas: createCanvas,
    setScale: setScale,
    updateEntities: updateEntities
  };

});
