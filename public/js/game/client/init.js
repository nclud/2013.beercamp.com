
(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/core',factory);
  }
})(this, function() {

  // Array cleaner removes specfied value from array. In this case,
  // I'm using it to remove 'undefined' objects in the array.
  // http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
  /*
  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };
  */

  // Used to prevent sending overly precise numbers from server to client.
  // Integers should not be given additional precision
  var toFixed = function(number) {
    if (typeof number !== 'number') return number;

    if (this.isInt(number)) {
      return number;
    }

    return parseFloat(number.toFixed(2));
  };

  var isInt = function(number) {
     return number % 1 === 0;
  };

  // linear interpolation
  var lerp = function(prev, next, time) {
    var _prev = Number(prev);
    var _next = Number(next);
    var _time = Number(time);
    var position;

    _time = (Math.max(0, Math.min(1, _time)));
    position = (_prev + (_time * (_next - _prev)));

    if (isNaN(position)) debugger;

    return position;
  };

  // TODO: replace with physics logic (using dependency injection pattern?)
  // TODO: pass in game object/player (with defined acceleration) instead of just deltas?
  // TODO: check for valid move or cheating (moving too quickly) here
  var getVector = function(vx, vy) {
    // TODO: set dx and dy to max value allowed
    return {
      vx: vx,
      vy: vy
    };
  };

  var getAngle = function(dx, dy) {
    // return angle in degrees, false if no angle
    var vx = dx ? (dx * 90) + 90 : false;
    var vy = dy ? (dy * 90) + 180 : false;

    return this.getVector(vx, vy);
  };

  // takes an input object and returns a velocity vector
  var getVelocity = function(input) {
    // return change as vector, delta x and delta y
    var dx = 0;
    var dy = 0;

    var keys = Object.keys(input);
    var length = keys.length;
    var value;

    for (var i = 0; i < length; i++) {
      value = keys[i];

      if (input[value]) {
        switch(value) {
          case 'up':
            dy++
            break;
          case 'down':
            dy--
            break;
          case 'right':
            dx--;
            break;
          case 'left':
            dx++;
            break;
        }
      }
    }

    return this.getAngle(dx, dy);
  };

  var getRandomNumber = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var initGlobalVariables = function() {

    // entity interpolation offset (milliseconds)
    this.offset = 100;

    // entity interpolation buffer size, frames * seconds
    this.buffersize = 120;

    // entity interpolation smoothing factor
    // lower number is slower smoothing
    this.smoothing = 20;

  };

  var isCollision = function(a, b) {
    var ax = parseInt(a.state.private.x);
    var ay = parseInt(a.state.private.y);
    var bx = parseInt(b.state.private.x);
    var by = parseInt(b.state.private.y);

    return  ax <= (bx + b.width) &&
        bx <= (ax + a.width) &&
        ay <= (by + b.height) &&
        by <= (ay + a.height);
  };

  var loadScene = function(name) {
    /*
    game.scene = game.scenes[name];
    game.scene.init();
    */
  };

  var filterQueue = function(el, index, array) {
    return el.time > (Date.now() - 1000);
  };

  return {
    lerp: lerp,
    getVector: getVector,
    getAngle: getAngle,
    getVelocity: getVelocity,
    getRandomNumber: getRandomNumber,
    initGlobalVariables: initGlobalVariables,
    isCollision: isCollision,
    loadScene: loadScene,
    filterQueue: filterQueue,
    toFixed:toFixed,
    isInt:isInt
  };

});

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('input',factory);
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

    // toggle stats on ctrl-r
    if (code === 82 && event.ctrlKey && (event.type === 'keydown')) {
      $('#stats').toggle();
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

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    // jQuery and Raphael dependencies loaded outside RequireJS
    define('ui',factory);
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
      this.gameover(client, player);
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

  var gameover = function(client, player) {
    client.disconnect();

    // this object should have all data needed to display gameover screen
    if (player) console.log(player);

    $('.gameover').fadeIn(function() {
      $('#main').hide();
      $('#hud').hide();
      $('header').remove();

      var pimage = player.state.public.src;

      $('.gameover .pic').css('background-image','url(../'+pimage+')');
      $('.gameover .' + player.intoxicationLevel()).show();

      var tweet_message = encodeURIComponent("I " + player.intoxicationLevel(true) + " at #beercamp! http://2013.beercamp.com via @nclud");
      var referrer = encodeURIComponent("http://2013.beercamp.com");
      var url = "https://twitter.com/intent/tweet?original_referer=" + referrer + " &text=" + tweet_message;
      $('.tweet').attr("href", url).attr("target", "_blank");

      var facebook = "https://www.facebook.com/sharer/sharer.php?u=http://2013.beercamp.com";
      $('.facebook').attr("href", facebook).attr("target", "_blank");
    });

  };

  var updateFace = function(player){
    if (player) {
      setPlayerIcon(player);
      $("#user").removeClass("sober tipsy buzzed schwasted").addClass(player.intoxicationLevel());
    }
  };

  var queue = (function() {
    var enter = function(position) {
      var $queue = $('#queue');
      $queue.find('.number').text(position);
      $queue.show();
    };

    var update = function(position) {
      $('#queue').find('.number').text(position);
    };

    var exit = function() {
      $('#queue').fadeOut();
    };

    return {
      enter: enter,
      update: update,
      exit: exit
    }
  })();

  var updateAmmo = function(player) {
    if (player) {
      var beers = player.state.public.beer;
      for(var i = 8; i > beers; i--) {
        $('.weapon[data-count="' + i + '"]').removeClass('added');
      }
      for(var j = 1; j <= beers && j <= 8; j++) {
        $('.weapon[data-count="' + j + '"]').addClass('added');
      }
    }
  };

  // Sets the initial 'character class' for the player's timer.
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
    queue: queue,
    setPlayerIcon: setPlayerIcon,
    updateAmmo: updateAmmo
  };

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/time',factory);
  }
})(this, function() {

  var setDelta = function() {
    this.now = Date.now();
    this.delta = (this.now - this.then) / 1000; // seconds since last frame
    this.then = this.now;
  };

  return {
    then: Date.now(),
    setDelta: setDelta
  };

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Actor',factory);
  }
})(this, function() {

	var Actor = function(entity, img, sprite, client) {
    // set sprite direction if specified
    if (sprite.direction) {
      entity.set({
        direction: sprite.direction
      });
    }

    this.entity = entity;

    // prepare Actor canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Actor skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, sprite, client.canvas);

        var yStart = 0;
        var intoxication = this.entity.state.public['intoxication'];
        if (intoxication) {
          yStart = Math.min(Math.floor(intoxication / 25), 4);
        }

        this.drawFrame(yStart, client.canvas.scale);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, sprite, client.canvas);

    // sprite config
    if (sprite) {
      this.xMax = sprite.x;
      this.yMax = sprite.y;
      this.step = sprite.step;
      this.t = 0;

      var map = this.map = sprite.map;
      this.sprite = map[0];
    }

    return this;
	};

  Actor.prototype.constructor = Actor;

  Actor.prototype.updateCache = function(img, sprite, canvas) {
    var ctx = this.skin.getContext('2d');
    var scale = canvas.scale;

    var dpr = this.skin.dpr = window.devicePixelRatio;
    this.skin.width = sprite.width * scale * dpr;
    this.skin.height = sprite.height * scale * dpr;
    this.skin.scale = sprite.scale;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, sprite, scale, false);

    // reverse canvas for moving in opposite direction
    var direction = sprite.direction

    if (direction) {
      this[direction] = cached;
      var mirror = direction === 'right' ? 'left' : 'right';
      this[mirror] = this.renderToCanvas(img, sprite, scale, true);
    }

    /*
    // DEBUG: render full skin
    this.skin.width = cached.width;
    this.skin.height = cached.height;
    */

    ctx.drawImage(cached, 0, 0);
  };

  Actor.prototype.renderToCanvas = function(img, sprite, scale, mirror) {
    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio = img.width / img.height;
    var dpr = this.skin.dpr;

    // round to whole pixel
    // TODO: what is the role of sprite.scale?
    var width = buffer.width = (sprite.width * sprite.scale * ratio * scale * dpr) + 0.5 | 0;
    var height = buffer.height = (sprite.height * sprite.scale * scale * dpr) + 0.5 | 0;

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Actor.prototype.setFrame = function(frame, yStart, scale) {
    var state = this.entity.state.public;

    this.frame = frame;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var cached = this.cached;
    var xShift = this.frame * cached.width / this.xMax;
    var yShift = yStart * cached.height / this.yMax;

    ctx.clearRect(0, 0, skin.width, skin.height);
    ctx.drawImage(cached, -xShift, -yShift);
  };

  Actor.prototype.drawFrame = function(yStart, scale) {
    var state = this.entity.state.public;

    var step = this.step;

    var skin = this.skin;
    var ctx = skin.getContext('2d');

    var xShift;
    var yShift;
    var cached = this.cached;

    var start;
    var delta;

    ctx.clearRect(0, 0, skin.width, skin.height);

    switch(state.direction) {
      case 'right':
        start = this.sprite.start;
        delta = this.t / step;
        break;
      case 'left':
        start = this.xMax - this.sprite.end;
        delta = -this.t / step;
        break;
    }

    this.frame = start + delta;
    xShift = this.frame * cached.width / this.xMax;
    yShift = yStart * cached.height / this.yMax;

    ctx.drawImage(cached, -xShift, -yShift);
  };

  Actor.prototype.update = function(yStart, scale) {
    var state = this.entity.state.public;

    var skin = this.skin;
    var cached = this.cached;

    var ctx = skin.getContext('2d');

    // animate character
    var step = this.step;
    var end = this.sprite.start + (this.t / step) > this.sprite.end ? true : false;

    if (!end) {
      // if at step, advance to next frame in animation
      if (this.t % step === 0) {
        this.drawFrame(yStart, scale);
      }
      this.t++;
    } else if (this.sprite.repeat) {
      this.t = 0;
    } else if (this.direction !== state.direction) {
      // redraw if this.entity.state.public.direction changes
      this.direction = state.direction;
      this.drawFrame(yStart, scale);
    }
  };

  Actor.prototype.draw = function(ctx, x, y, scale) {
    var state = this.entity.state.public;

    var dpr = this.skin.dpr;
    var width = (this.skin.width / dpr) + 0.5 | 0;
    var height = (this.skin.height / dpr) + 0.5 | 0;

    var halfWidth = (this.skin.width / dpr / 2) + 0.5 | 0;
    var halfHeight = (this.skin.height / dpr / 2) + 0.5 | 0;

    var yStart = 0;
    var intoxication = state['intoxication'];
    if (intoxication) {
      yStart = Math.min(Math.floor(intoxication / 25), 4);
    }

    var animation;

    // animation priority
    if (state.isBlackout || intoxication >= 100) {
      this.sprite = this.map[0];
      animation = 'default';
    } else if (state.isHit) {
      this.sprite = this.map[4];
      animation = 'isHit';
    } else if (state.isThrowing) {
      this.sprite = this.map[3];
      animation = 'isThrowing';
    } else if (state.isJumping) {
      this.sprite = this.map[2];
      animation = 'isJumping';
    } else if (state.isMoving) {
      this.sprite = this.map[1];
      animation = 'isMoving';
    } else {
      this.sprite = this.map[0];
      animation = 'default';
    }

    // reset this.t when sprite changes
    if (this.animation !== animation) {
      this.animation = animation;
      this.t = 0;
    }

    switch(state.direction) {
      case 'right':
        this.cached = this.right;

        if (this.sprite.start === this.sprite.end && this.frame !== this.sprite.start) {
          this.setFrame(this.sprite.start, yStart, scale);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(yStart, scale);
        }

        break;
      case 'left':
        this.cached = this.left;

        if (this.sprite.start === this.sprite.end && this.frame !== (this.xMax - this.sprite.start - 1)) {
          this.setFrame(this.xMax - this.sprite.start - 1, yStart, scale);
        } else if (this.sprite.start !== this.sprite.end) {
          this.update(yStart, scale);
        }

        break;
    }

    if (this.entity.state.private.class === 'Player') {
      ctx.drawImage(this.skin, x - halfWidth, y - (halfHeight * 1.1) + 0.5 | 0, width, height);
    } else {
      ctx.drawImage(this.skin, x - halfWidth, y - halfHeight, width, height);
    }
  };

  return Actor;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Graphic',factory);
  }
})(this, function() {

	var Graphic = function(entity, img, client) {
    this.entity = entity;

    // prepare Graphic canvas
    this.skin = document.createElement('canvas');

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize Graphic skin on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);
        this.updateCache(img, client.canvas);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    this.updateCache(img, client.canvas);

    return this;
	};

  Graphic.prototype.constructor = Graphic;

  Graphic.prototype.updateCache = function(img, canvas) {
    var state = this.entity.state.private;

    var ctx = this.skin.getContext('2d');
    var scale = canvas.scale;

    var ratio =  img.height / img.width;

    this.skin.width = state.width * scale;
    this.skin.height = state.width * ratio * scale;

    // render to offscreen canvas
    var cached = this.cached = this.renderToCanvas(img, scale, false);

    ctx.drawImage(cached, 0, 0, cached.width / 2, cached.height / 2);
  };

  Graphic.prototype.renderToCanvas = function(img, scale, mirror) {
    var state = this.entity.state.private;

    var buffer = document.createElement('canvas');
    var ctx = buffer.getContext('2d');

    var ratio =  img.height / img.width;

    // TODO: where is this 10 value coming from? is ratio being used correctly?
    var width = buffer.width = state.width * scale * 2;
    var height = buffer.height = state.width * ratio * scale * 2;

    ctx.drawImage(img, 0, 0, width, height);

    return buffer;
  };

  Graphic.prototype.draw = function(ctx, x, y, scale) {
    ctx.drawImage(this.skin, x, y);
  };

  return Graphic;

});

