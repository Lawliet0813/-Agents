import { Client } from '@notionhq/client'
import { db } from '~/server/db'

export class NotionService {
  private notion: Client | null = null

  constructor(private userId: string) {}

  /**
   * Initialize Notion client
   */
  private async getNotionClient() {
    if (this.notion) return this.notion

    const user = await db.user.findUnique({
      where: { id: this.userId },
      select: { notionToken: true },
    })

    if (!user?.notionToken) {
      throw new Error('未設定 Notion Token')
    }

    this.notion = new Client({ auth: user.notionToken })
    return this.notion
  }

  /**
   * Get user's Notion pages
   */
  async listPages() {
    const notion = await this.getNotionClient()

    const response = await notion.search({
      filter: { property: 'object', value: 'page' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    })

    return response.results
  }

  /**
   * Create a new page
   */
  async createPage(options: {
    title: string
    content: string
    parentPageId?: string
  }) {
    const notion = await this.getNotionClient()

    const parent = options.parentPageId
      ? { page_id: options.parentPageId }
      : { type: 'page_id' as const }

    // Convert markdown content to Notion blocks
    const blocks = this.markdownToBlocks(options.content)

    const response = await notion.pages.create({
      parent: parent as any,
      properties: {
        title: {
          title: [{ type: 'text', text: { content: options.title } }],
        },
      },
      children: blocks,
    })

    return response
  }

  /**
   * Update page content
   */
  async updatePage(pageId: string, content: string) {
    const notion = await this.getNotionClient()

    const blocks = this.markdownToBlocks(content)

    // Clear existing blocks
    const existingBlocks = await notion.blocks.children.list({ block_id: pageId })
    for (const block of existingBlocks.results) {
      if ('id' in block) {
        await notion.blocks.delete({ block_id: block.id })
      }
    }

    // Add new blocks
    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })

    return true
  }

  /**
   * Sync voice note to Notion
   */
  async syncVoiceNote(voiceNoteId: string) {
    const voiceNote = await db.voiceNote.findUnique({
      where: { id: voiceNoteId },
      include: { course: true },
    })

    if (!voiceNote) {
      throw new Error('語音筆記不存在')
    }

    const title = `${voiceNote.course?.name || '未分類'} - ${new Date(voiceNote.recordedAt).toLocaleDateString('zh-TW')}`

    const content = `# ${title}

**錄音時間**: ${new Date(voiceNote.recordedAt).toLocaleString('zh-TW')}
**課程**: ${voiceNote.course?.name || '未分類'}

## 逐字稿

${voiceNote.transcript || '無逐字稿'}

## AI 筆記

${voiceNote.processedNotes || '無 AI 筆記'}
`

    if (voiceNote.notionPageId) {
      // Update existing page
      await this.updatePage(voiceNote.notionPageId, content)
    } else {
      // Create new page
      const page = await this.createPage({
        title,
        content,
        parentPageId: voiceNote.course?.notionPageId || undefined,
      })

      // Save Notion page ID
      await db.voiceNote.update({
        where: { id: voiceNoteId },
        data: { notionPageId: page.id },
      })
    }

    return true
  }

  /**
   * Sync assignment to Notion
   */
  async syncAssignment(assignmentId: string) {
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })

    if (!assignment) {
      throw new Error('作業不存在')
    }

    const title = `📝 ${assignment.title}`
    const content = `# ${title}

**課程**: ${assignment.course?.name || '未分類'}
**截止日期**: ${assignment.dueDate.toLocaleString('zh-TW')}
**狀態**: ${this.getStatusText(assignment.status)}

## 說明

${assignment.description || '無說明'}
`

    if (assignment.notionPageId) {
      // Update existing page
      await this.updatePage(assignment.notionPageId, content)
    } else {
      // Create new page
      const page = await this.createPage({
        title,
        content,
        parentPageId: assignment.course?.notionPageId || undefined,
      })

      // Save Notion page ID
      await db.assignment.update({
        where: { id: assignmentId },
        data: { notionPageId: page.id },
      })
    }

    return true
  }

  /**
   * Convert markdown to Notion blocks (simplified)
   */
  private markdownToBlocks(markdown: string): any[] {
    const lines = markdown.split('\n')
    const blocks: any[] = []

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.substring(2) } }],
          },
        })
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.substring(3) } }],
          },
        })
      } else if (line.trim()) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }],
          },
        })
      }
    }

    return blocks
  }

  /**
   * Get status text
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待處理',
      in_progress: '進行中',
      submitted: '已提交',
      completed: '已完成',
    }
    return statusMap[status] || status
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      const notion = await this.getNotionClient()
      const response = await notion.users.me({})
      return { success: true, user: response }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
