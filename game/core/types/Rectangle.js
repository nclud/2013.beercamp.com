(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      './Entity'
    ], factory);
  }
})(this, function(core, time, Entity) {

	var Rectangle = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Rectangle';
    properties.type = properties.type || 'static';

    Entity.call(this, properties, id, client);

    return this;
	};

	Rectangle.prototype = new Entity();
  Rectangle.prototype.constructor = Rectangle;

  Rectangle.prototype.drawType = function(ctx, scale) {
    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'salmon';
    ctx.strokeRect(
      x - halfWidth,
      y - halfHeight,
      width,
      height
    );

    ctx.restore();

    // Entity.prototype.draw.call(this, client);
  }

  return Rectangle;

});
