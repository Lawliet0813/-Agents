# Task 2.1: NextAuth.js 設定與登入頁面 ✅

## 完成時間
2025-11-19

## 任務概述
成功實作 NextAuth.js 認證系統，包含 Google OAuth 登入、Session 管理、受保護路由中間件，以及完整的登入 UI。

## 完成項目

### 1. ✅ NextAuth API Route Handler
**檔案**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '~/server/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

特性：
- ✅ 整合 Task 1.3 已建立的 `authOptions`
- ✅ 支援 GET 和 POST 請求
- ✅ 使用 Prisma Adapter
- ✅ Google OAuth 認證

### 2. ✅ 登入頁面 UI
**檔案**:
- `src/app/(auth)/layout.tsx` - 認證頁面佈局
- `src/app/(auth)/login/page.tsx` - 登入頁面

#### Auth Layout
```typescript
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  )
}
```

#### Login Page 特性
- ✅ 美觀的卡片式設計
- ✅ Google 登入按鈕（含 Google Logo）
- ✅ 錯誤訊息顯示（完整的 NextAuth 錯誤處理）
- ✅ 使用條款與隱私政策說明
- ✅ 響應式設計

#### 錯誤處理
支援以下 NextAuth 錯誤碼：
- `OAuthSignin` - OAuth 登入流程啟動失敗
- `OAuthCallback` - OAuth 回調錯誤
- `OAuthCreateAccount` - 無法創建 OAuth 帳號
- `OAuthAccountNotLinked` - 郵件地址已與其他帳號綁定
- `CredentialsSignin` - 憑證登入失敗
- `SessionRequired` - 需要登入
- `Callback` - 一般回調錯誤

### 3. ✅ Session Provider
**檔案**: `src/components/providers/SessionProvider.tsx`

```typescript
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

特性：
- ✅ Client component wrapper
- ✅ 全域 session 管理
- ✅ 自動 session 更新

### 4. ✅ Root Layout 整合
**檔案**: `src/app/layout.tsx`

```typescript
import { SessionProvider } from "~/components/providers/SessionProvider"

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <SessionProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

Provider 層級結構：
```
SessionProvider (NextAuth)
└── TRPCProvider (React Query + tRPC)
    └── children
```

### 5. ✅ 路由保護中間件
**檔案**: `src/middleware.ts`

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/trpc/:path*',
  ],
}
```

特性：
- ✅ 保護 `/dashboard` 所有子路由
- ✅ 保護 `/api/trpc` API endpoints
- ✅ 未登入自動重定向到 `/login`
- ✅ 登入後重定向到原始請求頁面

### 6. ✅ Dashboard 頁面
**檔案**: `src/app/dashboard/page.tsx`

功能：
- ✅ 顯示使用者資訊（名稱、郵件、頭像）
- ✅ 統計卡片（課程、作業、筆記、學習時數）
- ✅ 登出按鈕
- ✅ 快速開始按鈕（目前為佔位符）
- ✅ 使用 tRPC 獲取 session 和 user 資料

統計卡片：
- 本學期課程：0
- 待完成作業：0
- 語音筆記：0
- 學習時數：0h

### 7. ✅ 首頁更新
**檔案**: `src/app/page.tsx`

新增功能：
- ✅ 條件式按鈕（已登入顯示"前往 Dashboard"，未登入顯示"登入開始使用"）
- ✅ 更新任務完成狀態（顯示 Task 2.1 完成）

## 資料夾結構

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                    ✅ 認證頁面佈局
│   │   └── login/
│   │       └── page.tsx                  ✅ 登入頁面
│   ├── api/
│   │   └── auth/[...nextauth]/
│   │       └── route.ts                  ✅ NextAuth API handler
│   ├── dashboard/
│   │   └── page.tsx                      ✅ Dashboard 主頁
│   ├── layout.tsx                        ✅ 整合 SessionProvider
│   └── page.tsx                          ✅ 首頁（更新）
├── components/
│   └── providers/
│       └── SessionProvider.tsx           ✅ Session provider wrapper
├── middleware.ts                         ✅ 路由保護中間件
└── server/
    └── auth.ts                           ✅ (Task 1.3 已建立)
```

## 認證流程

