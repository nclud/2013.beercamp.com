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

	var Actor = function(properties, entity, client) {
    this.entity = entity;
    this.animate = properties.animate;

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

    /*
    if (animate) {
      this.sprite = cached;
      this.frame = 0;
      this.step = 8;
    }
    */

    return this;
	};

  Actor.prototype.constructor = Actor;

  Actor.prototype.updateCache = function(properties, canvas) {
    var ctx = this.skin.getContext('2d');
    var SCALE = canvas.scale;

    this.skin.width = properties.width * SCALE;
    this.skin.height = properties.height * SCALE;

    // render to offscreen canvas
    var cached = this.renderToCanvas(properties.skin, SCALE);

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

  Actor.prototype.update = function() {
    var skin = this.skin;
    var sprite = this.sprite;

    var ctx = skin.getContext('2d');

    // animate character
    var frame = this.frame;
    var step = this.step;
    var shift;

    // TODO: alter animation based on state
    if (this.entity.isMoving) {
      // TODO: get values from jumping/moving state, change to be LAST_FRAME
      frame / step === 3 ? this.frame = 1 : this.frame++;

      // if at step, advance to next frame in animation
      if (frame % step === 0) {
        shift = (frame/step) * SCALE * 4;

        ctx.clearRect(0, 0, skin.width, skin.height);
        ctx.drawImage(sprite, -shift, 0, sprite.width / 2, sprite.height / 2);
      }
    } else {
      ctx.clearRect(0, 0, skin.width, skin.height);
      ctx.drawImage(sprite, 0, 0, sprite.width / 2, sprite.height / 2);
    }
  };

  Actor.prototype.draw = function(ctx, x, y) {
    if (this.animate) this.update();
    ctx.drawImage(this.skin, x, y);
  };

  return Actor;

});
