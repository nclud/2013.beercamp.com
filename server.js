var config = require('./config');

// use cluster for physics calculations
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  var worker;

  // cluster config
  cluster.setupMaster({
    exec : "./worker.js"
  });

  cluster.on('online', function(worker, address) {
    console.log('worker ' + worker.process.pid + ' online');
  });

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });

  console.log('CPUs:', numCPUs);
  if (numCPUs > 1) {
    worker = cluster.fork();
  }

  // server config
  var app = require('http').createServer(handler);
  app.listen(config.port);
  console.log('Server started, listening on port ' + config.port);

  // http config
  var static = require('node-static');
  var file = new (static.Server)('./public');

  // require server game modules, init using dependency injection if required
  var channel = require('./game/server/redis').init();
  var socket = require('./game/server/socket').init(app, channel, worker);

  // init expire loop
  var levels = require('./game/server/levels.js').init(worker).load(worker);
  var expire = require('./game/server/expire.js').init(channel.store);

  // require server loops
  var input = require('./game/server/input').init(worker);
  var update = require('./game/server/update').init(socket);

  function handler (req, res) {
    req.addListener('end', function () {
      file.serve(req, res);
    });
  }
}
