/**
 * Course Identifier
 * Automatically identifies which course a voice recording belongs to
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '~/env'
import type { Course } from '@prisma/client'

export interface IdentificationResult {
  courseId: string | null
  method: 'time' | 'filename' | 'content' | null
  confidence: number // 0-100
  suggestedCourses: Array<{
    courseId: string
    courseName: string
    confidence: number
    reason: string
  }>
}

export class CourseIdentifier {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    })
  }

  /**
   * Main identification method - tries multiple strategies
   */
  async identify(params: {
    fileName: string
    recordedAt: Date
    transcript: string | null
    availableCourses: Course[]
  }): Promise<IdentificationResult> {
    const { fileName, recordedAt, transcript, availableCourses } = params

    if (availableCourses.length === 0) {
      return {
        courseId: null,
        method: null,
        confidence: 0,
        suggestedCourses: [],
      }
    }

    // Strategy 1: Try time-based matching (highest confidence)
    const timeResult = await this.identifyByTime(recordedAt, availableCourses)
    if (timeResult.confidence >= 90) {
      return timeResult
    }

    // Strategy 2: Try filename matching
    const filenameResult = this.identifyByFilename(fileName, availableCourses)
    if (filenameResult.confidence >= 80) {
      return filenameResult
    }

    // Strategy 3: Try content-based matching (if transcript available)
    if (transcript && transcript.length > 100) {
      const contentResult = await this.identifyByContent(
        transcript,
        availableCourses
      )
      if (contentResult.confidence >= 60) {
        return contentResult
      }
    }

    // Return best result even if confidence is low
    const bestResult = [timeResult, filenameResult]
      .filter((r) => r.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)[0]

    return bestResult || {
      courseId: null,
      method: null,
      confidence: 0,
      suggestedCourses: [],
    }
  }

  /**
   * Identify course by recording time vs course schedule
   */
  private async identifyByTime(
    recordedAt: Date,
    courses: Course[]
  ): Promise<IdentificationResult> {
    const suggestedCourses: IdentificationResult['suggestedCourses'] = []

    for (const course of courses) {
      // Parse course schedule from metadata
      // Assuming Course has a schedule field in JSON format
      const schedule = course.metadata as any

      if (!schedule?.schedule || !Array.isArray(schedule.schedule)) {
        continue
      }

      // Check if recording time matches any class time
      const match = this.matchTimeWithSchedule(recordedAt, schedule.schedule)

      if (match) {
        suggestedCourses.push({
          courseId: course.id,
          courseName: course.name,
          confidence: match.confidence,
          reason: `錄音時間 (${this.formatTime(recordedAt)}) 符合課程時間`,
        })
      }
    }

    // Sort by confidence
    suggestedCourses.sort((a, b) => b.confidence - a.confidence)

    const best = suggestedCourses[0]

    return {
      courseId: best?.courseId || null,
      method: 'time',
      confidence: best?.confidence || 0,
      suggestedCourses,
    }
  }

  /**
   * Match recording time with course schedule
   */
  private matchTimeWithSchedule(
    recordedAt: Date,
    schedule: Array<{
      dayOfWeek: number // 0-6 (Sunday-Saturday)
      startTime: string // "HH:MM"
      endTime: string // "HH:MM"
    }>
  ): { confidence: number } | null {
    const recordDay = recordedAt.getDay()
    const recordTime = this.getTimeString(recordedAt)

    for (const slot of schedule) {
      if (slot.dayOfWeek !== recordDay) {
        continue
      }

      // Check if time is within class period (with 15 min buffer)
      const isWithinTime = this.isTimeInRange(
        recordTime,
        slot.startTime,
        slot.endTime,
        15 // 15 minutes buffer
      )

      if (isWithinTime) {
        return { confidence: 95 } // Very high confidence
      }
    }

    return null
  }

  /**
   * Identify course by filename keywords
   */
  private identifyByFilename(
    fileName: string,
    courses: Course[]
  ): IdentificationResult {
    const suggestedCourses: IdentificationResult['suggestedCourses'] = []

    // Normalize filename (remove extension, lowercase)
    const normalizedFileName = fileName
      .replace(/\.m4a$/i, '')
      .toLowerCase()
      .replace(/[_-]/g, ' ')

    for (const course of courses) {
      // Extract keywords from course name
      const courseKeywords = this.extractKeywords(course.name)

      let matchCount = 0
      let matchedKeywords: string[] = []

      for (const keyword of courseKeywords) {
        if (normalizedFileName.includes(keyword.toLowerCase())) {
          matchCount++
          matchedKeywords.push(keyword)
        }
      }

      if (matchCount > 0) {
        // Calculate confidence based on match count
        const confidence = Math.min(85, 50 + matchCount * 15)

        suggestedCourses.push({
          courseId: course.id,
          courseName: course.name,
          confidence,
          reason: `檔案名稱包含關鍵字：${matchedKeywords.join(', ')}`,
        })
      }
    }

    suggestedCourses.sort((a, b) => b.confidence - a.confidence)

    const best = suggestedCourses[0]

    return {
      courseId: best?.courseId || null,
      method: 'filename',
      confidence: best?.confidence || 0,
      suggestedCourses,
    }
  }

  /**
   * Identify course by analyzing transcript content with Claude
   */
  private async identifyByContent(
    transcript: string,
    courses: Course[]
  ): Promise<IdentificationResult> {
    try {
      // Use only first 500 words to save tokens
      const shortTranscript = transcript.split(/\s+/).slice(0, 500).join(' ')

      const courseList = courses
        .map(
          (c, i) =>
            `${i + 1}. ${c.name} (教師：${(c.metadata as any)?.instructor || '未知'})`
        )
        .join('\n')

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: '你是課程識別專家，需要根據逐字稿內容判斷是哪門課程的錄音。',
        messages: [
          {
            role: 'user',
            content: `請分析以下課程錄音逐字稿，判斷最可能屬於哪門課程。

可選課程列表：
${courseList}

逐字稿片段（前500字）：
${shortTranscript}

請以 JSON 格式回答，包含：
{
  "courseIndex": 1, // 最可能的課程編號（1-${courses.length}），如果無法判斷則為 null
  "confidence": 75, // 信心度 (0-100)
  "reason": "提到了「機器學習」「神經網路」等專業術語"
}`,
          },
        ],
      })

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : ''

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('無法解析 Claude 回應')
      }

      const result = JSON.parse(jsonMatch[0])

      if (result.courseIndex && result.courseIndex <= courses.length) {
        const course = courses[result.courseIndex - 1]

        return {
          courseId: course.id,
          method: 'content',
          confidence: result.confidence || 60,
          suggestedCourses: [
            {
              courseId: course.id,
              courseName: course.name,
              confidence: result.confidence || 60,
              reason: result.reason || '內容分析匹配',
            },
          ],
        }
      }

      return {
        courseId: null,
        method: null,
        confidence: 0,
        suggestedCourses: [],
      }
    } catch (error) {
      console.error('Error in content-based identification:', error)
      return {
        courseId: null,
        method: null,
        confidence: 0,
        suggestedCourses: [],
      }
    }
  }

  /**
   * Helper: Extract keywords from course name
   */
  private extractKeywords(courseName: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = ['課程', '導論', '概論', '進階', '基礎', '實作', '專題']

    return courseName
      .split(/[\s\-_()（）]+/)
      .filter((word) => word.length > 1 && !commonWords.includes(word))
  }

  /**
   * Helper: Get time string from Date
   */
  private getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Helper: Check if time is in range (with buffer)
   */
  private isTimeInRange(
    time: string,
    start: string,
    end: string,
    bufferMinutes: number
  ): boolean {
    const timeMinutes = this.timeToMinutes(time)
    const startMinutes = this.timeToMinutes(start) - bufferMinutes
    const endMinutes = this.timeToMinutes(end) + bufferMinutes

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes
  }

  /**
   * Helper: Convert "HH:MM" to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Helper: Format date/time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
