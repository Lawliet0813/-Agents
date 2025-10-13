# Automation Agents for macOS

此專案提供三個專為 macOS 設計的自動化小幫手：

1. **AutoOrganizer（自動整理員）**：掃描桌面與下載資料夾，根據副檔名移動至對應分類，並輸出每日 Markdown 摘要。
2. **Expense Watcher（消費小記）**：解析郵件或通知檔案中的金額，依關鍵字歸類並輸出 HTML/CSV 月報。
3. **Voice Butler（語音執行員）**：透過語音或鍵盤指令啟動常用自動化流程。

## 安裝

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 使用方式

### AutoOrganizer

```bash
python -m agents.cli auto-organize
```

### Expense Watcher

```bash
python -m agents.cli expense-report ~/Downloads/notifications --month 2024-05 \
  --category "餐飲=food,restaurant" --category "訂閱=netflix,spotify" --report-dir ~/Reports
```

### Voice Butler

```bash
python -m agents.cli voice
```

## 測試

```bash
pytest
```
