'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { trpc } from '~/lib/trpc/client'

export default function PendingNotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  // Fetch data
  const { data: voiceNotes, isLoading } = trpc.notes.list.useQuery()
  const { data: courses } = trpc.courses.list.useQuery()
  const utils = trpc.useUtils()

  // Update mutation
  const updateMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
      setSelectedNoteId(null)
      setSelectedCourseId('')
    },
  })

  // Delete mutation
  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
    },
  })

  // Filter only NEEDS_REVIEW notes
  const pendingNotes = voiceNotes?.filter((note) => note.status === 'NEEDS_REVIEW') || []

  const handleAssignCourse = async (noteId: string, courseId: string) => {
    if (!courseId) return
    try {
      await updateMutation.mutateAsync({
        id: noteId,
        courseId,
      })
    } catch (error) {
      console.error('Failed to assign course:', error)
      alert('指定課程失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此語音筆記嗎？')) {
      await deleteMutation.mutateAsync({ id })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notes">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">待確認的語音筆記</h1>
          </div>
          <p className="text-gray-600 mt-1">手動指定無法自動識別的筆記所屬課程</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingNotes.length} 筆待確認
        </Badge>
      </div>

      {/* Info Box */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">為什麼需要手動確認？</p>
              <p className="text-xs text-amber-700 mt-1">
                系統無法自動識別這些語音筆記所屬的課程。可能原因：
                <br />• 錄音時間與課程時間表不符
                <br />• 檔案名稱不包含課程關鍵字
                <br />• 逐字稿內容無法判斷所屬課程
              </p>
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
      ) : pendingNotes.length > 0 ? (
        <div className="space-y-4">
          {pendingNotes.map((note) => {
            const suggestedCourses = note.suggestedCourses
              ? JSON.parse(note.suggestedCourses)
              : []

            return (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {note.fileName || '未命名錄音'}
                        </CardTitle>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          ⚠️ 待確認
                        </Badge>
                        <Badge variant={note.source === 'ICLOUD' ? 'default' : 'secondary'} className="text-xs">
                          {note.source === 'ICLOUD' ? '📱 iCloud' : '🌐 Web'}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-3 text-sm">
                        <span>
                          錄音時間：{new Date(note.recordedAt).toLocaleString('zh-TW')}
                        </span>
                        {note.duration && (
                          <span>• {Math.round(note.duration / 60)} 分鐘</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Transcript Preview */}
                  {note.transcript && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">逐字稿預覽</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{note.transcript}</p>
                    </div>
                  )}

                  {/* Identification Info */}
                  {note.identificationMethod && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        識別方式：{note.identificationMethod === 'time' ? '時間比對' : note.identificationMethod === 'filename' ? '檔名分析' : '內容分析'}
                        {note.identificationConfidence && ` (信心度：${note.identificationConfidence.toFixed(0)}%)`}
                      </span>
                    </div>
                  )}

                  {/* Suggested Courses */}
                  {suggestedCourses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">建議課程：</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedCourses.map((suggested: { courseId: string; courseName: string; confidence: number }) => (
                          <Badge
                            key={suggested.courseId}
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50"
                            onClick={() => handleAssignCourse(note.id, suggested.courseId)}
                          >
                            {suggested.courseName} ({suggested.confidence.toFixed(0)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Selection */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">指定課程：</p>
                    <div className="flex gap-2">
                      <select
                        value={selectedNoteId === note.id ? selectedCourseId : ''}
                        onChange={(e) => {
                          setSelectedNoteId(note.id)
                          setSelectedCourseId(e.target.value)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選擇課程...</option>
                        {courses?.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => handleAssignCourse(note.id, selectedCourseId)}
                        disabled={selectedNoteId !== note.id || !selectedCourseId || updateMutation.isPending}
                        className="px-6"
                      >
                        {updateMutation.isPending ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          '確認'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 mb-2 font-medium">太棒了！沒有待確認的筆記</p>
              <p className="text-sm text-gray-400">所有語音筆記都已成功識別課程</p>
              <Link href="/dashboard/notes">
                <Button variant="outline" className="mt-4">
                  返回筆記列表
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
