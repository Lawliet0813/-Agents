# Task 3.3 Complete: Course Detail Page Implementation ✅

## 完成時間
2025-11-19

## 任務概述
成功實作課程詳情頁面，提供完整的課程資訊展示、學習進度追蹤、課程內容瀏覽、作業管理和語音筆記功能。

## 完成項目

### 1. ✅ Course Detail Page
**檔案**: `src/app/dashboard/courses/[id]/page.tsx` (428 行)

**核心功能**:
- 動態路由 (`[id]`) 支援個別課程頁面
- 使用 tRPC `courses.get` query 獲取完整課程資料
- 包含 contents, assignments, voiceNotes 的關聯資料
- 完整的 Loading 和 Error 狀態處理
- 響應式設計，支援各種螢幕尺寸

**頁面結構**:

```typescript
// 1. 頁面標題區
- 返回按鈕 (router.back())
- 課程名稱
- 學期資訊

// 2. 課程資訊卡片
- 課程描述
- 授課教師
- 最後同步時間
- Moodle 課程連結

// 3. 學習進度卡片
- 作業完成度進度條
- 已完成 / 總作業數量
- 課程內容統計
- 作業數量統計
- 語音筆記數量統計

// 4. 即將到期的作業
- 未完成且未來到期的作業
- 按到期日期排序
- 顯示剩餘天數
- 緊急程度標示（3天內=紅色）
- 最多顯示 5 個

// 5. 課程內容（按週次）
- 依 weekNumber 分組
- 支援「一般資料」(week 0)
- 顯示內容類型 (file/url/other)
- 連結到 Moodle 原始內容
- 圖示區分不同類型

// 6. 所有作業列表
- 按到期日期排序
- 狀態標示：
  * 已完成（綠色背景）
  * 已逾期（紅色背景）
  * 待完成（灰色背景）
- 作業詳細資訊
- Moodle 連結

// 7. 語音筆記區塊
- 顯示最近 5 筆語音筆記
- 顯示轉錄文字預覽
- 錄製時間戳記
```

**關鍵實作細節**:

```typescript
// 按週次組織課程內容
type CourseContent = NonNullable<typeof course.contents>[number]
const contentsByWeek = course.contents?.reduce(
  (acc: Record<number, CourseContent[]>, content: CourseContent) => {
    const week = content.weekNumber || 0
    if (!acc[week]) acc[week] = []
    acc[week].push(content)
    return acc
  },
  {} as Record<number, CourseContent[]>
)

// 計算學習進度
const totalAssignments = course.assignments?.length || 0
const completedAssignments = course.assignments?.filter(
  (a: Assignment) => a.status === 'completed'
).length || 0
const progressPercentage = totalAssignments > 0
  ? Math.round((completedAssignments / totalAssignments) * 100)
  : 0

// 獲取即將到期的作業
const upcomingAssignments = course.assignments
  ?.filter((a: Assignment) =>
    a.status !== 'completed' && new Date(a.dueDate) > new Date()
  )
  .sort((a: Assignment, b: Assignment) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )
  .slice(0, 5) || []

// 計算剩餘天數
const daysUntilDue = Math.ceil(
  (new Date(assignment.dueDate).getTime() - new Date().getTime())
  / (1000 * 60 * 60 * 24)
)
```

**UI/UX 亮點**:
- ✅ 視覺化進度條，清楚展示學習進度
- ✅ 顏色編碼的作業狀態（綠色=完成，紅色=逾期，灰色=待辦）
- ✅ 動態倒數計時顯示到期時間
- ✅ 週次分隔線（藍色垂直線）組織課程內容
- ✅ 懸停效果增強互動體驗
- ✅ 響應式網格布局
- ✅ 空狀態友善提示

### 2. ✅ Badge Component
**檔案**: `src/components/ui/badge.tsx` (38 行)

**功能**:
- shadcn/ui 標準 Badge 組件
- 使用 class-variance-authority (cva) 管理變體
- 支援 4 種變體：
  - `default`: 主要藍色背景
  - `secondary`: 次要灰色背景
  - `destructive`: 警告紅色背景
  - `outline`: 僅邊框，無背景

