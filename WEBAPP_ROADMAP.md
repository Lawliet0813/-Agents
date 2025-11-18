# Web App 升級規劃 - FastAPI + React

## 📋 概述

當前的 Streamlit 版本適合快速原型和個人使用。如果需要更專業的 Web 應用（支援多用戶、API、更好的性能），可以升級到 FastAPI + React 架構。

## 🎯 為什麼要升級？

### Streamlit 的優勢
✅ 快速開發（幾小時即可完成）
✅ 純 Python，無需前端知識
✅ 適合個人使用和原型

### Streamlit 的限制
⚠️ 不支援真正的多用戶
⚠️ 狀態管理較弱（session based）
⚠️ 客製化能力有限
⚠️ 性能限制

### FastAPI + React 的優勢
✅ 真正的 RESTful API
✅ 完整的多用戶支援
✅ 更好的性能和可擴展性
✅ 現代化的前端體驗
✅ 易於部署和維護

## 🏗 架構設計

### 後端: FastAPI

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py         # 使用者認證
│   │   │   ├── moodle.py       # Moodle 相關 API
│   │   │   ├── notion.py       # Notion 相關 API
│   │   │   └── status.py       # 系統狀態 API
│   │   └── deps.py             # 依賴注入
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   ├── security.py         # 安全相關
│   │   └── celery_app.py       # 背景任務
│   ├── models/
│   │   ├── user.py             # 用戶模型
│   │   └── course.py           # 課程模型
│   ├── schemas/
│   │   ├── user.py             # 用戶 Schema
│   │   └── course.py           # 課程 Schema
│   ├── services/
│   │   ├── moodle.py           # Moodle 服務
│   │   ├── notion.py           # Notion 服務
│   │   └── download.py         # 下載服務
│   └── main.py                 # FastAPI 主程式
├── tests/
├── requirements.txt
└── Dockerfile
```

### 前端: React

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── Dashboard/
│   │   │   ├── StatusCards.tsx
│   │   │   └── CourseList.tsx
│   │   ├── Scraper/
│   │   │   ├── ScraperForm.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── Downloader/
│   │   │   ├── CourseSelector.tsx
│   │   │   └── DownloadProgress.tsx
│   │   └── Notion/
│   │       └── SyncPanel.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   ├── Scraper.tsx
│   │   ├── Downloader.tsx
│   │   └── Notion.tsx
│   ├── services/
│   │   └── api.ts              # API 客戶端
│   ├── hooks/
│   │   └── useAuth.ts          # 認證 Hook
│   ├── store/
│   │   └── index.ts            # Redux Store
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## 📡 API 設計

### 認證相關

```typescript
POST   /api/auth/register      # 註冊
POST   /api/auth/login         # 登入
POST   /api/auth/logout        # 登出
GET    /api/auth/me            # 獲取當前用戶
```

### Moodle 相關

```typescript
POST   /api/moodle/scrape      # 爬取課程
GET    /api/moodle/courses     # 獲取課程列表
GET    /api/moodle/course/{id} # 獲取課程詳情
POST   /api/moodle/download    # 下載資源
GET    /api/moodle/status      # 獲取爬取狀態
```

### Notion 相關

```typescript
POST   /api/notion/sync        # 同步到 Notion
GET    /api/notion/databases   # 獲取資料庫列表
GET    /api/notion/status      # 同步狀態
```

### 系統狀態

```typescript
GET    /api/status/system      # 系統狀態
GET    /api/status/files       # 檔案統計
GET    /api/status/tasks       # 任務列表
```

## 🔧 技術棧

### 後端
- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **PostgreSQL** - 資料庫
- **Redis** - 快取和 Session
- **Celery** - 背景任務
- **Alembic** - 資料庫遷移
- **JWT** - 認證

### 前端
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 建構工具
- **React Router** - 路由
- **Redux Toolkit** - 狀態管理
- **Ant Design** - UI 組件庫
- **Axios** - HTTP 客戶端
- **React Query** - 資料獲取

### 部署
- **Docker** - 容器化
- **Nginx** - 反向代理
- **Gunicorn** - WSGI 伺服器
- **Supervisor** - 進程管理

## 🚀 實作步驟

### Phase 1: 後端 API（1-2 週）

1. **專案初始化**
   ```bash
   mkdir backend frontend
   cd backend
   poetry init
   poetry add fastapi uvicorn sqlalchemy alembic
   ```

2. **建立基礎架構**
   - FastAPI 應用初始化
   - 資料庫模型
   - 認證系統（JWT）
   - CORS 設定

3. **實作核心 API**
   - Moodle 爬取 API
   - 檔案下載 API
   - Notion 同步 API

4. **背景任務**
   - Celery 設定
   - 爬取任務
   - 下載任務

### Phase 2: 前端開發（2-3 週）

1. **專案初始化**
   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install
   ```

2. **建立基礎組件**
   - Layout（Header, Sidebar, Footer）
   - 路由設定
   - API 客戶端

