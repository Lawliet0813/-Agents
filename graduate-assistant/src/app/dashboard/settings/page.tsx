'use client'

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
