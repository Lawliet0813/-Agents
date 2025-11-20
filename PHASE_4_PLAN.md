# Phase 4 開發計劃：智能功能與整合

## 概述
Phase 4 專注於添加智能 AI 功能、語音筆記系統和第三方服務整合，將系統從課程管理工具升級為全方位的研究生智能助理。

## 開發階段

### Stage 4.1: 語音筆記系統 (Voice Notes)

**目標**: 實作語音錄製、轉錄和管理功能

**任務清單**:
- [ ] **Task 4.1.1**: 語音筆記頁面基礎
  - 創建 `src/app/dashboard/notes/page.tsx`
  - 語音筆記列表（按日期/課程分組）
  - 筆記卡片組件
  - 搜尋和篩選功能

- [ ] **Task 4.1.2**: 語音錄製功能
  - 使用 Web Audio API 錄製
  - 實時音頻可視化
  - 暫停/繼續/停止控制
  - 音頻檔案儲存（Blob → Server）

- [ ] **Task 4.1.3**: Whisper API 整合
  - 創建 `src/server/services/whisper-service.ts`
  - OpenAI Whisper API 客戶端
  - 音頻轉文字功能
  - 支援多語言（中文/英文）
  - 處理長音頻檔案（分段）

- [ ] **Task 4.1.4**: 語音筆記 CRUD
  - tRPC mutations: create, update, delete
  - 關聯課程功能
  - 標籤系統
  - 筆記詳情頁面

- [ ] **Task 4.1.5**: 音頻播放器
  - 自訂音頻播放器組件
  - 播放速度控制
  - 時間戳導航
  - 下載功能

**預估時間**: 6-8 小時

---

### Stage 4.2: AI 智能功能 (Claude Integration)

**目標**: 整合 Claude API 提供 AI 輔助學習功能

**任務清單**:
- [ ] **Task 4.2.1**: Claude API 客戶端
  - 創建 `src/lib/claude-client.ts`
  - Anthropic SDK 整合
  - Rate limiting 處理
  - Token 使用追蹤

- [ ] **Task 4.2.2**: 筆記自動摘要
  - 創建 `src/server/services/ai-service.ts`
  - 語音轉錄自動摘要
  - 提取關鍵點
  - 生成標題建議

- [ ] **Task 4.2.3**: 課程內容分析
  - PDF/文件內容提取
  - 自動生成課程摘要
  - 關鍵概念提取
  - 問題生成（複習用）

- [ ] **Task 4.2.4**: AI 助手 Chat
  - 創建 AI 聊天界面
  - 基於課程內容的 Q&A
  - 作業協助功能
  - 對話歷史記錄

- [ ] **Task 4.2.5**: 智能推薦
  - 基於學習進度推薦下一步
  - 作業優先級建議
  - 學習時間分配建議

**預估時間**: 8-10 小時

---

### Stage 4.3: Google Calendar 整合

**目標**: 同步課程和作業到 Google Calendar

**任務清單**:
- [ ] **Task 4.3.1**: Google OAuth 設定
  - 設定 Google Cloud Project
  - OAuth 2.0 credentials
  - NextAuth Google provider 配置
  - 權限範圍設定（Calendar.Events）

- [ ] **Task 4.3.2**: Calendar API 客戶端
  - 創建 `src/lib/google-calendar-client.ts`
  - Google Calendar API 整合
  - Event CRUD operations
  - 時區處理

- [ ] **Task 4.3.3**: 課程時間表同步
  - 課程時間設定頁面
  - 自動創建課程事件
  - 週期性事件（每週上課）
  - 顏色編碼（不同課程不同顏色）

- [ ] **Task 4.3.4**: 作業截止日期同步
  - 作業自動加入 Calendar
  - 提醒設定（1天前/3天前）
  - 雙向同步（Calendar → Database）
  - 完成後更新事件狀態

- [ ] **Task 4.3.5**: Calendar 檢視頁面
  - 創建 `/dashboard/calendar` 頁面
  - 月檢視/週檢視
  - 事件詳情顯示
  - 快速編輯功能

**預估時間**: 5-7 小時

---

### Stage 4.4: Gmail 整合

**目標**: 追蹤課程相關郵件和通知

