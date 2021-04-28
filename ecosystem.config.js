module.exports = {
  apps : [{
    name: 'main',
    script: 'main.js',
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
      "NODE_ENV": "production"
    },
    max_memory_restart: "300M",
    node_args: [
      "--optimize_for_size",
      "--max_old_space_size=400",
      "--gc_interval=100"
    ],
    restart_delay: "1500"
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};