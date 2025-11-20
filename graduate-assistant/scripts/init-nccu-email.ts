/**
 * Initialize NCCU Email Processing
 * Run this script after first login with NCCU email
 */

import { PrismaClient } from '@prisma/client'
import { initializeNCCUEmailProcessing } from '../src/server/services/nccu-email-processor'

const prisma = new PrismaClient()

async function main() {
  console.log('🎓 政大信箱初始化腳本')
  console.log('================================\n')

  // Get NCCU email user
  const nccuEmail = '114921039@nccu.edu.tw'

  console.log(`尋找使用者: ${nccuEmail}...`)

  const user = await prisma.user.findFirst({
    where: {
      email: nccuEmail,
    },
  })

  if (!user) {
    console.error(`❌ 找不到使用者 ${nccuEmail}`)
    console.log('\n請先使用政大信箱登入系統：')
    console.log('1. 啟動系統: npm run dev')
    console.log('2. 訪問 http://localhost:3000')
    console.log('3. 使用 Google 登入並選擇政大信箱')
    console.log('4. 登入後再次執行此腳本\n')
    process.exit(1)
  }

  console.log(`✓ 找到使用者: ${user.name || user.email}\n`)

  // Initialize email rules
  console.log('初始化郵件處理規則...')
  const rules = await initializeNCCUEmailProcessing(user.id)

  console.log(`✓ 成功建立 ${rules.length} 條郵件規則：\n`)

  for (const rule of rules) {
    console.log(`  📧 ${rule.keyword}`)
    console.log(`     分類: ${rule.category}`)
    console.log(`     優先級: ${rule.priority}`)
    console.log(`     狀態: ${rule.isActive ? '啟用' : '停用'}\n`)
  }

  // Check Google account connection
  console.log('檢查 Google 帳號連結狀態...')
  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider: 'google',
    },
  })

  if (!account) {
    console.log('⚠️  尚未連結 Google 帳號')
    console.log('   請確認已完成 OAuth 設定並登入\n')
  } else if (!account.access_token) {
    console.log('⚠️  Google 授權已過期')
    console.log('   請重新登入系統以更新授權\n')
  } else {
    console.log('✓ Google 帳號已連結\n')

    // Check scopes
    const hasGmailScope = account.scope?.includes('mail.google.com')
    const hasCalendarScope = account.scope?.includes('calendar')

    console.log('授權範圍檢查：')
    console.log(`  Gmail: ${hasGmailScope ? '✓' : '✗'}`)
    console.log(`  Calendar: ${hasCalendarScope ? '✓' : '✗'}\n`)

    if (!hasGmailScope || !hasCalendarScope) {
      console.log('⚠️  某些權限缺失，請重新登入以授權所有必要權限\n')
    }
  }

  // Summary
  console.log('================================')
  console.log('✅ 初始化完成！\n')

  console.log('下一步：')
  console.log('1. 測試郵件處理：')
  console.log('   npm run process-nccu-emails\n')
  console.log('2. 檢查郵件規則：')
  console.log('   訪問 http://localhost:3000/dashboard/settings\n')
  console.log('3. 調整規則（可選）：')
  console.log('   在設定頁面中啟用/停用特定規則\n')

  console.log('📚 完整文件：')
  console.log('   查看 NCCU_EMAIL_SETUP.md\n')
}

main()
  .catch((error) => {
    console.error('❌ 初始化失敗：', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
