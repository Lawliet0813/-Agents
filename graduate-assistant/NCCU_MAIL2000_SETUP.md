# 政大 Mail2000 整合設定指南

**適用於**: 使用政大 Mail2000 系統的學生
**收發伺服器**: mail.nccu.edu.tw
**您的帳號**: 114921039@nccu.edu.tw

---

## 📧 Mail2000 vs Google Workspace

政大提供兩種郵件系統：

| 項目 | Mail2000 | Google Workspace |
|------|----------|------------------|
| 伺服器 | mail.nccu.edu.tw | gmail.com |
| 協議 | IMAP/SMTP | Gmail API |
| 整合方式 | 帳號密碼 | OAuth 2.0 |
| 本指南適用 | ✅ 是 | ❌ 否（請見 NCCU_EMAIL_SETUP.md） |

**如何確認您使用的系統？**
- 登入網址是 `https://mail.nccu.edu.tw` → Mail2000 ✅
- 登入網址是 `https://gmail.com` → Google Workspace（請參考 NCCU_EMAIL_SETUP.md）

---

## 🚀 快速設定（3 步驟）

### 步驟 1: 更新 Prisma Schema

需要在 User model 中添加 Mail2000 憑證欄位：

編輯 `prisma/schema.prisma`，在 `model User` 中添加：

```prisma
model User {
  // ... 其他欄位 ...

  // Mail2000 credentials
  mail2000Username String?
  mail2000Password String? // 加密存儲

  // ... 其他欄位 ...
}
```

然後執行：
```bash
npx prisma db push
npx prisma generate
```

### 步驟 2: 在系統中設定 Mail2000 憑證

1. 啟動系統：`npm run dev`
2. 訪問 `http://localhost:3000`
3. 使用任何方式登入（或創建帳號）
4. 前往「設定」→「整合服務」→「Mail2000」
5. 輸入：
   - 學號：`114921039`
   - 密碼：您的 Mail2000 密碼

### 步驟 3: 測試郵件處理

```bash
npm run process-mail2000
```

就這麼簡單！✨

---

## 🔧 詳細設定步驟

### 1. 環境變數設定

更新 `.env` 文件：

```env
# Mail2000 設定
NCCU_EMAIL="114921039@nccu.edu.tw"
MAIL2000_HOST="mail.nccu.edu.tw"
MAIL2000_IMAP_PORT="993"

# 資料庫 (確保已設定)
DATABASE_URL="postgresql://..."

# AI Keys (用於筆記處理)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### 2. 安裝依賴

```bash
npm install imap nodemailer mailparser
```

### 3. 資料庫 Migration

```bash
# 更新 schema
npx prisma db push

