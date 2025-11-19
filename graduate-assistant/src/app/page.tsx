'use client'

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { trpc } from "~/lib/trpc/client"

export default function Home() {
  const sessionQuery = trpc.auth.getSession.useQuery()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">研究生智能助理</h1>
          <p className="text-gray-600">Graduate Assistant - 專案初始化完成！</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>專案架構</CardTitle>
              <CardDescription>Next.js 16 + TypeScript</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ✓ App Router<br />
                ✓ Tailwind CSS v4<br />
                ✓ ESLint
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>核心依賴</CardTitle>
              <CardDescription>已安裝完成</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ✓ tRPC v11<br />
                ✓ Prisma v6<br />
                ✓ NextAuth v4<br />
                ✓ Zustand<br />
                ✓ React Hook Form
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UI 組件</CardTitle>
              <CardDescription>shadcn/ui</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ✓ Button<br />
                ✓ Card<br />
                ✓ Input/Label<br />
                ✓ Dialog<br />
                ✓ Dropdown Menu<br />
                ✓ Tabs
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>tRPC 測試</CardTitle>
            <CardDescription>驗證 API 連接</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Session 狀態：</strong>{' '}
                {sessionQuery.isLoading ? (
                  <span className="text-yellow-600">載入中...</span>
                ) : sessionQuery.data ? (
                  <span className="text-green-600">✓ 已登入</span>
                ) : (
                  <span className="text-gray-600">未登入</span>
                )}
              </p>
              {sessionQuery.data?.user && (
                <p className="text-sm text-gray-600">
                  用戶：{sessionQuery.data.user.email}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {sessionQuery.isSuccess && (
                  <span className="text-green-600">✓ tRPC 連接成功！</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>資料庫架構</CardTitle>
            <CardDescription>Prisma Schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">核心模型</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ User</li>
                  <li>✓ Course</li>
                  <li>✓ CourseContent</li>
                  <li>✓ VoiceNote</li>
                  <li>✓ Assignment</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">支援模型</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Account (NextAuth)</li>
                  <li>✓ Session (NextAuth)</li>
                  <li>✓ LearningActivity</li>
                  <li>✓ SyncLog</li>
                  <li>✓ EmailRule</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>tRPC API Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">已實作的路由</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ auth (getSession, getUser, updateProfile)</li>
                  <li>✓ courses (CRUD + sync)</li>
                  <li>✓ assignments (CRUD + getUpcoming)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">&nbsp;</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ notes (CRUD)</li>
                  <li>✓ sync (getLogs, createLog)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button>主要按鈕</Button>
          <Button variant="outline">次要按鈕</Button>
          <Button variant="ghost">幽靈按鈕</Button>
        </div>

        <div className="text-center text-sm text-gray-500 space-y-2">
          <p className="text-green-600 font-semibold">✓ Task 1.1: Next.js 專案初始化</p>
          <p className="text-green-600 font-semibold">✓ Task 1.2: Prisma 資料庫設置</p>
          <p className="text-green-600 font-semibold">✓ Task 1.3: tRPC 設定完成</p>
          <p className="mt-4">下一步：Task 2.1 NextAuth.js 設定與登入頁面</p>
        </div>
      </div>
    </div>
  )
}
