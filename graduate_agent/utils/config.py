"""配置管理模組"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MoodleConfig:
    """Moodle 配置"""
    base_url: str
    username: str
    password: str
    download_dir: str
    headless: bool = True


@dataclass
class NotionConfig:
    """Notion 配置"""
    token: str
    database_id: Optional[str] = None


@dataclass
class Config:
    """主配置類"""
    moodle: MoodleConfig
    notion: Optional[NotionConfig] = None


class ConfigManager:
    """配置管理器"""

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            # 使用環境變數或預設路徑
            config_path = os.getenv(
                'GRADUATE_AGENT_CONFIG',
                'graduate_agent/config/config.yaml'
            )
        self.config_path = Path(config_path)

    def load(self) -> Config:
        """載入配置"""
        if not self.config_path.exists():
            raise FileNotFoundError(
                f"配置檔案不存在: {self.config_path}\n"
                f"請參考 config.example.yaml 建立配置檔案"
            )

        with open(self.config_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)

        return self._parse_config(data)

    def _parse_config(self, data: Dict[str, Any]) -> Config:
        """解析配置資料"""
        # 解析 Moodle 配置
        moodle_data = data.get('moodle', {})

        # 支援從環境變數讀取敏感資訊
        username = moodle_data.get('username') or os.getenv('MOODLE_USERNAME')
        password = moodle_data.get('password') or os.getenv('MOODLE_PASSWORD')

        if not username or not password:
            raise ValueError(
                "Moodle 帳號密碼未設定\n"
                "請在 config.yaml 中設定或使用環境變數 MOODLE_USERNAME 和 MOODLE_PASSWORD"
            )

        moodle_config = MoodleConfig(
            base_url=moodle_data.get('base_url', 'https://moodle45.nccu.edu.tw'),
            username=username,
            password=password,
            download_dir=moodle_data.get('download_dir', 'graduate_agent/data/downloads'),
            headless=moodle_data.get('headless', True)
        )

        # 解析 Notion 配置（可選）
        notion_config = None
        if 'notion' in data:
            notion_data = data['notion']
            token = notion_data.get('token') or os.getenv('NOTION_TOKEN')

            if token:
                notion_config = NotionConfig(
                    token=token,
                    database_id=notion_data.get('database_id')
                )

        return Config(moodle=moodle_config, notion=notion_config)

    @staticmethod
    def create_example_config(output_path: str = 'graduate_agent/config/config.example.yaml'):
        """創建範例配置檔案"""
        example = {
            'moodle': {
                'base_url': 'https://moodle45.nccu.edu.tw',
                'username': '你的學號',  # 或使用環境變數 MOODLE_USERNAME
                'password': '你的密碼',  # 或使用環境變數 MOODLE_PASSWORD
                'download_dir': 'graduate_agent/data/downloads',
                'headless': True  # 無頭模式（不顯示瀏覽器視窗）
            },
            'notion': {
                'token': '你的 Notion Token',  # 或使用環境變數 NOTION_TOKEN
                'database_id': None  # 可選，課程資料庫 ID
            }
        }

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(example, f, allow_unicode=True, default_flow_style=False)

        print(f"✓ 已創建範例配置檔案: {output_path}")
