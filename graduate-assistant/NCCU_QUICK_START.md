# 政大信箱快速開始指南
**使用者**: 114921039@nccu.edu.tw

---

## 🚀 快速設定（5 分鐘）

### 步驟 1: 設定 Google OAuth

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. **重要**：使用 `114921039@nccu.edu.tw` 登入
3. 建立新專案：`Graduate Assistant NCCU`
4. 啟用 APIs：
   - Google Calendar API
   - Gmail API
5. 建立 OAuth 2.0 憑證
6. 複製 Client ID 和 Client Secret

### 步驟 2: 更新環境變數

複製範例檔案：
```bash
cp .env.nccu.example .env
```

編輯 `.env` 並填入：
```env
GOOGLE_CLIENT_ID="你的-client-id"
GOOGLE_CLIENT_SECRET="你的-client-secret"
NCCU_EMAIL="114921039@nccu.edu.tw"

# AI Keys (從各平台取得)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### 步驟 3: 啟動並登入

```bash
# 安裝依賴
npm install

# 初始化資料庫
npx prisma generate
npx prisma db push

# 啟動系統
npm run dev
```

訪問 `http://localhost:3000` 並使用政大信箱登入。

### 步驟 4: 初始化郵件處理

登入後，運行：
```bash
npm run init-nccu-email
```

這會自動建立 6 條政大 Moodle 郵件規則。

### 步驟 5: 測試郵件處理

```bash
npm run process-nccu-emails
```

系統會自動處理政大 Moodle 的未讀郵件並建立作業！

---

## 📧 自動處理的郵件類型

系統會自動處理以下郵件：

| 郵件類型 | 關鍵字 | 動作 |
|---------|--------|------|
| Moodle 通知 | `moodle.nccu.edu.tw` | 建立作業 |
| Moodle 系統 | `Moodle:` | 建立作業 |
| 作業通知 | `作業繳交` | 建立作業 |
| 截止提醒 | `截止日期` | 建立作業 |
| 測驗通知 | `測驗通知` | 建立作業 |
| 課程公告 | `課程公告` | 建立作業 |

---

## 🤖 智能功能

### 1. 自動提取截止日期
系統可以理解多種中文日期格式：
- ✓ 「截止日期：2025/11/25 23:59」
- ✓ 「3天內繳交」
- ✓ 「本週五前完成」
- ✓ 「下週一截止」

### 2. 自動識別課程
從郵件主旨或內容自動識別：
- ✓ [資料結構] 作業一
- ✓ 演算法課程通知
- ✓ 課程：計算機組織

### 3. 自動分類
自動將作業連結到對應課程。

---

## ⏰ 自動化執行（推薦）

### macOS / Linux (cron)

編輯 crontab：
```bash
crontab -e
```

添加（每小時執行一次）：
```bash
0 * * * * cd /path/to/graduate-assistant && npm run process-nccu-emails >> /tmp/nccu-emails.log 2>&1
```

### Windows (Task Scheduler)

1. 開啟「工作排程器」
2. 建立基本工作
3. 觸發程序：每小時
4. 動作：啟動程式
   - 程式：`npm`
   - 引數：`run process-nccu-emails`
   - 起始於：`C:\path\to\graduate-assistant`

---

## 📱 使用流程範例

### 情境 1: 收到 Moodle 作業通知

1. **政大 Moodle 發送郵件** → 114921039@nccu.edu.tw
2. **系統自動處理**（下次執行 process-nccu-emails 時）
3. **自動提取**：
   - 課程名稱：資料結構
   - 作業標題：作業一：鏈結串列實作
   - 截止日期：2025/11/25 23:59
4. **自動建立作業** → Dashboard
5. **自動同步** → Google Calendar
6. **自動同步** → Notion（如果啟用）

**您需要做的**：無！完全自動化 ✨

### 情境 2: 手動處理郵件

如果想立即處理，隨時運行：
```bash
npm run process-nccu-emails
```

---

## 🎯 完整功能一覽

### ✅ 已完成功能

- [x] 政大信箱 Google OAuth 登入
- [x] Gmail API 整合
- [x] 自動郵件處理
- [x] 智能日期提取（中文支援）
- [x] 自動課程識別
- [x] Google Calendar 同步
- [x] Notion 同步
- [x] 預設郵件規則
- [x] 初始化腳本
- [x] 處理腳本
- [x] 完整文件

### 🎨 可自訂項目

在系統設定頁面可以：
- 啟用/停用郵件規則
- 調整規則優先級
- 新增自訂規則
- 設定通知偏好

---

## 🔍 檢查清單

啟動前確認：

- [ ] Google OAuth 已設定
- [ ] .env 已設定所有 API keys
- [ ] 已使用政大信箱登入系統
- [ ] 已運行 `npm run init-nccu-email`
- [ ] 測試 `npm run process-nccu-emails` 成功

完成後：

- [ ] Gmail 顯示「已連結」
- [ ] Calendar 可顯示事件
- [ ] 郵件規則已建立（6條）
- [ ] 可自動處理 Moodle 郵件

---

## 💡 使用技巧

### 1. 每日晨間檢查
```bash
npm run process-nccu-emails
```
處理昨夜到今晨的所有郵件。

### 2. 考試週加強
臨時增加執行頻率：
```bash
# 每 15 分鐘執行一次
*/15 * * * * cd /path/to/graduate-assistant && npm run process-nccu-emails
```

### 3. 結合其他功能
- 處理郵件 → 查看 Dashboard → 一鍵同步到 Calendar
- 使用 AI 助手問問題：「今天有什麼作業？」
- Voice Notes 記錄課堂筆記 → 自動 AI 整理

---

## 🆘 常見問題

### Q: 無法登入政大信箱？
**A**:
1. 確認 OAuth 同意畫面已完成
2. 測試使用者包含您的信箱
3. 清除瀏覽器 cache

### Q: 郵件沒有自動處理？
**A**:
1. 檢查是否有未讀郵件
2. 確認郵件規則已建立：訪問設定頁面
3. 手動測試：`npm run process-nccu-emails`

### Q: 截止日期不正確？
**A**:
系統會嘗試從郵件提取，如果無法識別會預設 7 天後。
可以手動在 Dashboard 修改。

---

## 📚 進階文件

- **完整設定指南**: `NCCU_EMAIL_SETUP.md`
- **系統完整文件**: `GRADUATE_ASSISTANT_COMPLETE.md`
- **測試報告**: `TEST_RESULTS_SUMMARY.md`

---

## 🎓 政大專屬支援

- **資訊中心**: (02) 2939-3091 #67171
- **Email**: cc@nccu.edu.tw
- **Moodle**: https://moodle.nccu.edu.tw

---

**準備好了嗎？**

```bash
# 一鍵開始
npm run dev
```

然後訪問 `http://localhost:3000` 開始使用！ 🎉

---

**最後更新**: 2025-11-20
**版本**: 1.0.0
**專為**: 114921039@nccu.edu.tw 設計