**使用範例**:
```tsx
// 作業狀態
<Badge variant={isOverdue ? 'destructive' : 'secondary'}>
  {assignment.status === 'pending' ? '待完成' : '進行中'}
</Badge>

// 已完成標示
<Badge className="bg-green-600">已完成</Badge>

// 內容類型
<Badge variant="outline" className="text-xs">
  {content.type === 'file' ? '檔案' : '連結'}
</Badge>
```

### 3. ✅ TypeScript 錯誤修正

**問題 1: Python 風格 docstring**
- **檔案**: `src/lib/moodle-client.ts`, `src/server/services/sync-service.ts`
- **錯誤**: 使用 Python 的 `"""` 多行字串註解
- **修正**: 改用 JSDoc `/** */` 註解格式

```typescript
// 修正前 ❌
"""
Moodle API Client for Next.js

This client communicates with the Python FastAPI Moodle service.
"""

// 修正後 ✅
/**
 * Moodle API Client for Next.js
 *
 * This client communicates with the Python FastAPI Moodle service.
 */
```

**問題 2: 隱式 any 類型**
- **檔案**: 所有使用 map/filter/reduce 的檔案
- **錯誤**: TypeScript strict mode 無法推斷回調函數參數類型
- **修正**: 明確定義類型並添加參數註解

```typescript
// 定義類型別名
type CourseContent = NonNullable<typeof course.contents>[number]
type Assignment = NonNullable<typeof course.assignments>[number]
type VoiceNote = NonNullable<typeof course.voiceNotes>[number]
type Course = NonNullable<typeof courses>[number]

// 使用類型註解
course.contents?.reduce(
  (acc: Record<number, CourseContent[]>, content: CourseContent) => {
    // ...
  }
)

courses.map((course: Course) => {
  // ...
})
```

**修正的檔案**:
- `src/app/dashboard/courses/[id]/page.tsx`
- `src/app/dashboard/courses/page.tsx`
- `src/lib/moodle-client.ts`
- `src/server/services/sync-service.ts`

**TypeScript 編譯結果**: ✅ **0 errors**

### 4. ✅ 課程列表頁面更新
**檔案**: `src/app/dashboard/courses/page.tsx`

**變更**:
- 添加類型定義 `type Course = NonNullable<typeof courses>[number]`
- 修正 map 回調函數的類型註解
- 保持原有功能不變

## 系統架構

### 資料流程
```
User 點擊課程卡片
  ↓
Navigate to /dashboard/courses/[id]
  ↓
CourseDetailPage Component
  ↓
trpc.courses.get.useQuery({ id })
  ↓
tRPC Router: courses.get
  ↓
Prisma Query (with includes)
  - contents (ordered by weekNumber)
  - assignments (ordered by dueDate)
  - voiceNotes (limit 5, ordered by recordedAt)
  ↓
Return Course Data
  ↓
Component 處理資料
  - Group contents by week
  - Calculate progress
  - Filter upcoming assignments
  - Sort assignments by due date
  ↓
Render UI with shadcn/ui components
```

### Prisma Query 結構
```typescript
// courses.get query (已在 Task 1.3 實作)
db.course.findFirst({
  where: {
    id: input.id,
    userId: ctx.session.user.id,
  },
  include: {
    contents: {
      orderBy: [{ weekNumber: 'asc' }, { createdAt: 'asc' }],
    },
    assignments: {
      orderBy: { dueDate: 'asc' },
    },
    voiceNotes: {
      orderBy: { recordedAt: 'desc' },
      take: 5,
    },
  },
})
```

## 型別安全

### End-to-End Type Safety
```
Frontend Component (TypeScript)
  ↓ (tRPC type inference)
tRPC Router Query (TypeScript)
  ↓ (Prisma types)
Database Query (Prisma Client)
  ↓ (PostgreSQL)
Database (Relational Schema)
```

**實現方式**:
- ✅ Frontend: 使用 `typeof` 推斷 tRPC 返回類型
- ✅ Component: 明確的類型別名和參數註解
- ✅ tRPC: 自動類型推斷無需手動定義
- ✅ Prisma: Include 關聯資料的類型安全
- ✅ TypeScript strict mode: 無隱式 any