(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,d=e.filter,g=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,_=Object.keys,j=i.bind,w=function(n){return n instanceof w?n:this instanceof w?(this._wrapped=n,void 0):new w(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=w),exports._=w):n._=w,w.VERSION="1.4.4";var A=w.each=w.forEach=function(n,t,e){if(null!=n)if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a in n)if(w.has(n,a)&&t.call(e,n[a],a,n)===r)return};w.map=w.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e[e.length]=t.call(r,n,u,i)}),e)};var O="Reduce of empty array with no initial value";w.reduce=w.foldl=w.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=w.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},w.reduceRight=w.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=w.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=w.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},w.find=w.detect=function(n,t,r){var e;return E(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},w.filter=w.select=function(n,t,r){var e=[];return null==n?e:d&&n.filter===d?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&(e[e.length]=n)}),e)},w.reject=function(n,t,r){return w.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},w.every=w.all=function(n,t,e){t||(t=w.identity);var u=!0;return null==n?u:g&&n.every===g?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var E=w.some=w.any=function(n,t,e){t||(t=w.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};w.contains=w.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:E(n,function(n){return n===t})},w.invoke=function(n,t){var r=o.call(arguments,2),e=w.isFunction(t);return w.map(n,function(n){return(e?t:n[t]).apply(n,r)})},w.pluck=function(n,t){return w.map(n,function(n){return n[t]})},w.where=function(n,t,r){return w.isEmpty(t)?r?null:[]:w[r?"find":"filter"](n,function(n){for(var r in t)if(t[r]!==n[r])return!1;return!0})},w.findWhere=function(n,t){return w.where(n,t,!0)},w.max=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.max.apply(Math,n);if(!t&&w.isEmpty(n))return-1/0;var e={computed:-1/0,value:-1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a>=e.computed&&(e={value:n,computed:a})}),e.value},w.min=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.min.apply(Math,n);if(!t&&w.isEmpty(n))return 1/0;var e={computed:1/0,value:1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;e.computed>a&&(e={value:n,computed:a})}),e.value},w.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=w.random(r++),e[r-1]=e[t],e[t]=n}),e};var k=function(n){return w.isFunction(n)?n:function(t){return t[n]}};w.sortBy=function(n,t,r){var e=k(t);return w.pluck(w.map(n,function(n,t,u){return{value:n,index:t,criteria:e.call(r,n,t,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index<t.index?-1:1}),"value")};var F=function(n,t,r,e){var u={},i=k(t||w.identity);return A(n,function(t,a){var o=i.call(r,t,a,n);e(u,o,t)}),u};w.groupBy=function(n,t,r){return F(n,t,r,function(n,t,r){(w.has(n,t)?n[t]:n[t]=[]).push(r)})},w.countBy=function(n,t,r){return F(n,t,r,function(n,t){w.has(n,t)||(n[t]=0),n[t]++})},w.sortedIndex=function(n,t,r,e){r=null==r?w.identity:k(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;u>r.call(e,n[o])?i=o+1:a=o}return i},w.toArray=function(n){return n?w.isArray(n)?o.call(n):n.length===+n.length?w.map(n,w.identity):w.values(n):[]},w.size=function(n){return null==n?0:n.length===+n.length?n.length:w.keys(n).length},w.first=w.head=w.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:o.call(n,0,t)},w.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},w.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},w.rest=w.tail=w.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},w.compact=function(n){return w.filter(n,w.identity)};var R=function(n,t,r){return A(n,function(n){w.isArray(n)?t?a.apply(r,n):R(n,t,r):r.push(n)}),r};w.flatten=function(n,t){return R(n,t,[])},w.without=function(n){return w.difference(n,o.call(arguments,1))},w.uniq=w.unique=function(n,t,r,e){w.isFunction(t)&&(e=r,r=t,t=!1);var u=r?w.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:w.contains(a,r))||(a.push(r),i.push(n[e]))}),i},w.union=function(){return w.uniq(c.apply(e,arguments))},w.intersection=function(n){var t=o.call(arguments,1);return w.filter(w.uniq(n),function(n){return w.every(t,function(t){return w.indexOf(t,n)>=0})})},w.difference=function(n){var t=c.apply(e,o.call(arguments,1));return w.filter(n,function(n){return!w.contains(t,n)})},w.zip=function(){for(var n=o.call(arguments),t=w.max(w.pluck(n,"length")),r=Array(t),e=0;t>e;e++)r[e]=w.pluck(n,""+e);return r},w.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},w.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=w.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},w.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},w.range=function(n,t,r){1>=arguments.length&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=Array(e);e>u;)i[u++]=n,n+=r;return i},w.bind=function(n,t){if(n.bind===j&&j)return j.apply(n,o.call(arguments,1));var r=o.call(arguments,2);return function(){return n.apply(t,r.concat(o.call(arguments)))}},w.partial=function(n){var t=o.call(arguments,1);return function(){return n.apply(this,t.concat(o.call(arguments)))}},w.bindAll=function(n){var t=o.call(arguments,1);return 0===t.length&&(t=w.functions(n)),A(t,function(t){n[t]=w.bind(n[t],n)}),n},w.memoize=function(n,t){var r={};return t||(t=w.identity),function(){var e=t.apply(this,arguments);return w.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},w.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},w.defer=function(n){return w.delay.apply(w,[n,1].concat(o.call(arguments,1)))},w.throttle=function(n,t){var r,e,u,i,a=0,o=function(){a=new Date,u=null,i=n.apply(r,e)};return function(){var c=new Date,l=t-(c-a);return r=this,e=arguments,0>=l?(clearTimeout(u),u=null,a=c,i=n.apply(r,e)):u||(u=setTimeout(o,l)),i}},w.debounce=function(n,t,r){var e,u;return function(){var i=this,a=arguments,o=function(){e=null,r||(u=n.apply(i,a))},c=r&&!e;return clearTimeout(e),e=setTimeout(o,t),c&&(u=n.apply(i,a)),u}},w.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},w.wrap=function(n,t){return function(){var r=[n];return a.apply(r,arguments),t.apply(this,r)}},w.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},w.after=function(n,t){return 0>=n?t():function(){return 1>--n?t.apply(this,arguments):void 0}},w.keys=_||function(n){if(n!==Object(n))throw new TypeError("Invalid object");var t=[];for(var r in n)w.has(n,r)&&(t[t.length]=r);return t},w.values=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push(n[r]);return t},w.pairs=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push([r,n[r]]);return t},w.invert=function(n){var t={};for(var r in n)w.has(n,r)&&(t[n[r]]=r);return t},w.functions=w.methods=function(n){var t=[];for(var r in n)w.isFunction(n[r])&&t.push(r);return t.sort()},w.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},w.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},w.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)w.contains(r,u)||(t[u]=n[u]);return t},w.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)null==n[r]&&(n[r]=t[r])}),n},w.clone=function(n){return w.isObject(n)?w.isArray(n)?n.slice():w.extend({},n):n},w.tap=function(n,t){return t(n),n};var I=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof w&&(n=n._wrapped),t instanceof w&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==t+"";case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;r.push(n),e.push(t);var a=0,o=!0;if("[object Array]"==u){if(a=n.length,o=a==t.length)for(;a--&&(o=I(n[a],t[a],r,e)););}else{var c=n.constructor,f=t.constructor;if(c!==f&&!(w.isFunction(c)&&c instanceof c&&w.isFunction(f)&&f instanceof f))return!1;for(var s in n)if(w.has(n,s)&&(a++,!(o=w.has(t,s)&&I(n[s],t[s],r,e))))break;if(o){for(s in t)if(w.has(t,s)&&!a--)break;o=!a}}return r.pop(),e.pop(),o};w.isEqual=function(n,t){return I(n,t,[],[])},w.isEmpty=function(n){if(null==n)return!0;if(w.isArray(n)||w.isString(n))return 0===n.length;for(var t in n)if(w.has(n,t))return!1;return!0},w.isElement=function(n){return!(!n||1!==n.nodeType)},w.isArray=x||function(n){return"[object Array]"==l.call(n)},w.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){w["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),w.isArguments(arguments)||(w.isArguments=function(n){return!(!n||!w.has(n,"callee"))}),"function"!=typeof/./&&(w.isFunction=function(n){return"function"==typeof n}),w.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},w.isNaN=function(n){return w.isNumber(n)&&n!=+n},w.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},w.isNull=function(n){return null===n},w.isUndefined=function(n){return n===void 0},w.has=function(n,t){return f.call(n,t)},w.noConflict=function(){return n._=t,this},w.identity=function(n){return n},w.times=function(n,t,r){for(var e=Array(n),u=0;n>u;u++)e[u]=t.call(r,u);return e},w.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))};var M={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};M.unescape=w.invert(M.escape);var S={escape:RegExp("["+w.keys(M.escape).join("")+"]","g"),unescape:RegExp("("+w.keys(M.unescape).join("|")+")","g")};w.each(["escape","unescape"],function(n){w[n]=function(t){return null==t?"":(""+t).replace(S[n],function(t){return M[n][t]})}}),w.result=function(n,t){if(null==n)return null;var r=n[t];return w.isFunction(r)?r.call(n):r},w.mixin=function(n){A(w.functions(n),function(t){var r=w[t]=n[t];w.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),D.call(this,r.apply(w,n))}})};var N=0;w.uniqueId=function(n){var t=++N+"";return n?n+t:t},w.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var T=/(.)^/,q={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},B=/\\|'|\r|\n|\t|\u2028|\u2029/g;w.template=function(n,t,r){var e;r=w.defaults({},r,w.templateSettings);var u=RegExp([(r.escape||T).source,(r.interpolate||T).source,(r.evaluate||T).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(B,function(n){return"\\"+q[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,w);var c=function(n){return e.call(this,n,w)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},w.chain=function(n){return w(n).chain()};var D=function(n){return this._chain?w(n).chain():n};w.mixin(w),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];w.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],D.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];w.prototype[n]=function(){return D.call(this,t.apply(this._wrapped,arguments))}}),w.extend(w.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);
define("underscore", (function (global) {
    return function () {
        var ret, fn;
        return ret || global._;
    };
}(this)));

(function(root, factory) {
  if(typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('idgen'),
      undefined,
      undefined,
      require('underscore')
    );
  } else if(typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Entity',[
      '../core',
      '../time',
      undefined,
      './Actor',
      './Graphic',
      'underscore'
    ], factory);
  }
})(this, function(core, time, idgen, Actor, Graphic, _) {

  var Entity = function(properties, id, client) {
    if(idgen) {
      // This generates a 4 byte id (Az09) rather that a UUID which is 32 bytes
      // We can also use a custom character set (i.e. ABCDEFGHIJKLMNOPQRSTUVWYXZabcdefghijklmnopqrstuvwyxz0123456789*@#$%^&*()
      // to decrease chance of generating duplicates.
      this.uuid = idgen(4);
    } else if(id) {
      this.uuid = id;
    }

    this.state = {};

    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Reserved_Words#Reserved_word_usage
    this.state.private = {};
    this.state.public = {};

    if(properties) {
      this.set(properties);
      this.createActor(client);
    }

    // send entity with delta updates until sent by full state update
    this.set({
      'isNew': true
    });

    this.queue = {};

    // interpolation queue
    this.queue.server = [];

    return this;
  };

  Entity.prototype.createActor = function(client) {
    var properties = this.state.private;
    // Actor undefined on server
    // Image is function in Chrome and Firefox, object in Safari
    if(Actor && properties.sprite && properties.img) {
      this.actor = new Actor(this, properties.img, properties.sprite, client);
    } else if(Graphic && properties.img) {
      this.actor = new Graphic(this, properties.img, client);
    }
  };

  Entity.prototype.needsImage = function() {
    return this.state.private.src ? true : false;
  };

  Entity.prototype.createImage = function(client) {
    var state = this.state.private;
    var image = new Image();
    var entity = this;

    // encapsulate to keep correct state and uuid in callback
    (function(state, uuid, client) {
      image.addEventListener('load', function() {
        state.img = this;
        entity.createActor(client);
      });
    })(state, state.uuid, client);
    image.src = state.src;


  }

  Entity.prototype.set = function(properties) {
    for(var property in properties) {
      this.state.private[property] = properties[property];
      this.state.public[property] = properties[property];
    }
  };

  // @param [Hash] properties The state of an object.
  Entity.prototype.setPublic = function(properties) {
    for(var property in properties) {
      this.state.public[property] = properties[property];
    }
    this.updatePositionAndVelocity();
  };

  Entity.prototype.updatePositionAndVelocity = function() {
    // Positions/velocity should only be exact to a small level of precision.
    this.state.public.x = core.toFixed(this.state.public.x);
    this.state.public.y = core.toFixed(this.state.public.y);

    if (this.state.public.velocity) {
      this.state.public.velocity.x = core.toFixed(this.state.public.velocity.x);
      this.state.public.velocity.y = core.toFixed(this.state.public.velocity.y);
    }
  };


  // Used to render objects on the canvas.
  // @param [String] type - i.e. Platform, Powerup, etc.
  Entity.prototype.shouldRenderAs = function(type) {
    return this.state.private.class === type;
  };

  // Serialize is used to send data to clients
  Entity.prototype.serialize = function() {
    var state = this.state.public;
    if(Object.keys(state).length) {
      state.t = state.class;  // Which type of class should be created during initialization (allows for subclasses)
      return state;
    }
  };

  // Get state is used for interpolation
  Entity.prototype.getState = function() {
    // only return state.private with keys
    // this.state.private initialized as {} in Entity
    if(Object.keys(this.state.public).length) {
      return {
        state: this.state.public,
        time: Date.now()
      }
    }
  };

  // Determines if this object can ever move during the game.
  // Subclasses can override to optimize message communication
  Entity.prototype.canEverMove = function() {
    return true;
  };

  Entity.prototype.class = function() {
    return this.state.private['class'];
  };

  Entity.prototype.getDelta = function(async, _) {

    // save reference to old values and update state
    // WARN: clone produces shallow copy
    var prev = this.state.private;
    var next = this.state.private = _.clone(this.state.public);

    // init delta array for changed keys
    var deltaKeys = [];

    // iterate over new values and compare to old
    var keys = Object.keys(next);
    var length = keys.length;
    var key;

    for(var i = 0; i < length; i++) {
      key = keys[i];

      // check for changed values and push key to delta array
      if(prev[key] !== next[key]) {
        // Do deep comparison for objects (like velocity)
        if(!(typeof(prev[key]) === 'object' && _.isEqual(prev[key], next[key]))) {
          deltaKeys.push(key);
        }
      }
    }

    // set changed values in data object
    if(deltaKeys.length) {
      var state = _.pick(next, deltaKeys);
      return state;
    }

  };

  Entity.prototype.interpolate = function() {
    // entity interpolation
    var dx = Math.abs(this.state.public.x - this.state.private.x);
    var dy = Math.abs(this.state.public.y - this.state.private.y);

    var difference = Math.max(dx, dy);

    // return if no server updates to process
    if(!this.queue.server.length || difference < 0.1) return;

    var x;
    var y;

    var count = this.queue.server.length - 1;

    var prev;
    var next;

    for(var i = 0; i < count; i++) {
      prev = this.queue.server[i];
      next = this.queue.server[i + 1];

      // if client offset time is between points, break
      if(time.client > prev.time && time.client < next.time) break;
    }

    if(prev) {
      // calculate client time percentage between points
      var timePoint = 0;
      var difference = prev.time - time.client;
      var spread = prev.time - time.server;
      timePoint = difference / spread;

      // interpolated position
      x = core.lerp(prev.state.x, this.state.public.x, timePoint);
      y = core.lerp(prev.state.y, this.state.public.y, timePoint);

      if(dx < 10) {
        // apply smoothing
        this.state.private.x = core.lerp(this.state.private.x, x, time.delta * core.smoothing);
      } else {
        // apply smooth snap
        this.state.private.x = core.lerp(prev.state.x, x, time.delta * core.smoothing);
      }

      if(dy < 10) {
        // apply smoothing
        this.state.private.y = core.lerp(this.state.private.y, y, time.delta * core.smoothing);
      } else {
        // apply smooth snap
        this.state.private.y = core.lerp(prev.state.y, y, time.delta * core.smoothing);
      }
    } else {
      this.state.private.x = this.state.public.x;
      this.state.private.y = this.state.public.y;
    }
  };

  Entity.prototype.draw = function(ctx, scale) {
    ctx.save();

    // round to whole pixel
    // interpolated x and y coords
    // dont round until AFTER scale
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    // apply transformations (scale and rotate from center)
    // snapped rotation and scale
    ctx.translate(x, y);
    ctx.rotate(this.state.public.rotation);
    ctx.scale(this.state.public.scale, this.state.public.scale);
    ctx.translate(-x, -y);

    // Call extended Entity Type's draw method
    this.drawType && this.drawType(ctx, scale);

    /*
     // draw small dot at Entity center
     ctx.fillStyle = 'cyan';
     ctx.beginPath();
     ctx.arc(x, y, 2, 0, Math.PI * 2, true);
     ctx.closePath();
     ctx.fill();
     */

    ctx.restore();
  };

  return Entity;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Rectangle',[
      '../core',
      '../time',
      './Entity'
    ], factory);
  }
})(this, function(core, time, Entity) {

	var Rectangle = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Rectangle';
    properties.type = properties.type || 'static';

    Entity.call(this, properties, id, client);

    return this;
	};

	Rectangle.prototype = new Entity();
  Rectangle.prototype.constructor = Rectangle;

  Rectangle.prototype.drawType = function(ctx, scale) {
    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'salmon';
    ctx.strokeRect(
      x - halfWidth,
      y - halfHeight,
      width,
      height
    );

    ctx.restore();

    // Entity.prototype.draw.call(this, client);
  }

  return Rectangle;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Background',[
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

	var Background = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Background';
    
    Rectangle.call(this, properties, id, client);

    return this;
	};

	Background.prototype = new Rectangle();
    Background.prototype.constructor = Background;

    // Determines if this object can ever move during the game.
    // Subclasses can override to optimize message communication
    Background.prototype.canEverMove = function() {
        return false;
    };

    Background.prototype.drawType = function(ctx, scale) {
        // Rectangle.prototype.drawType.call(this, ctx, scale);

        // round to whole pixel
        // interpolated x and y coords
        var x = (this.state.private.x * scale + 0.5) | 0;
        var y = (this.state.private.y * scale + 0.5) | 0;

        var width = ((this.state.private.width * scale) + 0.5) | 0;
        var height = ((this.state.private.height * scale) + 0.5) | 0;

        var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
        var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

        ctx.save();

        if (this.actor) {
          this.actor.draw(ctx, x - halfWidth, y - halfHeight, scale);
        }

        ctx.restore();
    }

    return Background;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Platform',[
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

	var Platform = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Platform';

    properties.sprite = properties.sprite || {
      src: 'images/level_sprite.png',
      width: properties.width,
      height: properties.width,
      x: 10,
      y: 10,
      scale: 4,
      map: {

        // default
        0: {
          start: 1,
          end: 1,
          repeat: false
        }

      }
    };
    
    Rectangle.call(this, properties, id, client);

    return this;
	};

	Platform.prototype = new Rectangle();
  Platform.prototype.constructor = Platform;

    // Determines whether this type of object can ever move after the game setup.
    // @override
    Platform.prototype.canEverMove = function() {
        return false;
    }

  Platform.prototype.drawType = function(ctx, scale) {
    // Rectangle.prototype.drawType.call(this, ctx, scale);

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    var xMin;
    var yMin;
    var offset;

    var light = this.state.private.color ? this.state.private.color.light : '#bcbdc0';
    var dark = this.state.private.color ? this.state.private.color.dark : '#a7a9ab';

    switch(this.state.private.perspective) {
      case 'left':
        xMin = x - halfWidth;
        yMin = y - halfHeight;
        offset = halfWidth;

        ctx.fillStyle = light;

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();

        xMin += halfWidth;

        ctx.fillStyle = dark;

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin);
        ctx.lineTo(xMin + halfWidth, yMin + height);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();

        break;

      case 'right':
        xMin = x - halfWidth;
        yMin = y - halfHeight;
        offset = halfWidth;

        ctx.fillStyle = dark;

        ctx.beginPath();
        ctx.moveTo(xMin, yMin);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height);
        ctx.closePath();
        ctx.fill();

        xMin += halfWidth;

        ctx.fillStyle = light;

        ctx.beginPath();
        ctx.moveTo(xMin, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin - offset);
        ctx.lineTo(xMin + halfWidth, yMin + height + offset);
        ctx.lineTo(xMin, yMin + height + offset);
        ctx.closePath();
        ctx.fill();
        break;

      default:
        xMin = x - halfWidth;
        yMin = y;
        offset = height;

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = halfHeight / 2;
        ctx.shadowBlur = height;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.moveTo(xMin - offset, yMin);
        ctx.lineTo(xMin + offset + width, yMin);
        ctx.lineTo(xMin + offset + width, yMin + halfHeight);
        ctx.lineTo(xMin - offset, yMin + halfHeight);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'none';

        ctx.fillStyle = light;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.moveTo(xMin - offset - halfHeight, yMin);
        ctx.lineTo(xMin + offset + width + halfHeight, yMin);
        ctx.lineTo(xMin + offset + width + halfHeight, yMin + halfHeight);
        ctx.lineTo(xMin - offset - halfHeight, yMin + halfHeight);
        ctx.closePath();
        ctx.fill();

        yMin -= halfHeight;

        ctx.fillStyle = dark;

        ctx.beginPath();
        ctx.moveTo(xMin - offset, yMin);
        ctx.lineTo(xMin + offset + width, yMin);
        ctx.lineTo(xMin + offset + width + halfHeight, yMin + halfHeight);
        ctx.lineTo(xMin - offset - halfHeight, yMin + halfHeight);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  return Platform;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Powerup',[
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

  var Powerup = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Powerup';
    properties.type = properties.type || 'static';

    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2;
    properties.height = properties.height || 1.2;
    properties.fixed = properties.fixed || true;
    properties.isSensor = properties.isSensor || true;

    Rectangle.call(this, properties, id, client);

    return this;
  };

  Powerup.prototype = new Rectangle();
  Powerup.prototype.constructor = Powerup;


  Powerup.prototype.drawType = function(ctx, scale) {
    // Rectangle.prototype.drawType.call(this, ctx, scale);

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x, y + halfHeight * 0.6, scale);
    }

    ctx.restore();
  };

  return Powerup;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Rectangle')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Projectile',[
      '../core',
      '../time',
      './Rectangle'
    ], factory);
  }
})(this, function(core, time, Rectangle) {

	var Projectile = function(properties, id, client) {
    properties = properties || {};
    properties.class = properties.class || 'Projectile';
    properties.type = properties.type || 'dynamic';
    
    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2;
    properties.height = properties.height || 1.2;
    properties.fixed = properties.fixed || false;
    properties.isSensor = properties.isSensor || true;
    properties.speed = properties.speed || 30;
    properties.src = properties.src || 'images/beer.png';

    properties.sprite = properties.sprite || {
      src: properties.src,
      direction: properties.direction,
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
    };

    Rectangle.call(this, properties, id, client);

    return this;
	};

	Projectile.prototype = new Rectangle();
  Projectile.prototype.constructor = Projectile;

  Projectile.prototype.drawType = function(ctx, scale) {
    // Rectangle.prototype.drawType.call(this, ctx, scale);

    // round to whole pixel
    // interpolated x and y coords
    var x = (this.state.private.x * scale + 0.5) | 0;
    var y = (this.state.private.y * scale + 0.5) | 0;

    var width = ((this.state.private.width * scale) + 0.5) | 0;
    var height = ((this.state.private.height * scale) + 0.5) | 0;

    var halfWidth = ((this.state.private.width * scale / 2) + 0.5) | 0;
    var halfHeight = ((this.state.private.height * scale / 2) + 0.5) | 0;

    ctx.save();

    if (this.actor) {
      this.actor.draw(ctx, x, y + halfHeight * 0.6, scale);
    }

    ctx.restore();
  }

  return Projectile;

});

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require('../core'),
      require('../time'),
      require('./Entity'),
      require('./Rectangle'),
      require('./Projectile'),
      require('underscore'),
      require('../../server/entities')
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types/Player',[
      '../core',
      '../time',
      './Entity',
      './Rectangle',
      './Projectile',
      'underscore'
    ], factory);
  }
})(this, function(core, time, Entity, Rectangle, Projectile, _, entities) {

  var Player = function(properties, id, client) {
    properties = properties || {};

    properties.name = properties.name || this.defaultNameFor(properties.src);
    if (properties.name.length > 10) {
      properties.name = properties.name.substring(0, 10);
    }
    properties.class = properties.class || 'Player';
    properties.type = properties.type || 'dynamic';

    properties.angle = properties.angle || 0;
    properties.width = properties.width || 2.5;
    properties.height = properties.height || 3;
    properties.fixed = properties.fixed || true;
    properties.speed = properties.speed || 230;
    properties.gravity = properties.gravity || 50;

    properties.sprite = properties.sprite || {
      direction: 'right',
      width: 4,
      height: 4,
      x: 9,
      y: 5,
      step: 8,
      scale: 5,
      map: {

        // default
        0: {
          start: 0,
          end: 0,
          repeat: false
        },

        // move
        1: {
          start: 1,
          end: 3,
          repeat: true
        },

        // jump
        2: {
          start: 4,
          end: 5,
          repeat: false
        },

        // throw
        3: {
          start: 6,
          end: 7,
          repeat: false
        },

        // hit
        4: {
          start: 8,
          end: 8,
          repeat: false
        }

      }
    };

    // beer counter
    properties.beer = 0;

    // drunk meter
    properties.intoxication = 5;

    Rectangle.call(this, properties, id, client);

    // input sequence id
    this.seq = 0;

    // input queue
    this.queue.input = [];

    // current input state
    this.input = {};

    // end game when timer expires
    var start = Date.now();
    var stop = start + 120000; // two minutes

    this.timer = {
      start: start,
      stop: stop,
      now: Date.now() - start,
      update: function() {
        // TODO: refactor to update timer.now from server
        this.now = Date.now() - this.start;

        return this.now * 100 / (this.stop - this.start);
      }
    };

    return this;
  };

  Player.prototype = new Rectangle();
  Player.prototype.constructor = Player;

  Player.prototype.drink = function() {
    // handle beer powerup
    this.state.public.beer++;
    this.state.public.intoxication += 5;
    // console.log('Beer', this.state.public['beer'], 'Drunk', this.state.public['intoxication']);
  };

  Player.prototype.defaultNameFor = function(imageName) {
    if (imageName === 'images/char1.png') {
      return 'Mike';
    } else if (imageName === 'images/char2.png') {
      return "Jeff";
    } else if (imageName === 'images/char3.png') {
      return "Tanya";
    } else if (imageName === 'images/char4.png') {
      return "KSnug";
    } else if (imageName === 'images/char5.png') {
      return "Floyd";
    }
  };

  // Override Entity.setPublic to convert from serialized attributes to better named ones.
  Player.prototype.setPublic = function(properties) {
    properties = _.defaults(properties, {
      velocity: properties.v
    });

    if (properties.ix && !properties.intoxication) {
      properties.intoxication = properties.ix;
    }
    if (properties.h && !properties.isHit) {
      properties.isHit = properties.h;
    }
    if (properties.j && !properties.isJumping) {
      properties.isJumping = properties.j;
    }
    if (properties.mv && !properties.isMoving) {
      properties.isMoving = properties.mv;
    }
    if (properties.d && !properties.direction) {
      properties.direction = properties.d;
    }
    Entity.prototype.setPublic.call(this, properties);
  };

  Player.prototype.serialize = function() {
    return this.optimizeSerializedAttributes(this.state.public);
  };

  Player.prototype.optimizeSerializedAttributes = function(currentState) {
    var state = _.omit(currentState, "class", "type", "angle", "width", "height", "sprite", "fixed", "speed", "velocity", "intoxication", "isHit", "isJumping", "isMoving", "direction");
    state.v = currentState.velocity;
    state.t = 'Player';
    state.ix = currentState.intoxication ? currentState.intoxication : undefined;
    state.h = !_.isUndefined(currentState.isHit) ? currentState.isHit : undefined;
    state.j = !_.isUndefined(currentState.isJumping) ? currentState.isJumping : undefined;
    state.mv = !_.isUndefined(currentState.isMoving) ? currentState.isMoving : undefined;
    state.d = !_.isUndefined(currentState.direction) ? currentState.direction : undefined;
    return state;
  };

  Player.prototype.fire = function(worker) {

    // don't fire if no empty beer cans to throw
    if (!this.state.public.beer) return;

    // consume beer
    this.state.public.beer--;

    // play throwing animation
    this.setPublic({
      'isThrowing': true
    });

    // reset hitTimeout
    if(this.throwTimeout) {
      clearTimeout(this.throwTimeout);
    }

    // revert to default state
    this.throwTimeout = setTimeout((function() {
      this.setPublic({
        'isThrowing': false
      });
    }).bind(this), 600);

    if (worker) {
      var x = this.state.public.x;
      var y = this.state.public.y;

      var entity = new Projectile({
        x: x,
        y: y,
        direction: this.state.public.direction
      });

      entities.global[entity.uuid] = entity;
      entities.local.push(entity.uuid);

      var data = {
        class: entity.state.private.class,
        type: entity.state.private.type,
        x: entity.state.private.x,
        y: entity.state.private.y,
        angle: entity.state.private.angle,
        width: entity.state.private.width,
        height: entity.state.private.height,
        direction: entity.state.private.direction,
        speed: entity.state.private.speed,
        src: entity.state.private.src,
        isSensor: entity.state.private.isSensor
      };

      worker.send({
        'cmd': 'fire',
        'uuid': entity.uuid,
        'entity': data,
        'owner': this.uuid
      });
    }

  };

  Player.prototype.hit = function() {
    this.setPublic({
      'isHit': true,
      'intoxication': Math.max(this.state.public.intoxication - 5, 5)
    });

    // reset hitTimeout
    if(this.hitTimeout) {
      clearTimeout(this.hitTimeout);
    }

    // revert to default state
    this.hitTimeout = setTimeout((function() {
      this.setPublic({
        'isHit': false
      });
    }).bind(this), 500);
  };

  Player.prototype.sendImpulse = function(worker, degrees) {
    worker.send({
      'cmd': 'impulse',
      'uuid': this.uuid,
      'degrees': degrees,
      'power': this.state.private.speed
    });
  };

  // TODO: refactor respondToInput and processInput core into a shared function
  // TODO: pass in Web Worker to process input
  Player.prototype.respondToInput = function(pressed, callback) {

    if (this.gameover) return;

    // prevent movement if blacked out
    if (this.state.public['isBlackout']) {
      /*
       // stop player movement
       worker.send({
       'cmd': 'setZero',
       'uuid': this.uuid
       });
       */

      this.gameover = true;

      return;
    }

    var fireButtonChanged = false;
    var input;

    var delta = [];
    // console.log(move, worker.pid, worker.connected);

    for (var key in pressed) {
      if (pressed[key] !== this.input[key]) {
        delta.push(key);

        // update current input state
        this.input[key] = pressed[key];
      }
    }

    // calculate delta time vector
    var vector = core.getVelocity(pressed);

    var length = delta.length;
    var deltaKey;

    for (var i = 0; i < length; i++) {
      deltaKey = delta[i];

      // TODO: disable movement on isBlackout
      switch(deltaKey) {

        case 'up':
          if (pressed['up'] && !this.state.public.isJumping) {
            this.state.public.isJumping = true;
            // sendImpulse(worker, vector['vy']);
          }
          break;

        case 'left':
        case 'right':
          if (pressed['left'] !== pressed['right']) {
            this.state.public.isMoving = true;
            this.state.public.direction = pressed['left'] ? 'left' : 'right';

            // sendImpulse(worker, vector['vx']);
          } else {
            this.state.public.isMoving = false;

            /*
             worker.send({
             'cmd': 'setZero',
             'uuid': this.uuid
             });
             */
          }
          break;

        case 'spacebar':
          if (pressed['spacebar']) {
            this.fire();
          } else {
            this.fireButtonReleased = true;
          }
          break;

      }
    }

    // sendImpulse if key pressed but no velocity (from wall collision)
    /*
     if (!pressed['left'] !== !pressed['right'] && this.state.public.velocity.x === 0) {
     // this.sendImpulse(worker, vector['vx']);
     }
     */

    if (delta.length) {
      input = {
        seq: this.seq++,
        input: pressed
      };

      // add input to queue, then send to server
      this.queue.input.push(input);

      if (typeof callback === 'function') callback(input);
    }

  };

  Player.prototype.processInput = function(move, worker) {

    process.nextTick((function() {
      if (this.end) return;

      // prevent movement if blacked out
      if (this.state.public['isBlackout']) {
        // stop player movement
        worker.send({
          'cmd': 'setZero',
          'uuid': this.uuid
        });

        this.end = true;

        return;
      }

      var pressed = move.input;

      var delta = [];
      // console.log(move, worker.pid, worker.connected);

      for (var key in pressed) {
        if (pressed[key] !== this.input[key]) {
          delta.push(key);

          // update current input state
          this.input[key] = pressed[key];
        }
      }

      // calculate delta time vector
      var vector = core.getVelocity(pressed);

      var length = delta.length;
      var deltaKey;

      for (var i = 0; i < length; i++) {
        deltaKey = delta[i];

        switch(deltaKey) {

          case 'up':
            if (pressed['up'] && !this.state.public.isJumping) {
              this.state.public.isJumping = true;
              this.sendImpulse(worker, vector['vy']);
            }
            break;

          case 'left':
          case 'right':
            // negate values to make undefined equal false
            if (!pressed['left'] === !pressed['right']) {
              this.state.public.isMoving = false;

              worker.send({
                'cmd': 'setZero',
                'uuid': this.uuid
              });
            } else {
              this.state.public.isMoving = true;
              this.state.public.direction = pressed['left'] ? 'left' : 'right';

              this.sendImpulse(worker, vector['vx']);
            }
            break;

          case 'spacebar':
            if (pressed['spacebar']) {
              // TODO: play throw animation
              this.fire(worker);
            } else {
              this.fireButtonReleased = true;
            }
            break;

        }
      }

      // sendImpulse if key pressed but no velocity (from wall collision)
      /*
       if (!pressed['left'] !== !pressed['right'] && this.state.public.velocity.x === 0) {
       this.sendImpulse(worker, vector['vx']);
       }
       */

      // if queue empty, stop looping
      if (!this.queue.input.length) return;

      this.processInput(this.queue.input.shift(), worker);
    }).bind(this));

  };

  Player.prototype.reconcile = function(client, player) {

    var x;
    var y;

    // server reconciliation
    var dx = 0;
    var dy = 0;

    // bind this inside filter to Ship
    // remove most recent processed move and all older moves from queue
    var queue = this.queue.input = this.queue.input.filter((function(el, index, array) {
      return el.seq > this.ack;
    }).bind(this));

    // update reconciled position with client prediction
    // server position plus delta of unprocessed input
    for (var i = 0; i < queue.length; i++) {
      dx += parseInt(queue[i].data.speed * queue[i].data.vector.dx * time.delta);
      dy += parseInt(queue[i].data.speed * queue[i].data.vector.dy * time.delta);
    }

    // reconciled prediction
    x = parseInt(player.ship.state.x) + dx;
    y = parseInt(player.ship.state.y) + dy;

    // set reconciled position
    this.state.private.x = core.lerp(this.state.private.x, x, time.delta * core.smoothing);
    this.state.private.y = core.lerp(this.state.private.y, y, time.delta * core.smoothing);

  };

  Player.prototype.drawType = function(ctx, scale) {
//    Rectangle.prototype.drawType.call(this, ctx, scale);
    var x = this.x(scale);
    var y = this.y(scale);
    ctx.save();
    if (this.actor) {
      this.actor.draw(ctx, x, y, scale);
    }
    ctx.restore();
    this.drawName(ctx, scale, this.state.public.name);

    // Entity.prototype.draw.call(this, client);
  };

  Player.prototype.drawName = function(ctx, scale, name) {
    var x = this.x(scale);
    var y = this.y(scale);

    var halfHeight = this.halfHeight(scale);

    ctx.save();
    var fontHeight = Math.max(14, parseInt(scale));
    ctx.font = fontHeight + 'px Monstrrr-Serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = 'black';
    ctx.fillText(name, x, y - halfHeight - fontHeight / 2);
    ctx.restore();
  };

  Player.prototype.halfHeight = function(scale) {
    return ((this.state.private.height * scale / 2) + 0.5) | 0;
  };
  Player.prototype.halfWidth = function(scale) {
    return ((this.state.private.width * scale / 2) + 0.5) | 0;
  };
  Player.prototype.height = function(scale) {
    return ((this.state.private.height * scale) + 0.5) | 0;
  };
  Player.prototype.width = function(scale) {
    return ((this.state.private.height * scale) + 0.5) | 0;
  };

  // This should probably live on Entity.
  Player.prototype.x = function(scale) {
    return (this.state.private.x * scale + 0.5) | 0;
  };

  // This should probably live on Entity.
  Player.prototype.y = function(scale) {
    return (this.state.private.y * scale + 0.5) | 0;
  };

  // Returns a string value which represents the level of intoxication for this character.
  // @return [String] i.e. ['sober', 'tipsy', 'buzzed', 'schwasted', 'blackout']
  Player.prototype.intoxicationLevel = function(display_name) {
    var intox = this.state.public.intoxication;
    if (intox < 25) {
      return display_name ? "was stone cold sober" : "sober";
    }
    if (intox >= 25 && intox < 50) {
      return display_name ? "got slightly tipsy" : "tipsy";
    }
    if (intox >= 50 && intox < 75) {
      return display_name ? "got righteously buzzed" : "buzzed";
    }
    if (intox >= 75 && intox < 100) {
      return display_name ? "got sooper dooper schwasted" : "schwasted";
    }
    return display_name ? "mutha-f-ing blacked out" : "blackout"
  };

  return Player;

});

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
    define('../core/types/Beer',[
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

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    module.exports = factory(
      require
    );
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('../core/types',[
      'require',
      './types/Entity',
      './types/Rectangle',
      './types/Background',
      './types/Graphic',
      './types/Platform',
      './types/Powerup',
      './types/Projectile',
      './types/Player',
      './types/Beer',
      './types/Actor'
    ], factory);
  }
})(this, function(require) {

  // avoid types[class] within types to prevent circular dependencies

  return {
    Entity: require('./types/Entity'),
    Rectangle: require('./types/Rectangle'),
    Background: require('./types/Background'),
    Graphic: require('./types/Graphic'),
    Platform: require('./types/Platform'),
    Powerup: require('./types/Powerup'),
    Projectile: require('./types/Projectile'),
    Player: require('./types/Player'),
    Beer: require('./types/Beer'),
    Actor: require('./types/Actor')
  };

});

// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:11,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};

define("stats", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Stats;
    };
}(this)));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('client',[
      '../core/core',
      '../core/time',
      '../core/types',
      './input',
      './ui',
      'stats'
    ], factory);
  }
})(this, function(core, time, types, input, ui) {

  // init stats
  var stats = new Stats();
  document.body.appendChild(stats.domElement);

  var actions = [];
  var entities = {};

  var init = function(client) {

    // init physics worker
    var worker = new Worker('js/game/core/worker.js');

    // update predicted state from worker
    worker.onmessage = function(event) {
      debugger;
      var data = event.data;

      for (var id in data) {
        var entity = entities[id];

        if (entity) {
          entity.update(data[id]);
        }
      }
    };

    var clock = ui.init(client).clock;

    // set methods to run every frame
    this.actions = [
      this.clearCanvas,
      this.updateEntities,
      this.drawEntities,
      this.updateCamera
    ];

    // UI event listeners
    var listener = function(event) {
      var data = event.detail;
      var player = client.entities[client.uuid];

      if (player) {
        // ignore if gameover
        if (player.gameover || client.konami) return;

        // update isBlackout
        var intoxication = Math.min(data.intoxication, 100);
        if (intoxication >= 100) {
          player.setPublic({ 'isBlackout': true });

          // show end game screen
          ui.gameover(client, player);
        } 

        // update beer gauge level
        var level = (intoxication * 5) - 500;
        document.getElementById('beer').style.bottom = level + 'px';
        ui.updateFace(player);

        // update the Ammo Count
        ui.updateAmmo(player);

        // update timer
        var percent = player.timer.update();
        clock.animate(percent);

        // end game on timer expire
        // TODO: make this update from server side
        if (player.timer.now > player.timer.stop - player.timer.start) {
          player.gameover = true;

          // show end game screen
          ui.gameover(client, player);
        }

        // TODO: update ammo
      }
    }

    document.addEventListener('hud', listener);

    document.addEventListener('konami', function(event) {
      client.konami = true;
    });

    // init UI event emitter
    // TODO: emit events on state change rather than interval?
    setInterval(function() {
      updateUI(client);
    }, 1000);

    // socket.io client connection
    var socket = this.socket = io.connect();

    socket.on('game:load', function(data) {
      var character_id = getParameter('as');
      var charName = getParameter('name');

      socket.emit('player:select', { 'character-id' : character_id, name: charName });
    });

    // wait in queue
    socket.on('queue:enter', function(data) {
      ui.queue.enter(data);

      socket.on('queue:update', function(data) {
        ui.queue.update(data);
      });

      socket.on('queue:exit', function() {
        ui.queue.exit();
      });
    });

    // set client.uuid
    socket.on('uuid', function(data) {
      client.uuid = data;
    });

    // listen for full state updates
    socket.on('state:full', function(data) {

      // update server time (used for entity interpolation)
      time.server = data.time;
      time.client = time.server - core.offset;

      var uuid;

      var entities = _.union(Object.keys(client.entities), Object.keys(data.entities));
      var entity;

      var state;

      var msg = {};

      // iterate over union of client and server players
      for (var i = 0; i < entities.length; i++) {
        uuid = entities[i]
        entity = data.entities[uuid];

        if (entity && client.entities[uuid]) {
          // if defined on server and client, update state
          state = entity;
          client.entities[uuid].setPublic(state);
          client.entities[uuid].queue.server.push(client.entities[uuid].getState());
        } else if (entity) {
          // if defined on server but not on client, create new Entity on client
          state = entity;
          client.entities[uuid] = new types[state.t](state, uuid, client);
          if(client.entities[uuid].needsImage()){
            client.entities[uuid].createImage(client);
          }
          msg[uuid] = state;
        } else {
          if(client.entities[uuid].canEverMove()){
            delete client.entities[uuid];
          }
        }
      }

      if (Object.keys(msg).length) {
        // add entity to prediction worker
        worker.postMessage({
          'cmd': 'add',
          'msg': msg
        });
      }
    });

    // listen for delta updates
    socket.on('state:delta', function(data) {

      // update server time (used for entity interpolation)
      time.server = data.time;
      time.client = time.server - core.offset;

      // update entities
      var entities = Object.keys(data.entities); // This is a list of uuids of the entities
      var length = entities.length;

      var uuid;
      var entity;
      var state;

      // update server state, interpolate foreign entities
      for (var i = 0; i < length; i++) {
        uuid = entities[i];
        entity = data.entities[uuid];

        if (entity && client.entities[uuid]) {
          // authoritatively set internal state if player exists on client
          client.entities[uuid].setPublic(entity);

          // get full snapshot for interpolation
          // queue server updates for entity interpolation
          client.entities[uuid].queue.server.push(client.entities[uuid].getState());

          // remove all updates older than one second from interpolation queue
          client.entities[uuid].queue.server = client.entities[uuid].queue.server.filter(core.filterQueue);
        } else if (entity) {
          // new Entities should send full state in first delta update
          // if defined on server but not on client, create new Entity on client
          state = entity;

          if (state.t && types[state.t]) {
            client.entities[uuid] = new types[state.t](state, uuid, client);
            if (client.entities[uuid].needsImage()) {
              client.entities[uuid].createImage(client);
            }
            // msg[uuid] = state;
          }

        }
      }

    });
  };

  // Read the URL and find a parameter by name.
  // @param [String] name The name of the parameter (i.e. ?name=value) from the URL.
  var getParameter = function(name){
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if(results == null)
      return "";
    else
      return decodeURIComponent(results[1].replace(/\+/g, " "));
  };

  var frame = function() {
    loop(this);

    // TODO: why does this occaisionally spike from 0.016 to 0.4?
    // doesn't seem to coincide with garbage collection steps
    // could possibly be some long blocking operation?
    /*
    if (time.delta > 0.2) {
      console.log(time.delta);
    }
    */
  };

  var loop = function(client) {
    var client = client || this;

    // this bind necessary because of scope change on successive calls
    client.animationFrame = window.requestAnimationFrame(frame.bind(client));

    time.setDelta();
    runFrameActions(client);
    stats.update();
  };

  var pause = function() {
    window.cancelAnimationFrame(this.animationFrame);
    this.areRunning = false;
  };

  var play = function() {
    if(!this.areRunning) {
      this.then = Date.now();

      // init animation loop, variable time step
      this.loop();

      this.areRunning = true;
    }
  };

  var runFrameActions = function(client) {
    for (var i = 0; i < client.actions.length; i++) {
      client.actions[i](client);
    }
  };

  var clearCanvas = function(client) {
    client.ctx.clearRect(0, 0, client.canvas.width, client.canvas.height);
  };

  var cameraHeight = function(){
     var footer_height = 64;
     var camara_height = window.innerHeight - footer_height;
     return camara_height;
  };

  var createCanvas = function() {
    var canvas = this.canvas = document.createElement('canvas');
    this.ctx = canvas.ctx = canvas.getContext('2d');
    this.setScale(canvas, window.innerWidth);

    var camera = this.camera = document.createElement('canvas');
    camera.ctx = camera.getContext('2d');
    this.setScale(camera, window.innerWidth, this.cameraHeight());

    // throttle to only change after resizing complete
    var resizeTimer;

    // resize canvas on window resize
    window.addEventListener('resize', (function(event) {
      var resize = (function() {
        clearTimeout(resizeTimer);

        var width = window.innerWidth;
        var height = this.cameraHeight();

        this.setScale(this.canvas, width);
        this.setScale(this.camera, width, height);

        this.updateCamera(this);
      }).bind(this);

      resizeTimer = setTimeout(resize, 100);
    }).bind(this));

    document.getElementById('main').appendChild(camera);
  };

  // Canvas should fit within the HUD UI
  var setScale = function(canvas, width, height) {
    // in Box2D meters
    var left_hud_width = 120;
    var right_hud_width = 120;
    var proposed_width = width - left_hud_width - right_hud_width
    canvas.scale = proposed_width / 48;
    canvas.width = proposed_width;
    canvas.height = height || 62 * canvas.scale;
  };

  var updateEntities = function(client) {
    var draw = {};

    var entities = Object.keys(client.entities);
    var length = entities.length;
    var uuid;
    var entity;

    for (var i = 0; i < length; i++) {
      uuid = entities[i];
      entity = client.entities[uuid];

      // TODO: switch to array of player-originated entities
      interpolate = (uuid !== client.uuid);

      if (interpolate) {

        // interpolate position of other entities
        entity.interpolate();

      } else {

        // TODO: switch this to reconcile
        entity.interpolate();

        // client prediction only for active player
        entity.respondToInput(input.pressed, function(input) {
          client.socket.emit('command:send', input);
        });

      }

    }
  };

  var drawEntities = function(client) {
    // only layers defined here will be drawn!
    var order = [
      'Background',
      'Platform',
      'Powerup',
      'Projectile',
      'Player'
    ];

    var orderLength = order.length;

    var entities = Object.keys(client.entities);
    var length = entities.length;

    var uuid;
    var entity;

    for (var i = 0; i < orderLength; i++) {
      for (var j = 0; j < length; j++) {
        uuid = entities[j];
        entity = client.entities[uuid];

        if (!entity.state.public.isDead && entity.shouldRenderAs(order[i])) {
          entity.draw(client.ctx, client.canvas.scale);
        }
      }
    }
  };

  var updateCamera = function(client) {
    // follow player with camera
    // TODO: parallax background, interpolated camera movement
    var ctx = client.camera.ctx;
    var canvas = client.canvas;

    var player = client.entities[client.uuid];
    var value;

    if (player) {
      value = Math.min(player.state.private.y * canvas.scale, canvas.height - (cameraHeight() / 2));
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.drawImage(canvas, 0, (cameraHeight() / 2) - value);
    }
  };

  var currentPlayer = function(){
      var player = this.entities[this.uuid];
      if (player) {
          return player;
      }
  };

  var updateUI = function(client) {
    // emit intoxication level event
    var player = client.entities[client.uuid];

    if (player) {
      var state = player.state.public;
      var hud = new CustomEvent('hud', {
        detail: {
          intoxication: state['intoxication']
        }
      });

      document.dispatchEvent(hud);
    }
  };

  var disconnect = function(){
    console.log("Game over! Thanks for playing.");
    this.socket.disconnect();
  }

  return {
    actions: actions,
    entities: entities,
    getParameter: getParameter,
    init: init,
    loop: loop,
    pause: pause,
    play: play,
    runFrameActions: runFrameActions,
    clearCanvas: clearCanvas,
    createCanvas: createCanvas,
    setScale: setScale,
    updateEntities: updateEntities,
    drawEntities: drawEntities,
    updateCamera: updateCamera,
    cameraHeight: cameraHeight,
    currentPlayer: currentPlayer,
    disconnect: disconnect
  };

});

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('init',[
      '../core/core',
      './input',
      './ui',
      './client',
      'underscore'
    ], factory);
  }
})(this, function(core, input, ui, client, _) {

  // game.debug = true;
  core.initGlobalVariables();
  input.init();
  client.createCanvas();
  client.init(client);
  client.play();

});
