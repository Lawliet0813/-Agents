'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { trpc } from '~/lib/trpc/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedQuickHelp, setSelectedQuickHelp] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ])
    },
    onError: (error) => {
      alert(`AI 助手錯誤：${error.message}`)
    },
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')

    await chatMutation.mutateAsync({
      message: inputMessage,
      conversationHistory: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickHelpButtons = [
    { label: '作業協助', icon: '📝', prompt: '我需要作業協助' },
    { label: '概念解釋', icon: '💡', prompt: '我想理解一個概念' },
    { label: '時間管理', icon: '⏰', prompt: '我需要時間管理建議' },
    { label: '考試準備', icon: '📚', prompt: '我需要準備考試' },
  ]

  const handleQuickHelp = (prompt: string) => {
    setInputMessage(prompt)
  }

  const handleClearHistory = () => {
    if (confirm('確定要清除對話歷史嗎？')) {
      setMessages([])
    }
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI 學習助手</h1>
          <p className="text-gray-600 mt-1">智能協助您的學習和作業</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={handleClearHistory}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            清除歷史
          </Button>
        )}
      </div>

      {/* Quick Help Buttons */}
      {messages.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickHelpButtons.map((button) => (
            <Card
              key={button.label}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickHelp(button.prompt)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{button.icon}</div>
                <p className="font-medium text-sm">{button.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  嗨！我是你的 AI 學習助手
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  我可以協助你完成作業、解釋概念、管理時間和準備考試。
                  <br />
                  選擇上方的快速協助或直接輸入問題開始對話。
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                          AI
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg p-4 bg-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                        AI
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="輸入您的問題... (Shift+Enter 換行，Enter 送出)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="px-6"
              size="lg"
            >
              {chatMutation.isPending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 提示：您可以詢問作業協助、概念解釋、學習建議等問題
          </p>
        </div>
      </Card>
    </div>
  )
}
