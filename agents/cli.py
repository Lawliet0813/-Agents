"""Command-line interface for the agent toolkit."""

from __future__ import annotations

import argparse
import datetime as _dt
import logging
from pathlib import Path

from .auto_organizer import AutoOrganizer
from .expense_watcher import ExpenseWatcher, ExpenseWatcherConfig
from .voice_butler import VoiceButler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Automation agents for macOS workflows")
    subparsers = parser.add_subparsers(dest="command")

    auto_parser = subparsers.add_parser("auto-organize", help="整理桌面與下載資料夾")
    auto_parser.add_argument("--dry-run", action="store_true", help="僅模擬移動，不實際變動檔案")
    auto_parser.add_argument("--summary-dir", type=Path, help="指定摘要輸出位置")

    expense_parser = subparsers.add_parser("expense-report", help="產生消費報告")
    expense_parser.add_argument("sources", nargs="+", type=Path, help="郵件或通知檔案所在位置")
    expense_parser.add_argument("--month", type=str, help="指定月份 (YYYY-MM)")
    expense_parser.add_argument("--currency", default="TWD")
    expense_parser.add_argument(
        "--category",
        action="append",
        metavar="NAME=keyword1,keyword2",
        help="設定分類與對應關鍵字，可重複使用",
    )
    expense_parser.add_argument("--report-dir", type=Path, help="報表輸出資料夾")
    expense_parser.add_argument("--no-csv", action="store_true", help="不要輸出 CSV 檔")

    subparsers.add_parser("voice", help="啟動語音指令管家")
    return parser


def parse_category_args(category_args: list[str] | None) -> dict[str, tuple[str, ...]]:
    mapping: dict[str, tuple[str, ...]] = {}
    if not category_args:
        return mapping
    for item in category_args:
        if "=" not in item:
            raise ValueError(f"分類設定格式錯誤：{item}")
        name, keywords = item.split("=", 1)
        mapping[name] = tuple(keyword.strip() for keyword in keywords.split(",") if keyword.strip())
    return mapping


def run_cli(args: list[str] | None = None) -> int:
    parser = build_parser()
    parsed = parser.parse_args(args)
    if parsed.command == "auto-organize":
        organizer = AutoOrganizer.scan_default_locations()
        if parsed.summary_dir:
            organizer.summary_dir = parsed.summary_dir
        summary = organizer.organize(dry_run=parsed.dry_run)
        logger.info("總共整理 %d 個檔案", len(summary))
        return 0
    if parsed.command == "expense-report":
        month = None
        if parsed.month:
            month = _dt.datetime.strptime(parsed.month, "%Y-%m").date().replace(day=1)
        config = ExpenseWatcherConfig(
            source_paths=parsed.sources,
            category_keywords=parse_category_args(parsed.category),
            currency=parsed.currency,
            report_dir=parsed.report_dir,
            export_csv=not parsed.no_csv,
        )
        watcher = ExpenseWatcher(config)
        records = watcher.parse_sources()
        watcher.build_monthly_report(records, month=month)
        logger.info("完成消費報告，共擷取 %d 筆紀錄", len(records))
        return 0
    if parsed.command == "voice":
        VoiceButler().listen_and_execute()
        return 0
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(run_cli())
