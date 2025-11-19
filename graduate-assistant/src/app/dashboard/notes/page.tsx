'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { VoiceRecorder } from '~/components/voice-recorder'
import { trpc } from '~/lib/trpc/client'

export default function VoiceNotesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [showRecorder, setShowRecorder] = useState(false)

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

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((note: VoiceNote) =>
        note.transcript?.toLowerCase().includes(query) ||
        note.processedNotes?.toLowerCase().includes(query) ||
        note.course?.name?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [voiceNotes, courseFilter, searchQuery])

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">語音筆記</h1>
          <p className="text-gray-600 mt-1">管理您的課程錄音和筆記</p>
        </div>
        <Button onClick={() => setShowRecorder(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          新增語音筆記
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">已轉錄</p>
                <p className="text-2xl font-bold">
                  {voiceNotes?.filter((n) => n.transcript).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">關聯課程</p>
                <p className="text-2xl font-bold">
                  {new Set(voiceNotes?.filter((n) => n.courseId).map((n) => n.courseId)).size || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
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

            {/* Course Filter */}
            <div className="md:w-64">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有課程</option>
                <option value="none">未分類</option>
                {courses?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
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
                          <CardTitle className="text-base line-clamp-1">
                            {note.course?.name || '未分類筆記'}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(note.recordedAt).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </CardDescription>
                        </div>
                        {note.transcript && (
                          <Badge variant="secondary" className="text-xs">
                            已轉錄
                          </Badge>
                        )}
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
                          <Button variant="ghost" size="sm" className="flex-1 text-xs">
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
    </div>
  )
}
