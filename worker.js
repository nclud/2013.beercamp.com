/*
  Copyright 2011 Seth Ladd

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

console.log('Worker', process.pid, 'fired up! Status:', process.connected);
// console.log('process.send', process.send);

var Box2D = require('box2dweb-commonjs').Box2D;

var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

function bTest(intervalRate, adaptive) {
  this.intervalRate = parseInt(intervalRate);
  this.adaptive = adaptive;

  this.lastTimestamp = Date.now();

  this.world = new b2World(
    new b2Vec2(0, 50), //gravity
    true //allow sleep
  );

  this.bodies = {};
  this.deadBodies = [];

  this.fixDef = new b2FixtureDef;
  this.fixDef.density = 0.25;
  this.fixDef.friction = 0;
  this.fixDef.restitution = 0;

  this.bodyDef = new b2BodyDef;
}

bTest.prototype.update = function() {
  // console.log('update', Date.now());

  var now = Date.now();
  var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : this.intervalRate / 1000;
  this.lastTimestamp = now;

  this.world.Step(
    stepRate, // fixed time step
    8, // velocity iterations
    3 // position iterations
  );

  // iterate over bodies to destroy
  var body;
  var uuid;
  var length = this.deadBodies.length;

  for (var i = 0; i < length; i++) {
    uuid = this.deadBodies[i];
    body = this.bodies[uuid];
    this.world.DestroyBody(body);
  }

  // clear destroyed bodies from array
  this.deadBodies = [];

  // wraparound world
  for (var b = this.world.GetBodyList(); b; b = b.GetNext()) {
    if (b.GetFixtureList()) {
      var aabb = b.GetFixtureList().GetAABB();
      var width = aabb.lowerBound.x - aabb.upperBound.x;
      var height = aabb.lowerBound.y - aabb.upperBound.y;

      if (b.GetType() === b2Body.b2_dynamicBody) {
        if (aabb.lowerBound.x > 48) {
          b.SetPosition(new b2Vec2(0 + (width / 3), b.GetPosition().y));
        }

        if (aabb.upperBound.x < 0) {
          b.SetPosition(new b2Vec2(48 - (width / 3), b.GetPosition().y));
        }
      }

    }
  }

  this.world.ClearForces();
  this.sendUpdate();
}

// TODO: delta updates from worker to master
bTest.prototype.sendUpdate = function() {
  // console.log('sendUpdate', Date.now());

  var world = {};
  for (var b = this.world.GetBodyList(); b; b = b.m_next) {
    if (typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
      world[b.GetUserData()] = {x: b.GetPosition().x, y: b.GetPosition().y, angle: b.GetAngle()};
    }
  }

  // postMessage(world);
  process.send(world);
  // console.log(world);
}

bTest.prototype.setBodies = function(bodyEntities) {
  for(var uuid in bodyEntities) {
    var entity = bodyEntities[uuid];

    switch(entity.type) {
      case 'dynamic':
        this.bodyDef.type = b2Body.b2_dynamicBody;
        break;
      case 'static':
        this.bodyDef.type =  b2Body.b2_staticBody;
        break;
    }

    if (entity.radius) {
      this.fixDef.shape = new b2CircleShape(entity.radius);
    } else {
      this.fixDef.shape = new b2PolygonShape;
      this.fixDef.shape.SetAsBox(entity.width / 2, entity.height / 2);
    }

    this.bodyDef.position.x = entity.x;
    this.bodyDef.position.y = entity.y;

    this.bodyDef.fixedRotation = entity.fixed;

    this.bodyDef.userData = uuid;

    var body = this.bodies[uuid] = this.world.CreateBody(this.bodyDef);
    body.CreateFixture(this.fixDef);
  }
  // this.ready = true;
}

bTest.prototype.removeBody = function(uuid) {
  // add to queue to clean up after time step completes
  this.deadBodies.push(uuid);
}

bTest.prototype.impulse = function(uuid, degrees, power) {
  var body = this.bodies[uuid];

  // translate degrees to radians
  body.ApplyImpulse(
    new b2Vec2(
      Math.cos(degrees * (Math.PI / 180)) * power,
      Math.sin(degrees * (Math.PI / 180)) * power
    ),
    body.GetWorldCenter()
  );
}

bTest.prototype.setZero = function(uuid) {
  this.bodies[uuid].GetLinearVelocity().SetZero();
}
 
var box = new bTest(15, false);

var loop = function() {
  // console.log('Worker loop', Date.now(), 'Status:', process.connected);
  box.update();
}

setInterval(loop, 15);

// self.addEventListener('message', function(event) {});
process.on('message', function(data) {
  // console.log('child', data);

  switch (data.cmd) {
    case 'add':
      box.setBodies(data.msg);
      break;
    case 'remove':
      box.removeBody(data.uuid);
      break;
    case 'impulse':
      box.impulse(data.uuid, data.degrees, data.power);
      break;
    case 'setZero':
      box.setZero(data.uuid);
      break;
  }
});
