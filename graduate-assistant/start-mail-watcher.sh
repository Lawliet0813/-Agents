#!/bin/bash

###############################################################################
# 政大 Mail2000 郵件監控服務 - 一鍵啟動腳本
# NCCU Graduate Assistant - Mail2000 Email Watcher
###############################################################################

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 清除畫面
clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          📧 Mail2000 郵件監控服務 - 啟動程式               ║"
echo "║          NCCU Graduate Assistant                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 錯誤: 請在專案根目錄執行此腳本${NC}"
    exit 1
fi

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 錯誤: 找不到 Node.js${NC}"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 錯誤: 找不到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm 版本: $(npm -v)${NC}"
echo ""

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  尚未安裝依賴套件${NC}"
    echo -e "${BLUE}正在執行 npm install...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 安裝依賴失敗${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 依賴安裝完成${NC}"
    echo ""
fi

# 檢查 .env 檔案
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  找不到 .env 檔案${NC}"
    echo "請建立 .env 檔案並設定必要的環境變數"
    echo "可以參考 .env.example 或 .env.nccu.example"
    echo ""
    read -p "是否要繼續？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 載入環境變數
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 詢問使用者 Email
echo -e "${BLUE}請輸入您的 Email (例如: 114921039@nccu.edu.tw):${NC}"
read -r USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}❌ Email 不能為空${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}請輸入檢查間隔 (分鐘，預設 5):${NC}"
read -r CHECK_INTERVAL

if [ -z "$CHECK_INTERVAL" ]; then
    CHECK_INTERVAL=5
fi

# 確認設定
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  啟動設定                                                  ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  👤 使用者: $USER_EMAIL"
echo "║  ⏰ 檢查間隔: $CHECK_INTERVAL 分鐘"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
read -p "確認啟動？(Y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "已取消"
    exit 0
fi

# 啟動服務
echo ""
echo -e "${GREEN}🚀 正在啟動郵件監控服務...${NC}"
echo ""

export MAIL_CHECK_INTERVAL=$CHECK_INTERVAL
npm run start-mail2000-watcher "$USER_EMAIL"

# 如果服務結束
echo ""
echo -e "${YELLOW}👋 服務已停止${NC}"
