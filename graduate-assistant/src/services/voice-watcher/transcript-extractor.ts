/**
 * Transcript Extractor
 * Extracts transcript from iOS Voice Memos .m4a files using exiftool
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export interface VoiceFileMetadata {
  filePath: string
  fileName: string
  fileSize: number
  duration: number
  transcript: string | null
  recordedAt: Date
  hasTranscript: boolean
}

export class TranscriptExtractor {
  /**
   * Extract transcript and metadata from Voice Memo file
   */
  async extract(filePath: string): Promise<VoiceFileMetadata> {
    // Get file stats
    const stats = await fs.stat(filePath)

    // Extract metadata using exiftool
    const metadata = await this.extractMetadataWithExiftool(filePath)

    return {
      filePath,
      fileName: filePath.split('/').pop() || '',
      fileSize: stats.size,
      duration: metadata.duration,
      transcript: metadata.transcript,
      recordedAt: metadata.recordedAt || stats.birthtime,
      hasTranscript: metadata.transcript !== null,
    }
  }

  /**
   * Extract metadata using exiftool
   */
  private async extractMetadataWithExiftool(
    filePath: string
  ): Promise<{
    transcript: string | null
    duration: number
    recordedAt: Date | null
  }> {
    try {
      // Run exiftool to get all metadata
      const { stdout } = await execAsync(
        `exiftool -json -UserComment -Duration -CreateDate "${filePath}"`
      )

      const metadata = JSON.parse(stdout)[0]

      // Extract transcript from UserComment
      let transcript: string | null = null
      if (metadata.UserComment) {
        // iOS stores transcript in UserComment field
        // It may be in different encodings, try to extract
        transcript = this.parseUserComment(metadata.UserComment)
      }

      // Extract duration (convert from "hh:mm:ss" or seconds)
      const duration = this.parseDuration(metadata.Duration)

      // Extract creation date
      let recordedAt: Date | null = null
      if (metadata.CreateDate) {
        recordedAt = new Date(metadata.CreateDate)
      }

      return { transcript, duration, recordedAt }
    } catch (error) {
      console.error('Error extracting metadata with exiftool:', error)
      // Fallback to ffprobe for duration
      const duration = await this.getDurationWithFfprobe(filePath)
      return { transcript: null, duration, recordedAt: null }
    }
  }

  /**
   * Parse UserComment field to extract transcript
   */
  private parseUserComment(userComment: string): string | null {
    if (!userComment || userComment.trim() === '') {
      return null
    }

    // Remove any binary prefixes or encoding markers
    let cleaned = userComment
      .replace(/^(ASCII|Unicode|Binary)\s*/i, '')
      .replace(/\0/g, '')
      .trim()

    if (cleaned.length === 0) {
      return null
    }

    return cleaned
  }

  /**
   * Parse duration from various formats
   */
  private parseDuration(durationString: string | undefined): number {
    if (!durationString) return 0

    // If it's already a number in seconds
    if (!isNaN(Number(durationString))) {
      return Math.round(Number(durationString))
    }

    // If it's in format "hh:mm:ss" or "mm:ss"
    const parts = durationString.split(':').map(Number)

    if (parts.length === 3) {
      // hh:mm:ss
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      // mm:ss
      return parts[0] * 60 + parts[1]
    }

    return 0
  }

  /**
   * Fallback: Get duration using ffprobe
   */
  private async getDurationWithFfprobe(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      )

      const duration = parseFloat(stdout.trim())
      return Math.round(duration)
    } catch (error) {
      console.error('Error getting duration with ffprobe:', error)
      return 0
    }
  }

  /**
   * Check if exiftool is installed
   */
  async checkDependencies(): Promise<{
    exiftool: boolean
    ffprobe: boolean
  }> {
    const hasExiftool = await this.checkCommand('exiftool')
    const hasFfprobe = await this.checkCommand('ffprobe')

    return {
      exiftool: hasExiftool,
      ffprobe: hasFfprobe,
    }
  }

  /**
   * Check if a command is available
   */
  private async checkCommand(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Install dependencies reminder
 */
export function getDependencyInstructions(): string {
  return `
📦 Required Dependencies:

1. exiftool (for transcript extraction)
   brew install exiftool

2. ffmpeg/ffprobe (for audio metadata)
   brew install ffmpeg

After installation, restart the watcher service.
`
}
