import OpenAI from 'openai'
import { env } from '~/env'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

export interface TranscriptionOptions {
  language?: string // 'zh' | 'en' | 'auto'
  prompt?: string // Optional context for better accuracy
}

export interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
}

/**
 * Transcribe audio file using OpenAI Whisper API
 */
export async function transcribeAudio(
  audioFile: File | Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  try {
    const { language = 'zh', prompt } = options

    // Whisper API accepts File objects
    const file = audioFile instanceof Blob
      ? new File([audioFile], 'audio.webm', { type: audioFile.type })
      : audioFile

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: language === 'auto' ? undefined : language,
      prompt,
      response_format: 'verbose_json', // Get detailed response with timestamps
    })

    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    }
  } catch (error) {
    console.error('Whisper transcription error:', error)
    throw new Error('音頻轉錄失敗，請稍後再試')
  }
}

/**
 * Transcribe large audio files by splitting into chunks
 * Whisper API has a 25MB file size limit
 */
export async function transcribeLargeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const MAX_SIZE = 25 * 1024 * 1024 // 25MB

  // If file is small enough, transcribe directly
  if (audioBlob.size <= MAX_SIZE) {
    return transcribeAudio(audioBlob, options)
  }

  // For large files, we would need to split the audio
  // This requires more complex audio processing
  // For now, reject files that are too large
  throw new Error('音頻檔案過大（超過 25MB），請錄製較短的音頻')
}

/**
 * Convert base64 audio to Blob
 */
export function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64

  // Decode base64
  const binaryString = Buffer.from(base64Data, 'base64').toString('binary')
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Determine MIME type from data URL
  const mimeType = base64.includes(',')
    ? base64.split(',')[0].match(/:(.*?);/)?.[1] || 'audio/webm'
    : 'audio/webm'

  return new Blob([bytes], { type: mimeType })
}

/**
 * Transcribe audio from base64 string
 */
export async function transcribeBase64Audio(
  base64Audio: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const audioBlob = base64ToBlob(base64Audio)
  return transcribeLargeAudio(audioBlob, options)
}
