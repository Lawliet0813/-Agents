' Graduate Assistant Stopper for Windows
' 雙擊此文件停止應用

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 獲取當前目錄
strCurrentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' 顯示確認對話框
intResponse = objShell.Popup("確定要停止 Graduate Assistant 嗎？", 0, "停止 Graduate Assistant", 4 + 32)

' 4 = Yes/No buttons, 32 = Question icon
' 6 = Yes was clicked, 7 = No was clicked

If intResponse = 6 Then
    ' 執行停止命令
    objShell.Run "cmd /c cd /d """ & strCurrentDir & """ && npm run app stop", 0, True

    ' 顯示完成訊息
    objShell.Popup "Graduate Assistant 已停止", 2, "Graduate Assistant", 64
Else
    ' 使用者點擊 No
    WScript.Quit
End If
