import { createTRPCRouter } from '~/server/api/trpc'
import { authRouter } from './routers/auth'
import { coursesRouter } from './routers/courses'
import { assignmentsRouter } from './routers/assignments'
import { notesRouter } from './routers/notes'
import { syncRouter } from './routers/sync'
import { aiRouter } from './routers/ai'
import { calendarRouter } from './routers/calendar'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  courses: coursesRouter,
  assignments: assignmentsRouter,
  notes: notesRouter,
  sync: syncRouter,
  ai: aiRouter,
  calendar: calendarRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
