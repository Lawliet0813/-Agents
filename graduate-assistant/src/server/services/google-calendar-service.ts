import { google } from 'googleapis'
import { db } from '~/server/db'

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export class GoogleCalendarService {
  private oauth2Client

  constructor(private userId: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )
  }

  /**
   * Get authenticated calendar client
   */
  private async getCalendarClient() {
    // Get user's Google account with tokens
    const account = await db.account.findFirst({
      where: {
        userId: this.userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('未連結 Google 帳號或授權已過期')
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    })

    // Refresh token if expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      const { credentials } = await this.oauth2Client.refreshAccessToken()

      // Update tokens in database
      await db.account.update({
        where: {
          id: account.id,
        },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      })

      this.oauth2Client.setCredentials(credentials)
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * List calendar events
   */
  async listEvents(options: {
    timeMin?: Date
    timeMax?: Date
    maxResults?: number
    calendarId?: string
  }) {
    const calendar = await this.getCalendarClient()

    const response = await calendar.events.list({
      calendarId: options.calendarId || 'primary',
      timeMin: options.timeMin?.toISOString(),
      timeMax: options.timeMax?.toISOString(),
      maxResults: options.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  }

  /**
   * Get a specific event
   */
  async getEvent(eventId: string, calendarId = 'primary') {
    const calendar = await this.getCalendarClient()

    const response = await calendar.events.get({
      calendarId,
      eventId,
    })

    return response.data
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent, calendarId = 'primary') {
    const calendar = await this.getCalendarClient()

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })

    return response.data
  }

  /**
   * Update a calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId = 'primary') {
    const calendar = await this.getCalendarClient()

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event as any,
    })

    return response.data
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string, calendarId = 'primary') {
    const calendar = await this.getCalendarClient()

    await calendar.events.delete({
      calendarId,
      eventId,
    })

    return true
  }

  /**
   * Create event from assignment
   */
  async createEventFromAssignment(assignment: {
    title: string
    description?: string
    dueDate: Date
    courseId?: string
  }) {
    const course = assignment.courseId
      ? await db.course.findUnique({ where: { id: assignment.courseId } })
      : null

    // Event starts 1 hour before due date
    const startTime = new Date(assignment.dueDate)
    startTime.setHours(startTime.getHours() - 1)

    const event: CalendarEvent = {
      summary: `📝 ${assignment.title}`,
      description: assignment.description
        ? `課程：${course?.name || '未分類'}\n\n${assignment.description}`
        : `課程：${course?.name || '未分類'}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: assignment.dueDate.toISOString(),
        timeZone: 'Asia/Taipei',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    }

    return this.createEvent(event)
  }

  /**
   * List available calendars
   */
  async listCalendars() {
    const calendar = await this.getCalendarClient()

    const response = await calendar.calendarList.list()

    return response.data.items || []
  }

  /**
   * Sync assignment to calendar
   * Creates if not exists, updates if exists
   */
  async syncAssignment(assignmentId: string) {
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })

    if (!assignment) {
      throw new Error('作業不存在')
    }

    if (assignment.calendarEventId) {
      // Update existing event
      const event = await this.getEvent(assignment.calendarEventId)

      const startTime = new Date(assignment.dueDate)
      startTime.setHours(startTime.getHours() - 1)

      await this.updateEvent(assignment.calendarEventId, {
        summary: `📝 ${assignment.title}`,
        description: assignment.description
          ? `課程：${assignment.course?.name || '未分類'}\n\n${assignment.description}`
          : `課程：${assignment.course?.name || '未分類'}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Taipei',
        },
        end: {
          dateTime: assignment.dueDate.toISOString(),
          timeZone: 'Asia/Taipei',
        },
      })
    } else {
      // Create new event
      const event = await this.createEventFromAssignment({
        title: assignment.title,
        description: assignment.description || undefined,
        dueDate: assignment.dueDate,
        courseId: assignment.courseId,
      })

      // Save event ID to assignment
      await db.assignment.update({
        where: { id: assignmentId },
        data: { calendarEventId: event.id },
      })
    }

    return true
  }

  /**
   * Remove assignment from calendar
   */
  async unsyncAssignment(assignmentId: string) {
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || !assignment.calendarEventId) {
      return false
    }

    try {
      await this.deleteEvent(assignment.calendarEventId)
    } catch (error) {
      // Event may already be deleted, ignore error
      console.error('Failed to delete calendar event:', error)
    }

    // Remove event ID from assignment
    await db.assignment.update({
      where: { id: assignmentId },
      data: { calendarEventId: null },
    })

    return true
  }
}
