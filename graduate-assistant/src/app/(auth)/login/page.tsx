'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <Card className="w-[450px] shadow-xl">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">研究生智能助理</CardTitle>
        <CardDescription className="text-center">
          登入以開始管理您的課程與學習
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error === 'OAuthSignin' && '無法啟動 OAuth 登入流程'}
            {error === 'OAuthCallback' && 'OAuth 回調時發生錯誤'}
            {error === 'OAuthCreateAccount' && '無法建立 OAuth 帳號'}
            {error === 'EmailCreateAccount' && '無法建立郵件帳號'}
            {error === 'Callback' && '回調處理時發生錯誤'}
            {error === 'OAuthAccountNotLinked' &&
              '此郵件地址已與其他帳號綁定'}
            {error === 'EmailSignin' && '郵件登入失敗'}
            {error === 'CredentialsSignin' && '登入失敗，請檢查您的憑證'}
            {error === 'SessionRequired' && '請先登入'}
            {!error.match(/^(OAuth|Email|Credentials|Session|Callback)/) &&
              '登入時發生錯誤，請稍後再試'}
          </div>
        )}

        <Button
          className="w-full h-12 text-base"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          使用 Google 帳號登入
        </Button>

        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>登入即表示您同意我們的服務條款與隱私政策</p>
          <p className="text-gray-400">
            首次登入將自動創建帳號
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
