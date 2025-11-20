/**
 * PM2 Ecosystem Configuration
 * 用於管理 Graduate Assistant 的各項服務
 */

module.exports = {
  apps: [
    {
      name: 'graduate-assistant-web',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'mail2000-watcher',
      script: './scripts/start-mail2000-watcher.ts',
      interpreter: 'node_modules/.bin/tsx',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        MAIL_CHECK_INTERVAL: process.env.MAIL_CHECK_INTERVAL || '5',
        NCCU_EMAIL: process.env.NCCU_EMAIL || '',
      },
      error_file: './logs/mail-watcher-error.log',
      out_file: './logs/mail-watcher-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
