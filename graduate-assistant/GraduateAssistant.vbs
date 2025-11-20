' Graduate Assistant Launcher for Windows
' 雙擊此文件啟動應用，不會顯示命令行視窗

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 獲取當前目錄
strCurrentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' 切換到專案目錄並執行啟動命令
' 0 = 隱藏視窗, True = 等待完成
objShell.Run "cmd /c cd /d """ & strCurrentDir & """ && npm run app start", 0, False

' 顯示通知（可選）
objShell.Popup "Graduate Assistant 正在啟動..." & vbCrLf & vbCrLf & "請稍候片刻後訪問 http://localhost:3000", 3, "Graduate Assistant", 64

' 等待 5 秒後打開瀏覽器
WScript.Sleep 5000

' 打開瀏覽器
objShell.Run "http://localhost:3000", 1, False
