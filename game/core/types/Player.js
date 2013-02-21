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
	var Player = function(properties) {
    Rectangle.call(this, properties);

    /*
    this.actor = this.skin ? new Actor(this, skin, width, height) : false;
    */

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

		if(pressed.spacebar) {
			this.fire();
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
    }

	};

	Player.prototype.processInput = function(move, worker) {
    process.nextTick((function() {

      console.log(move, worker.process.pid, worker.state);

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

  /*
  Player.prototype.draw = function(ctx) {
    // translate box2d positions to pixels
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.translate(-(this.x), -(this.y));
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'cyan';
    ctx.strokeRect(
      (this.x - this.halfWidth) * SCALE,
      (this.y - this.halfHeight) * SCALE,
      (this.halfWidth * 2) * SCALE,
      (this.halfHeight * 2) * SCALE
    );
    ctx.restore();

    if (this.actor) {
      this.actor.draw(ctx, (this.x - this.halfWidth) * SCALE, (this.y - this.halfHeight) * SCALE);
    }

    Entity.prototype.draw.call(this, ctx);
  }
  */

  return Player;

});
