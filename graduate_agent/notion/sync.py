"""Notion 資料同步模組"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from .client import (
    NotionClient, heading_block, paragraph_block,
    bulleted_list_block, link_block, divider_block, callout_block
)


class NotionSync:
    """Notion 同步管理器"""

    def __init__(self, notion_client: NotionClient, database_id: Optional[str] = None):
        """
        初始化同步管理器

        Args:
            notion_client: Notion 客戶端實例
            database_id: 課程資料庫 ID（如果已存在）
        """
        self.client = notion_client
        self.database_id = database_id

    def get_or_create_courses_database(self, parent_page_id: str) -> str:
        """
        獲取或創建課程資料庫

        Args:
            parent_page_id: 父頁面 ID

        Returns:
            課程資料庫 ID
        """
        if self.database_id:
            return self.database_id

        # 定義課程資料庫的屬性
        properties = {
            "課程名稱": {"title": {}},
            "課程 ID": {"rich_text": {}},
            "學期": {"select": {}},
            "狀態": {
                "select": {
                    "options": [
                        {"name": "進行中", "color": "green"},
                        {"name": "已結束", "color": "gray"}
                    ]
                }
            },
            "最後更新": {"date": {}},
            "資源數量": {"number": {}},
            "課程連結": {"url": {}}
        }

        print("→ 創建課程資料庫...")
        db_id = self.client.create_database(
            parent_page_id=parent_page_id,
            title="🎓 研究生課程管理",
            properties=properties
        )

        self.database_id = db_id
        print(f"✓ 課程資料庫已創建: {db_id}")
        return db_id

    def find_course_page(self, course_name: str) -> Optional[str]:
        """
        尋找課程頁面

        Args:
            course_name: 課程名稱

        Returns:
            課程頁面 ID，如果不存在則返回 None
        """
        if not self.database_id:
            return None

        # 查詢資料庫中是否已存在該課程
        filter_obj = {
            "property": "課程名稱",
            "title": {
                "equals": course_name
            }
        }

        results = self.client.query_database(self.database_id, filter_obj)

        if results:
            return results[0]["id"]

        return None

    def create_course_page(self, course_data: Dict[str, Any]) -> str:
        """
        創建課程頁面

        Args:
            course_data: 課程資料

        Returns:
            新建課程頁面的 ID
        """
        course_name = course_data.get('name', 'Unknown Course')
        course_id = course_data.get('id', '')
        course_url = course_data.get('url', '')

        # 計算資源數量
        resource_count = sum(
            len(section.get('activities', []))
            for section in course_data.get('sections', [])
        )

        # 課程頁面屬性
        properties = {
            "課程名稱": {
                "title": [{"text": {"content": course_name}}]
            },
            "課程 ID": {
                "rich_text": [{"text": {"content": course_id}}]
            },
            "狀態": {
                "select": {"name": "進行中"}
            },
            "最後更新": {
                "date": {"start": datetime.now().isoformat()}
            },
            "資源數量": {
                "number": resource_count
            },
            "課程連結": {
                "url": course_url
            }
        }

        print(f"→ 創建課程頁面: {course_name}")
        page_id = self.client.create_page(
            parent_id=self.database_id,
            properties=properties,
            is_database=True
        )

        print(f"✓ 課程頁面已創建: {course_name}")
        return page_id

    def update_course_page(self, page_id: str, course_data: Dict[str, Any]):
        """
        更新課程頁面

        Args:
            page_id: 頁面 ID
            course_data: 課程資料
        """
        # 計算資源數量
        resource_count = sum(
            len(section.get('activities', []))
            for section in course_data.get('sections', [])
        )

        properties = {
            "最後更新": {
                "date": {"start": datetime.now().isoformat()}
            },
            "資源數量": {
                "number": resource_count
            }
        }

        print(f"→ 更新課程頁面: {course_data.get('name')}")
        self.client.update_page(page_id, properties)
        print(f"✓ 課程頁面已更新")

    def sync_course_content(self, course_page_id: str, course_data: Dict[str, Any]):
        """
        同步課程內容到頁面

        Args:
            course_page_id: 課程頁面 ID
            course_data: 課程資料
        """
        sections = course_data.get('sections', [])

        if not sections:
            return

        print(f"→ 同步課程內容: {course_data.get('name')}")

        # 建立內容區塊
        blocks = []

        # 添加課程概覽
        blocks.append(heading_block("📋 課程概覽", level=2))
        blocks.append(paragraph_block(
            f"課程 ID: {course_data.get('id', 'N/A')}\n"
            f"章節數量: {len(sections)}\n"
            f"最後更新: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ))
        blocks.append(divider_block())

        # 添加各章節內容
        blocks.append(heading_block("📚 課程內容", level=2))

        for section in sections:
            section_title = section.get('title', 'Unknown Section')
            activities = section.get('activities', [])

            if not activities:
                continue

            # 章節標題
            blocks.append(heading_block(f"{section_title}", level=3))

            # 活動列表
            for activity in activities:
                activity_name = activity.get('name', 'Unknown')
                activity_url = activity.get('url', '')
                activity_type = activity.get('type', 'unknown')

                # 根據類型添加表情符號
                type_emoji = {
                    'resource': '📄',
                    'assignment': '✏️',
                    'forum': '💬',
                    'quiz': '📝',
                    'url': '🔗'
                }.get(activity_type, '📌')

                # 創建連結項目
                link_text = f"{type_emoji} {activity_name}"
                blocks.append(link_block(link_text, activity_url))

            blocks.append(paragraph_block(""))  # 空行分隔

        # 添加區塊到頁面
        self.client.append_blocks(course_page_id, blocks)
        print(f"✓ 課程內容已同步")

    def sync_course(self, course_data: Dict[str, Any]) -> str:
        """
        同步單門課程

        Args:
            course_data: 課程資料

        Returns:
            課程頁面 ID
        """
        course_name = course_data.get('name', 'Unknown Course')

        # 檢查課程是否已存在
        existing_page_id = self.find_course_page(course_name)

        if existing_page_id:
            # 更新現有頁面
            self.update_course_page(existing_page_id, course_data)
            return existing_page_id
        else:
            # 創建新頁面
            page_id = self.create_course_page(course_data)
            # 同步內容
            self.sync_course_content(page_id, course_data)
            return page_id

    def sync_all_courses(self, courses_data: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        同步所有課程

        Args:
            courses_data: 課程資料列表

        Returns:
            課程名稱到頁面 ID 的映射
        """
        if not self.database_id:
            raise ValueError("課程資料庫 ID 未設定，請先呼叫 get_or_create_courses_database()")

        course_pages = {}

        print(f"\n{'=' * 60}")
        print(f"開始同步 {len(courses_data)} 門課程到 Notion")
        print(f"{'=' * 60}\n")

        for course_data in courses_data:
            course_name = course_data.get('name', 'Unknown Course')
            try:
                page_id = self.sync_course(course_data)
                course_pages[course_name] = page_id
            except Exception as e:
                print(f"✗ 同步失敗: {course_name} - {e}")

        print(f"\n{'=' * 60}")
        print(f"✓ 同步完成！共處理 {len(course_pages)} 門課程")
        print(f"{'=' * 60}\n")

        return course_pages


def create_assignment_database(client: NotionClient, parent_page_id: str) -> str:
    """
    創建作業資料庫

    Args:
        client: Notion 客戶端
        parent_page_id: 父頁面 ID

    Returns:
        作業資料庫 ID
    """
    properties = {
        "作業名稱": {"title": {}},
        "課程": {"select": {}},
        "截止日期": {"date": {}},
        "狀態": {
            "select": {
                "options": [
                    {"name": "未開始", "color": "gray"},
                    {"name": "進行中", "color": "blue"},
                    {"name": "已完成", "color": "green"},
                    {"name": "已逾期", "color": "red"}
                ]
            }
        },
        "優先級": {
            "select": {
                "options": [
                    {"name": "高", "color": "red"},
                    {"name": "中", "color": "yellow"},
                    {"name": "低", "color": "gray"}
                ]
            }
        },
        "作業連結": {"url": {}},
        "備註": {"rich_text": {}}
    }

    print("→ 創建作業資料庫...")
    db_id = client.create_database(
        parent_page_id=parent_page_id,
        title="✅ 作業管理",
        properties=properties
    )

    print(f"✓ 作業資料庫已創建: {db_id}")
    return db_id
