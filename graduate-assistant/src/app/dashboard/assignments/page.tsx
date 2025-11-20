'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import { trpc } from '~/lib/trpc/client'

export default function AssignmentsPage() {
  const [sortBy, setSortBy] = useState<'dueDate' | 'course' | 'status'>('dueDate')
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending')

  // Fetch all assignments
  const { data: allAssignments, isLoading } = trpc.assignments.list.useQuery()
  const utils = trpc.useUtils()

  // Update assignment status
  const updateStatusMutation = trpc.assignments.update.useMutation({
    onSuccess: () => {
      utils.assignments.list.invalidate()
      utils.courses.list.invalidate()
    },
  })

  // Filter assignments based on active tab
  type Assignment = NonNullable<typeof allAssignments>[number]
  const filteredAssignments = useMemo(() => {
    if (!allAssignments) return []

    let filtered = [...allAssignments]

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter((a: Assignment) => a.status !== 'completed')
    } else if (activeTab === 'completed') {
      filtered = filtered.filter((a: Assignment) => a.status === 'completed')
    }

    // Sort
    filtered.sort((a: Assignment, b: Assignment) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortBy === 'course') {
        return (a.course?.name || '').localeCompare(b.course?.name || '')
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

    return filtered
  }, [allAssignments, activeTab, sortBy])

  // Calculate days until due
  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get badge variant based on days until due
  const getDueDateBadgeVariant = (dueDate: Date, status: string) => {
    if (status === 'completed') return 'default'
    const days = getDaysUntilDue(dueDate)
    if (days < 0) return 'destructive'
    if (days <= 3) return 'destructive'
    if (days <= 7) return 'secondary'
    return 'outline'
  }

  // Format due date text
  const formatDueDate = (dueDate: Date) => {
    const days = getDaysUntilDue(dueDate)
    const dateStr = new Date(dueDate).toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    if (days < 0) return `已逾期 ${Math.abs(days)} 天 (${dateStr})`
    if (days === 0) return `今天到期 (${dateStr})`
    if (days === 1) return `明天到期 (${dateStr})`
    if (days <= 7) return `${days} 天後到期 (${dateStr})`
    return dateStr
  }

  // Toggle assignment completion
  const toggleCompletion = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await updateStatusMutation.mutateAsync({
      id: assignmentId,
      status: newStatus,
    })
  }

  // Render assignment card
  const renderAssignment = (assignment: Assignment) => {
    const isCompleted = assignment.status === 'completed'
    const isOverdue = getDaysUntilDue(assignment.dueDate) < 0 && !isCompleted
    const daysUntilDue = getDaysUntilDue(assignment.dueDate)

    return (
      <div
        key={assignment.id}
        className={`p-4 rounded-lg border transition-all ${
          isCompleted
            ? 'bg-green-50 border-green-200'
            : isOverdue
            ? 'bg-red-50 border-red-200'
            : daysUntilDue <= 3
            ? 'bg-orange-50 border-orange-200'
            : 'bg-white border-gray-200 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => toggleCompletion(assignment.id, assignment.status)}
              disabled={updateStatusMutation.isPending}
              className="flex-shrink-0 mt-1"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-green-600'
                }`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-gray-900 ${
                  isCompleted ? 'line-through text-gray-500' : ''
                }`}
              >
                {assignment.title}
              </h3>

              {assignment.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {assignment.course && (
                  <Link href={`/dashboard/courses/${assignment.course.id}`}>
                    <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      {assignment.course.name}
                    </Badge>
                  </Link>
                )}

                {!isCompleted && (
                  <Badge
                    variant={
                      assignment.status === 'in_progress'
                        ? 'secondary'
                        : assignment.status === 'submitted'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {assignment.status === 'in_progress'
                      ? '進行中'
                      : assignment.status === 'submitted'
                      ? '已繳交'
                      : '待處理'}
                  </Badge>
                )}

                {assignment.moodleUrl && (
                  <a
                    href={assignment.moodleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    在 Moodle 開啟
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <Badge variant={getDueDateBadgeVariant(assignment.dueDate, assignment.status)}>
              {isOverdue && !isCompleted ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : null}
              <span className="text-xs whitespace-nowrap">
                {getDaysUntilDue(assignment.dueDate) >= 0 && !isCompleted
                  ? `${getDaysUntilDue(assignment.dueDate)}天`
                  : isCompleted
                  ? '已完成'
                  : '逾期'}
              </span>
            </Badge>
            <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{formatDueDate(assignment.dueDate)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作業管理</h1>
          <p className="text-gray-600 mt-1">追蹤您的所有課程作業</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            排序：
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dueDate">截止日期</option>
            <option value="course">課程</option>
            <option value="status">狀態</option>
          </select>
        </div>
      </div>

      {allAssignments && allAssignments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">總作業數</p>
                  <p className="text-2xl font-bold">{allAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">待完成</p>
                  <p className="text-2xl font-bold">
                    {allAssignments.filter((a: Assignment) => a.status !== 'completed').length}
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold">
                    {allAssignments.filter((a: Assignment) => a.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">逾期</p>
                  <p className="text-2xl font-bold">
                    {
                      allAssignments.filter(
                        (a: Assignment) => getDaysUntilDue(a.dueDate) < 0 && a.status !== 'completed'
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">
            待完成
            {allAssignments && (
              <span className="ml-1.5 text-xs">
                ({allAssignments.filter((a: Assignment) => a.status !== 'completed').length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            已完成
            {allAssignments && (
              <span className="ml-1.5 text-xs">
                ({allAssignments.filter((a: Assignment) => a.status === 'completed').length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            全部
            {allAssignments && <span className="ml-1.5 text-xs">({allAssignments.length})</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
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
          ) : filteredAssignments.length > 0 ? (
            <div className="space-y-3">{filteredAssignments.map(renderAssignment)}</div>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <p className="text-gray-500 mb-2">
                    {activeTab === 'pending'
                      ? '目前沒有待完成的作業'
                      : activeTab === 'completed'
                      ? '目前沒有已完成的作業'
                      : '目前沒有任何作業'}
                  </p>
                  <p className="text-sm text-gray-400">同步課程後，作業將顯示在這裡</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
