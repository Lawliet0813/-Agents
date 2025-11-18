#!/usr/bin/env python3
"""Graduate Agent 模組測試腳本"""

import sys
from pathlib import Path


def test_imports():
    """測試模組導入"""
    print("→ 測試模組導入...")

    try:
        from graduate_agent.utils.config import ConfigManager
        print("  ✓ graduate_agent.utils.config")
    except ImportError as e:
        print(f"  ✗ graduate_agent.utils.config: {e}")
        return False

    try:
        from graduate_agent.moodle.scraper import MoodleScraper
        print("  ✓ graduate_agent.moodle.scraper")
    except ImportError as e:
        print(f"  ✗ graduate_agent.moodle.scraper: {e}")
        return False

    try:
        from graduate_agent.moodle.downloader import MoodleDownloader
        print("  ✓ graduate_agent.moodle.downloader")
    except ImportError as e:
        print(f"  ✗ graduate_agent.moodle.downloader: {e}")
        return False

    try:
        from graduate_agent.notion.client import NotionClient
        print("  ✓ graduate_agent.notion.client")
    except ImportError as e:
        print(f"  ✗ graduate_agent.notion.client: {e}")
        return False

    try:
        from graduate_agent.notion.sync import NotionSync
        print("  ✓ graduate_agent.notion.sync")
    except ImportError as e:
        print(f"  ✗ graduate_agent.notion.sync: {e}")
        return False

    return True


def test_dependencies():
    """測試依賴套件"""
    print("\n→ 測試依賴套件...")

    dependencies = {
        'selenium': 'selenium',
        'yaml': 'pyyaml',
        'notion_client': 'notion-client'
    }

    all_ok = True
    for module_name, package_name in dependencies.items():
        try:
            __import__(module_name)
            print(f"  ✓ {package_name}")
        except ImportError:
            print(f"  ✗ {package_name} (請執行: pip install {package_name})")
            all_ok = False

    return all_ok


def test_directory_structure():
    """測試目錄結構"""
    print("\n→ 測試目錄結構...")

    required_dirs = [
        "graduate_agent",
        "graduate_agent/moodle",
        "graduate_agent/notion",
        "graduate_agent/utils",
        "graduate_agent/config",
        "graduate_agent/data",
    ]

    all_ok = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"  ✓ {dir_path}")
        else:
            print(f"  ✗ {dir_path} (目錄不存在)")
            all_ok = False

    return all_ok


def test_config_files():
    """測試配置檔案"""
    print("\n→ 測試配置檔案...")

    config_example = Path("graduate_agent/config/config.example.yaml")
    if config_example.exists():
        print(f"  ✓ config.example.yaml")
    else:
        print(f"  ✗ config.example.yaml (範例檔案不存在)")
        return False

    env_example = Path(".env.example")
    if env_example.exists():
        print(f"  ✓ .env.example")
    else:
        print(f"  ✗ .env.example (範例檔案不存在)")
        return False

    return True


def main():
    """主程式"""
    print("=" * 60)
    print("Graduate Agent 模組測試")
    print("=" * 60)
    print()

    results = []

    # 測試目錄結構
    results.append(("目錄結構", test_directory_structure()))

    # 測試依賴套件
    results.append(("依賴套件", test_dependencies()))

    # 測試模組導入
    results.append(("模組導入", test_imports()))

    # 測試配置檔案
    results.append(("配置檔案", test_config_files()))

    # 總結
    print("\n" + "=" * 60)
    print("測試結果總結")
    print("=" * 60)

    all_passed = True
    for test_name, result in results:
        status = "✓ 通過" if result else "✗ 失敗"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n✓ 所有測試通過！系統已準備就緒。")
        print("\n接下來請：")
        print("1. 設定配置檔案（config.yaml 或 .env）")
        print("2. 執行: python -m graduate_agent.main scrape")
        return 0
    else:
        print("\n✗ 部分測試失敗，請檢查上述錯誤訊息。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
