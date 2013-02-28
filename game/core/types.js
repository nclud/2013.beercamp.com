(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'require',
      './types/Entity',
      './types/Rectangle',
      './types/Player',
      './types/Actor'
    ], factory);
  }
})(this, function(require) {

  // avoid types[class] within types to prevent circular dependencies

  return {
    Entity: require('./types/Entity'),
    Rectangle: require('./types/Rectangle'),
    Player: require('./types/Player'),
    Actor: require('./types/Actor')
  };

});
