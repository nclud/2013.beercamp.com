(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  }
})(this, function() {

  var pressed = {};

  var history = [];
  var konami = '38,38,40,40,37,39,37,39,66,65';

  var keys = {
    32: 'spacebar',
    37: 'left',
    39: 'right',
    65: 'left',
    68: 'right',
    87: 'up',
    83: 'down',
    38: 'up',
    40: 'down'
  };

  var keyInteraction = function(event) {
    var code = event.keyCode;

    if (event.type === 'keydown') {
      // store last 10 keypresses
      history = history.slice(-10);
      history.push(code);
      if (history.toString().indexOf(konami) === 0) {
        document.dispatchEvent(new CustomEvent('konami'));
      }
    }

    if(keys[code]) {
      event.preventDefault();
      pressed[keys[code]] = (event.type === 'keydown') ? true : false;
      // Need more info here.
      // - press (initial press)
      // - down (true as long as down)
      // - hold (what counts as a hold? + .5 seconds?)
      // - release (initial release)
    }
  };

  var init = function() {
    window.addEventListener('keyup', keyInteraction);
    window.addEventListener('keydown', keyInteraction);
  };

  return {
    init: init,
    pressed: pressed
  };

});
