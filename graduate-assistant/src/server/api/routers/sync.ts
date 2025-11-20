import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const syncRouter = createTRPCRouter({
  getLogs: protectedProcedure
    .input(
      z
        .object({
          syncType: z.enum(['moodle', 'calendar', 'notion', 'email']).optional(),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.syncLog.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.syncType && { syncType: input.syncType }),
        },
        orderBy: { startedAt: 'desc' },
        take: input?.limit || 20,
      })
    }),

  getLatestSync: protectedProcedure
    .input(
      z.object({
        syncType: z.enum(['moodle', 'calendar', 'notion', 'email']),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.syncLog.findFirst({
        where: {
          userId: ctx.session.user.id,
          syncType: input.syncType,
        },
        orderBy: { startedAt: 'desc' },
      })
    }),

  createLog: protectedProcedure
    .input(
      z.object({
        syncType: z.enum(['moodle', 'calendar', 'notion', 'email']),
        status: z.enum(['success', 'failed', 'partial']),
        itemsProcessed: z.number().default(0),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.syncLog.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      })
    }),
})
