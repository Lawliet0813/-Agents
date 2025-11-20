# 📱 Graduate Assistant - App 啟動指南

**像 APP 一樣雙擊啟動，無需終端機指令！**

---

## 🎯 三種啟動方式

### 方式 1: 雙擊啟動器（最簡單！推薦）

#### 🍎 macOS 使用者

**首次使用 - 創建 App**：
```bash
cd graduate-assistant
./create-macos-app.sh
```

這會創建兩個 .app 應用：
- ✅ `Graduate Assistant.app` - 啟動應用
- ✅ `Stop Graduate Assistant.app` - 停止應用

**使用方式**：
1. 雙擊 `Graduate Assistant.app` 啟動
2. 自動打開瀏覽器到 http://localhost:3000
3. 雙擊 `Stop Graduate Assistant.app` 停止

**💡 提示**：
- 可以將 .app 拖到 Dock 方便使用
- 可以拖到「應用程式」資料夾
- 首次啟動可能需要在「系統偏好設定 > 安全性與隱私」中允許執行

#### 🪟 Windows 使用者

**使用方式**：
1. 雙擊 `GraduateAssistant.vbs` 啟動
2. 應用會在背景啟動（無命令行視窗）
3. 5 秒後自動打開瀏覽器
4. 雙擊 `StopGraduateAssistant.vbs` 停止

**💡 提示**：
- 可以建立桌面捷徑
- 可以釘選到工作列
- 可以設定開機自動啟動

**建立桌面捷徑**：
1. 右鍵 `GraduateAssistant.vbs`
2. 選擇「傳送到」→「桌面（建立捷徑）」
3. 重新命名為「研究生助理」

---

### 方式 2: 控制面板（功能最多）

```bash
npm run app
```

會顯示互動式選單：

```
╔════════════════════════════════════════════════════════════╗
║          🎓 Graduate Assistant 控制面板                    ║
╚════════════════════════════════════════════════════════════╝

  [1] 啟動所有服務
  [2] 停止所有服務
  [3] 重啟所有服務
  [4] 查看服務狀態
  [5] 查看日誌
  [0] 退出

請選擇操作:
```

**功能說明**：
- **[1] 啟動** - 啟動 Web 應用和郵件監控服務
- **[2] 停止** - 停止所有服務
- **[3] 重啟** - 重啟所有服務（更新代碼後使用）
- **[4] 狀態** - 查看服務運行狀態和運行時間
- **[5] 日誌** - 實時查看服務日誌（除錯用）

---

### 方式 3: 命令行（進階用戶）

```bash
# 啟動所有服務
npm run app:start

# 停止所有服務
npm run app:stop

# 重啟所有服務
npm run app:restart

# 查看狀態
npm run app:status

# 查看日誌
npm run app:logs
```

---

## 🔧 背後的技術

### PM2 進程管理

應用使用 **PM2** 在背景運行，提供：
- ✅ 自動重啟（如果崩潰）
- ✅ 日誌管理
- ✅ 記憶體監控
- ✅ 進程守護

### 運行的服務

1. **graduate-assistant-web** (Port 3000)
   - Next.js Web 應用
   - 提供 UI 介面

2. **mail2000-watcher**
   - 郵件自動監控服務
   - 每 5 分鐘檢查新郵件

---

## 📋 首次設定

### 1. 安裝 PM2（自動）

首次執行時會自動安裝 PM2：
```bash
npm install -g pm2
```

### 2. 設定環境變數

確保 `.env` 檔案已設定：
```env
DATABASE_URL="..."
NCCU_EMAIL="114921039@nccu.edu.tw"
MAIL_CHECK_INTERVAL=5
```

### 3. 設定 Mail2000 帳號

在啟動前需設定郵件帳號：
```bash
npm run process-mail2000
```

或在 Web UI 中設定。

---

## 🎨 自訂圖示（macOS）

為 .app 應用更換圖示：

