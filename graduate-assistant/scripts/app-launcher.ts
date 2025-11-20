#!/usr/bin/env tsx

/**
 * Graduate Assistant App Launcher
 * 系統托盤應用啟動器
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'
import * as readline from 'readline'

const execAsync = promisify(exec)

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  uptime?: string
}

class GraduateAssistantLauncher {
  private projectRoot: string
  private logDir: string

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.logDir = path.join(this.projectRoot, 'logs')
    this.ensureLogDir()
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  /**
   * 檢查 PM2 是否已安裝
   */
  private async checkPM2(): Promise<boolean> {
    try {
      await execAsync('pm2 --version')
      return true
    } catch {
      return false
    }
  }

  /**
   * 安裝 PM2
   */
  private async installPM2(): Promise<void> {
    console.log('📦 PM2 未安裝，正在安裝...')
    await execAsync('npm install -g pm2')
    console.log('✅ PM2 安裝完成')
  }

  /**
   * 獲取服務狀態
   */
  private async getServiceStatus(serviceName: string): Promise<ServiceStatus> {
    try {
      const { stdout } = await execAsync(`pm2 jlist`)
      const services = JSON.parse(stdout)
      const service = services.find((s: any) => s.name === serviceName)

      if (!service) {
        return { name: serviceName, status: 'stopped' }
      }

      return {
        name: serviceName,
        status: service.pm2_env.status === 'online' ? 'running' : 'stopped',
        pid: service.pid,
        uptime: service.pm2_env.pm_uptime
          ? this.formatUptime(Date.now() - service.pm2_env.pm_uptime)
          : undefined,
      }
    } catch {
      return { name: serviceName, status: 'error' }
    }
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天`
    if (hours > 0) return `${hours}小時`
    if (minutes > 0) return `${minutes}分鐘`
    return `${seconds}秒`
  }

  /**
   * 啟動所有服務
   */
  async startAll(): Promise<void> {
    console.log('🚀 啟動 Graduate Assistant...\n')

    // 檢查 PM2
    const hasPM2 = await this.checkPM2()
    if (!hasPM2) {
      await this.installPM2()
    }

    // 啟動服務
    try {
      const ecosystemPath = path.join(this.projectRoot, 'ecosystem.config.js')
      await execAsync(`pm2 start ${ecosystemPath}`)
      console.log('✅ 所有服務已啟動\n')

      await this.showStatus()
    } catch (error) {
      console.error('❌ 啟動失敗:', error)
      throw error
    }
  }

  /**
   * 停止所有服務
   */
  async stopAll(): Promise<void> {
    console.log('🛑 停止所有服務...')

    try {
      await execAsync('pm2 stop all')
      console.log('✅ 所有服務已停止')
    } catch (error) {
      console.error('❌ 停止失敗:', error)
      throw error
    }
  }

  /**
   * 重啟所有服務
   */
  async restartAll(): Promise<void> {
    console.log('🔄 重啟所有服務...')

    try {
      await execAsync('pm2 restart all')
      console.log('✅ 所有服務已重啟\n')

      await this.showStatus()
    } catch (error) {
      console.error('❌ 重啟失敗:', error)
      throw error
    }
  }

  /**
   * 顯示服務狀態
   */
  async showStatus(): Promise<void> {
    console.log('📊 服務狀態：\n')

    const webStatus = await this.getServiceStatus('graduate-assistant-web')
    const mailStatus = await this.getServiceStatus('mail2000-watcher')

    console.log(
      `  Web 應用:      ${this.getStatusIcon(webStatus.status)} ${webStatus.status.toUpperCase()}`
    )
    if (webStatus.uptime) {
      console.log(`                 運行時間: ${webStatus.uptime}`)
    }

    console.log(
      `  郵件監控:      ${this.getStatusIcon(mailStatus.status)} ${mailStatus.status.toUpperCase()}`
    )
    if (mailStatus.uptime) {
      console.log(`                 運行時間: ${mailStatus.uptime}`)
    }

    if (webStatus.status === 'running') {
      console.log('\n🌐 訪問: http://localhost:3000')
    }

    console.log()
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'running':
        return '🟢'
      case 'stopped':
        return '⚫'
      case 'error':
        return '🔴'
      default:
        return '⚪'
    }
  }

  /**
   * 查看日誌
   */
  async showLogs(service?: string): Promise<void> {
    if (service) {
      spawn('pm2', ['logs', service], { stdio: 'inherit' })
    } else {
      spawn('pm2', ['logs'], { stdio: 'inherit' })
    }
  }

  /**
   * 互動式選單
   */
  async showMenu(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const showOptions = () => {
      console.clear()
      console.log('╔════════════════════════════════════════════════════════════╗')
      console.log('║          🎓 Graduate Assistant 控制面板                    ║')
      console.log('╚════════════════════════════════════════════════════════════╝')
      console.log()
      console.log('  [1] 啟動所有服務')
      console.log('  [2] 停止所有服務')
      console.log('  [3] 重啟所有服務')
      console.log('  [4] 查看服務狀態')
      console.log('  [5] 查看日誌')
      console.log('  [0] 退出')
      console.log()
      rl.question('請選擇操作: ', async (answer) => {
        console.log()

        switch (answer.trim()) {
          case '1':
            await this.startAll()
            break
          case '2':
            await this.stopAll()
            break
          case '3':
            await this.restartAll()
            break
          case '4':
            await this.showStatus()
            break
          case '5':
            console.log('按 Ctrl+C 返回選單')
            await this.showLogs()
            break
          case '0':
            console.log('👋 再見！')
            rl.close()
            process.exit(0)
            return
          default:
            console.log('❌ 無效的選項')
        }

        console.log()
        console.log('按 Enter 繼續...')
        rl.question('', () => {
          showOptions()
        })
      })
    }

    showOptions()
  }
}

// 主程式
async function main() {
  const launcher = new GraduateAssistantLauncher()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // 無參數：顯示互動式選單
    await launcher.showMenu()
    return
  }

  const command = args[0]

  try {
    switch (command) {
      case 'start':
        await launcher.startAll()
        break
      case 'stop':
        await launcher.stopAll()
        break
      case 'restart':
        await launcher.restartAll()
        break
      case 'status':
        await launcher.showStatus()
        break
      case 'logs':
        await launcher.showLogs(args[1])
        break
      default:
        console.log('用法:')
        console.log('  npm run app           # 互動式選單')
        console.log('  npm run app start     # 啟動所有服務')
        console.log('  npm run app stop      # 停止所有服務')
        console.log('  npm run app restart   # 重啟所有服務')
        console.log('  npm run app status    # 查看狀態')
        console.log('  npm run app logs      # 查看日誌')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  }
}

// 處理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 再見！')
  process.exit(0)
})

main()
