/**
 * Process NCCU Emails
 * Run this script periodically to process unread emails from NCCU Moodle
 */

import { PrismaClient } from '@prisma/client'
import { NCCUEmailProcessor } from '../src/server/services/nccu-email-processor'

const prisma = new PrismaClient()

async function main() {
  console.log('📧 處理政大郵件')
  console.log('================================\n')

  // Get NCCU email user
  const nccuEmail = process.env.NCCU_EMAIL || '114921039@nccu.edu.tw'

  console.log(`使用者: ${nccuEmail}`)

  const user = await prisma.user.findFirst({
    where: {
      email: nccuEmail,
    },
  })

  if (!user) {
    console.error(`❌ 找不到使用者 ${nccuEmail}`)
    console.log('請先運行初始化腳本: npm run init-nccu-email\n')
    process.exit(1)
  }

  // Check Google account
  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider: 'google',
    },
  })

  if (!account || !account.access_token) {
    console.error('❌ Google 帳號未連結或授權已過期')
    console.log('請重新登入系統以授權\n')
    process.exit(1)
  }

  console.log('✓ 帳號驗證成功\n')

  // Process emails
  console.log('開始處理未讀郵件...\n')

  const processor = new NCCUEmailProcessor(user.id)

  try {
    const result = await processor.processNCCUEmails()

    console.log('================================')
    console.log('✅ 處理完成！\n')
    console.log(`統計：`)
    console.log(`  已處理郵件: ${result.processed}`)
    console.log(`  新建作業: ${result.created}\n`)

    if (result.created > 0) {
      // Show created assignments
      const recentAssignments = await prisma.assignment.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: result.created,
        include: {
          course: {
            select: {
              name: true,
            },
          },
        },
      })

      console.log('新建立的作業：')
      for (const assignment of recentAssignments) {
        console.log(`\n  📝 ${assignment.title}`)
        if (assignment.course) {
          console.log(`     課程: ${assignment.course.name}`)
        }
        console.log(`     截止: ${assignment.dueDate.toLocaleString('zh-TW')}`)
        console.log(`     狀態: ${assignment.status}`)
      }
      console.log('')
    } else if (result.processed === 0) {
      console.log('ℹ️  沒有新的未讀郵件\n')
    }

    console.log('下次執行建議：')
    console.log('  • 手動: npm run process-nccu-emails')
    console.log('  • 定期: 設定 cron job (見 NCCU_EMAIL_SETUP.md)\n')
  } catch (error: any) {
    console.error('❌ 處理失敗：', error.message)

    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('\n可能的原因：')
      console.log('  • Google OAuth token 已過期')
      console.log('  • Gmail API 權限不足')
      console.log('\n解決方法：')
      console.log('  1. 重新登入系統')
      console.log('  2. 確認已授權 Gmail 權限')
      console.log('  3. 如果是政大信箱，可能需要聯絡資訊中心啟用 Gmail API\n')
    } else if (error.message.includes('403')) {
      console.log('\n可能的原因：')
      console.log('  • Gmail API 未啟用')
      console.log('  • 政大 IT 政策限制')
      console.log('\n解決方法：')
      console.log('  1. 檢查 Google Cloud Console 的 Gmail API 狀態')
      console.log('  2. 聯絡政大資訊中心 (02) 2939-3091 #67171\n')
    }

    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('❌ 執行錯誤：', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
