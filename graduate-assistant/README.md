# 🎓 Graduate Assistant - 研究生助理系統

專為研究生設計的智能助理系統，自動化處理課程作業、郵件通知和學習筆記。

## ✨ 主要功能

### 📧 郵件自動化
- **政大 Mail2000 整合**：自動處理 Moodle 課程通知
- **智能解析**：自動識別作業截止日期、課程名稱
- **中文日期支援**：理解「3天內」、「本週五」等中文時間表達
- **自動建立作業**：將郵件自動轉換為系統任務

### 🎤 語音筆記
- **iCloud 同步**：自動監控 Voice Memos
- **AI 轉錄**：使用 OpenAI Whisper 轉文字
- **智能摘要**：AI 自動生成筆記摘要
- **自動分類**：智能歸類到相關課程

### 📚 Moodle 整合
- **課程同步**：自動獲取課程列表
- **作業追蹤**：即時更新作業狀態
- **截止提醒**：不錯過任何期限

### 📝 Notion 整合
- **雙向同步**：與 Notion 資料庫同步
- **筆記管理**：統一管理所有學習資料
- **進度追蹤**：視覺化學習進度

---

## 🚀 快速開始

### 1️⃣ 安裝依賴

```bash
npm install
```

### 2️⃣ 設定環境變數

複製 `.env.example` 為 `.env` 並填入必要資訊：

```bash
cp .env.example .env
```

### 3️⃣ 設定資料庫

```bash
# 推送 schema 到資料庫
npm run db:push

# 生成 Prisma Client
npm run db:generate
```

### 4️⃣ 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 開始使用！

---

## 📱 像 APP 一樣啟動（推薦！）

不想每次都打開終端機？現在可以**雙擊啟動**，就像使用普通應用程式一樣！

### 🍎 macOS 使用者

**首次使用 - 創建 App**：
```bash
./create-macos-app.sh
```

然後就可以：
- ✅ 雙擊 `Graduate Assistant.app` 啟動
- ✅ 雙擊 `Stop Graduate Assistant.app` 停止
- ✅ 拖到 Dock 或應用程式資料夾

### 🪟 Windows 使用者

直接雙擊啟動：
- ✅ 雙擊 `GraduateAssistant.vbs` 啟動（無命令行視窗）
- ✅ 雙擊 `StopGraduateAssistant.vbs` 停止
- ✅ 可建立桌面捷徑或釘選到工作列

### 🎛️ 控制面板（所有平台）

```bash
npm run app
```

提供互動式選單：
- **[1]** 啟動所有服務
- **[2]** 停止所有服務
- **[3]** 重啟所有服務
- **[4]** 查看服務狀態
- **[5]** 查看日誌

**詳細說明**：請參考 [APP_LAUNCHER_GUIDE.md](./APP_LAUNCHER_GUIDE.md)

---

## 📧 郵件自動化設定（政大學生專用）

### 🎯 一鍵啟動（推薦！）

#### macOS / Linux:
```bash
./start-mail-watcher.sh
```

#### Windows:
雙擊 `start-mail-watcher.bat`

### 📖 詳細設定指南

請參考：
- **Mail2000 使用者**: [NCCU_MAIL2000_SETUP.md](./NCCU_MAIL2000_SETUP.md)
- **Google Workspace 使用者**: [NCCU_EMAIL_SETUP.md](./NCCU_EMAIL_SETUP.md)
- **快速開始**: [NCCU_QUICK_START.md](./NCCU_QUICK_START.md)

### 自動監控服務

啟動後系統會：
- ✅ 每 N 分鐘自動檢查新郵件（預設 5 分鐘）
- ✅ 自動處理 Moodle 通知郵件
- ✅ 自動建立作業到系統
- ✅ 支援手動觸發（按 Enter）

---

## 📦 可用指令

### 開發相關
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run start        # 啟動生產伺服器
npm run lint         # 執行代碼檢查
```

### 資料庫相關
```bash
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送 schema 到資料庫
npm run db:migrate   # 執行資料庫遷移
npm run db:studio    # 開啟 Prisma Studio
```

### 郵件處理
```bash
# Mail2000 (政大信箱)
npm run process-mail2000           # 手動處理一次
npm run start-mail2000-watcher     # 啟動自動監控

