// PM2 配置文件
module.exports = {
  apps: [{
    name: 'omni-track-backend',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // 重要：确保PM2加载.env文件
    env_file: '.env',
    // 或者使用 node-args 来加载 dotenv
    node_args: '-r dotenv/config',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};