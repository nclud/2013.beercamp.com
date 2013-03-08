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

    // prepare Actor canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Actor skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, sprite, client.canvas);

        var yStart = 0;
        var intoxication = this.entity.state.public['intoxication'];
        if (intoxication) {
          yStart = Math.floor(intoxication / 25);
        }

        this.drawFrame(yStart, client.canvas.scale);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, sprite, client.canvas);

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
    var scale = canvas.scale;

    var dpr = this.skin.dpr = window.devicePixelRatio;
    this.skin.width = sprite.width * scale * dpr;
    this.skin.height = sprite.height * scale * dpr;
    this.skin.scale = sprite.scale;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, sprite, scale, false);

    // reverse canvas for moving in opposite direction
    var direction = sprite.direction

    if (direction) {
      this[direction] = cached;
      var mirror = direction === 'right' ? 'left' : 'right';
      this[mirror] = this.renderToCanvas(img, sprite, scale, true);
    }

    /*
    // DEBUG: render full skin
    this.skin.width = cached.width;
    this.skin.height = cached.height;
    */

    ctx.drawImage(cached, 0, 0);
  };

  Actor.prototype.renderToCanvas = function(img, sprite, scale, mirror) {
    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = img.width / img.height;
    var dpr = this.skin.dpr;

    // round to whole pixel
    // TODO: what is the role of sprite.scale?
    var width = buffer.width = (sprite.width * sprite.scale * ratio * scale * dpr) + 0.5 | 0;
    var height = buffer.height = (sprite.height * sprite.scale * scale * dpr) + 0.5 | 0;

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Actor.prototype.setFrame = function(frame, yStart, scale) {
    var state = this.entity.state.public;

    this.frame = frame;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var cached = this.cached;
    var xShift = this.frame * cached.width / this.xMax;
    var yShift = yStart * cached.height / this.yMax;

    ctx.clearRect(0, 0, skin.width, skin.height);
    ctx.drawImage(cached, -xShift, -yShift);
  };

  Actor.prototype.drawFrame = function(yStart, scale) {
    var state = this.entity.state.public;

    var step = this.step;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var xShift;
    var yShift;
    var cached = this.cached;

    var start;
    var delta;

    ctx.clearRect(0, 0, skin.width, skin.height);

    switch(state.direction) {
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
    xShift = this.frame * cached.width / this.xMax;
    yShift = yStart * cached.height / this.yMax;

    ctx.drawImage(cached, -xShift, -yShift);
  };

  Actor.prototype.update = function(yStart, scale) {
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
        this.drawFrame(yStart, scale);
      }
      this.t++;
    } else if (this.sprite.repeat) {
      this.t = 0;
    } else if (this.direction !== state.direction) {
      // redraw if this.entity.state.public.direction changes
      this.direction = state.direction;
      this.drawFrame(yStart, scale);
    }
  };

  Actor.prototype.draw = function(ctx, x, y, scale) {
    var state = this.entity.state.public;

    var dpr = this.skin.dpr;
    var width = (this.skin.width / dpr) + 0.5 | 0;
    var height = (this.skin.height / dpr) + 0.5 | 0;

    var halfWidth = (this.skin.width / dpr / 2) + 0.5 | 0;
    var halfHeight = (this.skin.height / dpr / 2) + 0.5 | 0;

    var yStart = 0;
    var intoxication = state['intoxication'];
    if (intoxication) {
      yStart = Math.floor(intoxication / 25);
    }

    var animation;

    // animation priority
    if (state.isBlackout || intoxication >= 100) {
      this.sprite = this.map[0];
      animation = 'default';
    } else if (state.isHit) {
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
          this.setFrame(this.sprite.start, yStart, scale);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(yStart, scale);
        }

        break;
      case 'left':
        this.cached = this.left;

        if (this.sprite.start === this.sprite.end && this.frame !== (this.xMax - this.sprite.start - 1)) {
          this.setFrame(this.xMax - this.sprite.start - 1, yStart, scale);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(yStart, scale);
        }

        break;
    }

    if (this.entity.state.private.class === 'Player') {
      ctx.drawImage(this.skin, x - halfWidth, y - (halfHeight * 1.1) + 0.5 | 0, width, height);
    } else {
      ctx.drawImage(this.skin, x - halfWidth, y - halfHeight, width, height);
    }
  };

  return Actor;

});