## UI 組件使用

### shadcn/ui Components
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button` (variant: default, outline, ghost)
- `Badge` (variant: default, secondary, destructive, outline) **[新增]**

### 自訂組件
- `MoodleSyncDialog` (來自 Task 3.2)

### 圖示
- SVG 內嵌圖示（返回箭頭、文件、連結、麥克風等）
- Heroicons 風格

## 使用者體驗優化

### Loading 狀態
```tsx
if (isLoading) {
  return <Card>
    <div className="flex items-center justify-center">
      <svg className="animate-spin h-8 w-8">...</svg>
      <span>載入中...</span>
    </div>
  </Card>
}
```

### 錯誤處理
```tsx
if (!course) {
  return <Card>
    <div className="text-center">
      <svg>sad face icon</svg>
      <p>找不到此課程</p>
      <Button>返回課程列表</Button>
    </div>
  </Card>
}
```

### 空狀態
```tsx
{sortedWeeks.length === 0 && (
  <div className="text-center py-8">
    <svg>document icon</svg>
    <p>目前沒有課程內容</p>
  </div>
)}
```

### 互動回饋
- ✅ 懸停效果: `hover:bg-gray-100`, `hover:shadow-lg`
- ✅ 過渡動畫: `transition-colors`, `transition-shadow`
- ✅ 視覺層次: 卡片陰影、邊框、顏色區分
- ✅ 響應式: `md:grid-cols-2`, `lg:grid-cols-3`

## 響應式設計

### 網格布局
```tsx
// 課程資訊 + 統計
<div className="grid gap-6 md:grid-cols-3">
  <Card className="md:col-span-2">...</Card>  {/* 課程資訊 */}
  <Card>...</Card>                              {/* 統計 */}
</div>

// 課程內容項目
<div className="flex items-start gap-3">
  <div className="flex-shrink-0">icon</div>
  <div className="flex-1">content</div>
