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
  
  var Rectangle = types['Rectangle'];

  var init = function(worker) {
    worker.on('message', function(data) {
      // console.log('master', data);

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
    });

    return this;
  };

  var load = function(worker) {
    var data = {};

    var platforms = [
      { x: 24, y: 26, width: 48, height: 1 },
      { x: 24, y: 19, width: 12, height: 1 },
      { x: 6, y: 12, width: 12, height: 1 },
      { x: 42, y: 12, width: 12, height: 1 }
    ];
  
    var length = platforms.length;
    var platform;

    var id;
    var entity;

    for (var i = 0; i < length; i++) {
      platform = platforms[i];

      entity = new Rectangle({
        class: 'Rectangle',
        type: 'static',
        x: platform.x,
        y: platform.y,
        angle: 0,
        width: platform.width,
        height: platform.height,
        fixed: true,
        // skin: false
        skin: 'images/level_sprite.png'
      });

      // passing full object throws DOM exception, can't pass DOM elements to worker
      // TODO: replace with getState method
      data[entity.uuid] = {
        type: entity.state.private.type,
        x: entity.state.private.x,
        y: entity.state.private.y,
        angle: entity.state.private.angle,
        width: entity.state.private.width,
        height: entity.state.private.height,
        fixed: entity.state.private.fixed
      };

      entities.global[entity.uuid] = entity;
      entities.local.push(entity.uuid);
    }

    worker.send({
      'cmd': 'add',
      'msg': data
    });
  };

  var loadEnemies = function() {

    var enemies = [
      new Enemy(100, 25),
      new Enemy(250, 25),
      new Enemy(400, 25),
      new Enemy(550, 25),
      new Enemy(700, 25),
      new Enemy(100, 80, -1),
      new Enemy(250, 80, -1),
      new Enemy(400, 80, -1),
      new Enemy(550, 80, -1),
      new Enemy(700, 80, -1)
    ];

    var length = enemies.length;

    var npc;
    var uuid;

    for (var i = 0; i < length; i++) {
      npc = enemies[i];
      uuid = npc.uuid;

      npcs.global[uuid] = npc;
      npcs.local.push(uuid);
    }

  };

  return {
    init: init,
    load: load,
    loadEnemies: loadEnemies
  };

});
