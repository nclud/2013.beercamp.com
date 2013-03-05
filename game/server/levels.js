(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core/types'),
      require('./entities'),
      require('./npcs'),
      require('async')
    );
  }
})(this, function(types, entities, npcs, async) {
  
  var Platform = types['Platform'];
  var Powerup = types['Powerup'];

  var init = function(worker) {
    worker.on('message', function(event) {
      var cmd = event.cmd;
      var data = event.data;

      if (cmd === 'update') {
        async.forEach(
          Object.keys(data),
          function(uuid, callback) {
            var entity = entities.global[uuid];

            // TODO: race condition?
            if (entity) {
              entity.setPublic(data[uuid]);
            }

            // notify async.forEach that function has completed
            if (typeof callback === 'function') callback();
          }
        );
      } else if (cmd === 'remove') {
        entities.remove(entities, data);
      } else if (cmd === 'beer') {
        entities.global[data].drink();
      }
    });

    return this;
  };

  var load = function(worker) {
    var data = {};

    // TODO: rename this
    var objects = [
      // backgrounds
      { x: 24, y: 15, width: 48, height: 10, class: 'Background', src: 'images/lights.png' },
      { x: 24, y: 30, width: 48, height: 10, class: 'Background', src: 'images/lounge.png' },
      { x: 24, y: 46.8, width: 48, height: 15, class: 'Background', src: 'images/disco.png' },
      { x: 24, y: 54, width: 48, height: 15, class: 'Background', src: 'images/brick.png' },

      // brick
      { x: 24, y: 60, width: 48, height: 1, class: 'Platform' },
      { x: 8, y: 53, width: 16, height: 1, class: 'Platform' },
      { x: 40, y: 53, width: 16, height: 1, class: 'Platform' },

      // disco
      { x: 3, y: 46, width: 5, height: 1, class: 'Platform' },
      { x: 45, y: 46, width: 5, height: 1, class: 'Platform' },
      { x: 24, y: 46, width: 18, height: 1, class: 'Platform' },
      { x: 24, y: 39.7, width: 6, height: 1, class: 'Platform' },
      { x: 5, y: 39.7, width: 8, height: 1, class: 'Platform' },
      { x: 43, y: 39.7, width: 8, height: 1, class: 'Platform' },

      // lounge
      { x: 24, y: 33, width: 28, height: 1, class: 'Platform' },
      { x: 13, y: 25.9, width: 26, height: 1, class: 'Platform' },
      { x: 41, y: 25.9, width: 12, height: 1, class: 'Platform' },

      // roof
      { x: 13, y: 19, width: 26, height: 1, class: 'Platform',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 45, y: 19, width: 5, height: 1, class: 'Platform',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 27, y: 14.5, width: 1, height: 8.1, class: 'Platform',
        perspective: 'right',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 7, y: 12, width: 12, height: 1, class: 'Platform',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 23.5, y: 12, width: 4, height: 1, class: 'Platform',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 41.5, y: 12, width: 12, height: 1, class: 'Platform',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 34, y: 18.4, width: 1, height: 14, class: 'Platform',
        perspective: 'left',
        color: { light: '#8b5428', dark: '#624130' }
      },
      { x: 41.5, y: 12, width: 12, height: 1, class: 'Platform',
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

    for (var k = 0; k < 30; k++) {
      loadPowerup(worker);
    }
  };

  var loadPowerup = function(worker) {

    var data = {};

    var entity = new Powerup({
      x: (Math.random() * 44) + 1,
      y: Math.random() * 61,
      src: 'images/beer.png',
      sprite: {
        direction: 'right',
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
      }
    });

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