3. **實作功能頁面**
   - 首頁 Dashboard
   - 設定頁面
   - 爬取頁面
   - 下載頁面
   - Notion 同步頁面

4. **狀態管理**
   - Redux Store 設定
   - API 資料快取（React Query）
   - 認證狀態管理

### Phase 3: 整合與測試（1 週）

1. **前後端整合**
2. **功能測試**
3. **性能優化**
4. **部署配置**

## 💻 程式碼範例

### 後端 API 範例

```python
# backend/app/api/endpoints/moodle.py
from fastapi import APIRouter, BackgroundTasks, Depends
from app.schemas.course import CourseCreate, Course
from app.services.moodle import MoodleService
from app.core.deps import get_current_user

router = APIRouter()

@router.post("/scrape", response_model=dict)
async def scrape_courses(
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """爬取 Moodle 課程"""
    task_id = str(uuid.uuid4())
    background_tasks.add_task(
        MoodleService.scrape_courses,
        user_id=current_user.id,
        task_id=task_id
    )
    return {"task_id": task_id, "status": "started"}

@router.get("/courses", response_model=List[Course])
async def get_courses(current_user = Depends(get_current_user)):
    """獲取課程列表"""
    return MoodleService.get_user_courses(current_user.id)
```

### 前端組件範例

```typescript
// frontend/src/pages/Scraper.tsx
import React, { useState } from 'react';
import { Button, Progress, Card } from 'antd';
import { useScrapeCourses } from '../hooks/useMoodle';

export const Scraper: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const { mutate: scrape, data, isLoading } = useScrapeCourses();

  const handleScrape = () => {
    scrape({}, {
      onSuccess: (data) => {
        console.log('Task started:', data.task_id);
        setIsRunning(true);
      }
    });
  };

  return (
    <Card title="爬取課程">
      <Button
        type="primary"
        onClick={handleScrape}
        loading={isLoading}
      >
        開始爬取
      </Button>

      {isRunning && (
        <Progress percent={75} status="active" />
      )}
    </Card>
  );
};
```

## 🎨 UI/UX 設計

### 設計原則
1. **簡潔直觀** - 清晰的視覺層次
2. **即時反饋** - 所有操作都有即時回饋
3. **響應式設計** - 支援桌面和行動裝置
4. **無障礙** - 符合 WCAG 標準

### 色彩方案
- **主色**: #1890ff（藍色）
- **成功**: #52c41a（綠色）
- **警告**: #faad14（橙色）
- **錯誤**: #f5222d（紅色）

### 組件庫選擇
- **Ant Design** - 企業級 UI 組件
- **Chakra UI** - 簡潔現代
- **Material-UI** - Google Material Design

## 📦 部署方案

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: graduate_agent
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
      - ./data:/data
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://user:password@postgres/graduate_agent
      REDIS_URL: redis://redis:6379

  celery:
    build: ./backend
    command: celery -A app.core.celery_app worker -l info
    volumes:
      - ./backend:/app
      - ./data:/data
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

## 📊 性能優化

### 後端優化
1. **資料庫查詢優化**
   - 使用索引
   - 避免 N+1 查詢
   - 查詢結果快取

2. **背景任務**
   - Celery 處理長時間任務
   - WebSocket 即時更新進度

3. **API 快取**
   - Redis 快取常用資料
   - HTTP 快取標頭

### 前端優化
1. **程式碼分割**
   - 路由層級的懶載入
   - 組件懶載入

2. **資料快取**
   - React Query 自動快取
   - 樂觀更新

3. **打包優化**
   - Tree shaking
   - 壓縮和混淆

## 💰 成本估算

### 開發時間
- **後端開發**: 80-100 小時
- **前端開發**: 100-120 小時
- **測試與部署**: 40-60 小時
- **總計**: 220-280 小時（5-7 週全職開發）

### 基礎設施成本（月）
- **伺服器**: $10-50（VPS/雲端）
- **資料庫**: $0-15（PostgreSQL）
- **網域**: $10-15/年
- **總計**: $10-65/月

## 🎯 何時升級？

### 升級時機
✅ 需要多用戶支援
✅ 需要更好的性能
✅ 想要更靈活的客製化
✅ 需要 API 給其他應用使用
✅ 有足夠的開發時間和資源

### 維持 Streamlit
✅ 個人使用
✅ 快速原型
✅ 不需要複雜功能
✅ 開發資源有限

## 📚 參考資源

### 學習資源
- [FastAPI 官方文檔](https://fastapi.tiangolo.com/)
- [React 官方文檔](https://react.dev/)
- [Ant Design](https://ant.design/)

### 範例專案
- [FastAPI + React Template](https://github.com/tiangolo/full-stack-fastapi-postgresql)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)

---

**總結**:

當前的 **Streamlit 版本**已經足夠強大，適合大多數使用場景。如果未來需要更專業的解決方案，可以參考此規劃逐步升級到 **FastAPI + React** 架構。

**建議**: 先使用 Streamlit 版本，根據實際需求決定是否升級。
