import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const notesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          courseId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.voiceNote.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.courseId && { courseId: input.courseId }),
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.voiceNote.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          course: true,
        },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        originalFilePath: z.string(),
        recordedAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.voiceNote.create({
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
        transcript: z.string().optional(),
        processedNotes: z.string().optional(),
        notionPageId: z.string().optional(),
        courseId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.voiceNote.update({
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
      return ctx.db.voiceNote.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })
    }),
})
