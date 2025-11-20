/**
 * NCCU Mail2000 Service
 * Integration for NCCU's Mail2000 email system (mail.nccu.edu.tw)
 */

import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { db } from '~/server/db'

interface Mail2000Config {
  username: string // 114921039
  password: string
  host?: string
  port?: number
}

export class Mail2000Service {
  private imap: Imap | null = null
  private userId: string
  private config: Mail2000Config

  constructor(userId: string, config: Mail2000Config) {
    this.userId = userId
    this.config = {
      host: config.host || 'mail.nccu.edu.tw',
      port: config.port || 993,
      username: config.username,
      password: config.password,
    }
  }

  /**
   * Connect to Mail2000 IMAP server
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.username + '@nccu.edu.tw',
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      })

      this.imap.once('ready', () => {
        resolve()
      })

      this.imap.once('error', (err: Error) => {
        reject(err)
      })

      this.imap.connect()
    })
  }

  /**
   * Disconnect from IMAP server
   */
  private disconnect(): void {
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(limit = 50): Promise<any[]> {
    await this.connect()

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'))
        return
      }

      this.imap.openBox('INBOX', false, (err) => {
        if (err) {
          this.disconnect()
          reject(err)
          return
        }

        // Search for unread messages
        this.imap!.search(['UNSEEN'], (err, results) => {
          if (err) {
            this.disconnect()
            reject(err)
            return
          }

          if (!results || results.length === 0) {
            this.disconnect()
            resolve([])
            return
          }

          // Limit results
          const messageIds = results.slice(0, limit)
          const messages: any[] = []

          const fetch = this.imap!.fetch(messageIds, { bodies: '' })

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err)
                  return
                }

                messages.push({
                  id: parsed.messageId,
                  subject: parsed.subject,
                  from: parsed.from?.text,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                })
              })
            })
          })

          fetch.once('error', (err) => {
            this.disconnect()
            reject(err)
          })

          fetch.once('end', () => {
            this.disconnect()
            resolve(messages)
          })
        })
      })
    })
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.connect()

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'))
        return
      }

      this.imap.openBox('INBOX', false, (err) => {
        if (err) {
          this.disconnect()
          reject(err)
          return
        }

        // Search for the message
        this.imap!.search([['HEADER', 'MESSAGE-ID', messageId]], (err, results) => {
          if (err || !results || results.length === 0) {
            this.disconnect()
            reject(err || new Error('Message not found'))
            return
          }

          // Mark as read
          this.imap!.addFlags(results[0], ['\\Seen'], (err) => {
            this.disconnect()
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      })
    })
  }

  /**
   * Process NCCU Moodle emails
   */
  async processNCCUMoodleEmails(): Promise<{ processed: number; created: number }> {
    try {
      const messages = await this.getUnreadMessages(50)

      let processed = 0
      let created = 0

      for (const message of messages) {
        // Check if it's a Moodle email
        if (
          !message.from?.includes('moodle.nccu.edu.tw') &&
          !message.subject?.includes('Moodle')
        ) {
          continue
        }

        // Extract information
        const courseName = this.extractCourseName(message.subject, message.text || '')
        const dueDate = this.extractDueDate(message.text || '', message.subject) || this.getDefaultDueDate()

        // Find or create course
        let courseId: string | null = null
        if (courseName) {
          const existingCourse = await db.course.findFirst({
            where: {
              userId: this.userId,
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
            userId: this.userId,
            courseId,
            title: this.cleanSubject(message.subject),
            description: message.text?.substring(0, 1000) || '',
            dueDate,
            status: 'pending',
          },
        })

        // Mark as read
        if (message.id) {
          await this.markAsRead(message.id)
        }

        processed++
        created++
      }

      return { processed, created }
    } catch (error: any) {
      console.error('Error processing Mail2000 emails:', error)
      throw error
    }
  }

  /**
   * Extract course name from subject or body
   */
  private extractCourseName(subject: string, body: string): string | null {
    // Pattern 1: [課程名稱] in subject
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
   * Extract due date from email content
   */
  private extractDueDate(emailBody: string, subject: string): Date | null {
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

    return null
  }

  /**
   * Clean email subject
   */
  private cleanSubject(subject: string): string {
    if (!subject) return '未命名郵件'

    // Remove "Moodle:" prefix
    subject = subject.replace(/^Moodle:\s*/i, '')

    // Remove email prefixes
    subject = subject.replace(/^(Re|Fwd|轉寄):\s*/gi, '')

    return subject.trim()
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

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      this.disconnect()
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Helper function to get Mail2000 credentials from user
 */
export async function getMail2000Credentials(userId: string): Promise<Mail2000Config | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      mail2000Username: true,
      mail2000Password: true,
    },
  })

  if (!user || !user.mail2000Username || !user.mail2000Password) {
    return null
  }

  return {
    username: user.mail2000Username,
    password: user.mail2000Password,
  }
}