# Google Workspace
npm run init-nccu-email            # 初始化 Gmail 規則
npm run process-nccu-emails        # 處理 Gmail 郵件
```

---

## 🏗️ 技術架構

### 前端
- **Next.js 16**: React 框架
- **TypeScript**: 型別安全
- **Tailwind CSS**: 樣式設計
- **Radix UI**: UI 元件
- **tRPC**: 端到端型別安全 API

### 後端
- **Next.js API Routes**: 伺服器端點
- **Prisma**: ORM 資料庫管理
- **PostgreSQL**: 資料庫

### 整合服務
- **IMAP/SMTP**: Mail2000 郵件處理
- **Gmail API**: Google Workspace 整合
- **OpenAI API**: Whisper 語音轉文字、GPT 摘要
- **Anthropic API**: Claude AI 處理
- **Notion API**: 筆記同步
- **Moodle API**: 課程管理

### 自動化
- **Chokidar**: 檔案監控
- **Node-IMAP**: 郵件監控
- **Cron Jobs**: 定時任務

---

## 📁 專案結構

```
graduate-assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 元件
│   ├── server/                 # tRPC 伺服器
│   │   ├── api/               # API 路由
│   │   └── services/          # 服務層
│   │       ├── mail2000-service.ts
│   │       ├── nccu-email-processor.ts
│   │       └── ...
│   └── services/              # 前端服務
│       └── mail2000-watcher/  # 郵件監控
├── scripts/                   # 工具腳本
│   ├── app-launcher.ts        # 🆕 APP 控制面板
│   ├── process-mail2000.ts
│   └── start-mail2000-watcher.ts
├── prisma/                    # 資料庫 Schema
├── public/                    # 靜態資源
├── ecosystem.config.js        # 🆕 PM2 配置
├── GraduateAssistant.vbs      # 🆕 Windows 啟動器
├── StopGraduateAssistant.vbs  # 🆕 Windows 停止器
├── create-macos-app.sh        # 🆕 macOS App 創建腳本
├── start-mail-watcher.sh      # 郵件監控啟動 (macOS/Linux)
├── start-mail-watcher.bat     # 郵件監控啟動 (Windows)
└── ...
```

---

## 🔐 安全性

- 所有密碼都加密存儲在資料庫
- 使用 NextAuth.js 處理身份驗證
- OAuth 2.0 用於 Google 服務
- 環境變數分離敏感資訊

---

## 📝 文件

- **[APP 啟動指南](./APP_LAUNCHER_GUIDE.md)** - 🆕 像 APP 一樣雙擊啟動
- [Mail2000 設定指南](./NCCU_MAIL2000_SETUP.md) - 政大 Mail2000 郵件整合
- [Google Workspace 設定](./NCCU_EMAIL_SETUP.md) - Gmail API 整合
- [快速開始指南](./NCCU_QUICK_START.md) - 5 分鐘上手
- [測試結果](./TEST_RESULTS_SUMMARY.md) - 系統測試報告

---

## 🧪 測試

執行完整的系統測試：

```bash
./test-system.sh
```

測試包含：
- ✅ 環境檢查 (Node, npm, TypeScript, etc.)
- ✅ 專案結構
- ✅ 依賴套件
- ✅ 資料庫 Schema
- ✅ TypeScript 編譯
- ✅ API 路由
- ✅ 服務實作
- ✅ UI 元件

---

## 🐛 疑難排解

### 郵件無法連線
1. 確認帳號密碼正確
2. 檢查網路連線
3. 確認防火牆設定允許 Port 993 (IMAP)

### 資料庫錯誤
```bash
# 重置資料庫
npm run db:push
npm run db:generate
```

### 依賴問題
```bash
# 清除並重新安裝
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

## 📄 授權

MIT License

---

## 👨‍💻 開發者

專為政治大學研究生開發

**需要幫助？** 查看文件或提交 Issue

---

## 🎯 未來計劃

- [ ] 行事曆整合
- [ ] 移動應用程式
- [ ] 更多 AI 功能
- [ ] 團隊協作功能
- [ ] 更多大學支援

---

**建議從一鍵啟動腳本開始體驗自動化的便利！** 🚀
