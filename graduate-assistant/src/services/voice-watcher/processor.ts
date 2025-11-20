/**
 * Voice File Processor
 * Orchestrates the entire processing pipeline:
 * 1. Extract transcript
 * 2. Identify course
 * 3. Generate AI notes
 * 4. Save to database
 * 5. Send notification
 */

import { TranscriptExtractor } from './transcript-extractor'
import { CourseIdentifier } from './course-identifier'
import { summarizeNote } from '~/server/services/ai-service'
import { db } from '~/server/db'
import { sendNotification } from './notifier'

export class VoiceFileProcessor {
  private transcriptExtractor: TranscriptExtractor
  private courseIdentifier: CourseIdentifier
  private userId: string

  constructor(userId: string) {
    this.userId = userId
    this.transcriptExtractor = new TranscriptExtractor()
    this.courseIdentifier = new CourseIdentifier()
  }

  /**
   * Process a voice file end-to-end
   */
  async process(filePath: string): Promise<void> {
    console.log(`🔄 Processing: ${filePath}`)

    try {
      // Step 1: Extract transcript and metadata
      console.log(`📄 Extracting transcript...`)
      const fileMetadata = await this.transcriptExtractor.extract(filePath)

      if (!fileMetadata.hasTranscript) {
        console.warn(`⚠️  No transcript found in file`)
        // Still create a record for manual processing
        await this.createPendingNote(fileMetadata, null, 0)
        return
      }

      console.log(`✅ Transcript extracted (${fileMetadata.transcript!.length} chars)`)

      // Step 2: Identify course
      console.log(`🔍 Identifying course...`)
      const courses = await this.getUserCourses()

      const identification = await this.courseIdentifier.identify({
        fileName: fileMetadata.fileName,
        recordedAt: fileMetadata.recordedAt,
        transcript: fileMetadata.transcript,
        availableCourses: courses,
      })

      console.log(
        `📚 Course identification: ${identification.courseId ? 'Found' : 'Not found'} (confidence: ${identification.confidence}%)`
      )

      // If confidence is too low, mark for manual review
      if (identification.confidence < 60) {
        await this.createPendingNote(
          fileMetadata,
          identification,
          identification.confidence
        )
        await sendNotification({
          title: '❓ 語音筆記待確認',
          message: `檔案「${fileMetadata.fileName}」無法自動識別課程，請手動選擇`,
          actionUrl: '/dashboard/notes?filter=pending',
        })
        return
      }

      // Step 3: Generate AI notes
      console.log(`🤖 Generating AI notes...`)
      const course = courses.find((c) => c.id === identification.courseId)

      const aiResult = await summarizeNote(fileMetadata.transcript!, {
        courseName: course?.name,
        includeKeyPoints: true,
        includeQuestions: false,
        language: 'zh',
      })

      console.log(`✅ AI notes generated`)

      // Step 4: Save to database
      console.log(`💾 Saving to database...`)
      const voiceNote = await db.voiceNote.create({
        data: {
          userId: this.userId,
          courseId: identification.courseId,
          source: 'ICLOUD',
          status: 'COMPLETED',

          // File info
          originalFilePath: filePath,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          duration: fileMetadata.duration,
          recordedAt: fileMetadata.recordedAt,

          // Content
          transcript: fileMetadata.transcript,
          processedNotes: this.formatAINotes(aiResult),
          summary: aiResult.summary,
          keyPoints: aiResult.keyPoints
            ? JSON.stringify(aiResult.keyPoints)
            : null,

          // Identification
          identificationMethod: identification.method || 'auto',
          identificationConfidence: identification.confidence,
          suggestedCourses: JSON.stringify(identification.suggestedCourses),

          processedAt: new Date(),
        },
      })

      console.log(`✅ Saved to database: ${voiceNote.id}`)

      // Step 5: Send success notification
      await sendNotification({
        title: '✅ 語音筆記已處理完成',
        message: `${course?.name || '未分類'} - ${Math.round(fileMetadata.duration / 60)} 分鐘`,
        actionUrl: `/dashboard/notes/${voiceNote.id}`,
      })

      console.log(`🎉 Processing completed successfully`)
    } catch (error) {
      console.error(`❌ Processing failed:`, error)

      // Try to create a failed record
      try {
        await db.voiceNote.create({
          data: {
            userId: this.userId,
            source: 'ICLOUD',
            status: 'FAILED',
            originalFilePath: filePath,
            fileName: filePath.split('/').pop() || '',
            recordedAt: new Date(),
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
        })
      } catch (dbError) {
        console.error(`❌ Failed to save error record:`, dbError)
      }

      throw error
    }
  }

  /**
   * Get user's courses
   */
  private async getUserCourses() {
    return db.course.findMany({
      where: { userId: this.userId },
      select: {
        id: true,
        name: true,
        instructor: true,
        metadata: true,
      },
    })
  }

  /**
   * Create a pending note for manual review
   */
  private async createPendingNote(
    fileMetadata: any,
    identification: any,
    confidence: number
  ) {
    await db.voiceNote.create({
      data: {
        userId: this.userId,
        source: 'ICLOUD',
        status: 'NEEDS_REVIEW',

        originalFilePath: fileMetadata.filePath,
        fileName: fileMetadata.fileName,
        fileSize: fileMetadata.fileSize,
        duration: fileMetadata.duration,
        recordedAt: fileMetadata.recordedAt,

        transcript: fileMetadata.transcript,

        identificationConfidence: confidence,
        suggestedCourses: identification
          ? JSON.stringify(identification.suggestedCourses)
          : null,
      },
    })
  }

  /**
   * Format AI result into structured notes
   */
  private formatAINotes(aiResult: {
    summary: string
    keyPoints?: string[]
    suggestedTitle?: string
  }): string {
    let formatted = aiResult.summary

    if (aiResult.keyPoints && aiResult.keyPoints.length > 0) {
      formatted += '\n\n【關鍵點】\n'
      formatted += aiResult.keyPoints.map((point) => `• ${point}`).join('\n')
    }

    return formatted
  }
}