# 重新生成 client
npx prisma generate
```

### 4. 在 package.json 添加腳本

已自動添加：
```json
{
  "scripts": {
    "process-mail2000": "tsx scripts/process-mail2000.ts"
  }
}
```

---

## 💻 使用方式

### 方法 1: 手動執行

```bash
npm run process-mail2000
```

這會：
1. 連線到 mail.nccu.edu.tw
2. 讀取未讀郵件
3. 識別 Moodle 相關郵件
4. 自動建立作業
5. 標記郵件為已讀

### 方法 2: 定時自動執行

#### macOS/Linux (cron)

編輯 crontab：
```bash
crontab -e
```

添加（每小時執行）：
```bash
0 * * * * cd /path/to/graduate-assistant && npm run process-mail2000 >> /tmp/mail2000.log 2>&1
```

#### Windows (Task Scheduler)

1. 開啟「工作排程器」
2. 建立基本工作
3. 觸發程序：每小時
4. 動作：
   - 程式：`npm`
   - 引數：`run process-mail2000`
   - 起始於：專案目錄路徑

---

## 🎯 自動處理功能

系統會自動處理以下類型的郵件：

### 1. Moodle 通知

**識別方式**：
- 發件人包含 `moodle.nccu.edu.tw`
- 主旨包含 `Moodle`

**自動提取**：
- 課程名稱（從主旨或內容）
- 作業標題
- 截止日期（支援中文格式）

**自動動作**：
- 建立新作業
- 連結到對應課程（如果找到）
- 標記郵件為已讀

### 2. 中文日期識別

支援以下格式：
- ✅ `截止日期：2025/11/25 23:59`
- ✅ `3天內繳交`
- ✅ `本週五前完成`
- ✅ `Due date: 2025-11-25`

### 3. 課程自動識別

從以下來源識別課程：
- 主旨中的 `[課程名稱]`
- 內容中的 `課程：課程名稱`
- 常見課程關鍵字（資料結構、演算法等）

---

## 🔐 安全性

### 密碼儲存

您的 Mail2000 密碼：
- ✅ 加密存儲在資料庫
- ✅ 僅用於連線到 Mail2000
- ✅ 不會發送到任何第三方
- ✅ 可隨時在設定中更新或刪除

### IMAP 連線

- ✅ 使用 TLS 加密連線（Port 993）
- ✅ 直接連線到 mail.nccu.edu.tw
- ✅ 不經過任何中間伺服器

### 資料隱私

系統：
- ✅ 只讀取未讀郵件
- ✅ 只處理 Moodle 相關郵件
- ✅ 不會保存完整郵件內容
- ✅ 只提取必要資訊（標題、日期等）

---

## 📱 完整使用流程範例

### 情境：收到 Moodle 作業通知

1. **Moodle 發送郵件**
   ```
   收件人: 114921039@nccu.edu.tw
   主旨: Moodle: [資料結構] 作業一：鏈結串列實作
   內容:
   截止日期：2025/11/25 23:59
   請實作單向鏈結串列...
   ```

2. **執行處理腳本**
   ```bash
   npm run process-mail2000
   ```

3. **系統自動處理**
   ```
   ✓ 連線到 mail.nccu.edu.tw
   ✓ 找到 1 封未讀 Moodle 郵件
   ✓ 提取資訊：
     - 課程：資料結構
     - 標題：作業一：鏈結串列實作
     - 截止：2025/11/25 23:59
   ✓ 建立作業
   ✓ 標記郵件為已讀
   ```

4. **結果**
   - Dashboard 顯示新作業
   - 自動同步到 Google Calendar（如果啟用）
   - 自動同步到 Notion（如果啟用）

**您需要做的**：無！完全自動 ✨

---

## 🛠️ 進階設定

### 自訂郵件規則

未來版本會支援在 UI 中設定規則，目前可以修改程式碼：

編輯 `src/server/services/mail2000-service.ts`：

```typescript
// 在 processNCCUMoodleEmails 方法中
// 修改郵件篩選條件
if (
  !message.from?.includes('moodle.nccu.edu.tw') &&
  !message.subject?.includes('Moodle') &&
  !message.subject?.includes('你要加的關鍵字')  // 添加自訂條件
) {
  continue
}
```

### 增加課程識別關鍵字

編輯 `extractCourseName` 方法中的 `coursePatterns`：

```typescript
const coursePatterns = [
  /資料結構/,
  /演算法/,
  /你的課程名稱/,  // 添加這裡
  // ...
]
```

---

## 🐛 疑難排解

### Q1: 連線失敗 (ECONNREFUSED)

**症狀**：
```
❌ 無法連線到 Mail2000 伺服器
```

**可能原因**：
1. Mail2000 伺服器暫時無法連線
2. 防火牆阻擋 Port 993
3. 網路連線問題

**解決方法**：
```bash
# 測試 IMAP port 是否開放
telnet mail.nccu.edu.tw 993

