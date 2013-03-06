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

	var Projectile = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Projectile';
    properties.type = properties.type || 'dynamic';
    
    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2;
    properties.height = properties.height || 1.2;
    properties.fixed = properties.fixed || false;
    properties.isSensor = properties.isSensor || false;
    properties.speed = properties.speed || 100;
    properties.src = properties.src || 'images/beer.png';

    properties.sprite = properties.sprite || {
      src: properties.src,
      direction: properties.direction,
      width: 2,
      height: 2,
      x: 2,
      y: 1,
      scale: 1.2,
      map: {

        // default
        0: {
          start: 0,
          end: 0
        },

        // crushed
        1: {
          start: 1,
          end: 1
        }
      
      }
    };

    Rectangle.call(this, properties, id, client);

    return this;
	};

	Projectile.prototype = new Rectangle();
  Projectile.prototype.constructor = Projectile;

  Projectile.prototype.drawType = function(ctx, scale) {
    Rectangle.prototype.drawType.call(this, ctx, scale);

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
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, scale);
    }

    ctx.restore();
  }

  return Projectile;

});
