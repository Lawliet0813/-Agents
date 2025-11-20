'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600 mt-1">管理您的帳號和服務整合</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile">個人資料</TabsTrigger>
          <TabsTrigger value="integrations">整合服務</TabsTrigger>
          <TabsTrigger value="preferences">偏好設定</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>個人資料</CardTitle>
              <CardDescription>更新您的個人資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" placeholder="輸入您的姓名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input id="email" type="email" placeholder="您的電子郵件" disabled />
                <p className="text-xs text-gray-500">電子郵件無法變更</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-id">學號</Label>
                <Input id="student-id" placeholder="輸入學號（選填）" />
              </div>
              <div className="pt-4">
                <Button>儲存變更</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          {/* iCloud Voice Watcher Service */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    iCloud 語音監控服務
                  </CardTitle>
                  <CardDescription>自動處理 iPhone 錄音並生成筆記</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-700 font-medium">運行中</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  系統正在監控 iCloud Voice Memos 目錄，當偵測到新的 iPhone 錄音時會自動：
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• 提取 iOS 內建逐字稿</li>
                  <li>• 智能識別所屬課程</li>
                  <li>• 使用 Claude AI 生成結構化筆記</li>
                  <li>• 發送 macOS 系統通知</li>
                </ul>
                <div className="flex gap-2 pt-2">
                  <Link href="/dashboard/settings/voice-watcher">
                    <Button variant="default">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      查看監控儀表板
                    </Button>
                  </Link>
                  <Link href="/dashboard/notes/pending">
                    <Button variant="outline">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      待確認筆記
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Moodle Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Moodle 整合</CardTitle>
              <CardDescription>連結您的 Moodle 帳號以同步課程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moodle-username">Moodle 使用者名稱</Label>
                <Input id="moodle-username" placeholder="輸入 Moodle 帳號" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moodle-password">Moodle 密碼</Label>
                <Input id="moodle-password" type="password" placeholder="輸入 Moodle 密碼" />
              </div>
              <div className="flex items-center gap-2">
                <Button>連結 Moodle</Button>
                <Button variant="outline">測試連線</Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>整合 Google Calendar 以管理行事曆</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">連線狀態</p>
                  <p className="text-sm text-gray-500">已透過 Google OAuth 授權</p>
                </div>
                <Button variant="outline">重新授權</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notion Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Notion 整合</CardTitle>
              <CardDescription>同步筆記到 Notion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notion-token">Notion Integration Token</Label>
                <Input id="notion-token" type="password" placeholder="輸入 Notion API Token" />
              </div>
              <Button>連結 Notion</Button>
            </CardContent>
          </Card>

          {/* Gmail Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Gmail 整合</CardTitle>
              <CardDescription>自動處理課程相關郵件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">連線狀態</p>
                  <p className="text-sm text-gray-500">已透過 Google OAuth 授權</p>
                </div>
                <Button variant="outline">設定郵件規則</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>偏好設定</CardTitle>
              <CardDescription>自訂您的使用體驗</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">語言</p>
                  <p className="text-sm text-gray-500">選擇介面語言</p>
                </div>
                <select className="border rounded-md px-3 py-2">
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">通知</p>
                  <p className="text-sm text-gray-500">接收作業提醒通知</p>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">自動同步</p>
                  <p className="text-sm text-gray-500">定期自動同步 Moodle 課程</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="pt-4">
                <Button>儲存偏好設定</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