**任務清單**:
- [ ] **Task 4.4.1**: Gmail OAuth 設定
  - Gmail API 權限設定
  - OAuth scope: Gmail.Read
  - 整合到現有 Google OAuth

- [ ] **Task 4.4.2**: Gmail API 客戶端
  - 創建 `src/lib/gmail-client.ts`
  - 郵件列表查詢
  - 標籤篩選
  - 附件下載

- [ ] **Task 4.4.3**: 課程郵件追蹤
  - 識別課程相關郵件（關鍵字/寄件者）
  - 作業通知抓取
  - 自動解析截止日期
  - 關聯到課程/作業

- [ ] **Task 4.4.4**: 郵件通知頁面
  - 創建 `/dashboard/emails` 頁面
  - 未讀郵件列表
  - 郵件詳情檢視
  - 標記為已讀功能

**預估時間**: 4-6 小時

---

### Stage 4.5: Notion 整合

**目標**: 雙向同步課程筆記到 Notion

**任務清單**:
- [ ] **Task 4.5.1**: Notion OAuth 設定
  - Notion Integration 創建
  - OAuth 2.0 flow
  - 權限設定

- [ ] **Task 4.5.2**: Notion API 客戶端
  - 創建 `src/lib/notion-client.ts`
  - Notion SDK 整合
  - Database/Page CRUD
  - Block 操作

- [ ] **Task 4.5.3**: 筆記同步功能
  - 語音筆記 → Notion Page
  - 課程內容 → Notion Database
  - 格式轉換（Markdown ↔ Notion Blocks）
  - 雙向同步選項

- [ ] **Task 4.5.4**: Notion 設定頁面
  - 連結 Notion workspace
  - 選擇 Database
  - 同步規則設定
  - 手動/自動同步選項

**預估時間**: 5-7 小時

---

### Stage 4.6: 學習分析與報告

**目標**: 提供學習數據分析和視覺化

**任務清單**:
- [ ] **Task 4.6.1**: 學習數據收集
  - 活動記錄模型（ActivityLog）
  - 追蹤各種操作（登入/查看課程/完成作業/錄製筆記）
  - 時間統計

- [ ] **Task 4.6.2**: 統計分析頁面
  - 創建 `/dashboard/analytics` 頁面
  - 學習時間圖表（日/週/月）
  - 課程參與度分析
  - 作業完成率

- [ ] **Task 4.6.3**: 視覺化圖表
  - 使用 Recharts 或 Chart.js
  - 時間軸圖表
  - 圓餅圖（課程時間分配）
  - 進度條（學期進度）

- [ ] **Task 4.6.4**: 學習報告生成
  - 週報/月報自動生成
  - PDF 匯出功能
  - 分享功能
  - Email 定期報告

**預估時間**: 4-6 小時

---

### Stage 4.7: 通知系統

**目標**: 實作多渠道通知功能

**任務清單**:
- [ ] **Task 4.7.1**: 瀏覽器通知
  - Web Push API 整合
  - 通知權限請求
  - Service Worker 設定
  - 通知樣式自訂

- [ ] **Task 4.7.2**: Email 通知
  - Email 服務設定（Resend/SendGrid）
  - 通知模板設計
  - 定時提醒（作業到期前）
  - 通知偏好設定

- [ ] **Task 4.7.3**: 通知中心
  - 創建 `/dashboard/notifications` 頁面
  - 通知列表
  - 已讀/未讀狀態
  - 通知類型篩選

- [ ] **Task 4.7.4**: 通知設定
  - 通知偏好頁面
  - 選擇通知類型
  - 通知頻率設定
  - 靜音時段設定

**預估時間**: 4-5 小時

---

## 技術架構擴展

### 新增依賴

**NPM Packages**:
```json
{
  "@anthropic-ai/sdk": "^0.9.0",        // Claude API
  "@google-cloud/storage": "^7.7.0",    // 檔案儲存
  "googleapis": "^129.0.0",              // Google APIs
  "@notionhq/client": "^2.2.0",         // Notion API
  "openai": "^4.20.0",                   // Whisper API
  "recharts": "^2.10.0",                 // 圖表
  "react-audio-player": "^0.17.0",      // 音頻播放
  "web-push": "^3.6.0",                  // Push 通知
  "@react-pdf-viewer/core": "^3.12.0",  // PDF 檢視
  "nodemailer": "^6.9.0"                 // Email
}
```

