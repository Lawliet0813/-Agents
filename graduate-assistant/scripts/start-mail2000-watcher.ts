#!/usr/bin/env tsx

/**
 * Start Mail2000 Email Watcher Service
 * Automatically monitors and processes NCCU Mail2000 emails
 */

import { Mail2000Watcher } from '../src/services/mail2000-watcher/watcher'
import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Handle graceful shutdown
let watcher: Mail2000Watcher | null = null

process.on('SIGINT', async () => {
  console.log('\n\n👋 收到停止信號，正在關閉服務...')
  if (watcher) {
    await watcher.stop()
  }
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n\n👋 收到終止信號，正在關閉服務...')
  if (watcher) {
    await watcher.stop()
  }
  await prisma.$disconnect()
  process.exit(0)
})

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          📧 Mail2000 郵件監控服務                          ║')
  console.log('║          NCCU Graduate Assistant                           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log()

  // Get user email from command line or env
  const userEmail =
    process.argv[2] || process.env.NCCU_EMAIL || process.env.USER_EMAIL

  if (!userEmail) {
    console.error('❌ 錯誤: 請提供使用者 Email')
    console.error('用法:')
    console.error('  npm run start-mail2000-watcher <email>')
    console.error('  或設定環境變數: NCCU_EMAIL=your@email.com')
    process.exit(1)
  }

  console.log(`👤 使用者: ${userEmail}`)

  // Find user
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      mail2000Username: true,
      mail2000Password: true,
    },
  })

  if (!user) {
    console.error(`❌ 找不到使用者: ${userEmail}`)
    console.error('請確認 Email 正確，或先建立帳號')
    process.exit(1)
  }

  console.log(`✅ 找到使用者: ${user.name || user.id}`)

  // Check credentials
  if (!user.mail2000Username || !user.mail2000Password) {
    console.error('\n❌ 尚未設定 Mail2000 帳號')
    console.error('\n請先設定帳號，有兩種方式:')
    console.error('\n方式 1 - 使用設定腳本:')
    console.error('  npm run process-mail2000')
    console.error('\n方式 2 - 在 Web UI 中設定:')
    console.error('  1. 啟動系統: npm run dev')
    console.error('  2. 前往「設定」→「整合服務」→「Mail2000」')
    console.error('  3. 輸入學號和密碼')
    process.exit(1)
  }

  console.log(`📧 Mail2000 帳號: ${user.mail2000Username}@nccu.edu.tw`)

  // Get check interval
  const checkInterval = process.env.MAIL_CHECK_INTERVAL
    ? parseInt(process.env.MAIL_CHECK_INTERVAL)
    : 5

  console.log(`⏰ 檢查間隔: ${checkInterval} 分鐘`)
  console.log()

  // Create and start watcher
  try {
    watcher = new Mail2000Watcher({
      userId: user.id,
      checkIntervalMinutes: checkInterval,
      autoProcess: true,
    })

    await watcher.start()

    console.log()
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║  ✅ 服務已啟動！                                           ║')
    console.log('║                                                            ║')
    console.log('║  系統會自動檢查並處理新的 Moodle 郵件                      ║')
    console.log('║  按 Ctrl+C 停止服務                                        ║')
    console.log('║  按 Enter 手動觸發檢查                                     ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log()

    // Enable manual trigger
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.on('line', async () => {
      if (watcher) {
        await watcher.triggerCheck()
      }
    })

    // Keep process running
    await new Promise(() => {}) // Never resolves
  } catch (error) {
    console.error('\n❌ 啟動失敗:', error)
    if (error instanceof Error) {
      console.error(error.message)
    }
    await prisma.$disconnect()
    process.exit(1)
  }
}

main().catch(async (error) => {
  console.error('❌ 發生錯誤:', error)
  await prisma.$disconnect()
  process.exit(1)
})
