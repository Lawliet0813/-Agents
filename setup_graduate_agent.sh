#!/bin/bash

# 研究生專屬 AGENT 快速設定腳本

echo "========================================"
echo "研究生專屬 AGENT - 快速設定"
echo "========================================"
echo ""

# 檢查 Python 版本
echo "→ 檢查 Python 版本..."
if ! command -v python3 &> /dev/null; then
    echo "✗ 找不到 Python 3，請先安裝 Python 3.8 或以上版本"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✓ 找到 Python $PYTHON_VERSION"
echo ""

# 創建虛擬環境
echo "→ 創建虛擬環境..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✓ 虛擬環境已創建"
else
    echo "⊙ 虛擬環境已存在"
fi
echo ""

# 啟動虛擬環境
echo "→ 啟動虛擬環境..."
source .venv/bin/activate
echo "✓ 虛擬環境已啟動"
echo ""

# 安裝依賴
echo "→ 安裝依賴套件..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ 依賴套件已安裝"
echo ""

# 檢查 ChromeDriver
echo "→ 檢查 ChromeDriver..."
if command -v chromedriver &> /dev/null; then
    CHROMEDRIVER_VERSION=$(chromedriver --version)
    echo "✓ 找到 ChromeDriver: $CHROMEDRIVER_VERSION"
else
    echo "⚠  未找到 ChromeDriver"
    echo "   請執行以下命令安裝："
    echo "   Ubuntu/Debian: sudo apt-get install chromium-chromedriver"
    echo "   Mac: brew install chromedriver"
    echo "   或手動下載: https://chromedriver.chromium.org/downloads"
fi
echo ""

# 創建配置檔案
echo "→ 設定配置檔案..."
if [ ! -f "graduate_agent/config/config.yaml" ]; then
    cp graduate_agent/config/config.example.yaml graduate_agent/config/config.yaml
    echo "✓ 已創建配置檔案: graduate_agent/config/config.yaml"
    echo "  請編輯此檔案填入你的資訊"
else
    echo "⊙ 配置檔案已存在"
fi
echo ""

# 創建環境變數檔案
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ 已創建環境變數檔案: .env"
    echo "  請編輯此檔案填入你的資訊（推薦）"
else
    echo "⊙ 環境變數檔案已存在"
fi
echo ""

# 創建資料目錄
echo "→ 創建資料目錄..."
mkdir -p graduate_agent/data/cache
mkdir -p graduate_agent/data/downloads
echo "✓ 資料目錄已創建"
echo ""

echo "========================================"
echo "✓ 設定完成！"
echo "========================================"
echo ""
echo "接下來的步驟："
echo "1. 編輯配置檔案或環境變數："
echo "   nano graduate_agent/config/config.yaml"
echo "   或"
echo "   nano .env"
echo ""
echo "2. 執行爬取課程資料："
echo "   python -m graduate_agent.main scrape"
echo ""
echo "3. 下載課程資源："
echo "   python -m graduate_agent.main download"
echo ""
echo "4. 同步到 Notion（可選）："
echo "   python -m graduate_agent.main sync --parent-page-id 你的頁面ID"
echo ""
echo "詳細說明請參考: GRADUATE_AGENT_README.md"
echo ""
