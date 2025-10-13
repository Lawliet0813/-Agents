from __future__ import annotations

import datetime as _dt
from agents.expense_watcher import ExpenseWatcher, ExpenseWatcherConfig


def test_expense_watcher_parses_amounts_and_generates_report(tmp_path, monkeypatch):
    source_dir = tmp_path / "sources"
    report_dir = tmp_path / "reports"
    source_dir.mkdir()
    (source_dir / "mail1.eml").write_text(
        "Subject: 測試\n\n您已使用 LINE Pay 消費 250 元於 Starbucks，日期 2024-05-18。",
        encoding="utf-8",
    )

    config = ExpenseWatcherConfig(
        source_paths=[source_dir],
        category_keywords={"咖啡": ("Starbucks",)},
        currency="TWD",
        report_dir=report_dir,
    )
    watcher = ExpenseWatcher(config)
    records = watcher.parse_sources()

    assert len(records) == 1
    assert records[0].category == "咖啡"
    assert records[0].amount == 250

    month = _dt.date(2024, 5, 1)
    report_path = watcher.build_monthly_report(records, month=month)
    assert report_path is not None
    assert report_path.exists()
    html = report_path.read_text(encoding="utf-8")
    assert "咖啡" in html
    assert "250.00" in html

    csv_path = report_dir / "Expense_Report_2024-05.csv"
    assert csv_path.exists()
    csv_content = csv_path.read_text(encoding="utf-8")
    assert "Starbucks" in csv_content
