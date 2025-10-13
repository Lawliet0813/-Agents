from __future__ import annotations

from agents.voice_butler import VoiceButler, VoiceButlerConfig


def test_voice_butler_executes_matching_command(tmp_path, monkeypatch):
    executed = {}

    def fake_action(transcript: str) -> None:
        executed["value"] = transcript

    config = VoiceButlerConfig(commands={})
    butler = VoiceButler(config)
    butler.config.commands.clear()
    butler.register_command(
        "test",
        keywords=("打開測試", "test"),
        action=fake_action,
        description="測試指令",
    )

    result = butler.execute("請幫我打開測試檔案")
    assert result == "測試指令"
    assert executed["value"] == "請幫我打開測試檔案"
