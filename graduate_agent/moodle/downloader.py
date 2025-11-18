"""Moodle 檔案下載模組"""
import os
import time
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, unquote
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class MoodleDownloader:
    """Moodle 檔案下載器"""

    def __init__(self, driver, download_dir: str):
        """
        初始化下載器

        Args:
            driver: Selenium WebDriver 實例
            download_dir: 下載目錄路徑
        """
        self.driver = driver
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)

        # 支援的檔案類型
        self.supported_types = {
            'resource',  # 一般資源檔案
            'url',       # URL 連結（可能指向檔案）
            'folder'     # 資料夾
        }

    def sanitize_filename(self, filename: str) -> str:
        """
        清理檔案名稱，移除不合法字元

        Args:
            filename: 原始檔案名稱

        Returns:
            清理後的檔案名稱
        """
        # 移除或替換不合法字元
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # 移除前後空白
        filename = filename.strip()
        # 限制長度
        if len(filename) > 200:
            name, ext = os.path.splitext(filename)
            filename = name[:200 - len(ext)] + ext

        return filename

    def get_course_folder(self, course_name: str) -> Path:
        """
        獲取課程資料夾路徑

        Args:
            course_name: 課程名稱

        Returns:
            課程資料夾路徑
        """
        folder_name = self.sanitize_filename(course_name)
        course_folder = self.download_dir / folder_name
        course_folder.mkdir(parents=True, exist_ok=True)
        return course_folder

    def get_section_folder(self, course_folder: Path, section_title: str, section_index: int) -> Path:
        """
        獲取章節資料夾路徑

        Args:
            course_folder: 課程資料夾路徑
            section_title: 章節標題
            section_index: 章節索引

        Returns:
            章節資料夾路徑
        """
        # 使用 Week01, Week02 格式
        if "week" in section_title.lower() or "週" in section_title:
            folder_name = f"Week{section_index:02d}"
        else:
            folder_name = self.sanitize_filename(section_title) or f"Section{section_index:02d}"

        section_folder = course_folder / folder_name
        section_folder.mkdir(parents=True, exist_ok=True)
        return section_folder

    def is_file_downloaded(self, file_path: Path) -> bool:
        """
        檢查檔案是否已下載

        Args:
            file_path: 檔案路徑

        Returns:
            是否已存在
        """
        return file_path.exists() and file_path.stat().st_size > 0

    def wait_for_download(self, download_folder: Path, timeout: int = 30) -> Optional[Path]:
        """
        等待檔案下載完成

        Args:
            download_folder: 下載資料夾
            timeout: 超時時間（秒）

        Returns:
            下載的檔案路徑，如果失敗則返回 None
        """
        start_time = time.time()

        while time.time() - start_time < timeout:
            # 尋找最新的檔案
            files = list(download_folder.glob('*'))
            if files:
                # 排除 .crdownload 等臨時檔案
                complete_files = [f for f in files if not f.name.endswith('.crdownload')
                                  and not f.name.endswith('.tmp')]

                if complete_files:
                    # 返回最新的檔案
                    latest_file = max(complete_files, key=lambda x: x.stat().st_mtime)
                    return latest_file

            time.sleep(0.5)

        return None

    def download_resource(self, activity: Dict[str, Any], target_folder: Path) -> Optional[Path]:
        """
        下載單個資源

        Args:
            activity: 活動資訊字典
            target_folder: 目標資料夾

        Returns:
            下載的檔案路徑，如果失敗則返回 None
        """
        activity_name = activity.get('name', 'unknown')
        activity_url = activity.get('url')
        activity_type = activity.get('type')

        if not activity_url or activity_type not in self.supported_types:
            return None

        try:
            print(f"  → 下載: {activity_name}")

            # 訪問資源頁面
            self.driver.get(activity_url)
            time.sleep(1)

            # 嘗試尋找直接下載連結
            download_link = None

            # 方法 1: 尋找 "Download" 按鈕或連結
            try:
                download_link = self.driver.find_element(By.PARTIAL_LINK_TEXT, "Download")
            except:
                pass

            # 方法 2: 尋找檔案圖示連結
            if not download_link:
                try:
                    download_link = self.driver.find_element(By.CSS_SELECTOR, "a[href*='/mod/resource/']")
                except:
                    pass

            # 方法 3: 檢查當前 URL 是否直接指向檔案
            current_url = self.driver.current_url
            if not download_link and any(ext in current_url for ext in ['.pdf', '.ppt', '.doc', '.zip']):
                # 當前頁面就是檔案，直接記錄
                print(f"  ✓ 已在檔案頁面: {activity_name}")
                return None  # Selenium 會自動下載，但我們無法追蹤檔案名稱

            if download_link:
                # 記錄下載前的檔案列表
                before_files = set(target_folder.glob('*'))

                # 點擊下載
                download_link.click()

                # 等待新檔案出現
                time.sleep(2)
                after_files = set(target_folder.glob('*'))
                new_files = after_files - before_files

                if new_files:
                    downloaded_file = list(new_files)[0]
                    print(f"  ✓ 已下載: {downloaded_file.name}")
                    return downloaded_file
                else:
                    # 等待一段時間看看檔案是否出現
                    downloaded_file = self.wait_for_download(target_folder, timeout=10)
                    if downloaded_file:
                        print(f"  ✓ 已下載: {downloaded_file.name}")
                        return downloaded_file

            print(f"  ⊘ 無法下載: {activity_name}")
            return None

        except Exception as e:
            print(f"  ✗ 下載失敗: {activity_name} - {e}")
            return None

    def download_course(self, course_data: Dict[str, Any], skip_existing: bool = True) -> Dict[str, Any]:
        """
        下載整門課程的所有資源

        Args:
            course_data: 課程資料字典
            skip_existing: 是否跳過已存在的檔案

        Returns:
            下載統計資訊
        """
        course_name = course_data.get('name', 'Unknown Course')
        course_folder = self.get_course_folder(course_name)

        stats = {
            'total': 0,
            'downloaded': 0,
            'skipped': 0,
            'failed': 0
        }

        print(f"\n{'=' * 60}")
        print(f"下載課程: {course_name}")
        print(f"目標資料夾: {course_folder}")
        print(f"{'=' * 60}")

        for section in course_data.get('sections', []):
            section_title = section.get('title', 'Unknown Section')
            section_index = section.get('index', 0)
            activities = section.get('activities', [])

            # 篩選出資源類型的活動
            resources = [a for a in activities if a.get('type') in self.supported_types]

            if not resources:
                continue

            print(f"\n[{section_title}]")
            section_folder = self.get_section_folder(course_folder, section_title, section_index)

            for activity in resources:
                stats['total'] += 1

                # 檢查是否已存在
                activity_name = self.sanitize_filename(activity.get('name', 'unknown'))
                # 注意：我們不知道確切的副檔名，所以這裡只是簡單檢查

                if skip_existing:
                    # 檢查是否有類似名稱的檔案存在
                    existing_files = list(section_folder.glob(f"{activity_name}*"))
                    if existing_files:
                        print(f"  ⊙ 跳過（已存在）: {activity.get('name')}")
                        stats['skipped'] += 1
                        continue

                # 下載檔案
                downloaded = self.download_resource(activity, section_folder)

                if downloaded:
                    stats['downloaded'] += 1
                else:
                    stats['failed'] += 1

        print(f"\n{'=' * 60}")
        print(f"下載完成統計:")
        print(f"  總計: {stats['total']}")
        print(f"  已下載: {stats['downloaded']}")
        print(f"  已跳過: {stats['skipped']}")
        print(f"  失敗: {stats['failed']}")
        print(f"{'=' * 60}\n")

        return stats

    def download_all_courses(self, courses_data: List[Dict[str, Any]], skip_existing: bool = True) -> Dict[str, Any]:
        """
        下載所有課程的資源

        Args:
            courses_data: 課程資料列表
            skip_existing: 是否跳過已存在的檔案

        Returns:
            總體下載統計資訊
        """
        total_stats = {
            'total': 0,
            'downloaded': 0,
            'skipped': 0,
            'failed': 0,
            'courses': len(courses_data)
        }

        for course_data in courses_data:
            stats = self.download_course(course_data, skip_existing)

            total_stats['total'] += stats['total']
            total_stats['downloaded'] += stats['downloaded']
            total_stats['skipped'] += stats['skipped']
            total_stats['failed'] += stats['failed']

        print(f"\n{'=' * 60}")
        print(f"所有課程下載完成")
        print(f"{'=' * 60}")
        print(f"  課程數: {total_stats['courses']}")
        print(f"  總資源數: {total_stats['total']}")
        print(f"  已下載: {total_stats['downloaded']}")
        print(f"  已跳過: {total_stats['skipped']}")
        print(f"  失敗: {total_stats['failed']}")
        print(f"{'=' * 60}\n")

        return total_stats
