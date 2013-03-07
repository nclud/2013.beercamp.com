var eyes = require('eyes'),
    haibu = require('haibu');

// Create a new client for communicating with the haibu server
var client = new haibu.drone.Client({
  host: process.env.HOST || '127.0.0.1',
  port: 9002
});

// A basic package.json for a node.js application on Haibu
var app = {
  "user": "mikemorris",
  "name": "beercamp",
  "repository": {
    "type": "local",
    "directory": "/Users/mikemorris/Dropbox/Projects/beercamp"
  },
  "scripts": {
    "start": "server.js"
  },
  "engine": {
    "node": "0.8.x"
  },
  "dependencies": {
    "socket.io": "0.9.x",
    "node-static": "0.6.x",
    "underscore": "1.4.x",
    "async": "0.1.x",
    "redis": "0.8.x",
    "idgen": "1.2.0",
    "box2dweb-commonjs": "2.1.x"
  },
  "analyze": true
};

// Attempt to start up a new application
client.start(app, function (err, result) {
  if (err) {
    console.log('Error spawning app: ' + app.name);
    return eyes.inspect(err);
  }
  
  console.log('Successfully spawned app:');
  eyes.inspect(result);
});
