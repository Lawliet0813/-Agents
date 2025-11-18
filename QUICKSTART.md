# 研究生專屬 AGENT - 快速開始

## 🚀 5 分鐘快速上手

### 步驟 1: 環境設定

```bash
# 克隆專案（如果還沒有）
git clone <repository-url>
cd -Agents

# 執行自動化設定腳本
./setup_graduate_agent.sh
```

### 步驟 2: 配置帳號資訊

**方法 A: 使用環境變數（推薦）**

```bash
# 編輯 .env 檔案
nano .env

# 填入以下內容：
MOODLE_USERNAME=你的學號
MOODLE_PASSWORD=你的密碼
NOTION_TOKEN=你的Notion_Token  # 可選
```

**方法 B: 使用配置檔案**

```bash
# 編輯配置檔案
nano graduate_agent/config/config.yaml

# 修改以下內容：
moodle:
  username: '你的學號'
  password: '你的密碼'
```

### 步驟 3: 執行！

```bash
# 爬取課程資料
python -m graduate_agent.main scrape

# 下載所有課程資源
python -m graduate_agent.main download

# （可選）同步到 Notion
python -m graduate_agent.main sync --parent-page-id <你的頁面ID>
```

## 📦 一鍵執行全部

```bash
python -m graduate_agent.main full --parent-page-id <你的頁面ID>
```

這會依序執行：
1. 爬取課程資料
2. 下載所有資源
3. 同步到 Notion

## 📁 結果在哪裡？

- **課程資料**: `moodle_courses.json`
- **下載的檔案**: `graduate_agent/data/downloads/`
  ```
  downloads/
  ├── 課程A/
  │   ├── Week01/
  │   ├── Week02/
  │   └── ...
  └── 課程B/
      └── ...
  ```

## 🎯 常用命令

```bash
# 只爬取，不下載
python -m graduate_agent.main scrape

# 只下載（使用已有的 JSON 檔案）
python -m graduate_agent.main download

# 跳過已下載的檔案
python -m graduate_agent.main download --skip-existing

# 使用自訂配置檔案
python -m graduate_agent.main scrape --config /path/to/config.yaml

# 輸出到不同的 JSON 檔案
python -m graduate_agent.main scrape --output my_courses.json
```

## 🔧 故障排除

### 問題 1: 找不到 ChromeDriver

```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Mac
brew install chromedriver
```

### 問題 2: 登入失敗

1. 檢查帳號密碼是否正確
2. 關閉無頭模式查看登入過程：
   ```yaml
   # 在 config.yaml 中設定
   moodle:
     headless: false
   ```

### 問題 3: 依賴套件缺失

```bash
pip install -r requirements.txt
```

## 📚 詳細文件

- **完整使用說明**: [GRADUATE_AGENT_README.md](GRADUATE_AGENT_README.md)
- **開發總結**: [GRADUATE_AGENT_SUMMARY.md](GRADUATE_AGENT_SUMMARY.md)
- **原始規劃**: 查看專案規劃文件

## 💡 提示

1. **首次執行**時可能需要較長時間（需要下載所有資源）
2. **後續執行**使用 `--skip-existing` 可以只下載新資源
3. **定期執行**（例如每週一次）保持資料最新
4. **備份重要資料**，特別是 `moodle_courses.json`

## 🎓 Notion 整合

### 獲取 Notion Token

1. 前往 https://www.notion.so/my-integrations
2. 點擊 "+ New integration"
3. 複製 Token

### 獲取頁面 ID

1. 在 Notion 中打開目標頁面
2. 從 URL 中複製 ID：
   ```
   https://notion.so/My-Page-<這串就是頁面ID>
   ```

### 分享頁面給 Integration

1. 在頁面右上角點擊 "Share"
2. 搜尋你的 Integration 名稱
3. 授予權限

---

**需要幫助？** 請查看詳細文件或提交 Issue
