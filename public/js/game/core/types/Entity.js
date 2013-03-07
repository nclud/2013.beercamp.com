(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('node-uuid')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time', 
      undefined,
      './Actor',
      './Graphic'
    ], factory);
  }
})(this, function(core, time, uuid, Actor, Graphic) {

	var Entity = function(properties, id, client) {
    if (uuid) {
      this.uuid = uuid.v4 ? uuid.v4() : false;
    } else if (id) {
      this.uuid = id;
    }

    this.state = {};

    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Reserved_Words#Reserved_word_usage
    this.state.private = {};
    this.state.public = {};

		if(properties) {
			this.set(properties);

      // Actor undefined on server
      // Image is function in Chrome and Firefox, object in Safari
      if (Actor && properties.sprite && properties.img) {
        this.actor = new Actor(this, properties.img, properties.sprite, client);
      } else if (Graphic && properties.img) {
        this.actor = new Graphic(this, properties.img, client);
      }
		}

    this.queue = {};

    // interpolation queue
    this.queue.server = [];

    return this;
	};

	Entity.prototype.set = function(properties) {
		for(var property in properties) {
			this.state.private[property] = properties[property];
			this.state.public[property] = properties[property];
		}
	};

	Entity.prototype.setPublic = function(properties) {
		for(var property in properties) {
			this.state.public[property] = properties[property];
		}
	};

  Entity.prototype.getState = function() {
    // only return state.private with keys
    // this.state.private initialized as {} in Entity
    if (Object.keys(this.state.public).length) {
      return {
        uuid: this.uuid,
        state: this.state.public,
        time: Date.now()
      }
    }
  };

  Entity.prototype.getDelta = function(async, _) {

    // save reference to old values and update state
    // WARN: clone produces shallow copy
    var prev = this.state.private;
    var next = this.state.private = _.clone(this.state.public);

    // init delta array for changed keys
    var deltaKeys = [];

    // iterate over new values and compare to old
    var keys = Object.keys(next);
    var length = keys.length;
    var key;

    for (var i = 0; i < length; i++) {
      key = keys[i];

      // check for changed values and push key to delta array
      if (prev[key] !== next[key]) {
        deltaKeys.push(key);
      }
    }

    // set changed values in data object
    if (deltaKeys.length) {
      return {
        uuid: this.uuid,
        state: _.pick(next, deltaKeys)
      };
    }

  };

  Entity.prototype.interpolate = function() {
    // entity interpolation
    var dx = Math.abs(this.state.public.x - this.state.private.x);
    var dy = Math.abs(this.state.public.y - this.state.private.y);

    var difference = Math.max(dx, dy);

    // return if no server updates to process
    if (!this.queue.server.length || difference < 0.1) return;

    var x;
    var y;

    var count = this.queue.server.length - 1;

    var prev;
    var next;

    for(var i = 0; i < count; i++) {
      prev = this.queue.server[i];
      next = this.queue.server[i + 1];

      // if client offset time is between points, break
      if(time.client > prev.time && time.client < next.time) break;
    }

    if (prev) {
      // calculate client time percentage between points
      var timePoint = 0;
      var difference = prev.time - time.client;
      var spread = prev.time - time.server;
      timePoint = difference / spread;

      // interpolated position
      x = core.lerp(prev.state.x, this.state.public.x, timePoint);
      y = core.lerp(prev.state.y, this.state.public.y, timePoint);

      if (dx < 10) {
        // apply smoothing
        this.state.private.x = core.lerp(this.state.private.x, x, time.delta * core.smoothing);
      } else {
        // apply smooth snap
        this.state.private.x = core.lerp(prev.state.x, x, time.delta * core.smoothing);
      }

      if (dy < 10) {
        // apply smoothing
        this.state.private.y = core.lerp(this.state.private.y, y, time.delta * core.smoothing);
      } else {
        // apply smooth snap
        this.state.private.y = core.lerp(prev.state.y, y, time.delta * core.smoothing);
      }
    } else {
      this.state.private.x = this.state.public.x;
      this.state.private.y = this.state.public.y;
    }
  };

	Entity.prototype.draw = function(ctx, scale) {
    ctx.save();

    // round to whole pixel
    // interpolated x and y coords
    // dont round until AFTER scale
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    // apply transformations (scale and rotate from center)
    // snapped rotation and scale
    ctx.translate(x, y);
    ctx.rotate(this.state.public.rotation);
    ctx.scale(this.state.public.scale, this.state.public.scale);
    ctx.translate(-x, -y);

    // Call extended Entity Type's draw method
    this.drawType && this.drawType(ctx, scale);

    /*
    // draw small dot at Entity center
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    */

    ctx.restore();
	};

  return Entity;

});