1. 準備 `.icns` 圖示檔案
2. 複製到 `Graduate Assistant.app/Contents/Resources/`
3. 重新命名為 `icon.icns`
4. 在 `Info.plist` 中添加：
```xml
<key>CFBundleIconFile</key>
<string>icon.icns</string>
```

---

## 🚀 開機自動啟動

### macOS

使用 Automator 或 LaunchAgent：

```bash
# 添加到登入項目
# 系統偏好設定 → 使用者與群組 → 登入項目
# 將 Graduate Assistant.app 加入列表
```

### Windows

1. 按 `Win + R`
2. 輸入 `shell:startup`
3. 將 `GraduateAssistant.vbs` 的捷徑放入此資料夾

---

## 📊 監控和管理

### 查看服務狀態
```bash
pm2 status
```

### 查看實時日誌
```bash
pm2 logs
```

### 重啟特定服務
```bash
pm2 restart graduate-assistant-web
pm2 restart mail2000-watcher
```

### 停止特定服務
```bash
pm2 stop graduate-assistant-web
pm2 stop mail2000-watcher
```

### 完全移除服務
```bash
pm2 delete all
```

---

## 🐛 疑難排解

### 應用無法啟動

**檢查端口是否被佔用**：
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**解決方式**：
- 停止佔用端口的程序
- 或修改 `.env` 中的 `PORT`

### PM2 命令找不到

**手動安裝 PM2**：
```bash
npm install -g pm2
```

### 服務狀態顯示 error

**查看錯誤日誌**：
```bash
npm run app:logs
```

**常見問題**：
- 資料庫連線失敗：檢查 `DATABASE_URL`
- Mail2000 連線失敗：確認帳號密碼正確
- 端口被佔用：更改端口或停止衝突程序

### macOS 無法執行 .app

**允許執行未識別的開發者應用**：
1. 系統偏好設定 → 安全性與隱私
2. 點擊「強制打開」
3. 或在終端執行：
```bash
xattr -cr "Graduate Assistant.app"
```

### Windows 無法執行 .vbs

**允許執行腳本**：
1. 右鍵 .vbs 檔案
2. 內容 → 解除封鎖
3. 確定

---

## 💡 使用技巧

### 查看完整狀態
```bash
npm run app:status
```

顯示：
```
📊 服務狀態：

  Web 應用:      🟢 RUNNING
                 運行時間: 2小時

  郵件監控:      🟢 RUNNING
                 運行時間: 2小時

🌐 訪問: http://localhost:3000
```

### 背景運行

服務會持續在背景運行，即使：
- ✅ 關閉終端機
- ✅ 關閉瀏覽器
- ✅ 電腦休眠後喚醒（會自動重啟）

### 更新代碼後

```bash
git pull
npm install
npm run app:restart
```

---

## 🎯 推薦工作流程

### 日常使用（macOS）
1. 開機後雙擊 `Graduate Assistant.app`
2. 自動打開瀏覽器使用
3. 下班時雙擊 `Stop Graduate Assistant.app`

### 日常使用（Windows）
1. 開機後雙擊桌面的「研究生助理」
2. 自動打開瀏覽器使用
3. 下班時雙擊「停止研究生助理」

### 開發調試
1. `npm run app` 打開控制面板
2. 選擇 [5] 查看日誌
3. 修改代碼後選擇 [3] 重啟

---

## 📚 相關文件

- [README.md](./README.md) - 專案總覽
- [NCCU_MAIL2000_SETUP.md](./NCCU_MAIL2000_SETUP.md) - 郵件設定
- [NCCU_QUICK_START.md](./NCCU_QUICK_START.md) - 快速開始

---

## ✨ 總結

現在您可以：
- 🎯 **雙擊啟動** - 像使用普通 APP 一樣
- 🔕 **無終端機** - 在背景安靜運行
- 🔄 **自動重啟** - 即使崩潰也會自動恢復
- 📱 **輕鬆管理** - 通過控制面板或雙擊停止

**享受無縫的研究生助理體驗！** 🚀
