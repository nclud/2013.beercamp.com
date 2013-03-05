var config = require('./config');

// use child_process for physics calculations
var child = require('child_process');
var numCPUs = require('os').cpus().length;

// child_process config
console.log('CPUs:', numCPUs);

// polyfill for nodejitsu compatibility
child.fork = function(file) {
  return this.spawn(process.execPath, [file], {
    stdio: ['pipe', 1, 2, 'ipc'],
    env: process.env
  });
}

var worker = child.fork(__dirname + '/worker.js');

console.log('Worker', worker.pid, worker.connected);
// console.log('worker.send', worker.send);

worker.on('exit', function(worker, code, signal) {
  console.log('Worker ' + worker.process.pid + ' died');
});

// server config
var app = require('http').createServer(handler);
app.listen(config.port);
console.log('Server started, listening on port ' + config.port);

// http config
var static = require('node-static');
var file = new (static.Server)('./public');

// require server game modules, init using dependency injection if required
// var channel = require('./game/server/redis').init();
var socket = require('./game/server/socket').init(app, worker); //, channel);

// init expire loop
var levels = require('./game/server/levels.js').init(worker).load(worker);
// var expire = require('./game/server/expire.js').init(channel.store);

// require server loops
var input = require('./game/server/input').init(worker);
var update = require('./game/server/update').init(socket);

function handler (req, res) {
  req.addListener('end', function () {
    file.serve(req, res);
  });
}