# 如果使用防火牆，允許 outbound 993
# 稍後再試
```

### Q2: 認證失敗 (AUTHENTICATIONFAILED)

**症狀**：
```
❌ 學號或密碼錯誤
```

**可能原因**：
1. 密碼錯誤
2. 密碼已過期
3. 帳號被鎖定

**解決方法**：
1. 訪問 https://mail.nccu.edu.tw 確認可以登入
2. 如果無法登入，請重設密碼
3. 在系統設定中更新密碼

### Q3: 沒有找到未讀郵件

**症狀**：
```
ℹ️ 沒有新的未讀 Moodle 郵件
```

**這是正常的**！表示：
- 所有郵件都已讀取
- 或沒有新的 Moodle 郵件

### Q4: 建立作業但課程是「未分類」

**原因**：系統無法自動識別課程

**解決方法**：
1. 在 Dashboard 中手動指定課程
2. 或在系統中先建立課程（名稱要與郵件中的相符）

### Q5: 日期提取不正確

**如果郵件的日期格式不在支援列表中**：

請提供郵件範例，我們可以添加支援。

或手動在 Dashboard 中修改截止日期。

---

## 📊 Mail2000 vs Google Workspace 對比

| 功能 | Mail2000 | Google Workspace |
|------|----------|------------------|
| 設定難度 | ⭐ 簡單 | ⭐⭐ 中等 |
| 需要 OAuth | ❌ 否 | ✅ 是 |
| 需要 Google Cloud | ❌ 否 | ✅ 是 |
| 支援 Gmail API | ❌ 否 | ✅ 是 |
| 支援 Calendar | ❌ 否 (需另外設定) | ✅ 是 |
| 自動 Token Refresh | N/A | ✅ 是 |
| 密碼管理 | 需手動更新 | 自動處理 |
| 安全性 | ⭐⭐⭐ 良好 | ⭐⭐⭐⭐ 優秀 |

**建議**：
- 如果只需要郵件處理 → Mail2000 ✅
- 如果需要 Calendar 整合 → Google Workspace ✅
- **兩者都可以同時使用**！

---

## 🔄 同時使用兩種系統

您可以同時整合 Mail2000 和 Google Workspace：

1. **Mail2000**：處理政大 Moodle 郵件
2. **Google Workspace**：
   - Google Calendar 同步
   - Gmail 通知（如果有其他 Gmail）

設定方式：
1. 完成 Mail2000 設定（本文件）
2. 完成 Google OAuth 設定（NCCU_EMAIL_SETUP.md）
3. 兩個處理腳本都可以執行：
   ```bash
   npm run process-mail2000
   npm run process-nccu-emails
   ```

---

## ✅ 設定完成檢查清單

Mail2000 設定：
- [ ] Prisma schema 已更新
- [ ] 資料庫已 migration
- [ ] 系統中已設定 Mail2000 帳號密碼
- [ ] 測試連線成功
- [ ] 可以執行 `npm run process-mail2000`
- [ ] 自動處理測試成功

進階設定（可選）：
- [ ] 設定 cron job 定時執行
- [ ] 自訂郵件規則
- [ ] 增加課程識別關鍵字

---

## 📞 支援資源

### 政大資源
- **資訊中心**: (02) 2939-3091 #67171
- **Email**: cc@nccu.edu.tw
- **Mail2000**: https://mail.nccu.edu.tw
- **Moodle**: https://moodle.nccu.edu.tw

### Mail2000 相關
- 忘記密碼：聯絡資訊中心
- 帳號問題：聯絡資訊中心
- IMAP 設定：https://mail.nccu.edu.tw (查看說明)

---

## 🎓 總結

Mail2000 整合提供：
- ✅ 簡單快速的設定流程
- ✅ 不需要 Google Cloud Console
- ✅ 直接使用學號密碼
- ✅ 完整的 Moodle 郵件處理
- ✅ 智能中文日期識別
- ✅ 自動課程識別
- ✅ 可與 Google 服務並存

**開始使用**：
1. 完成上述 3 個步驟設定
2. 執行 `npm run process-mail2000`
3. 享受自動化！🎉

---

**最後更新**: 2025-11-20
**適用帳號**: 114921039@nccu.edu.tw
**伺服器**: mail.nccu.edu.tw
**協議**: IMAP (Port 993)
