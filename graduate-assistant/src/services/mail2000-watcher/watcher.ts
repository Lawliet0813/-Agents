/**
 * Mail2000 Email Watcher
 * Automatically monitors and processes NCCU Mail2000 emails
 */

import { Mail2000Service } from '../../server/services/mail2000-service'
import { PrismaClient } from '@prisma/client'

export interface Mail2000WatcherConfig {
  userId: string
  checkIntervalMinutes?: number
  autoProcess?: boolean
}

export class Mail2000Watcher {
  private timer: NodeJS.Timeout | null = null
  private mail2000Service: Mail2000Service | null = null
  private config: Required<Mail2000WatcherConfig>
  private processing = false
  private prisma: PrismaClient

  constructor(config: Mail2000WatcherConfig) {
    this.config = {
      checkIntervalMinutes: 5, // 預設每 5 分鐘檢查一次
      autoProcess: true,
      ...config,
    }
    this.prisma = new PrismaClient()
  }

  /**
   * Start watching for new emails
   */
  async start(): Promise<void> {
    console.log(`📧 啟動 Mail2000 郵件監控服務...`)
    console.log(`⏰ 檢查間隔: ${this.config.checkIntervalMinutes} 分鐘`)

    // Initialize Mail2000 service
    try {
      await this.initializeService()
      console.log('✅ Mail2000 服務初始化成功')
    } catch (error) {
      console.error('❌ 無法初始化 Mail2000 服務:', error)
      throw error
    }

    // Start periodic checking
    this.timer = setInterval(
      () => this.checkAndProcessEmails(),
      this.config.checkIntervalMinutes * 60 * 1000
    )

    // Run initial check
    await this.checkAndProcessEmails()

    console.log('✅ Mail2000 郵件監控服務已啟動')
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('🛑 Mail2000 郵件監控服務已停止')
    }
    await this.prisma.$disconnect()
  }

  /**
   * Initialize Mail2000 service with user credentials
   */
  private async initializeService(): Promise<void> {
    // Get user credentials from database
    const user = await this.prisma.user.findUnique({
      where: { id: this.config.userId },
      select: {
        mail2000Username: true,
        mail2000Password: true,
      },
    })

    if (!user?.mail2000Username || !user?.mail2000Password) {
      throw new Error(
        '找不到 Mail2000 帳號資訊\n' +
          '請先在系統設定中配置 Mail2000 帳號\n' +
          '或使用 npm run process-mail2000 設定'
      )
    }

    this.mail2000Service = new Mail2000Service(this.config.userId, {
      host: 'mail.nccu.edu.tw',
      port: 993,
      username: user.mail2000Username,
      password: user.mail2000Password,
    })

    // Test connection
    const isConnected = await this.mail2000Service.testConnection()
    if (!isConnected) {
      throw new Error('無法連線到 Mail2000 伺服器')
    }
  }

  /**
   * Check and process new emails
   */
  private async checkAndProcessEmails(): Promise<void> {
    if (this.processing) {
      console.log('⏭️  上次檢查仍在進行中，跳過本次檢查')
      return
    }

    this.processing = true
    const timestamp = new Date().toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
    })

    try {
      console.log(`\n📬 [${timestamp}] 檢查新郵件...`)

      if (!this.mail2000Service) {
        await this.initializeService()
      }

      if (this.config.autoProcess && this.mail2000Service) {
        const result = await this.mail2000Service.processNCCUMoodleEmails()

        if (result.processed > 0) {
          console.log(`✅ 已處理 ${result.processed} 封郵件`)
          console.log(`📝 新建 ${result.created} 個作業`)
        } else {
          console.log('📭 沒有新的 Moodle 郵件')
        }
      }
    } catch (error) {
      console.error(`❌ 處理郵件時發生錯誤:`, error)

      // 如果是連線錯誤，嘗試重新初始化
      if (error instanceof Error && error.message.includes('連線')) {
        console.log('🔄 嘗試重新連線...')
        this.mail2000Service = null
        try {
          await this.initializeService()
          console.log('✅ 重新連線成功')
        } catch (reinitError) {
          console.error('❌ 重新連線失敗:', reinitError)
        }
      }
    } finally {
      this.processing = false
    }
  }

  /**
   * Get watcher status
   */
  getStatus() {
    return {
      isRunning: this.timer !== null,
      checkIntervalMinutes: this.config.checkIntervalMinutes,
      processing: this.processing,
      autoProcess: this.config.autoProcess,
    }
  }

  /**
   * Manually trigger email check
   */
  async triggerCheck(): Promise<void> {
    console.log('🔄 手動觸發郵件檢查...')
    await this.checkAndProcessEmails()
  }
}
