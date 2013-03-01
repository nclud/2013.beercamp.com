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

    var canvas = client.canvas[this.entity.state.private.class];

    // prepare Graphic canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Graphic skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, canvas);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, canvas);

    return this;
	};

  Graphic.prototype.constructor = Graphic;

  Graphic.prototype.updateCache = function(img, canvas) {
    var state = this.entity.state.private;

    var ctx = this.skin.getContext('2d');
    var SCALE = canvas.scale;

    this.skin.width = state.width * SCALE;
    this.skin.height = state.height * SCALE;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, SCALE, false);

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Graphic.prototype.renderToCanvas = function(img, SCALE, mirror) {
    var state = this.entity.state.private;

    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = img.width / img.height;

    // TODO: where is this 10 value coming from? is ratio being used correctly?
    var width = buffer.width = state.width * SCALE * 2;
    var height = buffer.height = state.height * SCALE * 2;

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Graphic.prototype.draw = function(ctx, x, y, SCALE) {
    ctx.drawImage(this.skin, x, y);
  };

  return Graphic;

});
