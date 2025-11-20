'use client'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { MoodleSyncDialog } from '~/components/sync/MoodleSyncDialog'
import { trpc } from '~/lib/trpc/client'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = trpc.auth.getSession.useQuery()
  const { data: user } = trpc.auth.getUser.useQuery(undefined, {
    enabled: !!session?.user,
  })

  // Fetch real data
  const { data: courses, isLoading: coursesLoading } = trpc.courses.list.useQuery()
  const { data: allAssignments, isLoading: assignmentsLoading } = trpc.assignments.list.useQuery()
  const { data: upcomingAssignments } = trpc.assignments.getUpcoming.useQuery({ days: 7 })
  const { data: syncLogs } = trpc.courses.syncLogs.useQuery({ limit: 5 })

  // Calculate statistics
  type Assignment = NonNullable<typeof allAssignments>[number]
  const totalCourses = courses?.length || 0
  const pendingAssignments = allAssignments?.filter((a: Assignment) => a.status !== 'completed').length || 0
  const totalVoiceNotes = courses?.reduce((sum: number, course: any) => sum + (course._count?.voiceNotes || 0), 0) || 0

  // Calculate days until due
  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            歡迎回來，{user?.name || session?.user?.name || '使用者'}！
          </h1>
          <p className="text-gray-600 mt-1">
            這是您的學習儀表板概覽
          </p>
        </div>
        <MoodleSyncDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/courses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                本學期課程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coursesLoading ? '...' : totalCourses}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalCourses === 0 ? '尚未同步課程' : `已同步 ${totalCourses} 門課程`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                待完成作業
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assignmentsLoading ? '...' : pendingAssignments}</div>
              <p className="text-xs text-gray-500 mt-1">
                {pendingAssignments === 0 ? '目前沒有待辦事項' : `還有 ${pendingAssignments} 個作業待完成`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/notes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                語音筆記
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coursesLoading ? '...' : totalVoiceNotes}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalVoiceNotes === 0 ? '尚未建立筆記' : `共 ${totalVoiceNotes} 則語音筆記`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              本週到期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingAssignments?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {upcomingAssignments?.length === 0 ? '本週沒有作業' : `本週有 ${upcomingAssignments?.length} 個作業到期`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>即將到期的作業</CardTitle>
              <CardDescription>本週需要完成的作業</CardDescription>
            </div>
            <Link href="/dashboard/assignments">
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAssignments && upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssignments.slice(0, 5).map((assignment: any) => {
                const daysUntilDue = getDaysUntilDue(assignment.dueDate)
                const isUrgent = daysUntilDue <= 3

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                      isUrgent
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{assignment.title}</h4>
                      {assignment.course && (
                        <p className="text-sm text-gray-600 mt-0.5">{assignment.course.name}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      <Badge variant={isUrgent ? 'destructive' : 'secondary'}>
                        {daysUntilDue === 0
                          ? '今天'
                          : daysUntilDue === 1
                          ? '明天'
                          : `${daysUntilDue}天`}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(assignment.dueDate).toLocaleDateString('zh-TW', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>本週沒有即將到期的作業</p>
              <p className="text-sm mt-1">享受你的閒暇時光！</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近同步記錄</CardTitle>
          <CardDescription>Moodle 課程資料同步歷史</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs && syncLogs.length > 0 ? (
            <div className="space-y-4">
              {syncLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {log.status === 'success' ? (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {log.status === 'success' ? '同步成功' : '同步失敗'}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {log.itemsSynced ? `已同步 ${log.itemsSynced} 個項目` : log.errorMessage || '無詳細資訊'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.syncedAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <p>尚無同步記錄</p>
              <p className="text-sm mt-1">點擊右上角的「同步 Moodle 課程」開始同步</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
