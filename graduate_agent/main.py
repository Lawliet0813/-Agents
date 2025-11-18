"""研究生專屬 AGENT 主程式"""
import sys
import json
from pathlib import Path
from typing import Optional

from graduate_agent.utils.config import ConfigManager
from graduate_agent.moodle.scraper import MoodleScraper
from graduate_agent.moodle.downloader import MoodleDownloader


def scrape_moodle(config_path: Optional[str] = None, output_path: str = "moodle_courses.json"):
    """
    爬取 Moodle 課程資料

    Args:
        config_path: 配置檔案路徑
        output_path: 輸出 JSON 檔案路徑
    """
    # 載入配置
    config_manager = ConfigManager(config_path)
    config = config_manager.load()

    # 創建爬蟲並執行
    with MoodleScraper(
        base_url=config.moodle.base_url,
        username=config.moodle.username,
        password=config.moodle.password,
        headless=config.moodle.headless
    ) as scraper:
        # 爬取所有課程
        data = scraper.scrape_all()

        # 儲存為 JSON
        scraper.save_to_json(data, output_path)

        return data


def download_resources(
    config_path: Optional[str] = None,
    courses_json: str = "moodle_courses.json",
    skip_existing: bool = True
):
    """
    下載課程資源

    Args:
        config_path: 配置檔案路徑
        courses_json: 課程資料 JSON 檔案路徑
        skip_existing: 是否跳過已存在的檔案
    """
    # 載入配置
    config_manager = ConfigManager(config_path)
    config = config_manager.load()

    # 讀取課程資料
    with open(courses_json, 'r', encoding='utf-8') as f:
        data = json.load(f)

    courses = data.get('courses', [])

    if not courses:
        print("✗ 沒有找到課程資料")
        return

    # 創建爬蟲（需要登入狀態才能下載）
    with MoodleScraper(
        base_url=config.moodle.base_url,
        username=config.moodle.username,
        password=config.moodle.password,
        headless=config.moodle.headless
    ) as scraper:
        # 登入
        if not scraper.login():
            print("✗ 登入失敗，無法下載資源")
            return

        # 創建下載器
        downloader = MoodleDownloader(scraper.driver, config.moodle.download_dir)

        # 下載所有課程的資源
        stats = downloader.download_all_courses(courses, skip_existing)

        return stats


def sync_to_notion(
    config_path: Optional[str] = None,
    courses_json: str = "moodle_courses.json",
    parent_page_id: Optional[str] = None
):
    """
    同步課程資料到 Notion

    Args:
        config_path: 配置檔案路徑
        courses_json: 課程資料 JSON 檔案路徑
        parent_page_id: Notion 父頁面 ID（如果不提供，需要在配置中設定）
    """
    # 載入配置
    config_manager = ConfigManager(config_path)
    config = config_manager.load()

    if not config.notion:
        print("✗ Notion 配置未設定")
        print("請在配置檔案中設定 Notion token 或使用環境變數 NOTION_TOKEN")
        return

    # 讀取課程資料
    with open(courses_json, 'r', encoding='utf-8') as f:
        data = json.load(f)

    courses = data.get('courses', [])

    if not courses:
        print("✗ 沒有找到課程資料")
        return

    # 創建 Notion 客戶端
    from graduate_agent.notion.client import NotionClient
    from graduate_agent.notion.sync import NotionSync

    notion_client = NotionClient(config.notion.token)

    # 確定資料庫 ID
    if config.notion.database_id:
        database_id = config.notion.database_id
    elif parent_page_id:
        # 創建新資料庫
        sync = NotionSync(notion_client)
        database_id = sync.get_or_create_courses_database(parent_page_id)
    else:
        print("✗ 需要提供 parent_page_id 或在配置中設定 database_id")
        return

    # 同步課程
    sync = NotionSync(notion_client, database_id)
    course_pages = sync.sync_all_courses(courses)

    return course_pages


def main():
    """主程式入口"""
    import argparse

    parser = argparse.ArgumentParser(description='研究生專屬 AGENT - Moodle 課程管理助手')
    parser.add_argument('command', choices=['scrape', 'download', 'sync', 'full'],
                        help='執行的命令')
    parser.add_argument('--config', '-c', help='配置檔案路徑')
    parser.add_argument('--output', '-o', default='moodle_courses.json',
                        help='輸出 JSON 檔案路徑（用於 scrape）')
    parser.add_argument('--input', '-i', default='moodle_courses.json',
                        help='輸入 JSON 檔案路徑（用於 download/sync）')
    parser.add_argument('--skip-existing', action='store_true', default=True,
                        help='跳過已存在的檔案（用於 download）')
    parser.add_argument('--parent-page-id', help='Notion 父頁面 ID（用於 sync）')

    args = parser.parse_args()

    try:
        if args.command == 'scrape':
            print("\n🚀 開始爬取 Moodle 課程資料...\n")
            scrape_moodle(args.config, args.output)

        elif args.command == 'download':
            print("\n📥 開始下載課程資源...\n")
            download_resources(args.config, args.input, args.skip_existing)

        elif args.command == 'sync':
            print("\n🔄 開始同步到 Notion...\n")
            sync_to_notion(args.config, args.input, args.parent_page_id)

        elif args.command == 'full':
            print("\n🎯 執行完整流程...\n")

            # 1. 爬取課程
            print("\n" + "=" * 60)
            print("步驟 1/3: 爬取課程資料")
            print("=" * 60 + "\n")
            scrape_moodle(args.config, args.output)

            # 2. 下載資源
            print("\n" + "=" * 60)
            print("步驟 2/3: 下載課程資源")
            print("=" * 60 + "\n")
            download_resources(args.config, args.output, args.skip_existing)

            # 3. 同步到 Notion
            if args.parent_page_id:
                print("\n" + "=" * 60)
                print("步驟 3/3: 同步到 Notion")
                print("=" * 60 + "\n")
                sync_to_notion(args.config, args.output, args.parent_page_id)
            else:
                print("\n⊙ 跳過 Notion 同步（未提供 --parent-page-id）")

            print("\n" + "=" * 60)
            print("✓ 所有步驟完成！")
            print("=" * 60 + "\n")

    except FileNotFoundError as e:
        print(f"\n✗ 錯誤: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ 發生錯誤: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
