(function(root, factory) {
  if(typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Powerup'),
      require('underscore')
    );
  } else if(typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../core',
      '../time',
      './Powerup',
      'underscore'
    ], factory);
  }
})(this, function(core, time, Powerup, _) {

  var Beer = function(properties, id, client) {
    properties.class = 'Powerup';
    _.defaults(properties, {
      src: 'images/beer.png',
      sprite: {
        direction: 'right',
        width: 2,
        height: 2,
        x: 2,
        y: 1,
        scale: 0.6,
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
      }
    });
    Powerup.call(this, properties, id, client);
    return this;
  };

  Beer.prototype = new Powerup();
  Beer.prototype.constructor = Beer;

  Beer.prototype.serialize = function() {
    var state = _.pick(this.state.public, "x", "y");
    state.t = 'Beer';

    return state;
  };

  // Beers are considered to be Powerups during client rendering.
  Beer.prototype.shouldRenderAs = function(type) {
    return "Powerup" === type;
  };

  // Spawns a beer at a random location on the screen.
  Beer.spawnRandom = function() {
    var spawn = [ 12, 19, 26, 33, 40, 46, 53, 60 ];
    var pos = Math.floor(Math.random() * spawn.length);
    var properties = {
      x: (Math.random() * 44) + 1,
      y: spawn[pos]
    };
    return new Beer(properties);
  };

  return Beer;

});
