/**
 * iCloud Voice Memos Watcher
 * Monitors iCloud Voice Memos directory for new recordings
 */

import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs/promises'
import { VoiceFileProcessor } from './processor'

export interface WatcherConfig {
  watchPath: string
  debounceMs?: number
  autoProcess?: boolean
  userId: string
}

export class VoiceMemosWatcher {
  private watcher: chokidar.FSWatcher | null = null
  private processor: VoiceFileProcessor
  private config: Required<WatcherConfig>
  private processing = new Set<string>()

  constructor(config: WatcherConfig) {
    this.config = {
      debounceMs: 2000,
      autoProcess: true,
      ...config,
    }
    this.processor = new VoiceFileProcessor(config.userId)
  }

  /**
   * Start watching the iCloud Voice Memos directory
   */
  async start(): Promise<void> {
    console.log(`📱 Starting Voice Memos Watcher...`)
    console.log(`📂 Watching: ${this.config.watchPath}`)

    // Verify directory exists
    try {
      await fs.access(this.config.watchPath)
    } catch (error) {
      throw new Error(
        `iCloud Voice Memos directory not found: ${this.config.watchPath}\n` +
          `Please ensure:\n` +
          `1. iCloud Drive is enabled\n` +
          `2. Voice Memos sync is enabled\n` +
          `3. Voice Memos app has been opened at least once`
      )
    }

    // Initialize watcher
    this.watcher = chokidar.watch(path.join(this.config.watchPath, '*.m4a'), {
      persistent: true,
      ignoreInitial: true, // Don't process existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    })

    // Set up event handlers
    this.watcher.on('add', (filePath) => this.handleNewFile(filePath))
    this.watcher.on('error', (error) => this.handleError(error))
    this.watcher.on('ready', () => {
      console.log('✅ Voice Memos Watcher is ready')
    })
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
      console.log('🛑 Voice Memos Watcher stopped')
    }
  }

  /**
   * Handle new file detected
   */
  private async handleNewFile(filePath: string): Promise<void> {
    const filename = path.basename(filePath)

    // Check if already processing
    if (this.processing.has(filePath)) {
      console.log(`⏭️  Skipping ${filename} (already processing)`)
      return
    }

    console.log(`🎤 New voice memo detected: ${filename}`)
    this.processing.add(filePath)

    try {
      if (this.config.autoProcess) {
        await this.processor.process(filePath)
        console.log(`✅ Processed: ${filename}`)
      } else {
        console.log(`ℹ️  Auto-process disabled, skipping: ${filename}`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error)
    } finally {
      this.processing.delete(filePath)
    }
  }

  /**
   * Handle watcher errors
   */
  private handleError(error: Error): void {
    console.error('❌ Watcher error:', error)
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      isRunning: this.watcher !== null,
      watchPath: this.config.watchPath,
      processingCount: this.processing.size,
      processingFiles: Array.from(this.processing),
    }
  }
}

/**
 * Helper to get default iCloud Voice Memos path
 */
export function getDefaultVoiceMemosPath(): string {
  const homeDir = process.env.HOME || '~'

  const paths = [
    // Primary iCloud path
    path.join(
      homeDir,
      'Library/Mobile Documents/com~apple~VoiceMemos/Documents'
    ),
    // Fallback path
    path.join(
      homeDir,
      'Library/Application Support/com.apple.voicememos/Recordings'
    ),
  ]

  return paths[0]
}
