# 研究生專屬 AGENT 使用說明

## 📋 簡介

這是一個專為研究生設計的 AI 助理系統，可以自動化管理 Moodle 課程資料：

- ✅ 自動登入政大 Moodle 系統（支援 SSO 單一登入）
- ✅ 獲取所有註冊課程的結構化資料
- ✅ 自動下載課程資源（PDF、PPT、Word 等）
- ✅ 按課程和週次組織檔案結構
- ✅ 同步課程資料到 Notion（可選）

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 創建虛擬環境
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows

# 安裝依賴套件
pip install -r requirements.txt
```

### 2. 設定配置

#### 方法 A: 使用配置檔案

```bash
# 複製範例配置檔案
cp graduate_agent/config/config.example.yaml graduate_agent/config/config.yaml

# 編輯配置檔案，填入你的資訊
# 至少需要設定：
# - moodle.username
# - moodle.password
```

#### 方法 B: 使用環境變數（推薦）

```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯 .env 檔案，填入你的資訊
export MOODLE_USERNAME="你的學號"
export MOODLE_PASSWORD="你的密碼"
export NOTION_TOKEN="你的Notion_Token"  # 如果需要 Notion 整合
```

### 3. 安裝 ChromeDriver

Selenium 需要 ChromeDriver 才能自動化瀏覽器。

```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Mac (使用 Homebrew)
brew install chromedriver

# 或手動下載
# https://chromedriver.chromium.org/downloads
```

## 📚 使用方式

### 命令列介面

```bash
# 1. 爬取課程資料
python -m graduate_agent.main scrape

# 2. 下載課程資源
python -m graduate_agent.main download

# 3. 同步到 Notion
python -m graduate_agent.main sync --parent-page-id "你的Notion頁面ID"

# 4. 執行完整流程（爬取 + 下載 + 同步）
python -m graduate_agent.main full --parent-page-id "你的Notion頁面ID"
```

### 命令參數說明

```bash
python -m graduate_agent.main <command> [options]

Commands:
  scrape    爬取 Moodle 課程資料
  download  下載課程資源
  sync      同步到 Notion
  full      執行完整流程

Options:
  --config, -c          配置檔案路徑（預設：graduate_agent/config/config.yaml）
  --output, -o          輸出 JSON 檔案路徑（預設：moodle_courses.json）
  --input, -i           輸入 JSON 檔案路徑（預設：moodle_courses.json）
  --skip-existing       跳過已存在的檔案（用於 download）
  --parent-page-id      Notion 父頁面 ID（用於 sync）
```

### Python API 使用

```python
from graduate_agent.utils.config import ConfigManager
from graduate_agent.moodle.scraper import MoodleScraper
from graduate_agent.moodle.downloader import MoodleDownloader

# 載入配置
config = ConfigManager().load()

# 爬取課程資料
with MoodleScraper(
    base_url=config.moodle.base_url,
    username=config.moodle.username,
    password=config.moodle.password,
    headless=True
) as scraper:
    # 登入並爬取
    data = scraper.scrape_all()
    scraper.save_to_json(data, "moodle_courses.json")

    # 下載資源
    downloader = MoodleDownloader(scraper.driver, config.moodle.download_dir)
    stats = downloader.download_all_courses(data['courses'])
```

## 📁 檔案組織結構

下載的檔案會按照以下結構組織：

```
graduate_agent/data/downloads/
├── 領導與管理專題/
│   ├── Week01/
│   │   ├── syllabus.pdf
│   │   ├── lecture_slides.pptx
│   │   └── reading_materials.pdf
│   ├── Week02/
│   │   └── ...
│   └── Week03/
│       └── ...
└── 跨域治理/
    ├── Week01/
    ├── Week02/
    └── ...
```

## 🔧 Notion 整合設定

### 1. 創建 Notion Integration

1. 前往 https://www.notion.so/my-integrations
2. 點擊 "+ New integration"
3. 設定名稱（例如：Graduate Agent）
4. 選擇要整合的 workspace
5. 複製 "Internal Integration Token"

### 2. 分享頁面給 Integration

1. 在 Notion 中創建一個新頁面（例如：研究生課程管理）
2. 點擊右上角 "Share"
3. 點擊 "Invite"
4. 搜尋並選擇你的 Integration 名稱
5. 複製頁面 ID（從 URL 中取得）

### 3. 執行同步

```bash
python -m graduate_agent.main sync --parent-page-id "你的頁面ID"
```

同步後會在 Notion 中創建：
- 📚 課程資料庫（包含所有課程）
- 每門課程的詳細頁面（包含週次內容和資源連結）

## 🛠 進階使用

### 自訂下載目錄

在配置檔案中修改：

```yaml
moodle:
  download_dir: '/path/to/your/download/folder'
```

### 使用非無頭模式（顯示瀏覽器）

適合調試時使用：

```yaml
moodle:
  headless: false
```

### 選擇性下載

```python
from graduate_agent.moodle.downloader import MoodleDownloader

# 只下載特定課程
downloader.download_course(courses[0], skip_existing=True)
```

## 🔒 安全性建議

1. **不要在配置檔案中直接寫入密碼**
   - 使用環境變數 `MOODLE_PASSWORD` 和 `NOTION_TOKEN`

2. **確保 .env 和 config.yaml 不被提交到 Git**
   - 已在 `.gitignore` 中設定

3. **定期更改密碼**
   - 如果懷疑憑證外洩，立即更改密碼

4. **謹慎分享下載的課程資料**
   - 遵守著作權法和學校規定

## 📝 常見問題

### Q: ChromeDriver 版本不匹配？

A: 確保 ChromeDriver 版本與你的 Chrome 瀏覽器版本匹配。

```bash
# 檢查 Chrome 版本
google-chrome --version

# 下載對應版本的 ChromeDriver
# https://chromedriver.chromium.org/downloads
```

### Q: 登入失敗？

A: 檢查以下項目：
1. 帳號密碼是否正確
2. 網路連線是否正常
3. Moodle 網站是否有變更登入流程
4. 使用非無頭模式查看登入過程

### Q: 下載檔案失敗？

A: 可能原因：
1. 檔案需要特殊權限
2. 檔案連結已失效
3. 網路連線問題
4. Chrome 下載設定問題

### Q: Notion 同步失敗？

A: 檢查：
1. Notion Token 是否正確
2. Integration 是否有權限訪問目標頁面
3. 頁面 ID 是否正確

## 🎯 未來功能規劃

- [ ] MCP Server 整合（讓 Claude 直接存取 Moodle 資料）
- [ ] 作業截止日期追蹤和提醒
- [ ] AI 內容摘要功能
- [ ] 學習進度視覺化
- [ ] 支援更多 Moodle 活動類型
- [ ] Web UI 介面

## 📄 授權

MIT License

## 🙏 致謝

- Selenium - Web 自動化框架
- Notion SDK - Notion API 客戶端
- 政大 Moodle - 課程管理系統

---

**注意**: 本工具僅供個人學習和研究使用，請遵守學校相關規定和著作權法。
