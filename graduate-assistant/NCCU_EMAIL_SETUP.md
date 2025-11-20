# 政大信箱 (NCCU Gmail) 整合設定指南

## 📧 使用政大學生信箱

您的政大信箱：**114921039@nccu.edu.tw**

政大使用 Google Workspace（G Suite），因此可以完全整合到本系統。

---

## 🔧 設定步驟

### 1. Google Cloud Console 設定

#### 1.1 建立專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. **重要**：使用您的政大信箱 `114921039@nccu.edu.tw` 登入
3. 點擊「選取專案」→「新增專案」
4. 專案名稱：`Graduate Assistant NCCU`
5. 點擊「建立」

#### 1.2 啟用 APIs
在專案中啟用以下 APIs：
1. 前往「API 和服務」→「程式庫」
2. 搜尋並啟用：
   - **Google Calendar API**
   - **Gmail API**
   - **Google+ API**（用於登入）

#### 1.3 設定 OAuth 同意畫面
1. 前往「API 和服務」→「OAuth 同意畫面」
2. 選擇「內部」（僅限政大組織內部）或「外部」
   - **建議選擇「外部」**：因為這是個人專案
3. 填寫應用程式資訊：
   ```
   應用程式名稱: Graduate Assistant
   使用者支援電子郵件: 114921039@nccu.edu.tw
   開發人員聯絡資訊: 114921039@nccu.edu.tw
   ```
4. 範圍（Scopes）：
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://mail.google.com/`
5. 測試使用者（如果選擇「外部」）：
   - 新增 `114921039@nccu.edu.tw`

#### 1.4 建立 OAuth 2.0 憑證
1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 應用程式類型：「網頁應用程式」
4. 名稱：`Graduate Assistant Web`
5. **已授權的 JavaScript 來源**：
   ```
   http://localhost:3000
   https://your-domain.com  (生產環境)
   ```
6. **已授權的重新導向 URI**：
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```
7. 點擊「建立」
8. **複製「用戶端 ID」和「用戶端密碼」**

---

### 2. 環境變數設定

更新 `.env` 文件：

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id-from-google-console.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-from-google-console"
```

---

### 3. 政大信箱特殊設定

#### 3.1 Gmail API 權限
政大的 Google Workspace 可能有管理員設定的限制。如果遇到權限問題：

1. **聯絡政大資訊中心**：
   - 電話：(02) 2939-3091 分機 67171
   - Email：cc@nccu.edu.tw
   - 說明您需要使用 Gmail API 進行學習管理

2. **替代方案**：
   - 如果無法使用 Gmail API，可以使用個人 Gmail 帳號
   - 將課程郵件轉寄到個人 Gmail

#### 3.2 行事曆同步
政大行事曆可以直接同步，不需要特殊權限。

---

## 📱 使用方式

### 登入系統
1. 訪問 `http://localhost:3000`
2. 點擊「使用 Google 登入」
3. 選擇或輸入 `114921039@nccu.edu.tw`
4. 授權所需權限：
   - 基本資料（姓名、電子郵件）
   - Google Calendar 讀寫權限
   - Gmail 讀取權限

### Gmail 自動處理
系統會自動處理來自以下來源的郵件：
- Moodle 通知 (`moodle.nccu.edu.tw`)
- 課程教師郵件
- 作業截止提醒

#### 設定郵件規則範例

在系統中可以設定以下規則：

```javascript
// 範例：自動處理政大 Moodle 郵件
{
  keyword: "moodle.nccu.edu.tw",
  category: "assignment",
  action: "create_task"
}

// 範例：處理特定課程郵件
{
  keyword: "資料結構",
  category: "course",
  action: "create_task"
}
```

---

## 🔍 測試連線

### 1. 測試 Google OAuth
```bash
# 啟動開發伺服器
npm run dev

# 訪問 http://localhost:3000
# 嘗試登入
```

### 2. 測試 Gmail 連線
登入後，前往「設定」→「整合服務」→「Gmail 整合」
- 應該顯示「已連結」狀態
- 顯示您的政大信箱

### 3. 測試 Calendar 連線
前往「行事曆」頁面
- 應該看到您的政大行事曆事件
- 可以建立新事件

---

## 🛡️ 隱私與安全

### 資料存取範圍
系統只會存取：
- ✅ 未讀郵件（用於規則處理）
- ✅ 行事曆事件（讀寫）
- ✅ 基本個人資料

系統**不會**：
- ❌ 讀取所有郵件
- ❌ 發送郵件
- ❌ 修改郵件設定
- ❌ 分享您的資料

### OAuth Token 管理
- Token 加密存儲在資料庫
- 自動 refresh 機制
- 可隨時撤銷授權

---

## ⚙️ 進階設定

### 1. 郵件規則 (Email Rules)

在資料庫中建立規則：

```sql
-- 範例：處理 Moodle 作業通知
INSERT INTO "EmailRule" (
  "userId",
  "keyword",
  "category",
  "action",
  "priority",
  "isActive"
) VALUES (
  'your-user-id',
  'Moodle:',
  'assignment',
  'create_task',
  1,
  true
);
```

### 2. 自動分類課程

系統會嘗試從郵件主旨和內容中識別課程：
- 資料結構 → 自動歸類到對應課程
- 演算法 → 自動歸類到對應課程

### 3. 批次處理

設定定期處理郵件：

```bash
# 使用 cron job (Linux/macOS)
# 每小時處理一次未讀郵件
0 * * * * cd /path/to/graduate-assistant && npm run process-emails
```

---

## 🐛 常見問題

### Q1: 無法登入政大信箱
**A**:
1. 確認 OAuth 同意畫面已完成設定
2. 確認測試使用者包含您的政大信箱
3. 清除瀏覽器 cookies 重試

### Q2: Gmail API 權限被拒
**A**:
1. 檢查是否為政大管理員限制
2. 聯絡政大資訊中心申請權限
3. 或使用個人 Gmail 帳號

### Q3: 無法讀取郵件
**A**:
1. 檢查 OAuth scopes 是否包含 `https://mail.google.com/`
2. 重新授權一次
3. 檢查系統日誌

### Q4: 行事曆無法同步
**A**:
1. 確認 Calendar API 已啟用
2. 檢查 OAuth scopes
3. 確認政大行事曆設定為「公開」或「與組織共用」

---

## 📞 支援資源

### 政大相關
- **資訊中心**: (02) 2939-3091 #67171
- **Email**: cc@nccu.edu.tw
- **Moodle**: https://moodle.nccu.edu.tw

### Google Workspace
- **說明文件**: https://workspace.google.com/
- **API 文件**: https://developers.google.com/gmail

### 系統支援
- **GitHub Issues**: [專案 repository]
- **文件**: 查看 `GRADUATE_ASSISTANT_COMPLETE.md`

---

## ✅ 設定完成檢查清單

- [ ] Google Cloud 專案已建立（使用政大信箱）
- [ ] Calendar API 已啟用
- [ ] Gmail API 已啟用
- [ ] OAuth 同意畫面已設定
- [ ] OAuth 憑證已建立
- [ ] `.env` 已更新 Client ID 和 Secret
- [ ] 系統可以成功登入政大信箱
- [ ] Gmail 連線狀態顯示「已連結」
- [ ] Calendar 可以顯示政大行事曆
- [ ] 郵件規則已設定

完成以上步驟後，您的政大信箱就完全整合到研究生助理系統了！🎉

---

**最後更新**: 2025-11-20
**適用信箱**: 114921039@nccu.edu.tw
**系統版本**: 1.0.0