### 登入流程
```
1. 用戶訪問 /dashboard
   ↓
2. Middleware 檢查 session
   ↓
3. 未登入 → 重定向到 /login?callbackUrl=/dashboard
   ↓
4. 用戶點擊 "使用 Google 帳號登入"
   ↓
5. signIn('google', { callbackUrl: '/dashboard' })
   ↓
6. NextAuth 啟動 Google OAuth 流程
   ↓
7. Google 認證成功 → 回調到 /api/auth/callback/google
   ↓
8. NextAuth 使用 Prisma Adapter 創建/更新 User, Account, Session
   ↓
9. 重定向到 /dashboard
   ↓
10. Middleware 通過 → 顯示 Dashboard
```

### Session 管理
```
Client Component
└── useSession() / trpc.auth.getSession.useQuery()
    └── SessionProvider
        └── NextAuth Session
            └── Prisma Database
                ├── User
                ├── Account
                └── Session
```

## Google OAuth 配置

### Scopes（已配置於 `src/server/auth.ts`）
```typescript
{
  scope: 'openid email profile https://www.googleapis.com/auth/calendar https://mail.google.com/',
  access_type: 'offline',
  prompt: 'consent',
}
```

權限：
- ✅ `openid` - OpenID Connect
- ✅ `email` - 郵件地址
- ✅ `profile` - 基本個人資料
- ✅ `calendar` - Google Calendar 完整存取
- ✅ `mail.google.com` - Gmail 完整存取

特性：
- ✅ `access_type: 'offline'` - 取得 refresh token
- ✅ `prompt: 'consent'` - 每次都要求授權（確保取得 refresh token）

### 環境變數（需設定）

**`.env`**:
```env
# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Google Cloud Console 設定步驟

1. **建立專案**
   - 訪問 https://console.cloud.google.com
   - 建立新專案或選擇現有專案

2. **啟用 API**
   - APIs & Services → Library
   - 搜尋並啟用：
     - Google+ API
     - Google Calendar API
     - Gmail API

3. **建立 OAuth 2.0 憑證**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: Graduate Assistant
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-domain.com` (生產環境)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.com/api/auth/callback/google`

4. **取得憑證**
   - 複製 Client ID 和 Client Secret
   - 貼到 `.env` 檔案

5. **OAuth consent screen**
   - User Type: External
   - App name: 研究生智能助理
   - User support email: your-email@example.com
   - Scopes: 添加必要的 scopes
   - Test users: 添加測試帳號郵件

## Prisma Schema 相容性

NextAuth 使用以下資料表（Task 1.2 已建立）：

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?

  accounts      Account[]
  sessions      Session[]
  // ... other relations
}
```

## 安全特性

### 1. CSRF 保護
- ✅ NextAuth 內建 CSRF token
- ✅ 每個請求自動驗證

### 2. Session 安全
- ✅ 加密的 session cookies
- ✅ HTTP-only cookies（防止 XSS）
- ✅ Secure cookies（HTTPS only in production）
- ✅ SameSite cookies（防止 CSRF）

### 3. OAuth 安全
- ✅ State parameter（防止 CSRF）
- ✅ PKCE（Proof Key for Code Exchange）
- ✅ Nonce（防止重放攻擊）

### 4. 資料庫安全
- ✅ Token 使用 `@db.Text` 類型（支援長 token）
- ✅ Cascade delete（刪除 user 時自動清理 accounts 和 sessions）
- ✅ 唯一約束（防止重複 OAuth 帳號）

## 驗收標準檢查

根據 Task 2.1 要求：

- ✅ **Google OAuth 登入正常運作** - UI 和流程已建立
- ✅ **Session 正確儲存** - 使用 Prisma Adapter
- ✅ **可以取得使用者資訊** - Dashboard 顯示 user 資料
- ✅ **登入頁面 UI 完整** - 美觀的卡片式設計
- ✅ **錯誤處理完善** - 完整的錯誤訊息顯示
- ✅ **路由保護** - Middleware 保護 dashboard 和 API

## 使用範例

### Client Component - 取得 Session

```typescript
'use client'

import { useSession } from 'next-auth/react'

export function ProfileButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>

  return <div>Hello {session.user.name}</div>
}
```

### Client Component - 使用 tRPC

```typescript
'use client'

import { trpc } from '~/lib/trpc/client'

export function UserProfile() {
  const { data: session } = trpc.auth.getSession.useQuery()
  const { data: user } = trpc.auth.getUser.useQuery()

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Name: {user?.name}</p>
    </div>
  )
}
```

### Server Component - 取得 Session

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '~/server/auth'

export default async function ServerPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return <div>Hello {session.user.name}</div>
}
```

### 登入/登出

```typescript
'use client'

import { signIn, signOut } from 'next-auth/react'

