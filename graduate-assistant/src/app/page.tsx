import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">研究生智能助理</h1>
          <p className="text-gray-600">Graduate Assistant - Next.js 專案初始化成功！</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>專案架構</CardTitle>
              <CardDescription>Next.js 14 + TypeScript</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ✓ App Router<br />
                ✓ Tailwind CSS<br />
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
                ✓ tRPC<br />
                ✓ Prisma<br />
                ✓ NextAuth<br />
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

        <div className="flex justify-center gap-4">
          <Button>主要按鈕</Button>
          <Button variant="outline">次要按鈕</Button>
          <Button variant="ghost">幽靈按鈕</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>資料夾結構</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認證相關頁面
│   ├── (dashboard)/       # Dashboard 頁面
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui 組件
│   └── dashboard/         # Dashboard 組件
├── lib/                   # 工具函數
│   └── trpc/             # tRPC 設定
├── server/
│   ├── api/              # tRPC API
│   ├── db/               # Prisma 資料庫
│   └── services/         # 業務邏輯
├── hooks/                # Custom hooks
├── types/                # TypeScript 類型
└── utils/                # 輔助函數`}
            </pre>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Task 1.1 完成！專案架構建立成功 🎉</p>
          <p className="mt-2">下一步：Task 1.2 設定 Prisma 資料庫</p>
        </div>
      </div>
    </div>
  )
}
