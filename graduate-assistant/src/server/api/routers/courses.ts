import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { syncService } from '~/server/services/sync-service'

export const coursesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.course.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        contents: {
          orderBy: { weekNumber: 'asc' },
          take: 10, // Limit to first 10 contents per course for list view
        },
        _count: {
          select: {
            contents: true,
            assignments: true,
            voiceNotes: true,
          },
        },
      },
      orderBy: { lastSyncedAt: 'desc' },
    })
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.course.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          contents: {
            orderBy: [{ weekNumber: 'asc' }, { createdAt: 'asc' }],
          },
          assignments: {
            orderBy: { dueDate: 'asc' },
          },
          voiceNotes: {
            orderBy: { recordedAt: 'desc' },
            take: 5,
          },
        },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        moodleCourseId: z.string(),
        name: z.string(),
        semester: z.string().optional(),
        instructor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.course.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        semester: z.string().optional(),
        instructor: z.string().optional(),
        notionPageId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.course.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.course.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })
    }),

  sync: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        baseUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Call sync service to fetch data from Moodle and save to database
      const result = await syncService.performFullSync(ctx.session.user.id, {
        username: input.username,
        password: input.password,
        baseUrl: input.baseUrl,
      })

      return {
        success: result.success,
        message: result.message,
        coursesCreated: result.coursesCreated,
        coursesUpdated: result.coursesUpdated,
        assignmentsCreated: result.assignmentsCreated,
        assignmentsUpdated: result.assignmentsUpdated,
        errors: result.errors,
      }
    }),

  syncLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      return syncService.getSyncLogs(ctx.session.user.id, input.limit)
    }),
})
