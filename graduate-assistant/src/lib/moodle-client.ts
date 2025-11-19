"""
Moodle API Client for Next.js

This client communicates with the Python FastAPI Moodle service.
"""

export interface MoodleCredentials {
  username: string
  password: string
  baseUrl?: string
}

export interface MoodleCourse {
  id: string
  name: string
  url: string
  description?: string
  teacher?: string
  semester?: string
}

export interface MoodleCourseContent {
  section_name: string
  activities: {
    type: string
    name: string
    url: string
    description?: string
  }[]
}

export interface MoodleCourseDetail extends MoodleCourse {
  contents: MoodleCourseContent[]
}

export interface MoodleAssignment {
  id: string
  course_id: string
  course_name: string
  name: string
  due_date?: string
  status?: string
  url: string
  description?: string
}

export interface MoodleSyncResponse {
  success: boolean
  message: string
  courses_count: number
  assignments_count: number
  data: {
    courses: MoodleCourseDetail[]
    assignments: MoodleAssignment[]
    synced_at: string
  }
}

export interface MoodleLoginResponse {
  success: boolean
  message: string
  session_id?: string
}

/**
 * Moodle API Client
 *
 * Communicates with the Python FastAPI service for Moodle integration.
 */
export class MoodleClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.MOODLE_SERVICE_URL || 'http://localhost:8000'
    this.apiKey = process.env.MOODLE_SERVICE_API_KEY || ''
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || `HTTP ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`Moodle API Error (${endpoint}):`, error)
      throw error
    }
  }

  /**
   * Test connection to Moodle service
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.fetchWithAuth('/health')
  }

  /**
   * Login to Moodle
   */
  async login(credentials: MoodleCredentials): Promise<MoodleLoginResponse> {
    return this.fetchWithAuth('/api/moodle/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  /**
   * Get all courses
   */
  async getCourses(): Promise<MoodleCourse[]> {
    return this.fetchWithAuth('/api/moodle/courses')
  }

  /**
   * Get course detail with contents
   */
  async getCourseDetail(courseId: string): Promise<MoodleCourseDetail> {
    return this.fetchWithAuth(`/api/moodle/courses/${courseId}`)
  }

  /**
   * Get all assignments (optionally filtered by course)
   */
  async getAssignments(courseId?: string): Promise<MoodleAssignment[]> {
    const endpoint = courseId
      ? `/api/moodle/assignments?course_id=${courseId}`
      : '/api/moodle/assignments'
    return this.fetchWithAuth(endpoint)
  }

  /**
   * Perform full sync of Moodle data
   *
   * This operation may take several minutes depending on the number of courses.
   */
  async syncAll(credentials: MoodleCredentials): Promise<MoodleSyncResponse> {
    return this.fetchWithAuth('/api/moodle/sync', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }
}

// Singleton instance
export const moodleClient = new MoodleClient()
