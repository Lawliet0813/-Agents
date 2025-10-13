"""AutoOrganizer agent implementation.

This module provides the :class:`AutoOrganizer` class, which scans target
folders, categorizes files based on configured extension mappings, and
produces a presentation-style daily summary document in Markdown format.

The class is designed with macOS in mind but works cross-platform, and it
includes numerous hooks to make the behavior easy to unit-test.
"""

from __future__ import annotations

import datetime as _dt
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Mapping, MutableMapping, Sequence

logger = logging.getLogger(__name__)


DEFAULT_EXTENSION_MAPPING: Mapping[str, str] = {
    # Documents
    ".pdf": "Documents",
    ".doc": "Documents",
    ".docx": "Documents",
    ".ppt": "Documents",
    ".pptx": "Documents",
    ".txt": "Documents",
    ".rtf": "Documents",
    ".md": "Documents",
    # Images
    ".png": "Images",
    ".jpg": "Images",
    ".jpeg": "Images",
    ".gif": "Images",
    ".svg": "Images",
    ".heic": "Images",
    # Archives
    ".zip": "Archives",
    ".tar": "Archives",
    ".gz": "Archives",
    ".rar": "Archives",
    # Audio/Video
    ".mp3": "Media",
    ".wav": "Media",
    ".mp4": "Media",
    ".mov": "Media",
}


@dataclass
class SummaryEntry:
    """Represents one item in the generated summary."""

    category: str
    file_name: str
    original_location: Path


@dataclass
class AutoOrganizer:
    """Organize files from target directories into categorized folders.

    Parameters
    ----------
    target_dirs:
        Iterable of directories that will be scanned for candidate files.
    base_destination:
        Folder under which category directories should be created. Defaults to
        the directory being scanned.
    extension_mapping:
        Mapping of file extension to category name. Extensions should be
        lower-case and include the leading dot. Unmapped extensions are
        ignored.
    summary_dir:
        Directory where the generated Markdown summaries will be written.
    now_provider:
        Callable used to supply the "current" datetime, primarily for testing.
    """

    target_dirs: Sequence[Path]
    base_destination: Path | None = None
    extension_mapping: Mapping[str, str] = field(
        default_factory=lambda: dict(DEFAULT_EXTENSION_MAPPING)
    )
    summary_dir: Path | None = None
    now_provider: callable = field(default=_dt.datetime.now)

    def __post_init__(self) -> None:
        self.target_dirs = [Path(d).expanduser().resolve() for d in self.target_dirs]
        if self.base_destination is None:
            self.base_destination = self.target_dirs[0]
        else:
            self.base_destination = Path(self.base_destination).expanduser().resolve()

        if self.summary_dir is None:
            self.summary_dir = self.base_destination
        else:
            self.summary_dir = Path(self.summary_dir).expanduser().resolve()

    def organize(self, dry_run: bool = False) -> List[SummaryEntry]:
        """Organize files and return the summary entries.

        Parameters
        ----------
        dry_run:
            If ``True``, files will not actually be moved. Useful for testing.
        """

        summary: List[SummaryEntry] = []
        for target in self.target_dirs:
            if not target.exists():
                logger.warning("Target directory %s does not exist, skipping", target)
                continue

            for file_path in target.iterdir():
                if not file_path.is_file():
                    continue

                category = self._categorize(file_path.suffix.lower())
                if not category:
                    continue

                destination_dir = (self.base_destination / category).resolve()
                destination_dir.mkdir(parents=True, exist_ok=True)

                destination_path = destination_dir / file_path.name
                summary.append(
                    SummaryEntry(
                        category=category,
                        file_name=file_path.name,
                        original_location=file_path.parent,
                    )
                )

                if dry_run:
                    logger.debug("Dry run: would move %s -> %s", file_path, destination_path)
                else:
                    logger.info("Moving %s -> %s", file_path, destination_path)
                    if destination_path.exists():
                        destination_path = self._resolve_collision(destination_path)
                    file_path.rename(destination_path)

        if summary:
            self._write_summary(summary, dry_run=dry_run)
        return summary

    def _categorize(self, extension: str) -> str | None:
        return self.extension_mapping.get(extension)

    def _resolve_collision(self, destination_path: Path) -> Path:
        stem = destination_path.stem
        suffix = destination_path.suffix
        counter = 1
        while destination_path.exists():
            destination_path = destination_path.with_name(f"{stem}_{counter}{suffix}")
            counter += 1
        return destination_path

    def _write_summary(self, summary: Sequence[SummaryEntry], dry_run: bool) -> None:
        if dry_run:
            logger.debug("Dry run: skipping summary write")
            return

        now = self.now_provider()
        summary_path = self.summary_dir / f"Daily_File_Summary_{now:%Y-%m-%d}.md"

        lines: List[str] = [
            "# 今日檔案摘要",
            "",
            f"產生時間：{now:%Y-%m-%d %H:%M}",
            "",
        ]

        grouped: MutableMapping[str, List[SummaryEntry]] = {}
        for entry in summary:
            grouped.setdefault(entry.category, []).append(entry)

        for category, entries in sorted(grouped.items()):
            lines.extend([f"## {category}", ""])
            for item in entries:
                rel_original = item.original_location
                lines.append(f"- **{item.file_name}**（原位置：{rel_original}）")
            lines.append("")

        summary_path.write_text("\n".join(lines), encoding="utf-8")
        logger.info("Wrote summary to %s", summary_path)

    @classmethod
    def scan_default_locations(cls) -> "AutoOrganizer":
        desktop = Path.home() / "Desktop"
        downloads = Path.home() / "Downloads"
        return cls(target_dirs=[desktop, downloads], base_destination=downloads)