</div>
```

### 斷點
- **Mobile** (< 768px): 單欄布局
- **Tablet** (≥ 768px): 2 欄布局 (md:grid-cols-2)
- **Desktop** (≥ 1024px): 3 欄布局 (lg:grid-cols-3)

## 測試和驗證

### 驗證項目
1. ✅ 頁面正常載入和渲染
2. ✅ Loading 狀態正確顯示
3. ✅ 課程資料正確展示
4. ✅ 課程內容按週次正確分組
5. ✅ 作業按到期日期正確排序
6. ✅ 進度計算準確
7. ✅ 即將到期作業篩選正確
8. ✅ 逾期作業標示正確
9. ✅ 空狀態友善顯示
10. ✅ TypeScript 編譯無錯誤
11. ✅ 返回按鈕功能正常
12. ✅ 外部連結正確開啟

### TypeScript 檢查
```bash
npx tsc --noEmit --skipLibCheck
# Result: ✅ 0 errors
```

## 檔案變更統計

### 新增檔案 (2個)
- `src/app/dashboard/courses/[id]/page.tsx` - **428 行**
- `src/components/ui/badge.tsx` - **38 行**

### 修改檔案 (3個)
- `src/lib/moodle-client.ts` - 修正 docstring (5 行變更)
- `src/server/services/sync-service.ts` - 修正 docstring (6 行變更)
- `src/app/dashboard/courses/page.tsx` - 添加類型註解 (2 行變更)

### 文檔檔案 (1個)
- `TASK_3.2_COMPLETE.md` - 從 Task 3.2 一併提交

**總計新增**: 466 行程式碼
**總計修改**: 13 行程式碼

## Git 提交

**Commit**: `9693758`
**Message**: "Task 3.3: Implement course detail page with comprehensive features"
**Branch**: `claude/setup-nextjs-project-01TUHNj3Yn1VMqwAvQX3TYdu`
**狀態**: ✅ 已推送到遠端

## 與其他功能的整合

### Task 3.2 整合
- ✅ 使用 tRPC `courses.get` query (已在 Task 1.3 定義)
- ✅ 課程列表頁面的「查看課程」按鈕現在可以正常導航
- ✅ 同步後的課程資料可以在詳情頁查看

### 未來整合點
- **Task 3.4** (作業追蹤): 作業管理按鈕可導航至作業頁面
- **Task 3.5** (Dashboard 優化): Dashboard 可顯示課程統計
- **Phase 4** (語音筆記): 語音筆記區塊可展開查看完整內容
- **Phase 5** (AI 功能): 課程內容可用於 AI 摘要生成

## 使用說明

### 訪問課程詳情頁
1. 登入系統
2. 前往「課程管理」頁面 (`/dashboard/courses`)
3. 點擊任一課程卡片的「查看課程」按鈕
4. 進入課程詳情頁 (`/dashboard/courses/[id]`)

### 導航
- 點擊左上角「返回」按鈕返回課程列表
- 點擊「查看全部」前往作業管理頁面
- 點擊「前往作業管理」前往完整作業列表
- 點擊「開啟內容」/「在 Moodle 開啟」訪問 Moodle 原始資源

### 功能使用
- 查看課程基本資訊
- 追蹤學習進度
- 瀏覽課程內容（按週次）
- 檢視即將到期的作業
- 管理所有作業狀態
- 查看相關語音筆記

## 下一步

### Task 3.4: 作業追蹤頁面
- [ ] 更新作業列表頁面 (`/dashboard/assignments`)
- [ ] 實作作業篩選功能
  - 按狀態篩選（待完成/已完成/已逾期）
  - 按課程篩選
  - 按到期日期篩選
- [ ] 實作作業排序功能
  - 按到期日期排序
  - 按課程排序
  - 按狀態排序
- [ ] 顯示截止日期倒數計時器
- [ ] 作業狀態管理
  - 標記為完成/未完成
  - 更新作業狀態
- [ ] 批次操作功能

### Task 3.5: Dashboard 優化
- [ ] 更新 Dashboard 頁面 (`/dashboard`)
- [ ] 顯示真實統計資料
  - 課程總數
  - 待辦作業數量
  - 即將到期作業
  - 語音筆記數量
- [ ] 最近活動時間軸
  - 最近同步記錄
  - 最近完成的作業
  - 最近的語音筆記
- [ ] 快速操作區
  - 快速同步按鈕
  - 快速訪問課程
  - 快速訪問作業

## 技術亮點

### 1. 動態路由實作
```
/dashboard/courses/[id]/page.tsx
- Next.js 14 App Router
- useParams() 獲取動態參數
- 類型安全的路由參數
```

### 2. 複雜資料處理
```typescript
// 分組、篩選、排序、計算
- reduce() 按週次分組
- filter() 篩選未完成作業
- sort() 按日期排序
- Math 計算進度百分比
- Date 操作計算剩餘天數
```

### 3. 條件渲染
```tsx
// 多層次條件渲染
isLoading ? <Loading />
  : !course ? <NotFound />
  : <CourseDetail />

// 條件樣式
className={isCompleted
  ? 'bg-green-50'
  : isOverdue
  ? 'bg-red-50'
  : 'bg-gray-50'
}
```

### 4. 組件組合
```tsx
// 組合多個 shadcn/ui 組件
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 內容 */}
  </CardContent>
</Card>
```

## 成就解鎖 🎉

✅ **完整的課程管理系統**
- 課程列表 → 課程詳情 → 作業管理
- 完整的導航流程
- 資料完整展示

✅ **企業級 TypeScript**
- Strict mode 無錯誤
- 明確的類型定義
- 端到端類型安全

✅ **優秀的使用者體驗**
- Loading/Error/Empty 狀態
- 視覺化進度追蹤
- 響應式設計
- 直覺的導航

✅ **Phase 3.3 完成**
- 課程詳情頁面完整實作
- Badge 組件可重用
- 為 Task 3.4 和 3.5 奠定基礎

---

**開發日期**: 2025-11-19
**版本**: 1.0.0
**狀態**: ✅ Task 3.3 完成
**下一個任務**: Task 3.4 - 作業追蹤頁面實作
**TypeScript 狀態**: ✅ 0 errors
**測試狀態**: ✅ 手動測試通過
