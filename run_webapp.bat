@echo off
REM 研究生專屬 AGENT - Web App 啟動腳本 (Windows)

echo ==========================================
echo 研究生專屬 AGENT - Web Application
echo ==========================================
echo.

REM 檢查虛擬環境
if not exist ".venv" (
    echo 警告: 虛擬環境不存在，請先執行設定
    echo 執行: python -m venv .venv
    pause
    exit /b 1
)

REM 啟動虛擬環境
echo 啟動虛擬環境...
call .venv\Scripts\activate.bat

REM 檢查 Streamlit
python -c "import streamlit" 2>nul
if errorlevel 1 (
    echo 安裝 Streamlit...
    pip install streamlit
)

REM 啟動 Streamlit
echo 啟動 Web 應用...
echo.
echo ==========================================
echo Web UI 將在瀏覽器中自動開啟
echo 預設網址: http://localhost:8501
echo 按 Ctrl+C 停止服務
echo ==========================================
echo.

streamlit run graduate_agent\webapp\streamlit_app.py

pause
