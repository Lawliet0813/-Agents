"""Voice Butler agent implementation."""

from __future__ import annotations

import json
import logging
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, MutableMapping, Optional

try:  # pragma: no cover - optional dependency
    import speech_recognition as sr
except Exception:  # pragma: no cover - fallback when library is missing
    sr = None  # type: ignore

logger = logging.getLogger(__name__)


@dataclass
class Command:
    """Represents a voice-triggered command."""

    keywords: tuple[str, ...]
    action: Callable[[str], None]
    description: str


@dataclass
class VoiceButlerConfig:
    commands: MutableMapping[str, Command] = field(default_factory=dict)
    fallback_prompt: str = "請輸入指令："
    use_microphone: bool = True


class VoiceButler:
    """Translate voice commands into macOS automation tasks."""

    def __init__(self, config: VoiceButlerConfig | None = None) -> None:
        self.config = config or VoiceButlerConfig()
        if not self.config.commands:
            self._register_default_commands()

    # Default command implementations -------------------------------------------------
    def _register_default_commands(self) -> None:
        self.register_command(
            "open_presentation",
            keywords=("開啟簡報", "presentation", "投影片"),
            action=self._open_keynote,
            description="開啟 Keynote 簡報應用程式",
        )
        self.register_command(
            "start_auto_organizer",
            keywords=("整理桌面", "auto organizer", "整理檔案"),
            action=lambda _: self._run_command(["python", "-m", "agents.cli", "auto-organize"]),
            description="啟動自動整理程序",
        )
        self.register_command(
            "convert_document",
            keywords=("轉檔", "convert"),
            action=self._convert_document,
            description="將最近下載的文件轉為 PDF",
        )

    def register_command(self, name: str, keywords: tuple[str, ...], action: Callable[[str], None], description: str) -> None:
        self.config.commands[name] = Command(keywords=keywords, action=action, description=description)

    # Recognition ---------------------------------------------------------------------
    def listen_and_execute(self) -> Optional[str]:
        """Capture voice (or fallback to text) and execute the matching command."""

        transcript = self._capture_text()
        if transcript is None:
            return None
        logger.info("Received command text: %s", transcript)
        return self.execute(transcript)

    def execute(self, transcript: str) -> Optional[str]:
        transcript_lower = transcript.lower()
        for command in self.config.commands.values():
            if any(keyword.lower() in transcript_lower for keyword in command.keywords):
                logger.info("Executing command: %s", command.description)
                command.action(transcript)
                return command.description
        logger.warning("No matching command for: %s", transcript)
        return None

    def _capture_text(self) -> Optional[str]:
        if sr and self.config.use_microphone:
            recognizer = sr.Recognizer()
            with sr.Microphone() as source:  # pragma: no cover - hardware access
                logger.info("Listening for command")
                audio = recognizer.listen(source)
            try:
                transcript = recognizer.recognize_google(audio, language="zh-TW")
                return transcript
            except sr.UnknownValueError:  # pragma: no cover - hardware access
                logger.error("無法辨識語音，請再試一次")
                return None
            except sr.RequestError as exc:  # pragma: no cover - hardware access
                logger.error("語音服務錯誤：%s", exc)
                return None
        # Fallback to keyboard input for development/testing
        try:
            return input(self.config.fallback_prompt)
        except EOFError:
            return None

    # Actions -------------------------------------------------------------------------
    def _open_keynote(self, _: str) -> None:
        self._run_command(["open", "-a", "Keynote"])

    def _convert_document(self, transcript: str) -> None:
        downloads = Path.home() / "Downloads"
        latest = max(downloads.glob("*"), default=None, key=lambda p: p.stat().st_mtime)
        if latest is None:
            logger.warning("下載資料夾中找不到文件")
            return
        self._run_command([
            "qlmanage",
            "-p",
            str(latest),
        ])

    def _run_command(self, command: list[str]) -> None:
        logger.debug("Running command: %s", command)
        try:
            subprocess.run(command, check=True)
        except FileNotFoundError:
            logger.error("找不到指令：%s", command[0])
        except subprocess.CalledProcessError as exc:
            logger.error("指令失敗 (%s): %s", exc.returncode, command)

    # Persistence --------------------------------------------------------------------
    def to_json(self, path: Path) -> None:
        data = {
            name: {
                "keywords": command.keywords,
                "description": command.description,
            }
            for name, command in self.config.commands.items()
        }
        Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def from_json(cls, path: Path, action_factory: Optional[Callable[[str], Callable[[str], None]]] = None) -> "VoiceButler":
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        config = VoiceButlerConfig(commands={})
        instance = cls(config)
        instance.config.commands.clear()
        for name, payload in data.items():
            keywords = tuple(payload.get("keywords", ()))
            description = payload.get("description", name)
            action = action_factory(name) if action_factory else lambda _: logger.info("Action %s triggered", name)
            instance.register_command(name, keywords=keywords, action=action, description=description)
        return instance
