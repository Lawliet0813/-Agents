"""Expense Watcher agent implementation."""

from __future__ import annotations

import csv
import datetime as _dt
import json
import logging
import re
from dataclasses import dataclass, field
from email import message_from_string
from email.message import Message
from pathlib import Path
from typing import List, Mapping, MutableMapping, Sequence

logger = logging.getLogger(__name__)

AMOUNT_PATTERN = re.compile(
    r"(?P<amount>[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:元|NT|TWD|\$)"
)


@dataclass
class ExpenseRecord:
    timestamp: _dt.datetime
    amount: float
    category: str
    source: str
    description: str


@dataclass
class ExpenseWatcherConfig:
    source_paths: Sequence[Path]
    category_keywords: Mapping[str, Sequence[str]] = field(default_factory=dict)
    currency: str = "TWD"
    report_dir: Path | None = None
    export_csv: bool = True

    def expand(self) -> "ExpenseWatcherConfig":
        expanded_sources = [Path(path).expanduser().resolve() for path in self.source_paths]
        report_dir = Path(self.report_dir).expanduser().resolve() if self.report_dir else expanded_sources[0]
        return ExpenseWatcherConfig(
            source_paths=expanded_sources,
            category_keywords=self.category_keywords,
            currency=self.currency,
            report_dir=report_dir,
            export_csv=self.export_csv,
        )


