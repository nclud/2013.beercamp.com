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

  var Powerup = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Powerup';
    properties.type = properties.type || 'static';

    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2;
    properties.height = properties.height || 1.2;
    properties.fixed = properties.fixed || true;
    properties.isSensor = properties.isSensor || true;

    Rectangle.call(this, properties, id, client);

    return this;
  };

  Powerup.prototype = new Rectangle();
  Powerup.prototype.constructor = Powerup;


  Powerup.prototype.drawType = function(ctx, scale) {
    // Rectangle.prototype.drawType.call(this, ctx, scale);

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x, y + halfHeight * 0.6, scale);
    }

    ctx.restore();
  };

  return Powerup;

});
