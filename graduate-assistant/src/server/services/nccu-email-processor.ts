/**
 * NCCU (National Chengchi University) Email Processor
 * Specialized processor for NCCU Moodle and course-related emails
 */

import { GmailService } from './gmail-service'
import { db } from '~/server/db'

export class NCCUEmailProcessor extends GmailService {
  /**
   * Default email rules for NCCU Moodle
   */
  private static readonly NCCU_DEFAULT_RULES = [
    {
      keyword: 'moodle.nccu.edu.tw',
      category: 'moodle',
      priority: 10,
      description: '政大 Moodle 通知',
    },
    {
      keyword: 'Moodle:',
      category: 'moodle',
      priority: 9,
      description: 'Moodle 系統郵件',
    },
    {
      keyword: '作業繳交',
      category: 'assignment',
      priority: 8,
      description: '作業繳交通知',
    },
    {
      keyword: '截止日期',
      category: 'deadline',
      priority: 8,
      description: '截止日期提醒',
    },
    {
      keyword: '課程公告',
      category: 'announcement',
      priority: 7,
      description: '課程公告',
    },
    {
      keyword: '測驗通知',
      category: 'exam',
      priority: 8,
      description: '測驗通知',
    },
  ]

  /**
   * Initialize default NCCU email rules for a user
   */
  static async initializeDefaultRules(userId: string) {
    const existingRules = await db.emailRule.findMany({
      where: { userId },
    })

    // Only create default rules if no rules exist
    if (existingRules.length > 0) {
      return existingRules
    }

    const createdRules = []

    for (const rule of this.NCCU_DEFAULT_RULES) {
      const created = await db.emailRule.create({
        data: {
          userId,
          keyword: rule.keyword,
          category: rule.category,
          action: 'create_task',
          priority: rule.priority,
          isActive: true,
        },
      })
      createdRules.push(created)
    }

    return createdRules
  }

  /**
   * Extract due date from NCCU Moodle email content
   */
  extractNCCUDueDate(emailBody: string, subject: string): Date | null {
    const now = new Date()

    // Pattern 1: "截止日期：YYYY/MM/DD HH:MM"
    const pattern1 = /截止日期[：:]\s*(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})[日]?\s*(\d{1,2}):(\d{2})/
    const match1 = emailBody.match(pattern1) || subject.match(pattern1)
    if (match1) {
      const [, year, month, day, hour, minute] = match1
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      )
    }

    // Pattern 2: "Due date: YYYY-MM-DD"
    const pattern2 = /due date[：:]?\s*(\d{4})-(\d{2})-(\d{2})/i
    const match2 = emailBody.match(pattern2) || subject.match(pattern2)
    if (match2) {
      const [, year, month, day] = match2
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59)
    }

    // Pattern 3: "X天內" or "X日內"
    const pattern3 = /(\d+)\s*[天日]內/
    const match3 = emailBody.match(pattern3) || subject.match(pattern3)
    if (match3) {
      const days = parseInt(match3[1])
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + days)
      return dueDate
    }

    // Pattern 4: "本週" or "本周"
    if (emailBody.includes('本週') || emailBody.includes('本周')) {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
      endOfWeek.setHours(23, 59, 59)
      return endOfWeek
    }

    // Pattern 5: "下週" or "下周"
    if (emailBody.includes('下週') || emailBody.includes('下周')) {
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }

    // Default: 7 days from now
    return null
  }

  /**
   * Extract course name from NCCU email
   */
  extractNCCUCourseName(subject: string, body: string): string | null {
    // Pattern 1: "[課程名稱]" in subject
    const pattern1 = /\[([^\]]+)\]/
    const match1 = subject.match(pattern1)
    if (match1) {
      return match1[1]
    }

    // Pattern 2: "課程：課程名稱"
    const pattern2 = /課程[：:]\s*([^\n\r]+)/
    const match2 = body.match(pattern2)
    if (match2) {
      return match2[1].trim()
    }

    // Pattern 3: Common NCCU course patterns
    const coursePatterns = [
      /資料結構/,
      /演算法/,
      /計算機組織/,
      /作業系統/,
      /資料庫/,
      /人工智慧/,
      /機器學習/,
      /軟體工程/,
      /網路程式設計/,
      /雲端運算/,
    ]

    for (const pattern of coursePatterns) {
      const match = subject.match(pattern) || body.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
  }

  /**
   * Process NCCU Moodle emails with enhanced parsing
   */
  async processNCCUEmails() {
    // Ensure default rules are initialized
    await NCCUEmailProcessor.initializeDefaultRules(this['userId'])

    // Get unread Moodle emails
    const moodleEmails = await this.listUnreadMessages({
      query: 'from:moodle.nccu.edu.tw OR subject:Moodle',
      maxResults: 50,
    })

    let processed = 0
    let created = 0

    for (const email of moodleEmails) {
      const subject = email.payload?.headers?.find((h) => h.name === 'Subject')?.value || ''
      const body = this.extractBody(email)

      // Extract information
      const courseName = this.extractNCCUCourseName(subject, body)
      const dueDate = this.extractNCCUDueDate(body, subject) || this.getDefaultDueDate()

      // Find or create course
      let courseId: string | null = null
      if (courseName) {
        const existingCourse = await db.course.findFirst({
          where: {
            userId: this['userId'],
            name: { contains: courseName },
          },
        })

        if (existingCourse) {
          courseId = existingCourse.id
        }
      }

      // Create assignment
      await db.assignment.create({
        data: {
          userId: this['userId'],
          courseId,
          title: this.cleanSubject(subject),
          description: body.substring(0, 1000),
          dueDate,
          status: 'pending',
        },
      })

      await this.markAsRead(email.id!)
      processed++
      created++
    }

    return { processed, created }
  }

  /**
   * Clean email subject
   */
  private cleanSubject(subject: string): string {
    // Remove "Moodle:" prefix
    subject = subject.replace(/^Moodle:\s*/i, '')

    // Remove email prefixes like "Re:", "Fwd:"
    subject = subject.replace(/^(Re|Fwd|轉寄):\s*/gi, '')

    return subject.trim()
  }

  /**
   * Extract email body
   */
  private extractBody(message: any): string {
    if (message.payload.body?.data) {
      return Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    }

    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    }

    return ''
  }

  /**
   * Get default due date (7 days from now)
   */
  private getDefaultDueDate(): Date {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)
    dueDate.setHours(23, 59, 59)
    return dueDate
  }
}

/**
 * Helper function to initialize NCCU email processing for a user
 */
export async function initializeNCCUEmailProcessing(userId: string) {
  return NCCUEmailProcessor.initializeDefaultRules(userId)
}
