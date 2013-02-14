(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('./Entity')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['./Entity'], factory);
  }
})(this, function(Entity) {

	var Rectangle = function(properties) {
    Entity.call(this, properties);

    /*
    this.actor = this.skin ? new Actor(this, skin, width, height) : false;
    */

    // interpolation queue
    this.queue = {};
    this.queue.input = [];
    this.queue.server = [];
	};

	Rectangle.prototype = new Entity();
  Rectangle.prototype.constructor = Rectangle;

	Rectangle.prototype.processInput = function(move, worker) {
    console.log(move);

    process.nextTick((function() {
      if (move.input['left']) {
        worker.send({
          'cmd': 'impulse',
          'uuid': worker.uuid,
          'degrees': 180,
          'power': 100
        });
      } else if (!move.input['right']) {
        worker.send({
          'cmd': 'setZero',
          'uuid': worker.uuid
        });
      }

      if (move.input['right']) {
        worker.send({
          'cmd': 'impulse',
          'uuid': worker.uuid,
          'degrees': 0,
          'power': 100
        });
      } else if (!move.input['left']) {
        worker.send({
          'cmd': 'setZero',
          'uuid': worker.uuid
        });
      }

      if (move.input['up']) {
        worker.send({
          'cmd': 'impulse',
          'uuid': worker.uuid,
          'degrees': 270,
          'power': 100
        });
      }

      // calculate delta time vector
      var vector = core.getVelocity(move.input);

      this.state.private.vx = parseInt(this.state.private.speed * time.delta * vector.dx);
      this.state.private.vy = parseInt(this.state.private.speed * time.delta * vector.dy);

      if(move.input.spacebar) {
        this.fire();
      } else {
        this.fireButtonReleased = true;
      }

      // if queue empty, stop looping
      if (!this.queue.input.length) return;

      this.processInput(this.queue.input.shift());
    }).bind(this));

  };

  Rectangle.prototype.drawType = function(client) {
    var ctx = client.ctx;
    var SCALE = window.innerWidth / 48;

    ctx.save();
    /*
    ctx.translate(this.state.private.x * SCALE, this.state.private.y * SCALE);
    ctx.rotate(this.state.private.angle);
    ctx.translate(-(this.state.private.x) * SCALE, -(this.state.private.y) * SCALE);
    */

    ctx.lineWidth = 2;
    ctx.fillStyle = 'salmon';
    ctx.fillRect(
      /*
      -this.width / 2,
      -this.height / 2,
      (this.width),
      (this.height)
      (this.state.private.x - this.state.private.halfWidth) * SCALE,
      (this.state.private.y - this.state.private.halfHeight) * SCALE,
      (this.state.private.halfWidth * 2) * SCALE,
      (this.state.private.halfHeight * 2) * SCALE
      */
      (this.state.private.x - this.state.private.width / 2) * SCALE,
      (this.state.private.y - this.state.private.height / 2) * SCALE,
      (this.state.private.width) * SCALE,
      (this.state.private.height) * SCALE
    );
    ctx.restore();

    // Entity.prototype.draw.call(this, client);
  }

  return Rectangle;

});
