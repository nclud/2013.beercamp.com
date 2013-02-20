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

(function(root, factory) {
  if (typeof exports === 'object') {
    // Node.js
    var Box2D = require('box2dweb-commonjs').Box2D;
    module.exports = factory();
  } else if (typeof importScripts === 'function' && typeof define === 'function' && define.amd) {
    // load Web Worker as an AMD module
    importScripts('Box2dWeb-2.1.a.3.min.js');
    define({
      baseUrl: './'
    }, factory);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  }
})(this, function() {

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

    this.fixDef = new b2FixtureDef;
    this.fixDef.density = 0.25;
    this.fixDef.friction = 0;
    this.fixDef.restitution = 0;

    this.bodyDef = new b2BodyDef;
  }

  bTest.prototype.update = function() {
    var now = Date.now();
    var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : this.intervalRate / 1000;
    this.lastTimestamp = now;

    this.world.Step(
      stepRate, // fixed time step
      8, // velocity iterations
      3 // position iterations
    );

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
    var world = {};
    for (var b = this.world.GetBodyList(); b; b = b.m_next) {
      if (typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
        world[b.GetUserData()] = {x: b.GetPosition().x, y: b.GetPosition().y, angle: b.GetAngle()};
      }
    }

    postMessage(world);
    // process.send(world);
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
    this.ready = true;
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
    if (box.ready) box.update();
  }

  setInterval(loop, 15);

  self.addEventListener('message', function(event) {
    var data = event.data;
    switch (data.cmd) {
      case 'add':
        box.setBodies(data.msg);
        break;
      case 'impulse':
        box.impulse(data.uuid, data.degrees, data.power);
        break;
      case 'setZero':
        box.setZero(data.uuid);
        break;
    }
  });

  /*
  process.on('message', function(data) {
    switch (data.cmd) {
      case 'add':
        box.setBodies(data.msg);
        break;
      case 'impulse':
        box.impulse(data.uuid, data.degrees, data.power);
        break;
      case 'setZero':
        box.setZero(data.uuid);
        break;
    }
  });
  */

});
