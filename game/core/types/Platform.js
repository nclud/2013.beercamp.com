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

  Platform.prototype.drawType = function(ctx, scale) {
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

    var xMin;
    var yMin;
    var offset;

    switch(this.state.private.perspective) {
      case 'left':
        xMin = x - halfWidth;
        yMin = y - halfHeight;
        offset = halfWidth;

        ctx.fillStyle = '#bcbdc0'; // light grey
        // ctx.fillStyle = '#8b5428'; // light brown

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();

        xMin += halfWidth;

        ctx.fillStyle = '#484749'; // dark grey
        ctx.fillStyle = '#a7a9ab'; // lighter grey
        // ctx.fillStyle = '#624130'; // dark brown

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin);
        ctx.lineTo(xMin + halfWidth, yMin + height);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();

        break;

      case 'right':
        xMin = x - halfWidth;
        yMin = y - halfHeight;
        offset = halfWidth;

        ctx.fillStyle = '#484749'; // dark grey
        ctx.fillStyle = '#a7a9ab'; // lighter grey
        // ctx.fillStyle = '#624130'; // dark brown

        ctx.beginPath();
        ctx.moveTo(xMin, yMin);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height);
        ctx.closePath();
        ctx.fill();

        xMin += halfWidth;

        ctx.fillStyle = '#bcbdc0'; // light grey
        // ctx.fillStyle = '#8b5428'; // light brown

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();
        break;

      default:
        xMin = x - halfWidth;
        yMin = y;
        offset = height;

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
        // ctx.fillStyle = '#8b5428'; // light brown

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
        ctx.fillStyle = '#a7a9ab'; // lighter grey
        // ctx.fillStyle = '#624130'; // dark brown

        ctx.beginPath();
        ctx.moveTo(xMin - offset, yMin);
        ctx.lineTo(xMin + offset + width, yMin);
        ctx.lineTo(xMin + offset + width + halfHeight, yMin + halfHeight);
        ctx.lineTo(xMin - offset - halfHeight, yMin + halfHeight);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  return Platform;

});
