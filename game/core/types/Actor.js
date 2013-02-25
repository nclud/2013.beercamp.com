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

	var Actor = function(properties, entity, client, sprite) {
    this.entity = entity;

    // prepare Actor canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Actor skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(properties, client.canvas);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(properties, client.canvas);

    // sprite config
    if (sprite) {
      this.xMax = sprite.x;
      this.yMax = sprite.y;
      this.step = sprite.step;
      this.t = 0;

      this.map = sprite.map;
      this.animation = this.map[entity.animation]; 
    }

    return this;
	};

  Actor.prototype.constructor = Actor;

  Actor.prototype.updateCache = function(properties, canvas) {
    var ctx = this.skin.getContext('2d');
    var SCALE = canvas.scale;

    this.skin.width = properties.width * SCALE;
    this.skin.height = properties.height * SCALE;

    // render to offscreen canvas
    var cached = this.cached = this.right = this.renderToCanvas(properties.skin, SCALE, false);
    this.left = this.renderToCanvas(properties.skin, SCALE, true);

    /*
    // DEBUG: render full skin
    this.skin.width = cached.width;
    this.skin.height = cached.height;
    */

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.renderToCanvas = function(skin, SCALE, mirror) {
    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = skin.width / skin.height;

    // TODO: where is this 10 value coming from? is ratio being used correctly?
    var width = buffer.width = SCALE * this.entity.state.private.width * 10 * ratio;
    var height = buffer.height = SCALE * this.entity.state.private.height * 10;

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(skin, 0, 0, width, height);

    return buffer;
  };

  Actor.prototype.setFrame = function(frame, SCALE) {
    this.frame = frame;

    // TODO: restart on animation play, not here
    this.t = 0;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var shift = this.frame * SCALE * this.entity.state.private.width;
    var cached = this.cached;

    ctx.clearRect(0, 0, skin.width, skin.height);
    ctx.drawImage(cached, -shift, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.nextFrame = function(SCALE) {
    var step = this.step;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var shift;
    var cached = this.cached;

    var start;
    var delta;

    // if at step, advance to next frame in animation
    if (this.t % step === 0) {
      ctx.clearRect(0, 0, skin.width, skin.height);

      switch(this.entity.direction) {
        case 'right':
          start = this.animation.start;
          delta = this.t / step;
          break;
        case 'left':
          start = this.xMax - this.animation.end;
          delta = -this.t / step;
          break;
      }

      this.frame = start + delta;
      shift = this.frame * SCALE * this.entity.state.private.width;
      ctx.drawImage(cached, -shift, 0, cached.width / 2, cached.height / 2);
    }

    this.t++;
  };

  Actor.prototype.update = function(SCALE) {
    var skin = this.skin;
    var cached = this.cached;

    var ctx = skin.getContext('2d');

    // animate character
    var step = this.step;
    var end = this.animation.start + (this.t / step) >= this.animation.end + 1 ? true : false;

    if (!end) {
      this.nextFrame(SCALE);
    } else if (this.animation.repeat) {
      this.t = 0;
    }
  };

  Actor.prototype.draw = function(ctx, x, y, SCALE) {
    // TODO: reset this.t when sprite changes
    var animation = this.entity.animation;

    if (animation.isThrowing) {
      this.animation = this.map[3];
    } else if (animation.isHit) {
      this.animation = this.map[4];
    } else if (animation.isJumping) {
      this.animation = this.map[2];
    } else if (animation.isMoving) {
      this.animation = this.map[1];
    } else {
      this.animation = this.map[0];
    }

    switch(this.entity.direction) {
      case 'right':
        this.cached = this.right;

        if (this.animation.start === this.animation.end && this.frame !== this.animation.start) {
          this.setFrame(this.animation.start, SCALE);
        } else if (this.animation.start !== this.animation.end) {
          this.update(SCALE);
        }

        break;
      case 'left':
        this.cached = this.left;

        if (this.animation.start === this.animation.end && this.frame !== (this.xMax - this.animation.start - 1)) {
          this.setFrame(this.xMax - this.animation.start - 1, SCALE);
        } else if (this.animation.start !== this.animation.end) {
          this.update(SCALE);
        }

        break;
    }

    ctx.drawImage(this.skin, x, y);
  };

  return Actor;

});
