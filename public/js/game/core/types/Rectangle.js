(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../core', '../time', './Entity'], factory);
  }
})(this, function(core, time, Entity) {

	var Rectangle = function(properties) {
    Entity.call(this, properties);

    /*
    this.actor = this.skin ? new Actor(this, skin, width, height) : false;
    */

    // input sequence id
    this.seq = 0;

    // interpolation queue
    this.queue = {};
    this.queue.input = [];
    this.queue.server = [];
	};

	Rectangle.prototype = new Entity();
  Rectangle.prototype.constructor = Rectangle;

	Rectangle.prototype.processInput = function(move, worker) {

    process.nextTick((function() {
      var power;

      // calculate delta time vector
      var vector = core.getVelocity(move.input);

      for (var vertex in vector) {
        // false if no magnitude
        if (typeof vector[vertex] === 'number') {
          power = this.state.private[vertex] = parseInt(this.state.private.speed * time.delta);
        
          worker.send({
            'cmd': 'impulse',
            'uuid': this.uuid,
            'degrees': vector[vertex],
            'power': power
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

  Rectangle.prototype.drawType = function(client) {
    var ctx = client.ctx;
    var SCALE = window.innerWidth / 48;

    ctx.save();
    ctx.translate(this.state.private.x * SCALE, this.state.private.y * SCALE);
    ctx.rotate(this.state.private.angle);
    ctx.translate(-(this.state.private.x) * SCALE, -(this.state.private.y) * SCALE);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'salmon';
    ctx.strokeRect(
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
