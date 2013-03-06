(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    // jQuery and Raphael dependencies loaded outside RequireJS
    define(factory);
  }
})(this, function() {

  var timer = (function() {
    var init = function() {
      var arc = Raphael('countdown', 115, 115);
      var arcStatic = Raphael('countdown_static', 115, 115);

      arc.customAttributes.arc = arcStatic.customAttributes.arc = function(xloc, yloc, value, total, R) {
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

      // make an arc at 60,60 with a stroke of 10 and radius of 50
      // that grows from 0 to 100 of 100 with a bounce
      // expose path to public interface
      this.path = arc.path().attr({
        'stroke': '#ed1b24',
        'stroke-width': 10,
        arc: [60, 60, 0, 100, 50]
      });

      arcStatic.path().attr({
        'stroke': '#ccc',
        'stroke-width': 10,
        arc: [60, 60, 100, 100, 50]
      });

      return this;
    };

    var animate = function(percent) {
      this.path.animate({
        arc: [60, 60, percent, 100, 50]
      }, 1000);
    };

    return {
      init: init,
      animate: animate
    }
  })();

  var init = function(client) {
    // clicking the timer triggers the end game screen.
    // TODO: remove this when actual game state can trigger end of game
    $('.countdown').on('click', (function() {
      var player = client.entities[client.uuid];
      this.gameover(player);
    }).bind(this));

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

    return {
      clock: timer.init()
    }
  };

  var gameover = function(player) {
    // this object should have all data needed to display gameover screen
    if (player) console.log(player);

    //$('#gameover-container').show();
    $('#main').hide();
    $('#hud').hide();
    $('body').removeClass('game').addClass('gameover');
    $('html, body').css('overflow','visible');
    $('header').remove();

    var pimage = player.state.public.src;

    $('.gameover .pic').css('background-image','url(../'+pimage+')');
    $('.gameover .' + player.intoxicationLevel()).show();
  };

  var updateFace = function(player){
      if (player) {
          setPlayerIcon(player);
          $("#user").removeClass("sober tipsy buzzed schwasted").addClass(player.intoxicationLevel());
      }
  };

  // Sets the inital 'character class' for the player's timer.
  // @param [Player] player Assumed to exist already.
  var setPlayerIcon = function(player){
    if($("#user").hasClass("user-face")){
        //console.log("Assigned user character already. Skipping.");
        return;
    }
    var pimage = player.state.public.src;
    var character_css = "";
    switch(pimage){
      case("images/char1.png"):
          character_css = "beardo";
          break;
      case("images/char2.png"):
          character_css = "mohawk";
          break;
      case("images/char3.png"):
          character_css = "glasses";
          break;
      case("images/char4.png"):
          character_css = "psy";
          break;
      default:
          character_css = "floyd";
          break;
    }
    $('#user').addClass('user-face').addClass(character_css);
  }
  return {
    init: init,
    gameover: gameover,
    updateFace: updateFace,
    setPlayerIcon: setPlayerIcon
  };

});
