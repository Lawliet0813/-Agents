'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { trpc } from '~/lib/trpc/client'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    } else {
      // Week view
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }, [currentDate, view])

  // Fetch calendar events
  const { data: calendarEvents, isLoading: eventsLoading } = trpc.calendar.listEvents.useQuery({
    timeMin: dateRange.start,
    timeMax: dateRange.end,
  })

  // Fetch assignments
  const { data: assignments } = trpc.assignments.list.useQuery()

  // Fetch connection status
  const { data: connectionStatus } = trpc.calendar.getConnectionStatus.useQuery()

  // Combine events and assignments
  const allEvents = useMemo(() => {
    const events = calendarEvents?.map((event: any) => ({
      id: event.id,
      title: event.summary,
      start: new Date(event.start?.dateTime || event.start?.date),
      end: new Date(event.end?.dateTime || event.end?.date),
      type: 'calendar' as const,
      description: event.description,
    })) || []

    const assignmentEvents = assignments
      ?.filter((a: any) => a.dueDate >= dateRange.start && a.dueDate <= dateRange.end)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        start: a.dueDate,
        end: a.dueDate,
        type: 'assignment' as const,
        course: a.course?.name,
        status: a.status,
        synced: !!a.calendarEventId,
      })) || []

    return [...events, ...assignmentEvents].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [calendarEvents, assignments, dateRange])

  // Generate calendar grid for month view
  const calendarDays = useMemo(() => {
    if (view !== 'month') return []

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days = []

    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      const day = new Date(year, month, -startPadding + i + 1)
      days.push({ date: day, currentMonth: false })
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false })
    }

    return days
  }, [currentDate, view])

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    return allEvents.filter(
      (event) => event.start >= dayStart && event.start <= dayEnd
    )
  }

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">行事曆</h1>
          <p className="text-gray-600 mt-1">管理您的課程和作業日程</p>
        </div>
        <div className="flex items-center gap-2">
          {!connectionStatus?.connected && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              未連結 Google Calendar
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Warning */}
      {!connectionStatus?.connected && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-900">尚未連結 Google Calendar</p>
                <p className="text-xs text-amber-700 mt-1">
                  請先在設定頁面完成 Google 帳號授權，以同步行事曆事件。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPrevious}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  今天
                </Button>
                <Button variant="outline" size="sm" onClick={goToNext}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                })}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                月
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                週
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {view === 'month' && (
        <Card>
          <CardContent className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDay(day.date)
                const isToday = day.date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      day.currentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        day.currentMonth ? 'font-medium' : 'text-gray-400'
                      } ${isToday ? 'text-blue-600 font-bold' : ''}`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${
                            event.type === 'assignment'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                          title={event.title}
                        >
                          {event.type === 'assignment' ? '📝' : '📅'} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {view === 'week' && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const day = new Date(dateRange.start)
                day.setDate(day.getDate() + offset)
                const dayEvents = getEventsForDay(day)
                const isToday = day.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={offset}
                    className={`border rounded-lg p-4 ${
                      isToday ? 'border-blue-500 border-2 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>
                        {day.getDate()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {day.toLocaleDateString('zh-TW', { weekday: 'long' })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayEvents.length > 0 ? (
                        dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg border ${
                              event.type === 'assignment'
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {event.type === 'assignment' ? '📝' : '📅'} {event.title}
                                </div>
                                {event.type === 'assignment' && event.course && (
                                  <div className="text-xs text-gray-600 mt-1">{event.course}</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {event.start.toLocaleTimeString('zh-TW', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              {event.type === 'assignment' && (
                                <Badge
                                  variant="outline"
                                  className={
                                    event.synced
                                      ? 'bg-green-50 text-green-700 border-green-300'
                                      : 'bg-gray-50 text-gray-700 border-gray-300'
                                  }
                                >
                                  {event.synced ? '已同步' : '未同步'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-gray-400 py-4">
                          無事件
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
              <span>Google Calendar 事件</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200"></div>
              <span>課程作業</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
