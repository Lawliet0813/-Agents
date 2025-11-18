#!/bin/bash

# 研究生專屬 AGENT - Web App 啟動腳本

echo "=========================================="
echo "研究生專屬 AGENT - Web Application"
echo "=========================================="
echo ""

# 檢查虛擬環境
if [ ! -d ".venv" ]; then
    echo "⚠  虛擬環境不存在，請先執行 ./setup_graduate_agent.sh"
    exit 1
fi

# 啟動虛擬環境
echo "→ 啟動虛擬環境..."
source .venv/bin/activate

# 檢查 Streamlit 是否安裝
if ! python -c "import streamlit" 2>/dev/null; then
    echo "→ 安裝 Streamlit..."
    pip install streamlit
fi

# 啟動 Streamlit
echo "→ 啟動 Web 應用..."
echo ""
echo "=========================================="
echo "Web UI 將在瀏覽器中自動開啟"
echo "預設網址: http://localhost:8501"
echo "按 Ctrl+C 停止服務"
echo "=========================================="
echo ""

streamlit run graduate_agent/webapp/streamlit_app.py
