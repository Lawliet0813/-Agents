'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { trpc } from '~/lib/trpc/client'

interface SyncResult {
  success: boolean
  message: string
  coursesCreated: number
  coursesUpdated: number
  assignmentsCreated: number
  assignmentsUpdated: number
  errors: string[]
}

export function MoodleSyncDialog() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const utils = trpc.useUtils()

  const syncMutation = trpc.courses.sync.useMutation({
    onSuccess: (data) => {
      setResult(data as SyncResult)
      setSyncing(false)
      // Invalidate queries to refresh data
      utils.courses.list.invalidate()
      utils.assignments.list.invalidate()
    },
    onError: (error) => {
      setResult({
        success: false,
        message: error.message,
        coursesCreated: 0,
        coursesUpdated: 0,
        assignmentsCreated: 0,
        assignmentsUpdated: 0,
        errors: [error.message],
      })
      setSyncing(false)
    },
  })

  const handleSync = async () => {
    if (!username || !password) {
      setResult({
        success: false,
        message: 'Please enter your Moodle credentials',
        coursesCreated: 0,
        coursesUpdated: 0,
        assignmentsCreated: 0,
        assignmentsUpdated: 0,
        errors: ['Missing credentials'],
      })
      return
    }

    setSyncing(true)
    setResult(null)

    syncMutation.mutate({
      username,
      password,
    })
  }

  const handleClose = () => {
    if (!syncing) {
      setOpen(false)
      setResult(null)
      setUsername('')
      setPassword('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          同步 Moodle 課程
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>同步 Moodle 資料</DialogTitle>
          <DialogDescription>
            輸入您的 Moodle 帳號密碼以同步課程和作業資料
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">學號</Label>
              <Input
                id="username"
                type="text"
                placeholder="請輸入學號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={syncing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={syncing}
              />
            </div>

            {syncing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在同步資料，請稍候...
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="py-4">
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? '同步成功' : '同步失敗'}
                  </h4>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>

                  {result.success && (
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>課程：新增 {result.coursesCreated} 個，更新 {result.coursesUpdated} 個</p>
                      <p>作業：新增 {result.assignmentsCreated} 個，更新 {result.assignmentsUpdated} 個</p>
                    </div>
                  )}

                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-900">錯誤訊息：</p>
                      <ul className="mt-1 space-y-1">
                        {result.errors.slice(0, 3).map((error, index) => (
                          <li key={index} className="text-sm text-red-700">• {error}</li>
                        ))}
                        {result.errors.length > 3 && (
                          <li className="text-sm text-red-600">... 還有 {result.errors.length - 3} 個錯誤</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={syncing}>
                取消
              </Button>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? '同步中...' : '開始同步'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              關閉
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
