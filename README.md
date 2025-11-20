# Graduate Research Assistant

智能研究生助理系統，整合 Moodle、Google Calendar、Gmail、Notion、AI 語音轉文字與筆記生成功能。

## 功能特色

- **課程管理**: Moodle 課程與作業自動同步
- **語音筆記**:
  - Web 端語音錄製
  - iPhone 錄音自動處理（iCloud 同步）
  - AI 語音轉文字（Whisper + iOS 內建逐字稿）
  - AI 自動生成結構化筆記（Claude）
- **行事曆整合**: 作業自動同步到 Google Calendar
- **郵件處理**: Gmail 自動監控與作業建立
- **筆記同步**: 自動同步到 Notion
- **AI 助手**: Claude AI 聊天助手

## 技術架構

- **前端**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **後端**: tRPC v11 + NextAuth.js + Prisma + PostgreSQL
- **AI 服務**: OpenAI Whisper + Anthropic Claude
- **整合服務**: Google Calendar, Gmail, Notion, Moodle

## 快速開始

### 環境需求

- Node.js 18+
- PostgreSQL
- macOS (for iCloud Voice Memos integration)

### 安裝

```bash
cd graduate-assistant
npm install
```

### 設定環境變數

複製 `.env.example` 並填入必要的 API keys：

```bash
cp .env.example .env
```

需要設定：
- `DATABASE_URL`: PostgreSQL 連線字串
- `NEXTAUTH_SECRET`: NextAuth.js 密鑰
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key

### 資料庫初始化

```bash
cd graduate-assistant
npx prisma generate
npx prisma db push
```

### 啟動開發伺服器

```bash
cd graduate-assistant
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

### 啟動 iCloud 監控服務 (可選)

僅適用於 macOS，用於自動處理 iPhone 錄音：

```bash
# 安裝系統依賴
brew install exiftool ffmpeg pm2

# 啟動服務
cd graduate-assistant
pm2 start src/services/voice-watcher/pm2.config.js
pm2 save
```

## 專案結構

```
graduate-assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # 儀表板頁面
│   │   └── api/                # API routes
│   ├── components/             # React 組件
│   ├── server/                 # 後端服務
│   │   ├── api/routers/        # tRPC routers
│   │   └── services/           # 整合服務
│   ├── services/               # 背景服務
│   │   └── voice-watcher/      # iCloud 監控
│   └── lib/                    # 工具函數
├── prisma/                     # 資料庫 schema
└── public/                     # 靜態資源
```

## 詳細文檔

- [完整實作報告](./GRADUATE_ASSISTANT_COMPLETE.md)
- [iCloud 語音監控指南](./ICLOUD_VOICE_WATCHER_GUIDE.md)
- [專案摘要](./GRADUATE_AGENT_SUMMARY.md)

## License

MIT
