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
     "type": "git",
     "url": "https://github.com/mikemorris/beercamp.git"
   },
   "scripts": {
     "start": "server.js"
   },
   "engine": {
     "node": "0.8.x"
   }
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
