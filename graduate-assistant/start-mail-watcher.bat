@echo off
REM ============================================================================
REM 政大 Mail2000 郵件監控服務 - Windows 一鍵啟動腳本
REM NCCU Graduate Assistant - Mail2000 Email Watcher
REM ============================================================================

chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════════╗
echo ║          📧 Mail2000 郵件監控服務 - 啟動程式               ║
echo ║          NCCU Graduate Assistant                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 檢查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 錯誤: 找不到 Node.js
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安裝
node -v

REM 檢查 npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 錯誤: 找不到 npm
    pause
    exit /b 1
)

echo ✅ npm 已安裝
npm -v
echo.

REM 檢查是否已安裝依賴
if not exist "node_modules" (
    echo ⚠️  尚未安裝依賴套件
    echo 正在執行 npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 安裝依賴失敗
        pause
        exit /b 1
    )
    echo ✅ 依賴安裝完成
    echo.
)

REM 檢查 .env 檔案
if not exist ".env" (
    echo ⚠️  找不到 .env 檔案
    echo 請建立 .env 檔案並設定必要的環境變數
    echo 可以參考 .env.example 或 .env.nccu.example
    echo.
    set /p "CONTINUE=是否要繼續？(Y/N): "
    if /i not "%CONTINUE%"=="Y" exit /b 1
)

REM 詢問使用者 Email
echo.
set /p "USER_EMAIL=請輸入您的 Email (例如: 114921039@nccu.edu.tw): "

if "%USER_EMAIL%"=="" (
    echo ❌ Email 不能為空
    pause
    exit /b 1
)

REM 詢問檢查間隔
echo.
set /p "CHECK_INTERVAL=請輸入檢查間隔 (分鐘，預設 5): "

if "%CHECK_INTERVAL%"=="" (
    set CHECK_INTERVAL=5
)

REM 確認設定
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  啟動設定                                                  ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  👤 使用者: %USER_EMAIL%
echo ║  ⏰ 檢查間隔: %CHECK_INTERVAL% 分鐘
echo ╚════════════════════════════════════════════════════════════╝
echo.
set /p "CONFIRM=確認啟動？(Y/N): "

if /i not "%CONFIRM%"=="Y" (
    echo 已取消
    pause
    exit /b 0
)

REM 啟動服務
echo.
echo 🚀 正在啟動郵件監控服務...
echo.

set MAIL_CHECK_INTERVAL=%CHECK_INTERVAL%
call npm run start-mail2000-watcher "%USER_EMAIL%"

REM 如果服務結束
echo.
echo 👋 服務已停止
pause
