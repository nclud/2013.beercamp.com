(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

	var Player = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Player';
    properties.type = properties.type || 'dynamic';

    properties.angle = properties.angle ||  0;
    properties.width = properties.width ||  3.4;
    properties.height = properties.height ||  3.4;
    properties.fixed = properties.fixed ||  true;
    properties.speed = properties.speed ||  340;

    properties.sprite = properties.sprite || {
      direction: 'right',
      width: 4,
      height: 4,
      x: 9,
      y: 5,
      step: 8,
      scale: 10,
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

    Rectangle.call(this, properties, id, client);

    // input sequence id
    this.seq = 0;

    // input queue
    this.queue.input = [];

    // current input state
    this.input = {};

    return this;
	};

	Player.prototype = new Rectangle();
  Player.prototype.constructor = Player;

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
            this.fire();
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
              this.fire();
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
    // Rectangle.prototype.drawType.call(this, canvas);

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, scale);
    }

    ctx.restore();

    // Entity.prototype.draw.call(this, client);
  }

  return Player;

});
