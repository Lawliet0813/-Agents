'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { trpc } from '~/lib/trpc/client'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const { data: course, isLoading } = trpc.courses.get.useQuery({ id: courseId })

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">載入中...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mb-4">找不到此課程</p>
              <Link href="/dashboard/courses">
                <Button variant="outline">返回課程列表</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group contents by week number
  type CourseContent = NonNullable<typeof course.contents>[number]
  const contentsByWeek = course.contents?.reduce((acc: Record<number, CourseContent[]>, content: CourseContent) => {
    const week = content.weekNumber || 0
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(content)
    return acc
  }, {} as Record<number, CourseContent[]>)

  const sortedWeeks = Object.keys(contentsByWeek || {})
    .map(Number)
    .sort((a, b) => a - b)

  // Calculate progress
  type Assignment = NonNullable<typeof course.assignments>[number]
  type VoiceNote = NonNullable<typeof course.voiceNotes>[number]
  const totalAssignments = course.assignments?.length || 0
  const completedAssignments = course.assignments?.filter((a: Assignment) => a.status === 'completed').length || 0
  const progressPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0

  // Get upcoming assignments (not completed and due in the future)
  const upcomingAssignments = course.assignments
    ?.filter((a: Assignment) => a.status !== 'completed' && new Date(a.dueDate) > new Date())
    .sort((a: Assignment, b: Assignment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            {course.semester && (
              <p className="text-sm text-gray-500 mt-1">{course.semester}</p>
            )}
          </div>
        </div>
      </div>

      {/* Course Info Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>課程資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">課程描述</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {course.instructor && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">授課教師</h3>
                  <p className="text-gray-600">{course.instructor}</p>
                </div>
              )}
              {course.lastSyncedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">最後同步時間</h3>
                  <p className="text-gray-600">
                    {new Date(course.lastSyncedAt).toLocaleString('zh-TW')}
                  </p>
                </div>
              )}
            </div>
            {course.moodleUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Moodle 連結</h3>
                <a
                  href={course.moodleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  前往 Moodle 課程頁面
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>學習進度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">作業完成度</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                已完成 {completedAssignments} / {totalAssignments} 個作業
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>課程內容</span>
                </div>
                <span className="font-medium">{course.contents?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>作業數量</span>
                </div>
                <span className="font-medium">{totalAssignments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>語音筆記</span>
                </div>
                <span className="font-medium">{course.voiceNotes?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>即將到期的作業</CardTitle>
              <Link href="/dashboard/assignments">
                <Button variant="ghost" size="sm">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssignments.map((assignment: Assignment) => {
                const daysUntilDue = Math.ceil(
                  (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{assignment.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(assignment.dueDate).toLocaleDateString('zh-TW')}
                        </p>
                        <p className={`text-xs ${daysUntilDue <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                          {daysUntilDue === 0 ? '今天到期' : `${daysUntilDue} 天後到期`}
                        </p>
                      </div>
                      <Badge variant={daysUntilDue <= 3 ? 'destructive' : 'secondary'}>
                        {assignment.status === 'pending' ? '待完成' : '進行中'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Contents by Week */}
      <Card>
        <CardHeader>
          <CardTitle>課程內容</CardTitle>
          <CardDescription>依週次組織的課程資料</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedWeeks.length > 0 ? (
            <div className="space-y-6">
              {sortedWeeks.map((week) => (
                <div key={week} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {week === 0 ? '一般資料' : `第 ${week} 週`}
                  </h3>
                  <div className="space-y-2">
                    {contentsByWeek?.[week]?.map((content: CourseContent) => (
                      <div
                        key={content.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {content.type === 'file' ? (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : content.type === 'url' ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{content.title}</h4>
                          {content.description && (
                            <p className="text-sm text-gray-600 mt-1">{content.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {content.type === 'file' ? '檔案' : content.type === 'url' ? '連結' : '其他'}
                            </Badge>
                            {content.moodleUrl && (
                              <a
                                href={content.moodleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                開啟內容
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>目前沒有課程內容</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Assignments */}
      {course.assignments && course.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>所有作業</CardTitle>
                <CardDescription>此課程的所有作業列表</CardDescription>
              </div>
              <Link href="/dashboard/assignments">
                <Button variant="outline" size="sm">
                  前往作業管理
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {course.assignments
                .sort((a: Assignment, b: Assignment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((assignment: Assignment) => {
                  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed'
                  const isCompleted = assignment.status === 'completed'

                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                            {assignment.title}
                          </h4>
                          {isOverdue && <Badge variant="destructive">已逾期</Badge>}
                          {isCompleted && <Badge className="bg-green-600">已完成</Badge>}
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            到期日：{new Date(assignment.dueDate).toLocaleDateString('zh-TW')}
                          </span>
                          {assignment.moodleUrl && (
                            <a
                              href={assignment.moodleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              在 Moodle 開啟
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Notes */}
      {course.voiceNotes && course.voiceNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近的語音筆記</CardTitle>
            <CardDescription>與此課程相關的語音筆記（最多顯示 5 筆）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.voiceNotes.map((note: VoiceNote) => (
                <div key={note.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{note.title || '未命名筆記'}</h4>
                    {note.transcription && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.transcription}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      錄製於 {new Date(note.recordedAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
