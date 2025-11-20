import { google } from 'googleapis'
import { db } from '~/server/db'

export class GmailService {
  private oauth2Client

  constructor(private userId: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )
  }

  /**
   * Get authenticated Gmail client
   */
  private async getGmailClient() {
    const account = await db.account.findFirst({
      where: {
        userId: this.userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('未連結 Google 帳號或授權已過期')
    }

    this.oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    })

    // Refresh token if expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      const { credentials } = await this.oauth2Client.refreshAccessToken()

      await db.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      })

      this.oauth2Client.setCredentials(credentials)
    }

    return google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  /**
   * List unread messages
   */
  async listUnreadMessages(options: {
    maxResults?: number
    query?: string
  } = {}) {
    const gmail = await this.getGmailClient()

    const query = options.query ? `is:unread ${options.query}` : 'is:unread'

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: options.maxResults || 10,
    })

    if (!response.data.messages) {
      return []
    }

    // Fetch full message details
    const messages = await Promise.all(
      response.data.messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })
        return detail.data
      })
    )

    return messages
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId: string) {
    const gmail = await this.getGmailClient()

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    return response.data
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    const gmail = await this.getGmailClient()

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    })

    return true
  }

  /**
   * Apply email rules to process messages
   */
  async processUnreadEmails() {
    const rules = await db.emailRule.findMany({
      where: {
        userId: this.userId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    })

    if (rules.length === 0) {
      return { processed: 0, created: 0 }
    }

    const messages = await this.listUnreadMessages({ maxResults: 50 })
    let processed = 0
    let created = 0

    for (const message of messages) {
      const subject = message.payload?.headers?.find((h) => h.name === 'Subject')?.value || ''
      const body = this.extractBody(message)

      // Check against each rule
      for (const rule of rules) {
        if (
          subject.toLowerCase().includes(rule.keyword.toLowerCase()) ||
          body.toLowerCase().includes(rule.keyword.toLowerCase())
        ) {
          // Execute rule action
          if (rule.action === 'create_task') {
            await this.createAssignmentFromEmail(message, rule.category)
            created++
          }

          await this.markAsRead(message.id!)
          processed++
          break
        }
      }
    }

    return { processed, created }
  }

  /**
   * Extract body from message
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
   * Create assignment from email
   */
  private async createAssignmentFromEmail(message: any, category: string) {
    const subject = message.payload?.headers?.find((h) => h.name === 'Subject')?.value || '未命名作業'
    const body = this.extractBody(message)

    // Try to extract due date from email (basic implementation)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7) // Default: 7 days from now

    await db.assignment.create({
      data: {
        userId: this.userId,
        courseId: null, // User needs to assign course manually
        title: subject,
        description: body.substring(0, 500),
        dueDate,
        status: 'pending',
      },
    })
  }
}
