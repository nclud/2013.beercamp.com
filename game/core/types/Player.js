(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity'),
      require('./Rectangle'),
      require('./Actor')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../core', '../time', './Entity', './Rectangle', './Actor'], factory);
  }
})(this, function(core, time, Entity, Rectangle, Actor) {

  // constructor
	var Player = function(properties, uuid, client) {
    Rectangle.call(this, properties);

    if (uuid) {
      this.uuid = uuid;
    }

    // function in Chrome and Firefox, object in Safari
    if (typeof Image !== 'undefined') {

      // pass xMax, yMax, frameStep when creating Actor
      // pass xStart, xEnd, xRepeat, yStart when updating Actor

      // this.drunk ranges from 0 to 4
      // TODO: reverse canvas for moving in opposite direction
      // TODO: sprite.x minus sprite.map.xStart to calculate mirror?

      var sprite = {
        src: this,
        x: 9,
        y: 5,
        step: 8,
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

      this.animation = {};

      // TODO: move this into state to update other clients
      this.direction = 'right';

      this.actor = properties.skin ? new Actor(properties, this, client, sprite) : false;
    }

    // input sequence id
    this.seq = 0;

    // input queue
    this.queue.input = [];

    return this;
	};

	Player.prototype = new Rectangle();
  Player.prototype.constructor = Player;

	Player.prototype.respondToInput = function(pressed, callback) {

    var vector = core.getVelocity(pressed);

    var fireButtonChanged = false;
    var input;

    var delta = false;
    var power;

    for (var vertex in vector) {
      // false if no magnitude
      if (typeof vector[vertex] === 'number') {
        if (this.state.private[vertex] !== this.state.private.speed) {
          this.state.private[vertex] = this.state.private.speed;
          delta = true;
        }
      } else if (this.state.private[vertex] !== 0) {
        this.state.private[vertex] = 0;
        delta = true;
      }
    }

    // set animation state for jumping or moving
    if (typeof vector['vy'] === "number") {
      this.animation.isJumping = true;
    } else {
      this.animation.isJumping = false;
    }
    
    if (vector['vx'] === 0) {
      this.animation.isMoving = true;
      this.direction = 'right';
    } else if (vector['vx'] === 180) {
      this.animation.isMoving = true;
      this.direction = 'left';
    } else {
      this.animation.isMoving = false;
    }

		if(pressed.spacebar) {
			this.fire();

      // play throw animation
      this.animation = 3;
		} else {
      if (!this.fireButtonReleased) {
        fireButtonChanged = true;
      }

			this.fireButtonReleased = true;
		}

    if (delta || pressed.spacebar || fireButtonChanged) {
      // create input object
      input = {
        seq: this.seq++,
        input: pressed
      };

      // add input to queue, then send to server
      this.queue.input.push(input);

      if (typeof callback === 'function') callback(input);
    } else {
      // reset to default animation if no input
      // TODO: move this to update loop if no change?
      // this.animation = 0;
    }

	};

	Player.prototype.processInput = function(move, worker) {
    process.nextTick((function() {
      // console.log(move, worker.pid, worker.connected);

      // calculate delta time vector
      var vector = core.getVelocity(move.input);
      var power;

      // TODO: static impulse instead of movement over time?
      for (var vertex in vector) {
        // false if no magnitude
        if (typeof vector[vertex] === 'number') {
          power = this.state.private[vertex] = this.state.private.speed;
        
          worker.send({
            'cmd': 'impulse',
            'uuid': this.uuid,
            'degrees': vector[vertex],
            'power': power
          });
        } else if (this.state.private[vertex] !== 0) {
          worker.send({
            'cmd': 'setZero',
            'uuid': this.uuid
          });
        }
      }

      if(move.input.spacebar) {
        this.fire();
      } else {
        this.fireButtonReleased = true;
      }

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

  Player.prototype.drawType = function(client) {
    Rectangle.prototype.drawType.call(this, client);

    var ctx = client.ctx;
    var SCALE = client.canvas.scale;

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * SCALE + 0.5) | 0;
    var y = (this.state.private.y * SCALE + 0.5) | 0;

    var width = ((this.state.private.width * SCALE) + 0.5) | 0;
    var height = ((this.state.private.height * SCALE) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * SCALE / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * SCALE / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, SCALE);
    }

    ctx.restore();

    // Entity.prototype.draw.call(this, client);
  }

  return Player;

});
