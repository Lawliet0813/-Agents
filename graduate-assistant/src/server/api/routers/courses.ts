import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This will call the Python service to scrape Moodle
      // For now, return a placeholder
      // Implementation will be in Task 4.2
      return {
        success: true,
        message: 'Sync endpoint ready - Python service integration pending',
        coursesCount: 0,
      }
    }),
})
