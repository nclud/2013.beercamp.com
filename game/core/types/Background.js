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

    properties.sprite = properties.sprite || {
      src: 'images/brick.png',
      width: properties.width,
      height: properties.width,
      x: 0,
      y: 0,
      scale: 0.56,
      map: {

        // default
        0: {
          start: 0,
          end: 0,
          repeat: false
        }

      }
    };
    
    Rectangle.call(this, properties, id, client);

    return this;
	};

	Background.prototype = new Rectangle();
  Background.prototype.constructor = Background;

  Background.prototype.drawType = function(client) {
    // Rectangle.prototype.drawType.call(this, client);

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

    /*
    var xMin = x - halfWidth;
    var yMin = y;
    var offset = height;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = halfHeight / 2;
    ctx.shadowBlur = height;
    ctx.shadowColor = 'black';

    ctx.beginPath();
    ctx.moveTo(xMin - offset, yMin);
    ctx.lineTo(xMin + offset + width, yMin);
    ctx.lineTo(xMin + offset + width, yMin + halfHeight);
    ctx.lineTo(xMin - offset, yMin + halfHeight);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'none';

    ctx.fillStyle = '#bcbdc0'; // light grey
    ctx.fillStyle = '#8b5428'; // light brown

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(xMin - offset - halfHeight, yMin);
    ctx.lineTo(xMin + offset + width + halfHeight, yMin);
    ctx.lineTo(xMin + offset + width + halfHeight, yMin + halfHeight);
    ctx.lineTo(xMin - offset - halfHeight, yMin + halfHeight);
    ctx.closePath();
    ctx.fill();

    yMin -= halfHeight;

    ctx.fillStyle = '#484749'; // dark grey
    ctx.fillStyle = '#624130'; // dark brown

    ctx.beginPath();
    ctx.moveTo(xMin - offset, yMin);
    ctx.lineTo(xMin + offset + width, yMin);
    ctx.lineTo(xMin + offset + width + halfHeight, yMin + halfHeight);
    ctx.lineTo(xMin - offset - halfHeight, yMin + halfHeight);
    ctx.closePath();
    ctx.fill();
    */

    if (this.actor) {
      this.actor.draw(ctx, x - halfWidth, y - halfHeight, SCALE);
    }

    ctx.restore();
  }

  return Background;

});
