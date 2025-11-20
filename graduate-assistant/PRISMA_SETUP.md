# Prisma Database Setup Guide

## ✅ 已完成的設置

### 1. Prisma Schema 創建完成
**位置**: `prisma/schema.prisma`

已定義的資料模型：
- ✅ **User** - 使用者模型（含 NextAuth 整合）
- ✅ **Account** - NextAuth 帳號模型
- ✅ **Session** - NextAuth 會話模型
- ✅ **VerificationToken** - NextAuth 驗證令牌
- ✅ **Course** - 課程模型（Moodle 整合）
- ✅ **CourseContent** - 課程內容模型
- ✅ **VoiceNote** - 語音筆記模型
- ✅ **Assignment** - 作業模型
- ✅ **LearningActivity** - 學習活動記錄
- ✅ **SyncLog** - 同步記錄
- ✅ **EmailRule** - 郵件規則

### 2. 環境變數配置完成
**位置**: `.env` 和 `.env.example`

已配置：
- ✅ DATABASE_URL (PostgreSQL)
- ✅ NEXTAUTH_SECRET 和 NEXTAUTH_URL
- ✅ Google OAuth 佔位符
- ✅ OpenAI API 佔位符
- ✅ Anthropic API 佔位符
- ✅ Python Service URL
- ✅ Notion API 佔位符

### 3. Prisma Client Singleton 創建完成
**位置**: `src/server/db/index.ts`

特性：
- ✅ 全域單例模式（避免開發環境中多實例）
- ✅ 開發環境日誌配置
- ✅ 生產環境優化配置

### 4. Package.json 腳本添加完成
已添加的腳本：
```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "postinstall": "prisma generate"
}
```

## 🚀 在本地環境完成設置的步驟

### 第一步：設置 PostgreSQL 資料庫

1. **安裝 PostgreSQL**（如果尚未安裝）：
   ```bash
   # macOS
   brew install postgresql@16
   brew services start postgresql@16

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Windows
   # 從 https://www.postgresql.org/download/windows/ 下載安裝器
   ```

2. **創建資料庫**：
   ```bash
   # 進入 PostgreSQL shell
   psql postgres

   # 創建資料庫
   CREATE DATABASE graduate_assistant;

   # 創建使用者（可選）
   CREATE USER graduate_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE graduate_assistant TO graduate_user;

   # 退出
   \q
   ```

3. **更新 .env 檔案**：
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/graduate_assistant?schema=public"

   # 或者如果你創建了新使用者
   DATABASE_URL="postgresql://graduate_user:your_password@localhost:5432/graduate_assistant?schema=public"
   ```

### 第二步：生成 Prisma Client

```bash
npm run db:generate
# 或
npx prisma generate
```

這會：
- 讀取 `prisma/schema.prisma`
- 生成 TypeScript 型別定義
- 創建 Prisma Client

### 第三步：執行資料庫 Migration

**方法一：開發環境（推薦）**
```bash
npm run db:migrate
# 或
npx prisma migrate dev --name init
```

這會：
- 創建 migration 檔案
- 執行 migration
- 更新資料庫 schema
- 自動執行 `prisma generate`

**方法二：快速測試（不建議用於生產）**
```bash
npm run db:push
# 或
npx prisma db push
```

這會直接推送 schema 到資料庫，不創建 migration 檔案。

### 第四步：驗證設置

1. **查看 Prisma Studio**（資料庫 GUI）：
   ```bash
   npm run db:studio
   # 或
   npx prisma studio
   ```

   會在 http://localhost:5555 開啟視覺化界面

2. **測試資料庫連接**：
   創建測試檔案 `test-db.ts`：
   ```typescript
   import { db } from './src/server/db'

   async function main() {
     const userCount = await db.user.count()
     console.log('User count:', userCount)
     console.log('✅ Database connection successful!')
   }

   main()
     .catch((e) => {
       console.error('❌ Database connection failed:', e)
       process.exit(1)
     })
     .finally(async () => {
       await db.$disconnect()
     })
   ```

   執行：
   ```bash
   npx tsx test-db.ts
   ```

## 📊 資料模型關係圖

```
User (使用者)
├── accounts (Account[]) - NextAuth 帳號
├── sessions (Session[]) - NextAuth 會話
├── courses (Course[]) - 課程
├── voiceNotes (VoiceNote[]) - 語音筆記
├── assignments (Assignment[]) - 作業
├── learningActivities (LearningActivity[]) - 學習活動
└── emailRules (EmailRule[]) - 郵件規則

