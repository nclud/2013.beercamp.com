# beercamp

Game server written in Node.js and JavaScript client using Socket.IO and Box2D.

## Getting setup

Here are the steps required to run this project locally on a Mac. This assume you have homebrew installed.

1. Clone this repo
1. Install Redis (brew install redis). 
1. Start the redis server (`redis-server /usr/local/etc/redis.conf`)
1. Install node.js (Use the installer found here: http://nodejs.org/)
1. Run `npm install`
1. Install the git submodules

```
git submodule init
git submodule update
```

1. Run `node server.js`
1. Open your Browser to http://localhost:4000
1. Play!


## Deploying to production

Deploy using Capistrano, so you we will need Ruby installed. Then do the following:

1. bundle install # This will install capistrano and it's dependencies.
1. cap deploy

