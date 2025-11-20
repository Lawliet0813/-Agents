import Anthropic from '@anthropic-ai/sdk'
import { env } from '~/env'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

export interface NoteSummaryOptions {
  courseName?: string
  includeKeyPoints?: boolean
  includeQuestions?: boolean
  language?: 'zh' | 'en'
}

export interface NoteSummaryResult {
  summary: string
  keyPoints?: string[]
  suggestedTitle?: string
  questions?: string[]
}

/**
 * Generate summary for voice note transcript using Claude
 */
export async function summarizeNote(
  transcript: string,
  options: NoteSummaryOptions = {}
): Promise<NoteSummaryResult> {
  const {
    courseName,
    includeKeyPoints = true,
    includeQuestions = false,
    language = 'zh',
  } = options

  try {
    const systemPrompt = language === 'zh'
      ? '你是一個專業的學習助手，擅長整理和摘要課程筆記。請使用繁體中文回答。'
      : 'You are a professional learning assistant specialized in organizing and summarizing course notes.'

    const userPrompt = buildSummaryPrompt(transcript, {
      courseName,
      includeKeyPoints,
      includeQuestions,
      language,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the structured response
    return parseNoteSummary(responseText, { includeKeyPoints, includeQuestions })
  } catch (error) {
    console.error('AI summarization error:', error)
    throw new Error('AI 摘要生成失敗，請稍後再試')
  }
}

/**
 * Build the summary prompt based on options
 */
function buildSummaryPrompt(
  transcript: string,
  options: Required<NoteSummaryOptions>
): string {
  const { courseName, includeKeyPoints, includeQuestions, language } = options

  if (language === 'zh') {
    let prompt = `請幫我分析以下${courseName ? `「${courseName}」課程的` : ''}筆記內容：\n\n${transcript}\n\n`
    prompt += '請提供：\n'
    prompt += '1. 摘要：簡潔的內容摘要（2-3 句話）\n'

    if (includeKeyPoints) {
      prompt += '2. 關鍵點：列出 3-5 個重點（使用項目符號）\n'
    }

    prompt += `${includeKeyPoints ? '3' : '2'}. 建議標題：為這份筆記建議一個簡短的標題（少於 10 個字）\n`

    if (includeQuestions) {
      prompt += `${includeKeyPoints ? '4' : '3'}. 複習問題：生成 2-3 個複習用問題\n`
    }

    prompt += '\n請使用以下格式：\n'
    prompt += '【摘要】\n...\n\n'
    if (includeKeyPoints) {
      prompt += '【關鍵點】\n- ...\n- ...\n\n'
    }
    prompt += '【建議標題】\n...\n'
    if (includeQuestions) {
      prompt += '\n【複習問題】\n1. ...\n2. ...\n'
    }
  } else {
    let prompt = `Please analyze the following${courseName ? ` notes from "${courseName}" course` : ' notes'}:\n\n${transcript}\n\n`
    prompt += 'Please provide:\n'
    prompt += '1. Summary: A concise summary (2-3 sentences)\n'

    if (includeKeyPoints) {
      prompt += '2. Key Points: List 3-5 main points (bullet points)\n'
    }

    prompt += `${includeKeyPoints ? '3' : '2'}. Suggested Title: A short title for this note (less than 10 words)\n`

    if (includeQuestions) {
      prompt += `${includeKeyPoints ? '4' : '3'}. Review Questions: Generate 2-3 review questions\n`
    }

    prompt += '\nPlease use this format:\n'
    prompt += '[Summary]\n...\n\n'
    if (includeKeyPoints) {
      prompt += '[Key Points]\n- ...\n- ...\n\n'
    }
    prompt += '[Suggested Title]\n...\n'
    if (includeQuestions) {
      prompt += '\n[Review Questions]\n1. ...\n2. ...\n'
    }
  }

  return prompt
}

/**
 * Parse the Claude response into structured data
 */
function parseNoteSummary(
  text: string,
  options: { includeKeyPoints: boolean; includeQuestions: boolean }
): NoteSummaryResult {
  const result: NoteSummaryResult = {
    summary: '',
  }

  // Extract summary
  const summaryMatch = text.match(/【摘要】\s*([\s\S]*?)(?=\n\n【|$)/i) ||
                       text.match(/\[Summary\]\s*([\s\S]*?)(?=\n\n\[|$)/i)
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim()
  }

  // Extract key points
  if (options.includeKeyPoints) {
    const keyPointsMatch = text.match(/【關鍵點】\s*([\s\S]*?)(?=\n\n【|$)/i) ||
                           text.match(/\[Key Points\]\s*([\s\S]*?)(?=\n\n\[|$)/i)
    if (keyPointsMatch) {
      const points = keyPointsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
      if (points.length > 0) {
        result.keyPoints = points
      }
    }
  }

  // Extract suggested title
  const titleMatch = text.match(/【建議標題】\s*([\s\S]*?)(?=\n\n【|$)/i) ||
                     text.match(/\[Suggested Title\]\s*([\s\S]*?)(?=\n\n\[|$)/i)
  if (titleMatch) {
    result.suggestedTitle = titleMatch[1].trim()
  }

  // Extract questions
  if (options.includeQuestions) {
    const questionsMatch = text.match(/【複習問題】\s*([\s\S]*?)$/i) ||
                           text.match(/\[Review Questions\]\s*([\s\S]*?)$/i)
    if (questionsMatch) {
      const questions = questionsMatch[1]
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
      if (questions.length > 0) {
        result.questions = questions
      }
    }
  }

  // Fallback: if no structured data found, use the entire text as summary
  if (!result.summary) {
    result.summary = text.trim()
  }

  return result
}

/**
 * Analyze course content and extract key concepts
 */
export async function analyzeCourseContent(
  content: string,
  courseName: string
): Promise<{
  summary: string
  concepts: string[]
  topics: string[]
}> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: '你是一個專業的學習助手，擅長分析課程內容並提取關鍵概念。請使用繁體中文回答。',
      messages: [
        {
          role: 'user',
          content: `請分析以下「${courseName}」課程的內容，並提供：

1. 課程摘要（3-5 句話）
2. 關鍵概念列表（5-10 個概念）
3. 主要主題列表（3-5 個主題）

課程內容：
${content}

請使用以下格式：
【課程摘要】
...

【關鍵概念】
- 概念1
- 概念2
...

【主要主題】
- 主題1
- 主題2
...`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse response
    const summaryMatch = responseText.match(/【課程摘要】\s*([\s\S]*?)(?=\n\n【|$)/i)
    const conceptsMatch = responseText.match(/【關鍵概念】\s*([\s\S]*?)(?=\n\n【|$)/i)
    const topicsMatch = responseText.match(/【主要主題】\s*([\s\S]*?)$/i)

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      concepts: conceptsMatch
        ? conceptsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(Boolean)
        : [],
      topics: topicsMatch
        ? topicsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(Boolean)
        : [],
    }
  } catch (error) {
    console.error('Course analysis error:', error)
    throw new Error('課程分析失敗，請稍後再試')
  }
}

/**
 * Generate study recommendations based on user data
 */
export async function generateStudyRecommendations(context: {
  upcomingAssignments: Array<{ name: string; dueDate: Date; course: string }>
  recentNotes: Array<{ courseName: string; date: Date }>
  studyGoals?: string
}): Promise<{
  priorities: string[]
  timeAllocation: Record<string, number>
  suggestions: string[]
}> {
  try {
    const contextStr = `
即將到期的作業：
${context.upcomingAssignments.map(a => `- ${a.course}: ${a.name} (截止日期: ${a.dueDate.toLocaleDateString('zh-TW')})`).join('\n')}

最近的筆記：
${context.recentNotes.map(n => `- ${n.courseName} (日期: ${n.date.toLocaleDateString('zh-TW')})`).join('\n')}

${context.studyGoals ? `學習目標：${context.studyGoals}` : ''}
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: '你是一個專業的學習規劃助手，擅長分析學習進度並提供個人化建議。請使用繁體中文回答。',
      messages: [
        {
          role: 'user',
          content: `基於以下學習情況，請提供個人化的學習建議：

${contextStr}

請提供：
1. 優先事項列表（3-5 項）
2. 學習建議（3-5 個具體建議）

格式：
【優先事項】
- ...

【學習建議】
- ...`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    const prioritiesMatch = responseText.match(/【優先事項】\s*([\s\S]*?)(?=\n\n【|$)/i)
    const suggestionsMatch = responseText.match(/【學習建議】\s*([\s\S]*?)$/i)

    return {
      priorities: prioritiesMatch
        ? prioritiesMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(Boolean)
        : [],
      timeAllocation: {}, // Could be enhanced with specific time recommendations
      suggestions: suggestionsMatch
        ? suggestionsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(Boolean)
        : [],
    }
  } catch (error) {
    console.error('Study recommendations error:', error)
    throw new Error('生成學習建議失敗，請稍後再試')
  }
}
