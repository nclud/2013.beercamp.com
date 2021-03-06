(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core/types'),
      require('./entities'),
      require('async')
    );
  }
})(this, function(types, entities, async) {
  
  var Platform = types['Platform'];
  var Powerup = types['Powerup'];
  var Beer = types['Beer'];

  var init = function(worker) {
    worker.on('message', function(event) {
      var cmd = event.cmd;
      var data = event.data;
      var entity;
      var player;
      var beer;

      switch (cmd) {
        case 'update':
          async.forEach(
            Object.keys(data),
            function(uuid, callback) {
              var entity = entities.global[uuid];

              if (entity) {
                entity.setPublic(data[uuid]);
              }

              // notify async.forEach that function has completed
              if (typeof callback === 'function') callback();
            }
          );
          break;
        case 'remove':
          if (entities.global[data]) {
            entities.remove(entities, data);
          }
          break;
        case 'hit':
          entity = entities.global[data];

          if (entity && entity.hit) {
            entity.hit();
          }

          break;
        case 'drink':
          entity = entities.global[data];

          if (entity) {
            entity.drink();
          }

          break;
      }
    });

    return this;
  };

  var load = function(worker) {
    var data = {};

    // TODO: rename this
    var objects = [
      // backgrounds
      { x: 24, y: 17.40, width: 48, height: 10, class: 'Background', src: 'images/arena-lights.png' },
      { x: 24, y: 32, width: 48, height: 10, class: 'Background', src: 'images/arena-lounge.png' },
      { x: 24, y: 48.8, width: 48, height: 15, class: 'Background', src: 'images/arena-disco.png' },
      { x: 24, y: 56, width: 48, height: 15, class: 'Background', src: 'images/arena-brick.png' },

      // brick platforms
      { x: 24, y: 62, width: 48, height: 1, class: 'Platform' },  // Level 0
      { x: 8, y: 55, width: 16, height: 1, class: 'Platform' },   // Level 1
      { x: 40, y: 55, width: 16, height: 1, class: 'Platform' },

      // disco platforms
      { x: 0,  y: 48.525,   width: 11, height: 1, class: 'Platform' },  // Level 2
      { x: 47, y: 48.525,   width: 9,  height: 1, class: 'Platform' },
      { x: 24, y: 48.525,   width: 18, height: 1, class: 'Platform' },
      { x: 24, y: 41.7, width: 6,  height: 1, class: 'Platform' }, // Level 3
      { x: 0,  y: 41.7, width: 18, height: 1, class: 'Platform' },
      { x: 44, y: 41.7, width: 10, height: 1, class: 'Platform' },

      // lounge
      { x: 24, y: 35, width: 28, height: 1, class: 'Platform' },    // Level 4
      { x: 13, y: 27.9, width: 26, height: 1, class: 'Platform' },  // Level 5
      { x: 42, y: 27.9, width: 14, height: 1, class: 'Platform' },

      // roof
      { x: 13, y: 21, width: 26, height: 1, class: 'Platform', // Level 6
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 46, y: 21, width: 7, height: 1, class: 'Platform', // Level 6
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 27, y: 16.5, width: 1, height: 8.1, class: 'Platform', // Vertical
        perspective: 'right',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 5, y: 14, width: 16, height: 1, class: 'Platform', // Level 7
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 23.5, y: 14, width: 4, height: 1, class: 'Platform',  // Level 7
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 42.5, y: 14, width: 14, height: 1, class: 'Platform',  // Level 7
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 34, y: 20.4, width: 1, height: 14, class: 'Platform',
        perspective: 'left',
        color: { light: '#8b5428', dark: '#624130' }
      }
    ];
  
    var length = objects.length;
    var obj;

    var id;
    var entity;

    for (var i = 0; i < length; i++) {
      obj = objects[i];

      entity = new types[obj.class]({
        x: obj.x,
        y: obj.y,
        angle: 0,
        width: obj.width,
        height: obj.height,
        src: obj.src,
        perspective: obj.perspective,
        color: obj.color
      });

      if (entity.state.private.class === 'Platform') {
        // passing full object throws DOM exception, can't pass DOM elements to worker
        // TODO: replace with getState method
        data[entity.uuid] = {
          class: entity.state.private.class,
          type: entity.state.private.type,
          x: entity.state.private.x,
          y: entity.state.private.y,
          angle: entity.state.private.angle,
          width: entity.state.private.width,
          height: entity.state.private.height
        };
      }

      entities.global[entity.uuid] = entity;
      entities.local.push(entity.uuid);
    }

    worker.send({
      'cmd': 'add',
      'msg': data
    });
  };

  var loadPowerup = function(worker) {

    var data = {};
    var entity = Beer.spawnRandom();

    data[entity.uuid] = {
      class: entity.state.private.class,
      type: entity.state.private.type,
      x: entity.state.private.x,
      y: entity.state.private.y,
      angle: entity.state.private.angle,
      width: entity.state.private.width,
      height: entity.state.private.height,
      src: entity.state.private.src,
      isSensor: entity.state.private.isSensor
    };

    entities.global[entity.uuid] = entity;
    entities.local.push(entity.uuid);

    worker.send({
      'cmd': 'add',
      'msg': data
    });

  };

  return {
    init: init,
    load: load,
    loadPowerup: loadPowerup
  };

});
