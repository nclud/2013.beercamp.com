(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

	var Platform = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Platform';

    // console.log(properties.width, properties.height);

    properties.sprite = properties.sprite || {
      src: 'images/level_sprite.png',
      width: properties.width,
      height: properties.width,
      x: 10,
      y: 10,
      scale: 4,
      map: {

        // default
        0: {
          start: 1,
          end: 1,
          repeat: false
        }

      }
    };
    
    Rectangle.call(this, properties, id, client);

    return this;
	};

	Platform.prototype = new Rectangle();
  Platform.prototype.constructor = Platform;

  Platform.prototype.drawType = function(client) {
    Rectangle.prototype.drawType.call(this, client);

    var ctx = client.ctx;
    var SCALE = client.canvas.scale;

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * SCALE + 0.5) | 0;
    var y = (this.state.private.y * SCALE + 0.5) | 0;

    var width = ((this.state.private.width * SCALE) + 0.5) | 0;
    var height = ((this.state.private.height * SCALE) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * SCALE / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * SCALE / 2) + 0.5) | 0;

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'salmon';
    ctx.strokeRect(
      x - halfWidth,
      y - halfHeight,
      width,
      height
    );

    if (this.actor) {
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, SCALE);
    }

    ctx.restore();
  }

  return Platform;

});
