from __future__ import annotations

import datetime as _dt
from agents.auto_organizer import AutoOrganizer


def test_auto_organizer_moves_files_and_creates_summary(tmp_path):
    desktop = tmp_path / "Desktop"
    downloads = tmp_path / "Downloads"
    desktop.mkdir()
    downloads.mkdir()

    (desktop / "report.pdf").write_text("data", encoding="utf-8")
    (downloads / "photo.jpg").write_text("data", encoding="utf-8")

    now = _dt.datetime(2024, 5, 20, 22, 0)
    organizer = AutoOrganizer(
        target_dirs=[desktop, downloads],
        base_destination=downloads,
        summary_dir=tmp_path,
        now_provider=lambda: now,
    )

    summary = organizer.organize()

    assert sorted(p.name for p in (downloads / "Documents").iterdir()) == ["report.pdf"]
    assert sorted(p.name for p in (downloads / "Images").iterdir()) == ["photo.jpg"]

    summary_path = tmp_path / "Daily_File_Summary_2024-05-20.md"
    assert summary_path.exists()
    content = summary_path.read_text(encoding="utf-8")
    assert "report.pdf" in content
    assert "photo.jpg" in content
    assert len(summary) == 2
