require "capistrano/node-deploy"

set :application, "beercamp"
set :repository,  "git@github.com:mikemorris/beercamp.git"
set :scm, :git
set :deploy_to, "/var/www/vhosts/beercamp"
role :app, "affric.browsermedia.com"

set :git_enable_submodules, 1 # Make sure we fetch submodules
set :deploy_via, :remote_cache
set :node_user, "node_user"