(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity'),
      require('./Rectangle'),
      require('./Projectile'),
      require('underscore'),
      require('../../server/entities')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      './Entity',
      './Rectangle',
      './Projectile',
      'underscore'
    ], factory);
  }
})(this, function(core, time, Entity, Rectangle, Projectile, _, entities) {

  var Player = function(properties, id, client) {
    properties = properties || {};

    properties.name = properties.name || this.defaultNameFor(properties.src);
    if (properties.name.length > 10) {
      properties.name = properties.name.substring(0, 10);
    }
    properties.class = properties.class || 'Player';
    properties.type = properties.type || 'dynamic';

    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2.5;
    properties.height = properties.height || 3;
    properties.fixed = properties.fixed || true;
    properties.speed = properties.speed || 230;

    properties.sprite = properties.sprite || {
      direction: 'right',
      width: 4,
      height: 4,
      x: 9,
      y: 5,
      step: 8,
      scale: 5,
      map: {

        // default
        0: {
          start: 0,
          end: 0,
          repeat: false
        },

        // move
        1: {
          start: 1,
          end: 3,
          repeat: true
        },

        // jump
        2: {
          start: 4,
          end: 5,
          repeat: false
        },

        // throw
        3: {
          start: 6,
          end: 7,
          repeat: false
        },

        // hit
        4: {
          start: 8,
          end: 8,
          repeat: false
        }

      }
    };

    // beer counter
    properties.beer = 0;

    // drunk meter
    properties.intoxication = 5;

    Rectangle.call(this, properties, id, client);

    // input sequence id
    this.seq = 0;

    // input queue
    this.queue.input = [];

    // current input state
    this.input = {};

    // end game when timer expires
    var start = Date.now();
    var stop = start + 120000; // two minutes

    this.timer = {
      start: start,
      stop: stop,
      now: Date.now() - start,
      update: function() {
        // TODO: refactor to update timer.now from server
        this.now = Date.now() - this.start;

        return this.now * 100 / (this.stop - this.start);
      }
    };

    return this;
  };

  Player.prototype = new Rectangle();
  Player.prototype.constructor = Player;

  Player.prototype.drink = function() {
    // handle beer powerup
    this.state.public.beer++;
    this.state.public.intoxication += 5;
    // console.log('Beer', this.state.public['beer'], 'Drunk', this.state.public['intoxication']);
  };

  Player.prototype.defaultNameFor = function(imageName) {
    if (imageName === 'images/char1.png') {
      return 'Mike';
    } else if (imageName === 'images/char2.png') {
      return "Jeff";
    } else if (imageName === 'images/char3.png') {
      return "Tanya";
    } else if (imageName === 'images/char4.png') {
      return "KSnug";
    } else if (imageName === 'images/char5.png') {
      return "Floyd";
    }
  };

  // Override Entity.setPublic to convert from serialized attributes to better named ones.
  Player.prototype.setPublic = function(properties) {
    properties = _.defaults(properties, {
      velocity: properties.v
    });

    if (properties.ix && !properties.intoxication) {
      properties.intoxication = properties.ix;
    }
    if (properties.j && !properties.isJumping) {
      properties.isJumping = properties.j;
    }
    if (properties.mv && !properties.isMoving) {
      properties.isMoving = properties.mv;
    }
    if (properties.d && !properties.direction) {
      properties.direction = properties.d;
    }
    Entity.prototype.setPublic.call(this, properties);
  };

  Player.prototype.serialize = function() {
    return this.optimizeSerializedAttributes(this.state.public);
  };

  Player.prototype.optimizeSerializedAttributes = function(currentState) {
    var state = _.omit(currentState, "class", "type", "angle", "width", "height", "sprite", "fixed", "speed", "velocity", "intoxication", "isJumping", "isMoving", "direction");
    state.v = currentState.velocity;
    state.t = 'Player';
    state.ix = currentState.intoxication ? currentState.intoxication : undefined;
    state.j = !_.isUndefined(currentState.isJumping) ? currentState.isJumping : undefined;
    state.mv = !_.isUndefined(currentState.isMoving) ? currentState.isMoving : undefined;
    state.d = !_.isUndefined(currentState.direction) ? currentState.direction : undefined;
    return state;
  };

  Player.prototype.fire = function(worker) {
    if (!this.state.public.beer) return;

    // consume beer
    this.state.public.beer--;

    var x = this.state.public.x;
    var y = this.state.public.y;

    var entity = new Projectile({
      x: x,
      y: y,
      direction: this.state.public.direction
    });

    entities.global[entity.uuid] = entity;
    entities.local.push(entity.uuid);

    if (worker) {
      var data = {
        class: entity.state.private.class,
        type: entity.state.private.type,
        x: entity.state.private.x,
        y: entity.state.private.y,
        angle: entity.state.private.angle,
        width: entity.state.private.width,
        height: entity.state.private.height,
        direction: entity.state.private.direction,
        speed: entity.state.private.speed,
        src: entity.state.private.src,
        isSensor: entity.state.private.isSensor
      };

      worker.send({
        'cmd': 'fire',
        'uuid': entity.uuid,
        'entity': data
      });
    }
  };

  Player.prototype.sendImpulse = function(worker, degrees) {
    worker.send({
      'cmd': 'impulse',
      'uuid': this.uuid,
      'degrees': degrees,
      'power': this.state.private.speed
    });
  };

  // TODO: refactor respondToInput and processInput core into a shared function
  // TODO: pass in Web Worker to process input
  Player.prototype.respondToInput = function(pressed, callback) {

    if (this.gameover) return;

    // prevent movement if blacked out
    if (this.state.public['isBlackout']) {
      /*
       // stop player movement
       worker.send({
       'cmd': 'setZero',
       'uuid': this.uuid
       });
       */

      this.gameover = true;

      return;
    }

    var fireButtonChanged = false;
    var input;

    var delta = [];
    // console.log(move, worker.pid, worker.connected);

    for (var key in pressed) {
      if (pressed[key] !== this.input[key]) {
        delta.push(key);

        // update current input state
        this.input[key] = pressed[key];
      }
    }

    // calculate delta time vector
    var vector = core.getVelocity(pressed);

    var length = delta.length;
    var deltaKey;

    for (var i = 0; i < length; i++) {
      deltaKey = delta[i];

      // TODO: disable movement on isBlackout
      switch(deltaKey) {

        case 'up':
          if (pressed['up'] && !this.state.public.isJumping) {
            this.state.public.isJumping = true;
            // sendImpulse(worker, vector['vy']);
          }
          break;

        case 'left':
        case 'right':
          if (pressed['left'] !== pressed['right']) {
            this.state.public.isMoving = true;
            this.state.public.direction = pressed['left'] ? 'left' : 'right';

            // sendImpulse(worker, vector['vx']);
          } else {
            this.state.public.isMoving = false;

            /*
             worker.send({
             'cmd': 'setZero',
             'uuid': this.uuid
             });
             */
          }
          break;

        case 'spacebar':
          if (pressed['spacebar']) {
            // TODO: play throw animation
            // this.fire(worker);
          } else {
            this.fireButtonReleased = true;
          }
          break;

      }
    }

    // sendImpulse if key pressed but no velocity (from wall collision)
    /*
     if (!pressed['left'] !== !pressed['right'] && this.state.public.velocity.x === 0) {
     // this.sendImpulse(worker, vector['vx']);
     }
     */

    if (delta.length) {
      input = {
        seq: this.seq++,
        input: pressed
      };

      // add input to queue, then send to server
      this.queue.input.push(input);

      if (typeof callback === 'function') callback(input);
    }

  };

  Player.prototype.processInput = function(move, worker) {

    process.nextTick((function() {
      if (this.end) return;

      // prevent movement if blacked out
      if (this.state.public['isBlackout']) {
        // stop player movement
        worker.send({
          'cmd': 'setZero',
          'uuid': this.uuid
        });

        this.end = true;

        return;
      }

      var pressed = move.input;

      var delta = [];
      // console.log(move, worker.pid, worker.connected);

      for (var key in pressed) {
        if (pressed[key] !== this.input[key]) {
          delta.push(key);

          // update current input state
          this.input[key] = pressed[key];
        }
      }

      // calculate delta time vector
      var vector = core.getVelocity(pressed);

      var length = delta.length;
      var deltaKey;

      for (var i = 0; i < length; i++) {
        deltaKey = delta[i];

        switch(deltaKey) {

          case 'up':
            if (pressed['up'] && !this.state.public.isJumping) {
              this.state.public.isJumping = true;
              this.sendImpulse(worker, vector['vy']);
            }
            break;

          case 'left':
          case 'right':
            // negate values to make undefined equal false
            if (!pressed['left'] === !pressed['right']) {
              this.state.public.isMoving = false;

              worker.send({
                'cmd': 'setZero',
                'uuid': this.uuid
              });
            } else {
              this.state.public.isMoving = true;
              this.state.public.direction = pressed['left'] ? 'left' : 'right';

              this.sendImpulse(worker, vector['vx']);
            }
            break;

          case 'spacebar':
            if (pressed['spacebar']) {
              // TODO: play throw animation
              this.fire(worker);
            } else {
              this.fireButtonReleased = true;
            }
            break;

        }
      }

      // sendImpulse if key pressed but no velocity (from wall collision)
      /*
       if (!pressed['left'] !== !pressed['right'] && this.state.public.velocity.x === 0) {
       this.sendImpulse(worker, vector['vx']);
       }
       */

      // if queue empty, stop looping
      if (!this.queue.input.length) return;

      this.processInput(this.queue.input.shift(), worker);
    }).bind(this));

  };

  Player.prototype.reconcile = function(client, player) {

    var x;
    var y;

    // server reconciliation
    var dx = 0;
    var dy = 0;

    // bind this inside filter to Ship
    // remove most recent processed move and all older moves from queue
    var queue = this.queue.input = this.queue.input.filter((function(el, index, array) {
      return el.seq > this.ack;
    }).bind(this));

    // update reconciled position with client prediction
    // server position plus delta of unprocessed input
    for (var i = 0; i < queue.length; i++) {
      dx += parseInt(queue[i].data.speed * queue[i].data.vector.dx * time.delta);
      dy += parseInt(queue[i].data.speed * queue[i].data.vector.dy * time.delta);
    }

    // reconciled prediction
    x = parseInt(player.ship.state.x) + dx;
    y = parseInt(player.ship.state.y) + dy;

    // set reconciled position
    this.state.private.x = core.lerp(this.state.private.x, x, time.delta * core.smoothing);
    this.state.private.y = core.lerp(this.state.private.y, y, time.delta * core.smoothing);

  };

  Player.prototype.drawType = function(ctx, scale) {
//    Rectangle.prototype.drawType.call(this, ctx, scale);
    var x = this.x(scale);
    var y = this.y(scale);
    ctx.save();
    if (this.actor) {
      this.actor.draw(ctx, x, y, scale);
    }
    ctx.restore();
    this.drawName(ctx, scale, this.state.public.name);

    // Entity.prototype.draw.call(this, client);
  };

  Player.prototype.drawName = function(ctx, scale, name) {
    var x = this.x(scale);
    var y = this.y(scale);

    var halfHeight = this.halfHeight(scale);

    ctx.save();
    var fontHeight = Math.max(14, parseInt(scale));
    ctx.font = fontHeight + 'px Monstrrr-Serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = 'black';
    ctx.fillText(name, x, y - halfHeight - fontHeight / 2);
    ctx.restore();
  };

  Player.prototype.halfHeight = function(scale) {
    return ((this.state.private.height * scale / 2) + 0.5) | 0;
  };
  Player.prototype.halfWidth = function(scale) {
    return ((this.state.private.width * scale / 2) + 0.5) | 0;
  };
  Player.prototype.height = function(scale) {
    return ((this.state.private.height * scale) + 0.5) | 0;
  };
  Player.prototype.width = function(scale) {
    return ((this.state.private.height * scale) + 0.5) | 0;
  };

  // This should probably live on Entity.
  Player.prototype.x = function(scale) {
    return (this.state.private.x * scale + 0.5) | 0;
  };

  // This should probably live on Entity.
  Player.prototype.y = function(scale) {
    return (this.state.private.y * scale + 0.5) | 0;
  };

  // Returns a string value which represents the level of intoxication for this character.
  // @return [String] i.e. ['sober', 'tipsy', 'buzzed', 'schwasted', 'blackout']
  Player.prototype.intoxicationLevel = function(display_name) {
    var intox = this.state.public.intoxication;
    if (intox < 25) {
      return display_name ? "was stone cold sober" : "sober";
    }
    if (intox >= 25 && intox < 50) {
      return display_name ? "got slightly tipsy" : "tipsy";
    }
    if (intox >= 50 && intox < 75) {
      return display_name ? "got righteously buzzed" : "buzzed";
    }
    if (intox >= 75 && intox < 100) {
      return display_name ? "got sooper dooper schwasted" : "schwasted";
    }
    return display_name ? "mutha-f-ing blacked out" : "blackout"
  };

  return Player;

});
