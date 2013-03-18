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

/*
  This file has been significantly modified from the original.
*/

console.log('Worker', process.pid, 'fired up! Status:', process.connected);

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
    new b2Vec2(0, 0), // zero gravity
    true // allow sleep
  );

  // use information generated in the previous simulation timestep
  // to help you come up with more accurate results,
  // faster, in the current timestep
  this.world.SetWarmStarting(true);

  this.bodies = {};
  this.graveyard = [];

  this.fixDef = new b2FixtureDef;
  this.fixDef.density = 1;
  this.fixDef.friction = 0;
  this.fixDef.restitution = 0;

  this.bodyDef = new b2BodyDef;
}

// TODO: refine this to handle beer can contacts
bTest.prototype.addContactListener = function(callbacks) {
  var listener = new Box2D.Dynamics.b2ContactListener;

  if (callbacks.BeginContact) {
    listener.BeginContact = (function(contact) {
      callbacks.BeginContact.call(this, [contact.GetFixtureA(), contact.GetFixtureB()]);
    }).bind(this);
  }

  if (callbacks.EndContact) {
    listener.EndContact = (function(contact) {
      callbacks.EndContact.call(this, [contact.GetFixtureA(), contact.GetFixtureB()]);
    }).bind(this);
  }

  this.world.SetContactListener(listener);
}

bTest.prototype.update = function() {

  // iterate over bodies to destroy
  var body;
  var uuid;
  var length = this.graveyard.length;

  for (var i = 0; i < length; i++) {
    uuid = this.graveyard[i];
    body = this.bodies[uuid];
    this.world.DestroyBody(body);
  }

  // clear destroyed bodies from array
  this.graveyard = [];

  // wraparound world
  for (var b = this.world.GetBodyList(); b; b = b.GetNext()) {
    if (b.GetType() === b2Body.b2_dynamicBody) {
      var gravity = b.GetUserData().gravity;

      // apply gravity
      if (gravity) {
        b.ApplyForce(
          new b2Vec2(0, gravity * b.GetMass()),
          b.GetWorldCenter()
        );
      }

      if (b.GetFixtureList()) {
        var aabb = b.GetFixtureList().GetAABB();
        var width = aabb.lowerBound.x - aabb.upperBound.x;
        var height = aabb.lowerBound.y - aabb.upperBound.y;

        if (aabb.lowerBound.x > 48) {
          if (b.GetUserData().class === 'Projectile') {
            // destroy offscreen projectiles
            box.remove(b.GetUserData().uuid);
          } else {
            b.SetPosition(new b2Vec2(0 + (width / 3), b.GetPosition().y));
          }
        }

        if (aabb.upperBound.x < 0) {
          if (b.GetUserData().class === 'Projectile') {
            // destroy offscreen projectiles
            box.remove(b.GetUserData().uuid);
          } else {
            b.SetPosition(new b2Vec2(48 - (width / 3), b.GetPosition().y));
          }
        }

        // catch objects that have fallen through the world and respawn them
        if (aabb.lowerBound.y > 70) {
          b.SetPosition(new b2Vec2(b.GetPosition().x, 58));
        }
      }

    }
  }

  // console.log('update', Date.now());

  var now = Date.now();
  var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : this.intervalRate / 1000;
  this.lastTimestamp = now;

  this.world.Step(
    stepRate, // fixed time step
    8, // velocity iterations
    3 // position iterations
  );

  this.world.ClearForces();
  this.sendUpdate();
}

// TODO: delta updates from worker to master
bTest.prototype.sendUpdate = function() {
  // console.log('sendUpdate', Date.now());

  var world = {};
  for (var b = this.world.GetBodyList(); b; b = b.m_next) {
    if (typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null && b.GetUserData().uuid) {
      world[b.GetUserData().uuid] = {
        x: b.GetPosition().x,
        y: b.GetPosition().y,
        angle: b.GetAngle(),
        velocity: b.GetLinearVelocity(),
        isJumping: b.numFootContacts === 0
      };
    }
  }

  // console.log(world);
  // postMessage(world);
  process.send({
    cmd: 'update',
    data: world
  });
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

    this.fixDef.isSensor = entity.isSensor || false;

    if (entity.radius) {
      this.fixDef.shape = new b2CircleShape(entity.radius);
    } else {
      this.fixDef.shape = new b2PolygonShape;
      this.fixDef.shape.SetAsBox(entity.width / 2, entity.height / 2);
    }

    this.bodyDef.position.x = entity.x;
    this.bodyDef.position.y = entity.y;

    this.bodyDef.fixedRotation = entity.fixed;

    this.bodyDef.userData = {
      uuid: uuid,
      class: entity.class
    };

    var body = this.bodies[uuid] = this.world.CreateBody(this.bodyDef);
    body.CreateFixture(this.fixDef);
  }
}

