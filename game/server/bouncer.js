(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  }
})(this, function() {

  // maximum connected players
  var max = 30;

  // queue to enter game
  var queue = [];

  // array of players currently in game
  var connected = [];

  var add = function(socket) {
    queue.push(socket);
  };

  var remove = function(socket) {
    queue.splice(getIndex(socket), 1);
  };

  var connect = function(socket) {
    var index = getIndex(socket);

    if (index > -1) {
      queue.splice(index, 1);
    }

    connected.push(socket);
  };

  var disconnect = function(socket) {
    var index = connected.indexOf(socket);
    connected.splice(index, 1);
  };

  var getIndex = function(socket) {
    return queue.indexOf(socket);
  };

  var isFull = function() {
    return connected.length >= max;
  };

  return {
    connected: connected,
    add: add,
    remove: remove,
    connect: connect,
    disconnect: disconnect,
    getIndex: getIndex,
    isFull: isFull
  };

});
