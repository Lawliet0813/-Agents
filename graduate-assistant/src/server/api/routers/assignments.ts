import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const assignmentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          courseId: z.string().optional(),
          status: z.enum(['pending', 'in_progress', 'submitted', 'completed']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.assignment.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.courseId && { courseId: input.courseId }),
          ...(input?.status && { status: input.status }),
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              instructor: true,
            },
          },
          courseContent: {
            select: {
              id: true,
              title: true,
              weekNumber: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.assignment.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          course: true,
          courseContent: true,
        },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        courseContentId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.assignment.create({
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
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        status: z.enum(['pending', 'in_progress', 'submitted', 'completed']).optional(),
        calendarEventId: z.string().optional(),
        notionPageId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.assignment.update({
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
      return ctx.db.assignment.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })
    }),

  getUpcoming: protectedProcedure
    .input(
      z.object({
        days: z.number().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(now.getDate() + input.days)

      return ctx.db.assignment.findMany({
        where: {
          userId: ctx.session.user.id,
          dueDate: {
            gte: now,
            lte: futureDate,
          },
          status: {
            not: 'completed',
          },
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      })
    }),
})
