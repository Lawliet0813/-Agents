#!/bin/bash

###############################################################################
# macOS App Bundle 創建腳本
# 創建可雙擊啟動的 .app 應用程式
###############################################################################

APP_NAME="Graduate Assistant"
APP_DIR="$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "🍎 正在創建 macOS App Bundle..."

# 清除舊的 app
if [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
fi

# 創建目錄結構
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# 創建 Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_TW</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIdentifier</key>
    <string>tw.edu.nccu.graduate-assistant</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Graduate Assistant</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppleScriptEnabled</key>
    <true/>
</dict>
</plist>
EOF

# 創建啟動腳本
cat > "$MACOS_DIR/launcher" << 'LAUNCHER_EOF'
#!/bin/bash

# 獲取應用程式所在目錄
APP_DIR="$(cd "$(dirname "$0")/../../../" && pwd)"

# 切換到專案目錄
cd "$APP_DIR"

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    osascript -e 'display dialog "首次啟動需要安裝依賴，這可能需要幾分鐘..." buttons {"確定"} default button 1 with icon note'

    # 打開終端機安裝依賴
    osascript <<EOF
    tell application "Terminal"
        activate
        do script "cd '$APP_DIR' && npm install && echo '\\n✅ 安裝完成！請關閉此視窗並重新啟動 Graduate Assistant。' && read -p '按 Enter 關閉...'"
    end tell
EOF
    exit 0
fi

# 啟動應用
npm run app start > /dev/null 2>&1 &

# 等待啟動
sleep 3

# 顯示通知
osascript -e 'display notification "應用正在啟動..." with title "Graduate Assistant"'

# 等待服務啟動
sleep 5

# 打開瀏覽器
open http://localhost:3000

# 顯示狀態視窗
osascript <<EOF
tell application "Terminal"
    do script "cd '$APP_DIR' && npm run app status && echo '\\n💡 提示：' && echo '   - 訪問 http://localhost:3000 使用應用' && echo '   - 執行 npm run app stop 停止服務' && echo '   - 或雙擊 Stop Graduate Assistant 停止' && echo '' && read -p '按 Enter 關閉此視窗...'"
    activate
end tell
EOF

LAUNCHER_EOF

# 使啟動腳本可執行
chmod +x "$MACOS_DIR/launcher"

# 創建停止應用
STOP_APP_NAME="Stop Graduate Assistant"
STOP_APP_DIR="$STOP_APP_NAME.app"
STOP_CONTENTS_DIR="$STOP_APP_DIR/Contents"
STOP_MACOS_DIR="$STOP_CONTENTS_DIR/MacOS"
STOP_RESOURCES_DIR="$STOP_CONTENTS_DIR/Resources"

# 清除舊的 stop app
if [ -d "$STOP_APP_DIR" ]; then
    rm -rf "$STOP_APP_DIR"
fi

# 創建目錄結構
mkdir -p "$STOP_MACOS_DIR"
mkdir -p "$STOP_RESOURCES_DIR"

# 創建 Info.plist
cat > "$STOP_CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_TW</string>
    <key>CFBundleExecutable</key>
    <string>stopper</string>
    <key>CFBundleIdentifier</key>
    <string>tw.edu.nccu.graduate-assistant.stopper</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Stop Graduate Assistant</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# 創建停止腳本
cat > "$STOP_MACOS_DIR/stopper" << 'STOPPER_EOF'
#!/bin/bash

APP_DIR="$(cd "$(dirname "$0")/../../../" && pwd)"
cd "$APP_DIR"

# 顯示確認對話框
RESULT=$(osascript -e 'display dialog "確定要停止 Graduate Assistant 嗎？" buttons {"取消", "停止"} default button 2 with icon caution')

if echo "$RESULT" | grep -q "停止"; then
    npm run app stop

    osascript -e 'display notification "應用已停止" with title "Graduate Assistant"'

    osascript -e 'display dialog "Graduate Assistant 已停止" buttons {"確定"} default button 1 with icon note'
fi

STOPPER_EOF

# 使停止腳本可執行
chmod +x "$STOP_MACOS_DIR/stopper"

echo "✅ macOS App 創建完成！"
echo ""
echo "📱 已創建兩個應用："
echo "   1. Graduate Assistant.app       - 啟動應用"
echo "   2. Stop Graduate Assistant.app  - 停止應用"
echo ""
echo "💡 使用方式："
echo "   - 雙擊 'Graduate Assistant.app' 啟動"
echo "   - 雙擊 'Stop Graduate Assistant.app' 停止"
echo ""
echo "📌 您可以將這兩個 .app 拖到 Dock 或應用程式資料夾"
