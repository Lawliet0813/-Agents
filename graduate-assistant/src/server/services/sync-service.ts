/**
 * Sync Service
 *
 * Handles synchronization between Moodle service and database.
 * Transforms Moodle API data to Prisma schema format.
 */

import { db } from '~/server/db'
import { moodleClient, type MoodleSyncResponse } from '~/lib/moodle-client'

export interface SyncResult {
  success: boolean
  message: string
  coursesCreated: number
  coursesUpdated: number
  assignmentsCreated: number
  assignmentsUpdated: number
  errors: string[]
}

export class SyncService {
  /**
   * Sync courses from Moodle to database
   */
  async syncCourses(
    userId: string,
    syncData: MoodleSyncResponse
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const course of syncData.data.courses) {
      try {
        // Check if course already exists
        const existingCourse = await db.course.findFirst({
          where: {
            userId,
            moodleId: course.id,
          },
        })

        if (existingCourse) {
          // Update existing course
          await db.course.update({
            where: { id: existingCourse.id },
            data: {
              name: course.name,
              description: course.description || '',
              moodleUrl: course.url,
              lastSyncedAt: new Date(),
            },
          })
          updated++
        } else {
          // Create new course
          await db.course.create({
            data: {
              userId,
              moodleId: course.id,
              name: course.name,
              description: course.description || '',
              moodleUrl: course.url,
              lastSyncedAt: new Date(),
            },
          })
          created++
        }

        // Sync course contents
        await this.syncCourseContents(userId, course.id, course.contents)
      } catch (error) {
        console.error(`Error syncing course ${course.id}:`, error)
        errors.push(`Course ${course.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { created, updated, errors }
  }

  /**
   * Sync course contents
   */
  private async syncCourseContents(
    userId: string,
    moodleCourseId: string,
    contents: any[]
  ): Promise<void> {
    // Find the course in our database
    const course = await db.course.findFirst({
      where: {
        userId,
        moodleId: moodleCourseId,
      },
    })

    if (!course) return

    // Delete existing contents for this course
    await db.courseContent.deleteMany({
      where: { courseId: course.id },
    })

    // Create new contents
    for (const section of contents) {
      for (const activity of section.activities) {
        try {
          await db.courseContent.create({
            data: {
              courseId: course.id,
              title: activity.name,
              type: activity.type,
              url: activity.url,
              description: activity.description || '',
              week: section.section_name,
            },
          })
        } catch (error) {
          console.error(`Error creating course content:`, error)
        }
      }
    }
  }

  /**
   * Sync assignments from Moodle to database
   */
  async syncAssignments(
    userId: string,
    syncData: MoodleSyncResponse
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const assignment of syncData.data.assignments) {
      try {
        // Find the course this assignment belongs to
        const course = await db.course.findFirst({
          where: {
            userId,
            moodleId: assignment.course_id,
          },
        })

        if (!course) {
          errors.push(`Assignment ${assignment.name}: Course not found`)
          continue
        }

        // Parse due date
        let dueDate: Date | null = null
        if (assignment.due_date) {
          try {
            dueDate = new Date(assignment.due_date)
          } catch (e) {
            console.error('Error parsing due date:', assignment.due_date)
          }
        }

        // Determine status
        const status = assignment.status || 'pending'

        // Check if assignment already exists
        const existingAssignment = await db.assignment.findFirst({
          where: {
            userId,
            courseId: course.id,
            title: assignment.name,
          },
        })

        if (existingAssignment) {
          // Update existing assignment
          await db.assignment.update({
            where: { id: existingAssignment.id },
            data: {
              description: assignment.description || '',
              dueDate,
              status,
              moodleUrl: assignment.url,
            },
          })
          updated++
        } else {
          // Create new assignment
          await db.assignment.create({
            data: {
              userId,
              courseId: course.id,
              title: assignment.name,
              description: assignment.description || '',
              dueDate,
              status,
              moodleUrl: assignment.url,
            },
          })
          created++
        }
      } catch (error) {
        console.error(`Error syncing assignment ${assignment.id}:`, error)
        errors.push(`Assignment ${assignment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { created, updated, errors }
  }

  /**
   * Perform full sync from Moodle
   */
  async performFullSync(
    userId: string,
    credentials: { username: string; password: string; baseUrl?: string }
  ): Promise<SyncResult> {
    try {
      // Call Moodle service to fetch data
      const syncData = await moodleClient.syncAll(credentials)

      if (!syncData.success) {
        return {
          success: false,
          message: syncData.message,
          coursesCreated: 0,
          coursesUpdated: 0,
          assignmentsCreated: 0,
          assignmentsUpdated: 0,
          errors: [syncData.message],
        }
      }

      // Sync courses
      const courseResult = await this.syncCourses(userId, syncData)

      // Sync assignments
      const assignmentResult = await this.syncAssignments(userId, syncData)

      // Create sync log
      await db.syncLog.create({
        data: {
          userId,
          source: 'moodle',
          status: courseResult.errors.length === 0 && assignmentResult.errors.length === 0 ? 'success' : 'partial',
          itemsSynced: courseResult.created + courseResult.updated + assignmentResult.created + assignmentResult.updated,
          errors: [...courseResult.errors, ...assignmentResult.errors],
        },
      })

      return {
        success: true,
        message: `Synced ${syncData.courses_count} courses and ${syncData.assignments_count} assignments`,
        coursesCreated: courseResult.created,
        coursesUpdated: courseResult.updated,
        assignmentsCreated: assignmentResult.created,
        assignmentsUpdated: assignmentResult.updated,
        errors: [...courseResult.errors, ...assignmentResult.errors],
      }
    } catch (error) {
      console.error('Sync error:', error)

      // Create error log
      await db.syncLog.create({
        data: {
          userId,
          source: 'moodle',
          status: 'error',
          itemsSynced: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      })

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        coursesCreated: 0,
        coursesUpdated: 0,
        assignmentsCreated: 0,
        assignmentsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Get recent sync logs
   */
  async getSyncLogs(userId: string, limit: number = 10) {
    return db.syncLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

// Singleton instance
export const syncService = new SyncService()
