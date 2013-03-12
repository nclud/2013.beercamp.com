(function(root, factory) {
  if(typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('idgen'),
      undefined,
      undefined,
      require('underscore')
    );
  } else if(typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      undefined,
      './Actor',
      './Graphic',
      'underscore'
    ], factory);
  }
})(this, function(core, time, idgen, Actor, Graphic, _) {

  var Entity = function(properties, id, client) {
    if(idgen) {
      // This generates a 4 byte id (Az09) rather that a UUID which is 32 bytes
      // We can also use a custom character set (i.e. ABCDEFGHIJKLMNOPQRSTUVWYXZabcdefghijklmnopqrstuvwyxz0123456789*@#$%^&*()
      // to decrease chance of generating duplicates.
      this.uuid = idgen(4);
    } else if(id) {
      this.uuid = id;
    }

    this.state = {};

    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Reserved_Words#Reserved_word_usage
    this.state.private = {};
    this.state.public = {};

    if(properties) {
      this.set(properties);
      this.createActor(client);
    }

    this.queue = {};

    // interpolation queue
    this.queue.server = [];

    return this;
  };

  Entity.prototype.createActor = function(client) {
    var properties = this.state.private;
    // Actor undefined on server
    // Image is function in Chrome and Firefox, object in Safari
    if(Actor && properties.sprite && properties.img) {
      this.actor = new Actor(this, properties.img, properties.sprite, client);
    } else if(Graphic && properties.img) {
      this.actor = new Graphic(this, properties.img, client);
    }
  };

  Entity.prototype.needsImage = function() {
    return this.state.private.src ? true : false;
  };

  Entity.prototype.createImage = function(client) {
    var state = this.state.private;
    var image = new Image();
    var entity = this;

    // encapsulate to keep correct state and uuid in callback
    (function(state, uuid, client) {
      image.addEventListener('load', function() {
        state.img = this;
        entity.createActor(client);
      });
    })(state, state.uuid, client);
    image.src = state.src;


  }

  Entity.prototype.set = function(properties) {
    for(var property in properties) {
      this.state.private[property] = properties[property];
      this.state.public[property] = properties[property];
    }
  };

  // @param [Hash] properties The state of an object.
  Entity.prototype.setPublic = function(properties) {
    for(var property in properties) {
      this.state.public[property] = properties[property];
    }
    this.updatePositionAndVelocity();
  };

  Entity.prototype.updatePositionAndVelocity = function(){
    // Positions/velocity should only be exact to a small level of precision.
    this.state.public.x = core.toFixed(this.state.public.x);
    this.state.public.y = core.toFixed(this.state.public.y);
    if(this.state.public.velocity){
      this.state.public.velocity.x = core.toFixed(this.state.public.velocity.x);
      this.state.public.velocity.y = core.toFixed(this.state.public.velocity.y);
    }
  };


  // Used to render objects on the canvas.
  // @param [String] type - i.e. Platform, Powerup, etc.
  Entity.prototype.shouldRenderAs = function(type) {
    return this.state.private.class === type;
  };

  // Serialize is used to send data to clients
  Entity.prototype.serialize = function() {
    var state = this.state.public;
    if(Object.keys(state).length) {
      state.t = state.class;  // Which type of class should be created during initialization (allows for subclasses)
      return state;
    }
  };

  // Get state is used for interpolation
  Entity.prototype.getState = function() {
    // only return state.private with keys
    // this.state.private initialized as {} in Entity
    if(Object.keys(this.state.public).length) {
      return {
        state: this.state.public,
        time: Date.now()
      }
    }
  };

  // Determines if this object can ever move during the game.
  // Subclasses can override to optimize message communication
  Entity.prototype.canEverMove = function() {
    return true;
  };

  Entity.prototype.class = function() {
    return this.state.private['class'];
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

    for(var i = 0; i < length; i++) {
      key = keys[i];

      // check for changed values and push key to delta array
      if(prev[key] !== next[key]) {
        // Do deep comparison for objects (like velocity)
        if(!(typeof(prev[key]) === 'object' && _.isEqual(prev[key], next[key]))) {
          deltaKeys.push(key);
        }
      }
    }

    // set changed values in data object
    if(deltaKeys.length) {
      var state = _.pick(next, deltaKeys);
      return state;
    }

  };

  Entity.prototype.interpolate = function() {
    // entity interpolation
    var dx = Math.abs(this.state.public.x - this.state.private.x);
    var dy = Math.abs(this.state.public.y - this.state.private.y);

    var difference = Math.max(dx, dy);

    // return if no server updates to process
    if(!this.queue.server.length || difference < 0.1) return;

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

    if(prev) {
      // calculate client time percentage between points
      var timePoint = 0;
      var difference = prev.time - time.client;
      var spread = prev.time - time.server;
      timePoint = difference / spread;

      // interpolated position
      x = core.lerp(prev.state.x, this.state.public.x, timePoint);
      y = core.lerp(prev.state.y, this.state.public.y, timePoint);

      if(dx < 10) {
        // apply smoothing
        this.state.private.x = core.lerp(this.state.private.x, x, time.delta * core.smoothing);
      } else {
        // apply smooth snap
        this.state.private.x = core.lerp(prev.state.x, x, time.delta * core.smoothing);
      }

      if(dy < 10) {
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