Course (課程)
├── user (User) - 所屬使用者
├── contents (CourseContent[]) - 課程內容
├── voiceNotes (VoiceNote[]) - 語音筆記
└── assignments (Assignment[]) - 作業

CourseContent (課程內容)
├── course (Course) - 所屬課程
└── assignments (Assignment[]) - 相關作業

VoiceNote (語音筆記)
├── user (User) - 所屬使用者
└── course (Course?) - 相關課程（可選）

Assignment (作業)
├── user (User) - 所屬使用者
├── course (Course) - 相關課程
└── courseContent (CourseContent?) - 相關內容（可選）
```

## 🔐 資料庫索引

已優化的索引：
- `users.email` - UNIQUE（登入查詢）
- `courses.userId` - INDEX（使用者課程查詢）
- `courses.userId + moodleCourseId` - UNIQUE（防止重複）
- `course_contents.courseId` - INDEX（課程內容查詢）
- `course_contents.courseId + weekNumber` - INDEX（週次查詢）
- `voice_notes.userId` - INDEX（使用者筆記查詢）
- `voice_notes.courseId` - INDEX（課程筆記查詢）
- `assignments.userId` - INDEX（使用者作業查詢）
- `assignments.courseId` - INDEX（課程作業查詢）
- `assignments.dueDate` - INDEX（截止日期排序）
- `learning_activities.userId + createdAt` - INDEX（活動時間序列）
- `sync_logs.userId + syncType` - INDEX（同步記錄查詢）

## 🛠️ Prisma 常用指令

```bash
# 生成 Prisma Client
npm run db:generate

# 創建新的 migration
npm run db:migrate

# 推送 schema 變更（跳過 migration）
npm run db:push

# 開啟 Prisma Studio
npm run db:studio

# 重置資料庫（警告：會刪除所有資料）
npx prisma migrate reset

# 查看資料庫狀態
npx prisma migrate status

# 格式化 schema 檔案
npx prisma format

# 驗證 schema
npx prisma validate
```

## 📝 NextAuth 整合說明

已包含 NextAuth.js 所需的所有資料表：
- `Account` - 儲存 OAuth 帳號資訊
- `Session` - 儲存使用者會話
- `VerificationToken` - 郵件驗證令牌

使用 Prisma Adapter：
```typescript
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '~/server/db'

export const authOptions = {
  adapter: PrismaAdapter(db),
  // ...
}
```

## ⚠️ 注意事項

1. **密碼加密**：`User.moodlePassword` 欄位應該使用加密儲存（例如 bcrypt）
2. **環境變數安全**：確保 `.env` 檔案已加入 `.gitignore`
3. **生產環境**：使用 `npx prisma migrate deploy` 而非 `migrate dev`
4. **備份**：定期備份資料庫
5. **連線池**：生產環境考慮設置適當的連線池大小

## 🎯 驗收標準

Task 1.2 完成條件：
- ✅ Prisma schema 無錯誤
- ⏳ 成功建立資料庫表格（需在本地環境執行）
- ✅ 可以成功 import db
- ⏳ Prisma Client 正常生成（需在本地環境執行）

## 🔜 下一步：Task 1.3

設定 tRPC 並創建 API 路由

## 故障排除

### 問題：Prisma Client 未生成
```bash
# 手動生成
npx prisma generate
```

### 問題：Migration 失敗
```bash
# 查看詳細錯誤
npx prisma migrate dev --create-only
# 檢查生成的 migration SQL
```

### 問題：連接資料庫失敗
```bash
# 測試連接
npx prisma db pull
# 檢查 DATABASE_URL 是否正確
```

### 問題：TypeScript 找不到 @prisma/client
```bash
# 重新安裝
npm install @prisma/client
npx prisma generate
```
