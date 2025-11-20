/**
 * Voice Watcher Service - Main Entry Point
 * Run this service to monitor iCloud Voice Memos
 */

import { VoiceMemosWatcher, getDefaultVoiceMemosPath } from './watcher'
import { TranscriptExtractor, getDependencyInstructions } from './transcript-extractor'

// Configuration
const CONFIG = {
  watchPath: process.env.VOICE_MEMOS_PATH || getDefaultVoiceMemosPath(),
  userId: process.env.DEFAULT_USER_ID || '', // Must be set
  autoProcess: process.env.AUTO_PROCESS !== 'false',
}

async function main() {
  console.log('🎤 Voice Memos Watcher Service')
  console.log('================================')

  // Check configuration
  if (!CONFIG.userId) {
    console.error('❌ ERROR: DEFAULT_USER_ID environment variable is required')
    console.error('   Set it to your user ID from the database')
    process.exit(1)
  }

  console.log(`📂 Watch Path: ${CONFIG.watchPath}`)
  console.log(`👤 User ID: ${CONFIG.userId}`)
  console.log(`⚙️  Auto Process: ${CONFIG.autoProcess ? 'Enabled' : 'Disabled'}`)
  console.log('')

  // Check dependencies
  console.log('🔍 Checking dependencies...')
  const extractor = new TranscriptExtractor()
  const deps = await extractor.checkDependencies()

  if (!deps.exiftool) {
    console.error('❌ exiftool is not installed')
    console.error(getDependencyInstructions())
    process.exit(1)
  }

  if (!deps.ffprobe) {
    console.warn('⚠️  ffprobe is not installed (optional, but recommended)')
  }

  console.log('✅ Dependencies OK')
  console.log('')

  // Create and start watcher
  const watcher = new VoiceMemosWatcher({
    watchPath: CONFIG.watchPath,
    userId: CONFIG.userId,
    autoProcess: CONFIG.autoProcess,
  })

  try {
    await watcher.start()

    // Keep process running
    console.log('')
    console.log('👂 Listening for new voice memos...')
    console.log('Press Ctrl+C to stop')
    console.log('')

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...')
      await watcher.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down...')
      await watcher.stop()
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Failed to start watcher:', error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the service
main()