class ExpenseWatcher:
    """Parse payment notifications and build categorized reports."""

    def __init__(self, config: ExpenseWatcherConfig) -> None:
        self.config = config.expand()

    def parse_sources(self) -> List[ExpenseRecord]:
        records: List[ExpenseRecord] = []
        for path in self.config.source_paths:
            if path.is_dir():
                for child in path.glob("**/*"):
                    if child.is_file():
                        records.extend(self._parse_file(child))
            elif path.is_file():
                records.extend(self._parse_file(path))
            else:
                logger.warning("Source %s not found", path)
        return records

    def _parse_file(self, file_path: Path) -> List[ExpenseRecord]:
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = file_path.read_text(encoding="latin-1")

        msg = message_from_string(text)
        if isinstance(msg, Message) and msg.is_multipart():
            body_parts = [part.get_payload(decode=True) for part in msg.walk() if part.get_content_type() == "text/plain"]
            joined = "\n".join(
                (part.decode(part.get_content_charset() or "utf-8", errors="ignore") if part else "")
                for part in body_parts
            )
            text = joined or text

        return self._parse_text(text, source=file_path.name)

    def _parse_text(self, text: str, source: str) -> List[ExpenseRecord]:
        records: List[ExpenseRecord] = []
        amounts = [match.group("amount") for match in AMOUNT_PATTERN.finditer(text)]
        if not amounts:
            return records

        timestamp = self._extract_timestamp(text)
        description = self._extract_description(text)
        category = self._infer_category(text)

        for amount_str in amounts:
            normalized = float(amount_str.replace(",", ""))
            records.append(
                ExpenseRecord(
                    timestamp=timestamp,
                    amount=normalized,
                    category=category,
                    source=source,
                    description=description,
                )
            )
        return records

    def _extract_timestamp(self, text: str) -> _dt.datetime:
        now = _dt.datetime.now()
        match = re.search(r"(20\d{2})[-/](\d{1,2})[-/](\d{1,2})", text)
        if match:
            year, month, day = map(int, match.groups())
            return now.replace(year=year, month=month, day=day, hour=12, minute=0, second=0, microsecond=0)
        match = re.search(r"(\d{1,2})/(\d{1,2})", text)
        if match:
            month, day = map(int, match.groups())
            return now.replace(month=month, day=day, hour=12, minute=0, second=0, microsecond=0)
        return now

    def _extract_description(self, text: str) -> str:
        for line in text.splitlines():
            if any(keyword.lower() in line.lower() for keywords in self.config.category_keywords.values() for keyword in keywords):
                return line.strip()
        return text.splitlines()[0].strip() if text.strip() else ""

    def _infer_category(self, text: str) -> str:
        lowered = text.lower()
        for category, keywords in self.config.category_keywords.items():
            if any(keyword.lower() in lowered for keyword in keywords):
                return category
        return "未分類"

    def build_monthly_report(self, records: Sequence[ExpenseRecord], month: _dt.date | None = None) -> Path | None:
        if not records:
            logger.info("No expense records to report")
            return None

        month = month or _dt.date.today().replace(day=1)
        filtered = [record for record in records if record.timestamp.date().replace(day=1) == month]
        if not filtered:
            logger.info("No expenses for %s", month)
            return None

        totals: MutableMapping[str, float] = {}
        for record in filtered:
            totals[record.category] = totals.get(record.category, 0.0) + record.amount

        grand_total = sum(totals.values())
        report_path = self._write_report(filtered, totals, grand_total, month)
        if self.config.export_csv:
            self._write_csv(filtered, month)
        return report_path

    def _write_report(
        self,
        records: Sequence[ExpenseRecord],
        totals: Mapping[str, float],
        grand_total: float,
        month: _dt.date,
    ) -> Path:
        report_dir = Path(self.config.report_dir)
        report_dir.mkdir(parents=True, exist_ok=True)
        file_path = report_dir / f"Expense_Report_{month:%Y-%m}.html"

        lines = [
            "<html><head><meta charset='utf-8'><style>",
            "body{font-family:'Helvetica Neue',Arial,sans-serif;margin:2rem;background:#f8f9fa;}",
            ".slide{background:white;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.1);}",
            "h1,h2{margin-top:0;}",
            ".bar{height:18px;background:#4c6ef5;border-radius:9px;}",
            ".bar-container{background:#dee2e6;border-radius:9px;margin-top:4px;margin-bottom:12px;}",
            "table{width:100%;border-collapse:collapse;margin-top:1rem;}",
            "th,td{padding:8px;text-align:left;border-bottom:1px solid #dee2e6;}",
            "</style></head><body>",
            f"<div class='slide'><h1>本月消費摘要（{month:%Y年%m月}）</h1><p>總金額：{grand_total:.2f} {self.config.currency}</p></div>",
        ]

        for category, total in sorted(totals.items(), key=lambda item: item[1], reverse=True):
            percentage = (total / grand_total * 100) if grand_total else 0
            lines.append("<div class='slide'>")
            lines.append(f"<h2>{category}</h2>")
            lines.append(f"<p>金額：{total:.2f} {self.config.currency}（{percentage:.1f}%）</p>")
            width = min(100, int(percentage))
            lines.append(f"<div class='bar-container'><div class='bar' style='width:{width}%'></div></div>")
            lines.append("<table><thead><tr><th>時間</th><th>金額</th><th>來源</th><th>描述</th></tr></thead><tbody>")
            for record in records:
                if record.category == category:
                    lines.append(
                        "<tr>"
                        f"<td>{record.timestamp:%Y-%m-%d}</td>"
                        f"<td>{record.amount:.2f}</td>"
                        f"<td>{record.source}</td>"
                        f"<td>{record.description}</td>"
                        "</tr>"
                    )
            lines.append("</tbody></table></div>")

        lines.append("</body></html>")
        file_path.write_text("\n".join(lines), encoding="utf-8")
        logger.info("Wrote expense report to %s", file_path)
        return file_path

    def _write_csv(self, records: Sequence[ExpenseRecord], month: _dt.date) -> None:
        report_dir = Path(self.config.report_dir)
        report_dir.mkdir(parents=True, exist_ok=True)
        csv_path = report_dir / f"Expense_Report_{month:%Y-%m}.csv"
        with csv_path.open("w", encoding="utf-8", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(["timestamp", "amount", "category", "source", "description"])
            for record in records:
                writer.writerow([
                    record.timestamp.isoformat(),
                    f"{record.amount:.2f}",
                    record.category,
                    record.source,
                    record.description,
                ])
        logger.info("Wrote CSV export to %s", csv_path)

    @classmethod
    def from_json(cls, path: Path) -> "ExpenseWatcher":
        config_data = json.loads(Path(path).read_text(encoding="utf-8"))
        config = ExpenseWatcherConfig(
            source_paths=[Path(p) for p in config_data.get("source_paths", [])],
            category_keywords=config_data.get("category_keywords", {}),
            currency=config_data.get("currency", "TWD"),
            report_dir=Path(config_data["report_dir"]) if config_data.get("report_dir") else None,
            export_csv=config_data.get("export_csv", True),
        )
        return cls(config)