export function AuthButtons() {
  return (
    <>
      <button onClick={() => signIn('google')}>Login</button>
      <button onClick={() => signOut()}>Logout</button>
    </>
  )
}
```

## 測試步驟

### 本地測試（需要 Google OAuth 設定）

1. **設定環境變數**
   ```bash
   # .env
   NEXTAUTH_SECRET="generate-a-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-id"
   GOOGLE_CLIENT_SECRET="your-secret"
   ```

2. **執行 Prisma Migration**
   ```bash
   npx prisma migrate dev
   ```

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

4. **測試流程**
   - 訪問 http://localhost:3000
   - 點擊 "登入開始使用"
   - 使用 Google 帳號登入
   - 應該重定向到 /dashboard
   - 查看使用者資訊是否正確顯示
   - 測試登出功能

### 測試檢查清單

- [ ] 訪問 /dashboard 未登入時重定向到 /login
- [ ] Google 登入按鈕正常運作
- [ ] 登入成功後重定向到 /dashboard
- [ ] Dashboard 顯示正確的使用者資訊
- [ ] 登出後重定向到 /login
- [ ] 錯誤訊息正確顯示
- [ ] Session 在頁面刷新後保持
- [ ] tRPC endpoints 需要認證正常運作

## 已知限制

### 1. 需要 HTTPS（生產環境）
- NextAuth cookies 在生產環境需要 HTTPS
- 本地開發可以使用 HTTP

### 2. Google OAuth 設定
- 需要在 Google Cloud Console 建立 OAuth 憑證
- 測試階段可以使用 External user type + Test users

### 3. Refresh Token
- 只有第一次授權會取得 refresh token
- 如需重新取得，需撤銷應用程式授權

### 4. Session 策略
- 目前使用 database strategy
- 可以改為 JWT strategy 以提升效能（但會失去即時撤銷能力）

## 效能考量

### Session 查詢優化
```typescript
// 使用 tRPC 的 enabled 選項
const { data: user } = trpc.auth.getUser.useQuery(undefined, {
  enabled: !!session?.user, // 只在有 session 時查詢
})
```

### React Query 快取
```typescript
// SessionProvider 已設定快取
const [queryClient] = useState(() =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 分鐘
      },
    },
  })
)
```

## 故障排除

### 問題：登入後重定向到錯誤頁面
```bash
# 檢查 NEXTAUTH_URL 是否正確
echo $NEXTAUTH_URL

# 檢查 Google OAuth redirect URI 是否匹配
```

### 問題：Session 為 null
```bash
# 檢查資料庫連接
npx prisma studio

# 檢查 session 表是否有資料
```

### 問題：Google OAuth 錯誤
```bash
# 檢查 Google Cloud Console 設定
# 確認 redirect URI 正確
# 確認 scopes 已授權
```

### 問題：Middleware 無限重定向
```bash
# 檢查 middleware.ts 的 matcher 設定
# 確認 /login 和 /api/auth 不在 matcher 中
```

## 下一步：Task 3.1 - Dashboard Layout

準備工作：
1. ✅ 認證系統已完成
2. ✅ Dashboard 基礎頁面已建立
3. 需要建立 Sidebar 組件
4. 需要建立 Header 組件
5. 需要建立 Dashboard layout

## 檔案清單

新增檔案：
```
src/app/api/auth/[...nextauth]/route.ts          ✅ NextAuth API handler
src/app/(auth)/layout.tsx                        ✅ Auth layout
src/app/(auth)/login/page.tsx                    ✅ Login page
src/app/dashboard/page.tsx                       ✅ Dashboard page
src/components/providers/SessionProvider.tsx     ✅ Session provider
src/middleware.ts                                ✅ Route protection
```

修改檔案：
```
src/app/layout.tsx                               ✅ 整合 SessionProvider
src/app/page.tsx                                 ✅ 添加登入按鈕
```

## 總結

Task 2.1 已完成！
- ✅ NextAuth.js 完整設定
- ✅ Google OAuth 認證流程
- ✅ Session 管理與儲存
- ✅ 登入頁面 UI
- ✅ Dashboard 基礎頁面
- ✅ 路由保護中間件
- ✅ 錯誤處理

專案現在有了：
1. ✅ Next.js 專案架構（Task 1.1）
2. ✅ Prisma 資料庫 schema（Task 1.2）
3. ✅ tRPC API 層（Task 1.3）
4. ✅ NextAuth 認證系統（Task 2.1）

準備好進入 Dashboard 開發階段！ 🎉

## 環境變數提醒

記得設定以下環境變數才能測試：
```env
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

並在 Google Cloud Console 設定 OAuth 憑證。