bTest.prototype.addPlayer = function(uuid, entity) {
  this.bodyDef.type = b2Body.b2_dynamicBody;

  // players never collide with each other
  this.fixDef.filter.groupIndex = -1;

  this.fixDef.shape = new b2PolygonShape;
  this.fixDef.shape.SetAsBox(entity.width / 2, entity.height / 2);

  this.bodyDef.position.x = entity.x;
  this.bodyDef.position.y = entity.y;

  this.bodyDef.fixedRotation = entity.fixed;

  this.bodyDef.userData = {
    uuid: uuid,
    class: entity.class,
    gravity: entity.gravity
  };

  var body = this.bodies[uuid] = this.world.CreateBody(this.bodyDef);
  body.numFootContacts = 0;

  // reset isSensor to false so Players don't fall through floor
  this.fixDef.isSensor = false;
  body.CreateFixture(this.fixDef);

  // add foot sensor fixture
  this.fixDef.isSensor = true;
  this.fixDef.shape = new b2PolygonShape;
  this.fixDef.shape.SetAsOrientedBox((entity.width / 2) * 0.9, 0.1, new b2Vec2(0, entity.height / 2), 0);
  this.fixDef.userData = 'feet';
  body.CreateFixture(this.fixDef);

  // reset fixDef
  this.fixDef.filter.groupIndex = 0;
  this.fixDef.isSensor = false;
}

bTest.prototype.fire = function(uuid, entity, owner) {
  switch(entity.type) {
    case 'dynamic':
      this.bodyDef.type = b2Body.b2_dynamicBody;
      break;
    case 'static':
      this.bodyDef.type =  b2Body.b2_staticBody;
      break;
    case 'kinematic':
      this.bodyDef.type =  b2Body.b2_kinematicBody;
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

  this.bodyDef.userData = {
    uuid: uuid,
    class: entity.class,
    owner: owner
  };

  var body = this.bodies[uuid] = this.world.CreateBody(this.bodyDef);

  this.fixDef.isSensor = entity.isSensor || false;
  this.fixDef.filter.groupIndex = -2;
  body.CreateFixture(this.fixDef);

  // reset fixDef
  this.fixDef.filter.groupIndex = 0;

  // set projectile velocity
  var direction = entity.direction === 'left' ? -1 : 1;
  body.GetLinearVelocity().x = entity.speed * direction;
}

bTest.prototype.removeBody = function(uuid) {
  // add to queue to clean up after time step completes
  if (this.bodies[uuid]) {
    this.graveyard.push(uuid);
  }
}

bTest.prototype.remove = function(uuid) {
  this.removeBody(uuid);

  process.send({
    cmd: 'remove',
    data: uuid
  });
}

bTest.prototype.hit = function(uuid, projectile) {
  this.remove(projectile);

  process.send({
    cmd: 'hit',
    data: uuid
  });
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
  // only set velocity.x to zero
  // TODO: only call this while body in contact with ground?
  var velocity = this.bodies[uuid].GetLinearVelocity();
  this.bodies[uuid].SetLinearVelocity({x: 0, y: velocity.y}, 0);
}
 
var box = new bTest(15, false);

box.addContactListener({
  BeginContact: function(fixtures) {
    var length = fixtures.length;
    var fixture;
    var userData;

    for (var i = 0; i < length; i++) {
      fixture = fixtures[i];
      userData = fixture.GetBody().GetUserData();

      // filter fixture collisions
      switch (fixture.GetUserData()) {
        case 'feet':
          for (var j = 0; j < length; j++) {
            if (fixtures[j].GetBody().GetUserData().class === 'Platform') {
              box.bodies[userData.uuid].numFootContacts++;
            }
          }
          break;
      }

      // filter body collisions
      switch (userData.class) {
        case 'Player':
          for (var k = 0; k < length; k++) {
            switch (fixtures[k].GetBody().GetUserData().class) {
              case 'Projectile':
                // prevent collisions with owner
                if (userData.uuid !== fixtures[k].GetBody().GetUserData().owner) {
                  this.hit(userData.uuid, fixtures[k].GetBody().GetUserData().uuid);
                }
                break;
              case 'Powerup':
                // remove powerup
                this.remove(fixtures[k].GetBody().GetUserData().uuid);

                // handle beer powerup
                process.send({
                  cmd: 'drink',
                  data: userData.uuid
                });
                break;
            }
          }
          break;
        case 'Projectile':
          for (var j = 0; j < length; j++) {
            switch (fixtures[j].GetBody().GetUserData().class) {
              // remove Projectile if it collides with a Platform
              case 'Platform':
                this.remove(userData.uuid);
                break;
            }
          }
      }
    }
  },
  EndContact: function(fixtures) {
    var length = fixtures.length;
    var fixture;
    var userData;

    for (var i = 0; i < length; i++) {
      fixture = fixtures[i];
      userData = fixture.GetBody().GetUserData();

      // filter fixture collisions
      switch (fixture.GetUserData()) {
        case 'feet':
          for (var j = 0; j < length; j++) {
            switch (fixtures[j].GetBody().GetUserData().class) {
              case 'Platform':
                box.bodies[userData.uuid].numFootContacts--;
                break;
            }
          }
          break;
      }

      /*
      // filter body collisions
      switch (userData.class) {
        case 'Player':
          for (var k = 0; k < length; k++) {
            switch (fixtures[k].GetBody().GetUserData().class) {
              case 'Projectile':
                this.hit(userData.uuid, fixtures[k].GetBody().GetUserData().uuid);
                break;
            }
          }
      }
      */
    }
  }
});

var loop = function() {
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
    case 'addPlayer':
      box.addPlayer(data.uuid, data.state);
      break;
    case 'remove':
      box.removeBody(data.uuid);
      break;
    case 'impulse':
      box.impulse(data.uuid, data.degrees, data.power);
      break;
    case 'fire':
      box.fire(data.uuid, data.entity, data.owner);
      break;
    case 'setZero':
      box.setZero(data.uuid);
      break;
  }
});
