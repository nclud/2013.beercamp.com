(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    // jQuery and Raphael dependencies loaded outside RequireJS
    define(factory);
  }
})(this, function() {

  var init = function() {
    // clicking the Timer triggers the end game screen.
    // TODO: remove this when actual game state can trigger end of game
    $('.countdown').click(this.gameover);

    // animation of the Timer (this is currently just a demo)
    var archtype = Raphael('countdown', 200, 200);
    var archtype_bot = Raphael('countdown_static', 500, 500);

    archtype.customAttributes.arc = function(xloc, yloc, value, total, R) {
      var alpha = 360 / total * value,
        a = (90 - alpha) * Math.PI / 180,
        x = xloc + R * Math.cos(a),
        y = yloc - R * Math.sin(a),
        path;

      if (total == value) {
        path = [
          ["M", xloc, yloc - R],
          ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
        ];
      } else {
        path = [
          ["M", xloc, yloc - R],
          ["A", R, R, 0, +(alpha > 180), 1, x, y]
        ];
      }

      return {
        path: path
      };
    };

    archtype_bot.customAttributes.arc = function(xloc, yloc, value, total, R) {
      var alpha = 360 / total * value,
        a = (90 - alpha) * Math.PI / 180,
        x = xloc + R * Math.cos(a),
        y = yloc - R * Math.sin(a),
        path;

      if (total == value) {
        path = [
          ["M", xloc, yloc - R],
          ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
        ];
      } else {
        path = [
          ["M", xloc, yloc - R],
          ["A", R, R, 0, +(alpha > 180), 1, x, y]
        ];
      }

      return {
        path: path
      };
    };

    // make an arc at 50,50 with a radius of 30 that grows from 0 to 40 of 100 with a bounce
    var my_arc = archtype.path().attr({
      "stroke":"#ed1b24",
      "stroke-width":10,
      arc:[60, 60, 0, 100, 50]
    });

    var my_arc_bot = archtype_bot.path().attr({
      "stroke":"#ccc",
      "stroke-width":10,
      arc:[60, 60, 100, 100, 50]
    });

    // TODO: remove this, animate timer on ui update loop
    function animate_arc() {
      setTimeout(function() {
        my_arc.animate({
          arc:[60, 60, 100, 100, 50]
        }, 10000);
      }, 2000);
    }

    animate_arc();

    // load twitter widgets (may not be necessary)
    /*
    !function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (!d.getElementById(id)) {
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);
        }
    }(document, "script", "twitter-wjs");
    */
  };

  var gameover = function(player) {
    // this object should have all data needed to display gameover screen
    if (player) console.log(player.state.public);

    $('#gameover-container').fadeIn(4000, function() {
      $('#main').hide();
      $('#hud').hide();
      $('body').removeClass('game').addClass('gameover');
    });
  };

  return {
    init: init,
    gameover: gameover
  };

});
