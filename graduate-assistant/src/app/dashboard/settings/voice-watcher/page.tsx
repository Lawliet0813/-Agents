'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { trpc } from '~/lib/trpc/client'

export default function VoiceWatcherDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch voice notes for statistics
  const { data: voiceNotes } = trpc.notes.list.useQuery()

  // Filter iCloud notes
  const iCloudNotes = voiceNotes?.filter((n: any) => n.source === 'ICLOUD') || []

  // Today's notes
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayNotes = iCloudNotes.filter((n: any) => new Date(n.createdAt) >= today)

  // Statistics
  const totalProcessed = iCloudNotes.length
  const todayProcessed = todayNotes.length
  const completedCount = iCloudNotes.filter((n: any) => n.status === 'COMPLETED').length
  const needsReviewCount = iCloudNotes.filter((n: any) => n.status === 'NEEDS_REVIEW').length
  const failedCount = iCloudNotes.filter((n: any) => n.status === 'FAILED').length

  // Recent notes (last 10)
  const recentNotes = [...iCloudNotes]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回設定
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">iCloud 語音監控服務</h1>
          </div>
          <p className="text-gray-600 mt-1">監控和管理自動語音筆記處理服務</p>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              服務狀態
            </CardTitle>
            <CardDescription>iCloud Voice Watcher 運行狀態</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">狀態</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                運行中 (PM2)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">當前時間</span>
              <span className="text-sm font-mono">
                {currentTime.toLocaleString('zh-TW')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">監控路徑</span>
              <span className="text-xs font-mono text-gray-500">
                ~/Library/Mobile Documents/.../Voice Memos
              </span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <Button variant="outline" className="w-full" disabled>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重啟服務
              </Button>
              <p className="text-xs text-gray-500 text-center">
                💡 使用 PM2 命令管理：<code className="bg-gray-100 px-1 rounded">pm2 restart voice-watcher</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>今日處理統計</CardTitle>
            <CardDescription>
              {today.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">已處理筆記</span>
                <span className="text-2xl font-bold text-blue-600">{todayProcessed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">成功完成</span>
                <span className="font-medium text-green-600">
                  {todayNotes.filter((n: any) => n.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">待確認</span>
                <span className="font-medium text-amber-600">
                  {todayNotes.filter((n: any) => n.status === 'NEEDS_REVIEW').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">處理失敗</span>
                <span className="font-medium text-red-600">
                  {todayNotes.filter((n: any) => n.status === 'FAILED').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">總處理數</p>
                <p className="text-2xl font-bold">{totalProcessed}</p>
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
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
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
                <p className="text-2xl font-bold text-amber-600">{needsReviewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">失敗</p>
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>服務配置</CardTitle>
          <CardDescription>當前運行配置資訊</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">監控檔案類型</p>
                  <p className="text-xs text-gray-500">*.m4a (Apple Voice Memos)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">檔案穩定延遲</p>
                  <p className="text-xs text-gray-500">2 秒（等待 iCloud 同步完成）</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">自動處理模式</p>
                  <p className="text-xs text-gray-500">已啟用（無需手動觸發）</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">課程識別策略</p>
                  <p className="text-xs text-gray-500">時間匹配 → 檔名分析 → 內容分析</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">系統通知</p>
                  <p className="text-xs text-gray-500">已啟用 macOS 通知</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">進程管理</p>
                  <p className="text-xs text-gray-500">PM2 (自動重啟、日誌管理)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Processing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>最近處理記錄</CardTitle>
              <CardDescription>最近 10 筆自動處理的語音筆記</CardDescription>
            </div>
            <Link href="/dashboard/notes?source=ICLOUD">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {note.fileName || '未命名錄音'}
                      </p>
                      {note.status === 'COMPLETED' && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          ✓ 完成
                        </Badge>
                      )}
                      {note.status === 'NEEDS_REVIEW' && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                          ⚠️ 待確認
                        </Badge>
                      )}
                      {note.status === 'FAILED' && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                          ✗ 失敗
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{note.course?.name || '未分類'}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleString('zh-TW')}</span>
                      {note.duration && (
                        <>
                          <span>•</span>
                          <span>{Math.round(note.duration / 60)} 分鐘</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/notes?source=ICLOUD`}>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-sm">尚無處理記錄</p>
              <p className="text-gray-400 text-xs mt-1">在 iPhone 錄音後會自動出現在這裡</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Guide Link */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">服務部署與管理</p>
              <p className="text-xs text-blue-700 mt-1">
                查看完整的部署指南： <code className="bg-blue-100 px-1 rounded">ICLOUD_VOICE_WATCHER_GUIDE.md</code>
              </p>
              <div className="mt-3 space-y-1 text-xs text-blue-700">
                <p>• 啟動服務：<code className="bg-blue-100 px-1 rounded">pm2 start src/services/voice-watcher/pm2.config.js</code></p>
                <p>• 查看日誌：<code className="bg-blue-100 px-1 rounded">pm2 logs voice-watcher</code></p>
                <p>• 重啟服務：<code className="bg-blue-100 px-1 rounded">pm2 restart voice-watcher</code></p>
                <p>• 停止服務：<code className="bg-blue-100 px-1 rounded">pm2 stop voice-watcher</code></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
