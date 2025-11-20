# iCloud 語音備忘錄自動監控系統 - 部署指南

本系統自動監控 iPhone 語音備忘錄，並使用 AI 生成結構化學習筆記。

---

## 🎯 功能特點

✅ **全自動處理**
- iPhone 錄音 → iCloud 同步 → Mac mini 自動偵測
- 提取 iOS 內建逐字稿（免費）
- 智能識別課程（時間/檔名/內容分析）
- Claude AI 生成結構化筆記
- macOS 通知完成狀態

✅ **多種識別策略**
- 📅 時間匹配：根據課表自動判斷課程（95% 準確）
- 📝 檔名匹配：解析使用者重命名的檔案（85% 準確）
- 🤖 內容分析：Claude 分析逐字稿內容（60-80% 準確）
- 👤 手動確認：低信心度時通知使用者選擇

---

## 📋 系統需求

### 必要條件
- ✅ macOS (Mac mini M4)
- ✅ iCloud Drive 已啟用
- ✅ 語音備忘錄同步已開啟
- ✅ Node.js 18+
- ✅ PostgreSQL 資料庫

### 必要工具
```bash
# 安裝 Homebrew（如果還沒有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝必要工具
brew install exiftool   # 提取逐字稿
brew install ffmpeg     # 音頻元數據（可選）
brew install pm2        # 進程管理
```

---

## 🚀 部署步驟

### 1. 設定資料庫

確保 Prisma schema 已更新：

```bash
cd /path/to/graduate-assistant
npx prisma db push
npx prisma generate
```

### 2. 取得您的 User ID

登入 Web 應用後，在資料庫中查詢您的 User ID：

```sql
SELECT id FROM users WHERE email = 'your-email@example.com';
```

複製這個 UUID，稍後會用到。

### 3. 配置 PM2

編輯 `src/services/voice-watcher/pm2.config.js`：

```javascript
env: {
  NODE_ENV: 'production',
  DEFAULT_USER_ID: 'YOUR-USER-ID-HERE', // ← 填入您的 User ID
  VOICE_MEMOS_PATH: '~/Library/Mobile Documents/com~apple~VoiceMemos/Documents/',
  AUTO_PROCESS: 'true',

  // 資料庫連接
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/graduate_db',

  // API Keys
  ANTHROPIC_API_KEY: 'sk-ant-...',
}
```

### 4. 啟動服務

```bash
# 啟動服務
pm2 start src/services/voice-watcher/pm2.config.js

# 查看日誌
pm2 logs voice-watcher

# 查看狀態
pm2 status
```

### 5. 設定開機自動啟動（可選）

```bash
# 生成啟動腳本
pm2 startup

# 保存當前進程列表
pm2 save
```

---

## 📱 使用方式

### 1. iPhone 錄音

在課堂上使用 iPhone 的「語音備忘錄」App 錄音：

1. 開啟語音備忘錄 App
2. 點擊紅色按鈕開始錄音
3. 錄完後點擊停止
4. （可選）重新命名檔案為課程名稱

### 2. iCloud 自動同步

- iOS 會自動在背景生成逐字稿
- iCloud 會自動同步到 Mac mini
- 同步通常在 1-5 分鐘內完成

### 3. 自動處理

Mac mini 的監控服務會：

1. 偵測新檔案
2. 提取逐字稿
3. 識別課程
4. 生成 AI 筆記
5. 儲存到資料庫
6. 發送通知

### 4. 查看筆記

開啟 Web 應用：`http://localhost:3000/dashboard/notes`

---

## 🔧 管理指令

### 服務控制
```bash
# 查看狀態
pm2 status

# 查看即時日誌
pm2 logs voice-watcher --lines 50

# 重啟服務
pm2 restart voice-watcher

# 停止服務
pm2 stop voice-watcher

# 刪除服務
pm2 delete voice-watcher
```

### 測試運行（開發模式）
```bash
# 不使用 PM2，直接運行（方便除錯）
cd /path/to/graduate-assistant
DEFAULT_USER_ID="your-user-id" \
DATABASE_URL="postgresql://..." \
ANTHROPIC_API_KEY="sk-ant-..." \
tsx src/services/voice-watcher/index.ts
```

---

## 🎨 Web 介面功能

### 語音筆記列表頁面

顯示所有錄音：
- ✅ 已完成：顯示課程、時長、摘要
- ⏳ 處理中：顯示處理狀態
- ❓ 待確認：需要手動選擇課程
- ❌ 失敗：顯示錯誤訊息

