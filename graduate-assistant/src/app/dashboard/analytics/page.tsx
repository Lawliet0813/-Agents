'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">統計分析</h1>
        <p className="text-gray-600 mt-1">深入了解您的學習情況</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="courses">課程</TabsTrigger>
          <TabsTrigger value="time">時間</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">總學習時數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0h</div>
                <p className="text-xs text-gray-500 mt-1">本學期累計</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">完成率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0%</div>
                <p className="text-xs text-gray-500 mt-1">作業完成率</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">平均分數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">--</div>
                <p className="text-xs text-gray-500 mt-1">尚無成績資料</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">語音筆記</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-xs text-gray-500 mt-1">已建立筆記</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>學習趨勢</CardTitle>
              <CardDescription>過去 30 天的學習時數</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">統計圖表開發中</p>
                <p className="text-sm text-gray-400 mt-1">開始使用系統後，將顯示學習趨勢圖表</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>課程分析</CardTitle>
              <CardDescription>各課程的學習表現</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">尚無課程資料</p>
                <p className="text-sm text-gray-400 mt-1">同步課程後將顯示詳細分析</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>時間分配</CardTitle>
              <CardDescription>各課程的時間投入分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-gray-500">尚無時間追蹤資料</p>
                <p className="text-sm text-gray-400 mt-1">系統將自動追蹤您的學習時間</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
