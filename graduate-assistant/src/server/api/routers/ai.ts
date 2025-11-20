import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '~/env'

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

export const aiRouter = createTRPCRouter({
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
            })
          )
          .optional(),
        context: z
          .object({
            courseName: z.string().optional(),
            assignmentName: z.string().optional(),
            recentNotes: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { message, conversationHistory = [], context } = input

      // Build system prompt with context
      let systemPrompt = `你是一個專業的學習助手，專門協助大學生管理課程、作業和學習進度。你的任務是：

1. 回答關於課程內容的問題
2. 協助完成作業和項目
3. 提供學習建議和時間管理技巧
4. 幫助理解複雜概念
5. 生成學習計劃和複習指南

請使用繁體中文回答，保持專業且友善的語氣。如果問題超出你的能力範圍，請誠實說明。`

      if (context?.courseName) {
        systemPrompt += `\n\n當前課程：${context.courseName}`
      }

      if (context?.assignmentName) {
        systemPrompt += `\n當前作業：${context.assignmentName}`
      }

      if (context?.recentNotes && context.recentNotes.length > 0) {
        systemPrompt += `\n\n最近的筆記摘要：\n${context.recentNotes.slice(0, 3).join('\n')}`
      }

      // Build messages array
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: message,
        },
      ]

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        })

        const responseText =
          response.content[0].type === 'text' ? response.content[0].text : ''

        return {
          message: responseText,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          },
        }
      } catch (error) {
        console.error('AI chat error:', error)
        throw new Error('AI 助手暫時無法回應，請稍後再試')
      }
    }),

  quickHelp: protectedProcedure
    .input(
      z.object({
        type: z.enum(['assignment', 'concept', 'timeManagement', 'exam']),
        topic: z.string(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prompts = {
        assignment: `我需要協助完成作業：「${input.topic}」${input.details ? `\n詳細資訊：${input.details}` : ''}\n\n請提供：\n1. 作業分解步驟\n2. 重點提示\n3. 時間分配建議`,
        concept: `請解釋這個概念：「${input.topic}」${input.details ? `\n補充說明：${input.details}` : ''}\n\n請提供：\n1. 簡單易懂的解釋\n2. 實際例子\n3. 相關概念連結`,
        timeManagement: `我需要時間管理建議${input.topic ? `關於：${input.topic}` : ''}${input.details ? `\n目前情況：${input.details}` : ''}\n\n請提供：\n1. 優先級排序\n2. 時間分配建議\n3. 具體執行步驟`,
        exam: `我需要準備考試：「${input.topic}」${input.details ? `\n考試範圍：${input.details}` : ''}\n\n請提供：\n1. 複習計劃\n2. 重點整理建議\n3. 複習技巧`,
      }

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system:
            '你是一個專業的學習助手。請使用繁體中文提供清晰、實用的建議。',
          messages: [
            {
              role: 'user',
              content: prompts[input.type],
            },
          ],
        })

        const responseText =
          response.content[0].type === 'text' ? response.content[0].text : ''

        return {
          advice: responseText,
        }
      } catch (error) {
        console.error('Quick help error:', error)
        throw new Error('無法生成建議，請稍後再試')
      }
    }),
})
