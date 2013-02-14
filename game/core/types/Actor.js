(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  }
})(this, function() {

	var Actor = function(properties) {
		if(properties) {
			this.set(properties);

      var cached = this.renderToCanvas(properties.skin);

      var skin = this.skin = document.createElement('canvas');
      var ctx = skin.getContext('2d');

      skin.width = entity.halfWidth * 2 * SCALE;
      skin.height = entity.halfHeight * 2 * SCALE;

      /*
      // DEBUG: render full skin
      skin.width = cached.width;
      skin.height = cached.height;
      */

      if (animate) {
        this.sprite = cached;
        this.frame = 0;
        this.step = 8;
      }

      ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
		}
	};

  Actor.prototype.renderToCanvas = function (skin) {
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
