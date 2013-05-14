require "capistrano/node-deploy"

set :application, "beercamp"
set :repository,  "git@github.com:nclud/2013.beercamp.com.git"
set :scm, :git
set :deploy_to, "/var/www/vhosts/beercamp"
role :app, "affric.browsermedia.com"

set :git_enable_submodules, 1 # Make sure we fetch submodules
set :deploy_via, :remote_cache
set :node_user, "node"
set :app_environment, "NODE_PORT=80"

namespace :node do
  desc "[Override] Start the node application"
  task :start do
    sudo "/sbin/service node start"
  end

  desc "[Override] Stop the node application"
  task :stop do
    sudo "/sbin/service node stop"
  end

  desc "Restart the node application"
    task :restart do
      sudo "/sbin/service node restart"
    end
end
