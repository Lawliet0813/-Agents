"""Notion API 客戶端模組"""
import os
from typing import Dict, Any, List, Optional
from datetime import datetime


try:
    from notion_client import Client
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False


class NotionClient:
    """Notion API 客戶端"""

    def __init__(self, token: str):
        """
        初始化 Notion 客戶端

        Args:
            token: Notion Integration Token
        """
        if not NOTION_AVAILABLE:
            raise ImportError(
                "Notion SDK 未安裝。請執行: pip install notion-client"
            )

        self.client = Client(auth=token)
        self.token = token

    def create_database(self, parent_page_id: str, title: str, properties: Dict[str, Any]) -> str:
        """
        創建資料庫

        Args:
            parent_page_id: 父頁面 ID
            title: 資料庫標題
            properties: 資料庫屬性定義

        Returns:
            新建資料庫的 ID
        """
        response = self.client.databases.create(
            parent={"page_id": parent_page_id},
            title=[{"text": {"content": title}}],
            properties=properties
        )
        return response["id"]

    def create_page(self, parent_id: str, properties: Dict[str, Any],
                    is_database: bool = True, content: Optional[List[Dict]] = None) -> str:
        """
        創建頁面

        Args:
            parent_id: 父容器 ID（資料庫或頁面）
            properties: 頁面屬性
            is_database: 父容器是否為資料庫
            content: 頁面內容區塊

        Returns:
            新建頁面的 ID
        """
        parent = {"database_id": parent_id} if is_database else {"page_id": parent_id}

        page_data = {
            "parent": parent,
            "properties": properties
        }

        if content:
            page_data["children"] = content

        response = self.client.pages.create(**page_data)
        return response["id"]

    def update_page(self, page_id: str, properties: Dict[str, Any]):
        """
        更新頁面屬性

        Args:
            page_id: 頁面 ID
            properties: 要更新的屬性
        """
        self.client.pages.update(page_id=page_id, properties=properties)

    def query_database(self, database_id: str, filter_obj: Optional[Dict] = None) -> List[Dict]:
        """
        查詢資料庫

        Args:
            database_id: 資料庫 ID
            filter_obj: 篩選條件

        Returns:
            查詢結果列表
        """
        query_params = {"database_id": database_id}
        if filter_obj:
            query_params["filter"] = filter_obj

        response = self.client.databases.query(**query_params)
        return response["results"]

    def append_blocks(self, page_id: str, blocks: List[Dict]):
        """
        向頁面添加內容區塊

        Args:
            page_id: 頁面 ID
            blocks: 要添加的區塊列表
        """
        self.client.blocks.children.append(block_id=page_id, children=blocks)

    def get_page(self, page_id: str) -> Dict[str, Any]:
        """
        獲取頁面資訊

        Args:
            page_id: 頁面 ID

        Returns:
            頁面資訊字典
        """
        return self.client.pages.retrieve(page_id=page_id)

    def search_pages(self, query: str) -> List[Dict]:
        """
        搜尋頁面

        Args:
            query: 搜尋關鍵字

        Returns:
            搜尋結果列表
        """
        response = self.client.search(query=query)
        return response["results"]


# Notion 區塊建構輔助函數

def heading_block(text: str, level: int = 2) -> Dict[str, Any]:
    """創建標題區塊"""
    heading_type = f"heading_{level}"
    return {
        "object": "block",
        "type": heading_type,
        heading_type: {
            "rich_text": [{"text": {"content": text}}]
        }
    }


def paragraph_block(text: str) -> Dict[str, Any]:
    """創建段落區塊"""
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"text": {"content": text}}]
        }
    }


def bulleted_list_block(text: str) -> Dict[str, Any]:
    """創建項目符號列表區塊"""
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"text": {"content": text}}]
        }
    }


def link_block(text: str, url: str) -> Dict[str, Any]:
    """創建連結區塊"""
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{
                "text": {"content": text, "link": {"url": url}},
                "annotations": {"code": False}
            }]
        }
    }


def divider_block() -> Dict[str, Any]:
    """創建分隔線區塊"""
    return {
        "object": "block",
        "type": "divider",
        "divider": {}
    }


def callout_block(text: str, emoji: str = "📌") -> Dict[str, Any]:
    """創建標註區塊"""
    return {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [{"text": {"content": text}}],
            "icon": {"emoji": emoji}
        }
    }