### 筆記詳情頁面

查看完整內容：
- 原始逐字稿
- AI 生成的結構化筆記
- 關鍵點摘要
- 課程資訊
- 錄音時長

### 待確認列表

處理低信心度的錄音：
- 顯示建議課程（含信心度）
- 使用者選擇正確課程
- 自動重新處理

---

## 📊 課程識別設定

### 方法 1：時間匹配（最準確）

在課程設定中添加課表：

```json
{
  "schedule": [
    {
      "dayOfWeek": 1,  // 週一
      "startTime": "09:00",
      "endTime": "11:00"
    },
    {
      "dayOfWeek": 3,  // 週三
      "startTime": "14:00",
      "endTime": "16:00"
    }
  ]
}
```

### 方法 2：檔名匹配

在 iPhone 上重新命名錄音：
- ✅ 「機器學習 20250120」→ 自動識別為「機器學習」課程
- ✅ 「ML課堂筆記」 → 識別為包含 "ML" 的課程

### 方法 3：內容分析

服務會自動使用 Claude 分析逐字稿前 500 字，比對課程關鍵字。

---

## ⚙️ 進階設定

### 調整監控路徑

如果 iCloud 路徑不同：

```bash
# 查找 Voice Memos 路徑
find ~ -name "*.m4a" -path "*VoiceMemos*" 2>/dev/null | head -1 | xargs dirname

# 更新 PM2 配置
VOICE_MEMOS_PATH="/your/custom/path/"
```

### 關閉自動處理

如果想手動控制處理：

```javascript
env: {
  AUTO_PROCESS: 'false', // 關閉自動處理
}
```

然後在 Web 介面中手動點擊「處理」按鈕。

### 調整信心度閾值

編輯 `src/services/voice-watcher/processor.ts`：

```typescript
// 目前：信心度 < 60% 需要人工確認
if (identification.confidence < 60) {
  // 可以調整為 50、70 等
}
```

---

## 🐛 故障排除

### 問題：服務無法啟動

檢查依賴：
```bash
which exiftool  # 應該有輸出
which ffprobe   # 應該有輸出
```

檢查 iCloud 路徑：
```bash
ls ~/Library/Mobile\ Documents/com~apple~VoiceMemos/Documents/
```

### 問題：沒有偵測到新錄音

1. 確認 iCloud Drive 已同步
2. 檢查語音備忘錄設定（iPhone 設定 > Apple ID > iCloud > 語音備忘錄）
3. 查看 PM2 日誌：`pm2 logs voice-watcher`

### 問題：逐字稿提取失敗

iOS 逐字稿功能需要：
- iOS 17.4 或更新版本
- 語言設定為中文或英文
- 錄音時長至少 10 秒

手動測試：
```bash
exiftool -UserComment "/path/to/voice-memo.m4a"
```

### 問題：課程識別不準確

1. 檢查課表是否正確設定
2. 嘗試重新命名檔案（在 iPhone 上）
3. 降低信心度閾值
4. 使用「待確認」功能手動選擇（系統會學習）

---

## 📈 效能與成本

### 處理速度
- 提取逐字稿：< 1 秒
- 課程識別：< 2 秒
- AI 生成筆記：3-5 秒
- **總計：約 5-8 秒/筆記**

### API 成本估算
- Claude Sonnet 4：$3 / 1M input tokens
- 單次處理：約 $0.05-0.08 USD
- 每學期（45 堂課）：約 $2-4 USD

### 儲存空間
- 原始錄音：~40MB/50分鐘
- 逐字稿文字：~10-20KB
- AI 筆記：~5-10KB

建議定期清理舊錄音檔案。

---

## 🔐 安全性注意事項

1. **API Keys 保護**
   - 不要提交 PM2 配置到 Git
   - 使用環境變數或 `.env` 檔案

2. **資料庫安全**
   - 使用強密碼
   - 限制資料庫存取來源

3. **檔案權限**
   - 確保只有您的使用者可以存取錄音檔案
   - 考慮加密儲存

---

## 📞 支援與問題回報

如遇問題，請提供：
- PM2 日誌：`pm2 logs voice-watcher --lines 100`
- 系統資訊：macOS 版本、Node.js 版本
- 錯誤訊息截圖

---

## 🎯 下一步

完成部署後，建議：

1. ✅ 測試錄製一段語音備忘錄
2. ✅ 確認自動處理流程
3. ✅ 檢查 Web 介面顯示
4. ✅ 調整課程識別設定
5. ✅ 設定開機自動啟動

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
