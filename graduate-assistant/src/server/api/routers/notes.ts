import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { transcribeBase64Audio } from '~/server/services/whisper-service'

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

  transcribe: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        language: z.enum(['zh', 'en', 'auto']).optional().default('zh'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the voice note
      const note = await ctx.db.voiceNote.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })

      if (!note) {
        throw new Error('語音筆記不存在')
      }

      if (!note.originalFilePath) {
        throw new Error('音頻檔案不存在')
      }

      if (note.transcript) {
        // Already transcribed, return existing
        return { transcript: note.transcript, alreadyTranscribed: true }
      }

      // Transcribe using Whisper
      const result = await transcribeBase64Audio(note.originalFilePath, {
        language: input.language,
      })

      // Update the note with transcript
      const updatedNote = await ctx.db.voiceNote.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          transcript: result.text,
          processedAt: new Date(),
        },
      })

      return {
        transcript: result.text,
        duration: result.duration,
        language: result.language,
        alreadyTranscribed: false,
      }
    }),
})