**Environment Variables**:
```env
# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Google Services
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# Notion
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...

# Email
RESEND_API_KEY=...

# Storage
CLOUD_STORAGE_BUCKET=...
```

### 資料庫擴展

**新增 Prisma Models**:
```prisma
model VoiceNote {
  id              String   @id @default(cuid())
  userId          String
  courseId        String?
  title           String?
  audioUrl        String   // Cloud Storage URL
  transcription   String?  @db.Text
  summary         String?  @db.Text
  duration        Int?     // seconds
  recordedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)
  tags            Tag[]
}

model Tag {
  id          String      @id @default(cuid())
  name        String      @unique
  voiceNotes  VoiceNote[]
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // 'view_course', 'complete_assignment', etc.
  entityType  String?  // 'course', 'assignment', 'note'
  entityId    String?
  metadata    Json?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'assignment_due', 'new_content', etc.
  title       String
  message     String   @db.Text
  link        String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Integration {
  id            String   @id @default(cuid())
  userId        String   @unique
  googleToken   Json?
  notionToken   Json?
  preferences   Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 測試計劃

### Unit Tests
- [ ] AI Service 測試（mocking API calls）
- [ ] Google Calendar 同步邏輯
- [ ] Whisper 轉錄功能
- [ ] Notification 觸發邏輯

### Integration Tests
- [ ] OAuth flows（Google, Notion）
- [ ] 語音錄製 → 轉錄 → 儲存流程
- [ ] Calendar 雙向同步
- [ ] 完整 AI 工作流程

### E2E Tests
- [ ] 語音筆記完整流程
- [ ] AI 摘要生成
- [ ] 通知系統
- [ ] 第三方整合授權

---

## 里程碑

### Milestone 4.1: 語音筆記完成
- ✅ 語音錄製和播放
- ✅ Whisper 轉錄
- ✅ 筆記管理
- **預計完成**: Day 1-2

### Milestone 4.2: AI 功能完成
- ✅ Claude API 整合
- ✅ 自動摘要
- ✅ AI 聊天助手
- **預計完成**: Day 3-5

### Milestone 4.3: 第三方整合完成
- ✅ Google Calendar 同步
- ✅ Gmail 追蹤
- ✅ Notion 同步
- **預計完成**: Day 6-8

### Milestone 4.4: 進階功能完成
- ✅ 學習分析
- ✅ 通知系統
- ✅ 完整測試
- **預計完成**: Day 9-10

---

## 風險與挑戰

### 技術風險
1. **Whisper API 成本**
   - 緩解：使用本地 Whisper 模型選項
   - 備案：限制轉錄長度或次數

2. **Claude API Rate Limits**
   - 緩解：實作 Queue 系統
   - 備案：本地快取摘要結果

3. **OAuth 複雜度**
   - 緩解：使用成熟的 OAuth 套件
   - 備案：分階段實作，先完成一個服務

### 開發風險
1. **時程壓力**
   - 緩解：優先完成核心功能
   - 備案：某些整合可選

2. **API 變更**
   - 緩解：使用官方 SDK
   - 備案：版本鎖定

---

## 開發建議

**優先級排序**:
1. **High Priority** (Must Have)
   - Task 4.1: 語音筆記系統
   - Task 4.2: AI 智能功能
   - Task 4.6: 學習分析

2. **Medium Priority** (Should Have)
   - Task 4.3: Google Calendar
   - Task 4.7: 通知系統

3. **Low Priority** (Nice to Have)
   - Task 4.4: Gmail 整合
   - Task 4.5: Notion 整合

**第一步建議**: Task 4.1.1 - 語音筆記頁面基礎
- 創建語音筆記 UI
- 建立基本的 CRUD
- 為後續功能奠定基礎

---

**Last Updated**: 2025-11-19
**Status**: 📋 Planning Complete
**Next Action**: Begin Task 4.1.1 - Voice Notes Page
**Estimated Total Time**: 35-45 hours
