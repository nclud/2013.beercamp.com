# beercamp

Realtime multiplayer game written in Node.js and JavaScript using Socket.IO and canvas. Client interpolation from authoritative server running Box2D physics simulation in `child_process` fork.

## Getting setup

Here are the steps required to run this project locally on a Mac. This assumes you have `brew` installed.

1. Clone this repo
2. `git submodule update --init`
3. Install Node.js (Use the installer at http://nodejs.org/)
4. `npm install`
5. `node server.js`
6. Open http://localhost:4000
7. Play!

## Redis

Redis has been removed as a dependency for now, but here is how you can set that up if you need it.

1. Install Redis `brew install redis`
2. Start the redis server `redis-server /usr/local/etc/redis.conf`

## Deploying to production

Deploy using Capistrano, so Ruby must be installed.

1. `bundle install` This will install capistrano and it's dependencies.
2. `cap deploy`
3. Open http://affric.browsermedia.com

## Generate optimized client dist
### Concatenated, minified and versioned assets

```
npm install -g grunt-cli
grunt
```

## Run jshint and csslint

```
grunt test
```
