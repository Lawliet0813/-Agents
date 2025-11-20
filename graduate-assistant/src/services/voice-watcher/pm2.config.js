/**
 * PM2 Configuration for Voice Watcher Service
 *
 * Usage:
 *   pm2 start src/services/voice-watcher/pm2.config.js
 *   pm2 logs voice-watcher
 *   pm2 stop voice-watcher
 *   pm2 restart voice-watcher
 *   pm2 delete voice-watcher
 *
 * Auto-start on boot:
 *   pm2 startup
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'voice-watcher',
      script: 'tsx',
      args: 'src/services/voice-watcher/index.ts',
      cwd: '/path/to/graduate-assistant', // Update this path
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        DEFAULT_USER_ID: 'your-user-id-here', // IMPORTANT: Set this
        VOICE_MEMOS_PATH:
          '~/Library/Mobile Documents/com~apple~VoiceMemos/Documents/',
        AUTO_PROCESS: 'true',

        // Database
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/graduate_db',

        // API Keys
        ANTHROPIC_API_KEY: 'sk-ant-...',
      },

      // Logging
      error_file: './logs/voice-watcher-error.log',
      out_file: './logs/voice-watcher-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
    },
  ],
}
