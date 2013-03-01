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

	var Background = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Background';
    
    Rectangle.call(this, properties, id, client);

    return this;
	};

	Background.prototype = new Rectangle();
  Background.prototype.constructor = Background;

  Background.prototype.drawType = function(canvas) {
    // Rectangle.prototype.drawType.call(this, canvas);

    var ctx = canvas.ctx;
    var SCALE = canvas.scale;

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * SCALE + 0.5) | 0;
    var y = (this.state.private.y * SCALE + 0.5) | 0;

    var width = ((this.state.private.width * SCALE) + 0.5) | 0;
    var height = ((this.state.private.height * SCALE) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * SCALE / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * SCALE / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, SCALE);
    }

    ctx.restore();
    this.redraw = false;
  }

  return Background;

});
