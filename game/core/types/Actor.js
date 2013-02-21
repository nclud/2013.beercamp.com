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
      this.frame = 0;

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
    var cached = this.cached = this.renderToCanvas(properties.skin, SCALE);

    /*
    // DEBUG: render full skin
    this.skin.width = cached.width;
    this.skin.height = cached.height;
    */

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Actor.prototype.renderToCanvas = function(skin, SCALE) {
    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = skin.width / skin.height;

    var width = buffer.width = SCALE * ratio * 40;
    var height = buffer.height = SCALE * 40;

    ctx.drawImage(skin, 0, 0, width, height);

    return buffer;
  };

  Actor.prototype.update = function(SCALE) {
    var skin = this.skin;
    var cached = this.cached;

    var ctx = skin.getContext('2d');

    // animate character
    var step = this.step;
    var shift;

    var animation = this.entity.animation;
    var end;

    // TODO: alter animation based on state
    if (animation) {
      this.animation = this.map[animation];
      end = this.animation.xStart + (this.frame / step) >= this.animation.xEnd + 1 ? true : false;

      // TODO: get values from jumping/moving state, change to be LAST_FRAME
      if (this.animation.repeat && end) {
        this.frame = 0;
      } else if (end) {
        this.frame = 0;
        this.entity.animation = 0;
      }

      // if at step, advance to next frame in animation
      if (this.frame % step === 0) {
        shift = (this.animation.xStart + (this.frame/step)) * SCALE * 4;

        ctx.clearRect(0, 0, skin.width, skin.height);
        ctx.drawImage(cached, -shift, 0, cached.width / 2, cached.height / 2);
      }

      this.frame++;
    } else {
      ctx.clearRect(0, 0, skin.width, skin.height);
      ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
    }
  };

  Actor.prototype.draw = function(ctx, x, y, SCALE) {
    // TODO: this will animate even when standing still
    if (typeof this.entity.animation === 'number') this.update(SCALE);
    ctx.drawImage(this.skin, x, y);
  };

  return Actor;

});
