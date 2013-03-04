(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  }
})(this, function() {

	var Graphic = function(entity, img, client) {
    this.entity = entity;

    // prepare Graphic canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Graphic skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, client.canvas);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, client.canvas);

    return this;
	};

  Graphic.prototype.constructor = Graphic;

  Graphic.prototype.updateCache = function(img, canvas) {
    var state = this.entity.state.private;

    var ctx = this.skin.getContext('2d');
    var scale = canvas.scale;

    var ratio =  img.height / img.width;

    this.skin.width = state.width * scale;
    this.skin.height = state.width * ratio * scale;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, scale, false);

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Graphic.prototype.renderToCanvas = function(img, scale, mirror) {
    var state = this.entity.state.private;

    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio =  img.height / img.width;

    // TODO: where is this 10 value coming from? is ratio being used correctly?
    var width = buffer.width = state.width * scale * 2;
    var height = buffer.height = state.width * ratio * scale * 2;

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Graphic.prototype.draw = function(ctx, x, y, scale) {
    ctx.drawImage(this.skin, x, y);
  };

  return Graphic;

});
