module.exports = {
  apps: [
    {
      name: 'blog-nest',
      script: 'dist/src/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/pm2/error.log',
      out_file: 'logs/pm2/out.log',
      merge_logs: true,
      log_type: 'json',
    },
  ],
};
