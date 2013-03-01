(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  }
})(this, function() {

	var Actor = function(entity, img, sprite, client) {
    // set sprite direction if specified
    if (sprite.direction) {
      entity.set({
        direction: sprite.direction
      });
    }

    this.entity = entity;

    var canvas = client.canvas[this.entity.state.private.class];

    // prepare Actor canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Actor skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, sprite, canvas);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, sprite, canvas);

    // sprite config
    if (sprite) {
      this.xMax = sprite.x;
      this.yMax = sprite.y;
      this.step = sprite.step;
      this.t = 0;

      var map = this.map = sprite.map;
      this.sprite = map[0];
    }

    return this;
	};

  Actor.prototype.constructor = Actor;

  Actor.prototype.updateCache = function(img, sprite, canvas) {
    var ctx = this.skin.getContext('2d');
    var SCALE = canvas.scale;

    this.skin.width = sprite.width * SCALE;
    this.skin.height = sprite.height * SCALE;
    this.skin.scale = sprite.scale;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, sprite, SCALE, false);

    // reverse canvas for moving in opposite direction
    var direction = sprite.direction

    if (direction) {
      this[direction] = cached;
      var mirror = direction === 'right' ? 'left' : 'right';
      this[mirror] = this.renderToCanvas(img, sprite, SCALE, true);
    }

    // DEBUG: render full skin
    /*
    if (this.entity.state.private.class === 'Platform') {
      this.skin.width = cached.width;
      this.skin.height = cached.height;
    }
    */

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.renderToCanvas = function(img, sprite, SCALE, mirror) {
    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = img.width / img.height;

    // TODO: where is this 10 value coming from? is ratio being used correctly?
    var width = buffer.width = sprite.width * sprite.scale * ratio * SCALE;
    var height = buffer.height = sprite.height * sprite.scale * SCALE;

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Actor.prototype.setFrame = function(frame, SCALE) {
    this.frame = frame;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var cached = this.cached;
    var shift = this.frame * cached.width / this.xMax / 2

    ctx.clearRect(0, 0, skin.width, skin.height);
    ctx.drawImage(cached, -shift, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.drawFrame = function(SCALE) {
    var step = this.step;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var shift;
    var cached = this.cached;

    var start;
    var delta;

    ctx.clearRect(0, 0, skin.width, skin.height);

    switch(this.entity.state.public.direction) {
      case 'right':
        start = this.sprite.start;
        delta = this.t / step;
        break;
      case 'left':
        start = this.xMax - this.sprite.end;
        delta = -this.t / step;
        break;
    }

    this.frame = start + delta;
    shift = this.frame * cached.width / this.xMax / 2;
    ctx.drawImage(cached, -shift, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.update = function(SCALE) {
    var state = this.entity.state.public;

    var skin = this.skin;
    var cached = this.cached;

    var ctx = skin.getContext('2d');

    // animate character
    var step = this.step;
    var end = this.sprite.start + (this.t / step) > this.sprite.end ? true : false;

    if (!end) {
      // if at step, advance to next frame in animation
      if (this.t % step === 0) {
        this.drawFrame(SCALE);
      }
      this.t++;
    } else if (this.sprite.repeat) {
      this.t = 0;
    } else if (this.direction !== state.direction) {
      // redraw if this.entity.state.public.direction changes
      this.direction = state.direction;
      this.drawFrame(SCALE);
    }
  };

  Actor.prototype.draw = function(ctx, x, y, SCALE) {
    var state = this.entity.state.public;
    var animation;

    // animation priority
    if (state.isHit) {
      this.sprite = this.map[4];
      animation = 'isHit';
    } else if (state.isThrowing) {
      this.sprite = this.map[3];
      animation = 'isThrowing';
    } else if (state.isJumping) {
      this.sprite = this.map[2];
      animation = 'isJumping';
    } else if (state.isMoving) {
      this.sprite = this.map[1];
      animation = 'isMoving';
    } else {
      this.sprite = this.map[0];
      animation = 'default';
    }

    // reset this.t when sprite changes
    if (this.animation !== animation) {
      this.animation = animation;
      this.t = 0;
    }

    switch(state.direction) {
      case 'right':
        this.cached = this.right;

        if (this.sprite.start === this.sprite.end && this.frame !== this.sprite.start) {
          this.setFrame(this.sprite.start, SCALE);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(SCALE);
        }

        break;
      case 'left':
        this.cached = this.left;

        if (this.sprite.start === this.sprite.end && this.frame !== (this.xMax - this.sprite.start - 1)) {
          this.setFrame(this.xMax - this.sprite.start - 1, SCALE);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(SCALE);
        }

        break;
    }

    ctx.drawImage(this.skin, x, y);
  };

  return Actor;

});
