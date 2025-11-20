/**
 * Process NCCU Mail2000 Emails
 * For users using NCCU's Mail2000 system (mail.nccu.edu.tw)
 */

import { PrismaClient } from '@prisma/client'
import { Mail2000Service, getMail2000Credentials } from '../src/server/services/mail2000-service'

const prisma = new PrismaClient()

async function main() {
  console.log('📧 處理政大 Mail2000 郵件')
  console.log('================================\n')

  // Get user email from environment or use default
  const userEmail = process.env.NCCU_EMAIL || '114921039@nccu.edu.tw'

  console.log(`使用者: ${userEmail}`)

  const user = await prisma.user.findFirst({
    where: { email: userEmail },
  })

  if (!user) {
    console.error(`❌ 找不到使用者 ${userEmail}`)
    console.log('請先登入系統並設定 Mail2000 密碼\n')
    process.exit(1)
  }

  // Get Mail2000 credentials
  const credentials = await getMail2000Credentials(user.id)

  if (!credentials) {
    console.error('❌ Mail2000 憑證未設定')
    console.log('\n請在系統設定中設定 Mail2000 帳號密碼：')
    console.log('1. 訪問 http://localhost:3000/dashboard/settings')
    console.log('2. 前往「整合服務」→「Mail2000 設定」')
    console.log('3. 輸入您的學號和密碼\n')
    process.exit(1)
  }

  console.log('✓ 憑證驗證成功\n')

  // Test connection
  console.log('測試 Mail2000 連線...')
  const service = new Mail2000Service(user.id, credentials)
  const connected = await service.testConnection()

  if (!connected) {
    console.error('❌ 無法連線到 Mail2000 伺服器')
    console.log('\n可能的原因：')
    console.log('  • 學號或密碼錯誤')
    console.log('  • Mail2000 伺服器暫時無法連線')
    console.log('  • 防火牆阻擋連線\n')
    process.exit(1)
  }

  console.log('✓ 連線成功\n')

  // Process emails
  console.log('開始處理未讀郵件...\n')

  try {
    const result = await service.processNCCUMoodleEmails()

    console.log('================================')
    console.log('✅ 處理完成！\n')
    console.log(`統計：`)
    console.log(`  已處理郵件: ${result.processed}`)
    console.log(`  新建作業: ${result.created}\n`)

    if (result.created > 0) {
      // Show created assignments
      const recentAssignments = await prisma.assignment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: result.created,
        include: {
          course: {
            select: { name: true },
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
      console.log('ℹ️  沒有新的未讀 Moodle 郵件\n')
    }

    console.log('下次執行建議：')
    console.log('  • 手動: npm run process-mail2000')
    console.log('  • 定期: 設定 cron job\n')
  } catch (error: any) {
    console.error('❌ 處理失敗：', error.message)

    if (error.message.includes('AUTHENTICATIONFAILED')) {
      console.log('\n可能的原因：')
      console.log('  • 學號或密碼錯誤')
      console.log('  • 密碼已過期，請至 Mail2000 更改密碼')
      console.log('\n解決方法：')
      console.log('  1. 訪問 https://mail.nccu.edu.tw')
      console.log('  2. 確認可以正常登入')
      console.log('  3. 在系統設定中更新密碼\n')
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('\n可能的原因：')
      console.log('  • Mail2000 伺服器暫時無法連線')
      console.log('  • 網路連線問題')
      console.log('\n解決方法：')
      console.log('  1. 檢查網路連線')
      console.log('  2. 稍後再試\n')
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
