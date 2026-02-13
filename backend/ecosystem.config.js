module.exports = {
  apps: [{
    name: 'nucleoia-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/var/www/nucleoia/logs/app/error.log',
    out_file: '/var/www/nucleoia/logs/app/out.log',
    log_file: '/var/www/nucleoia/logs/app/combined.log',
    time: true,
  }],
};
