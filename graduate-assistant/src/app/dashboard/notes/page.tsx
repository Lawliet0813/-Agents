'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { VoiceRecorder } from '~/components/voice-recorder'
import { AudioPlayer } from '~/components/audio-player'
import { trpc } from '~/lib/trpc/client'

type VoiceNoteSource = 'WEB' | 'ICLOUD'
type VoiceNoteStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW'

export default function VoiceNotesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showRecorder, setShowRecorder] = useState(false)
  const [playingNote, setPlayingNote] = useState<{ id: string; title: string; audioUrl: string; transcript: string | null } | null>(null)

  // Fetch data
  const { data: voiceNotes, isLoading } = trpc.notes.list.useQuery()
  const { data: courses } = trpc.courses.list.useQuery()
  const utils = trpc.useUtils()

  // Delete mutation
  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
    },
  })

  // Transcribe mutation
  const transcribeMutation = trpc.notes.transcribe.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
    },
  })

  // Summarize mutation
  const summarizeMutation = trpc.notes.summarize.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
    },
  })

  // Filter and search
  type VoiceNote = NonNullable<typeof voiceNotes>[number]
  const filteredNotes = useMemo(() => {
    if (!voiceNotes) return []

    let filtered = [...voiceNotes]

    // Filter by course
    if (courseFilter !== 'all') {
      filtered = filtered.filter((note: VoiceNote) =>
        courseFilter === 'none' ? !note.courseId : note.courseId === courseFilter
      )
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((note: VoiceNote) => note.source === sourceFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((note: VoiceNote) => note.status === statusFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((note: VoiceNote) =>
        note.transcript?.toLowerCase().includes(query) ||
        note.processedNotes?.toLowerCase().includes(query) ||
        note.course?.name?.toLowerCase().includes(query) ||
        note.fileName?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [voiceNotes, courseFilter, sourceFilter, statusFilter, searchQuery])

  // Group by date
  const groupedNotes = useMemo(() => {
    const groups: Record<string, VoiceNote[]> = {}

    filteredNotes.forEach((note) => {
      const date = new Date(note.recordedAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(note)
    })

    return Object.entries(groups).sort((a, b) => {
      return new Date(b[1][0].recordedAt).getTime() - new Date(a[1][0].recordedAt).getTime()
    })
  }, [filteredNotes])

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此語音筆記嗎？')) {
      await deleteMutation.mutateAsync({ id })
    }
  }

  const handleTranscribe = async (id: string) => {
    try {
      await transcribeMutation.mutateAsync({ id, language: 'zh' })
    } catch (error) {
      console.error('Transcription error:', error)
      alert('轉錄失敗，請檢查是否已設定 OpenAI API Key')
    }
  }

  const handleSummarize = async (id: string) => {
    try {
      await summarizeMutation.mutateAsync({
        id,
        includeKeyPoints: true,
        includeQuestions: false,
      })
    } catch (error) {
      console.error('Summarization error:', error)
      alert('生成摘要失敗，請檢查是否已設定 Anthropic API Key')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">語音筆記</h1>
          <p className="text-gray-600 mt-1">管理您的課程錄音和筆記</p>
        </div>
        <div className="flex gap-2">
          {voiceNotes?.filter((n: any) => n.status === 'NEEDS_REVIEW').length > 0 && (
            <Link href="/dashboard/notes/pending">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                待確認
                <Badge variant="destructive" className="ml-2">
                  {voiceNotes?.filter((n: any) => n.status === 'NEEDS_REVIEW').length}
                </Badge>
              </Button>
            </Link>
          )}
          <Button onClick={() => setShowRecorder(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            新增語音筆記
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">總筆記數</p>
                <p className="text-2xl font-bold">{voiceNotes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">iCloud</p>
                <p className="text-2xl font-bold">
                  {voiceNotes?.filter((n: any) => n.source === 'ICLOUD').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Web 錄音</p>
                <p className="text-2xl font-bold">
                  {voiceNotes?.filter((n: any) => n.source === 'WEB').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">已完成</p>
                <p className="text-2xl font-bold">
                  {voiceNotes?.filter((n: any) => n.status === 'COMPLETED').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">待確認</p>
                <p className="text-2xl font-bold">
                  {voiceNotes?.filter((n: any) => n.status === 'NEEDS_REVIEW').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="搜尋筆記內容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">課程</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">所有課程</option>
                  <option value="none">未分類</option>
                  {courses?.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">來源</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部來源</option>
                  <option value="WEB">Web 錄音</option>
                  <option value="ICLOUD">iCloud 同步</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部狀態</option>
                  <option value="PENDING">待處理</option>
                  <option value="PROCESSING">處理中</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="FAILED">失敗</option>
                  <option value="NEEDS_REVIEW">待確認</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-2 text-gray-600">載入中...</span>
            </div>
          </CardContent>
        </Card>
      ) : groupedNotes.length > 0 ? (
        <div className="space-y-6">
          {groupedNotes.map(([date, notes]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {date}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base line-clamp-1">
                              {note.course?.name || '未分類筆記'}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-xs flex items-center gap-2">
                            {new Date(note.recordedAt).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {note.fileName && (
                              <span className="text-xs text-gray-400">• {note.fileName}</span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {/* Source Badge */}
                          <Badge
                            variant={note.source === 'ICLOUD' ? 'default' : 'secondary'}
                            className="text-xs whitespace-nowrap"
                          >
                            {note.source === 'ICLOUD' ? '📱 iCloud' : '🌐 Web'}
                          </Badge>
                          {/* Status Badge */}
                          {note.status === 'COMPLETED' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                              ✓ 完成
                            </Badge>
                          )}
                          {note.status === 'PENDING' && (
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                              ⏳ 待處理
                            </Badge>
                          )}
                          {note.status === 'PROCESSING' && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                              ⚙️ 處理中
                            </Badge>
                          )}
                          {note.status === 'FAILED' && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                              ✗ 失敗
                            </Badge>
                          )}
                          {note.status === 'NEEDS_REVIEW' && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                              ⚠️ 待確認
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {note.transcript && (
                        <p className="text-sm text-gray-600 line-clamp-3">{note.transcript}</p>
                      )}
                      {note.processedNotes && (
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-900">
                          <p className="font-medium mb-1">📝 AI 摘要</p>
                          <p className="line-clamp-2">{note.processedNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {!note.transcript ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTranscribe(note.id)}
                            disabled={transcribeMutation.isPending}
                            className="flex-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {transcribeMutation.isPending ? (
                              <>
                                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                轉錄中...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                AI 轉錄
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPlayingNote({
                                  id: note.id,
                                  title: note.course?.name || '未分類筆記',
                                  audioUrl: note.originalFilePath,
                                  transcript: note.transcript,
                                })
                              }
                              className="text-xs"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              播放
                            </Button>
                            {!note.processedNotes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSummarize(note.id)}
                                disabled={summarizeMutation.isPending}
                                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                {summarizeMutation.isPending ? (
                                  <>
                                    <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    生成中...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    生成摘要
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          刪除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <p className="text-gray-500 mb-2">
                {searchQuery || courseFilter !== 'all' ? '沒有符合條件的筆記' : '尚未建立語音筆記'}
              </p>
              {!searchQuery && courseFilter === 'all' && (
                <p className="text-sm text-gray-400">點擊「新增語音筆記」開始錄製</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Recorder Dialog */}
      <VoiceRecorder
        open={showRecorder}
        onClose={() => setShowRecorder(false)}
        onSuccess={() => {
          setShowRecorder(false)
          utils.notes.list.invalidate()
        }}
      />

      {/* Audio Player Dialog */}
      {playingNote && (
        <AudioPlayer
          open={!!playingNote}
          onClose={() => setPlayingNote(null)}
          audioUrl={playingNote.audioUrl}
          title={playingNote.title}
          transcript={playingNote.transcript}
        />
      )}
    </div>
  )
}
