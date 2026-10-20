from __future__ import annotations

from pathlib import Path


class PermissionGuard:
    """Central safety checks for commands and file access."""

    blocked_commands = {
        "rm",
        "rmdir",
        "del",
        "format",
        "mkfs",
        "shutdown",
        "reboot",
        "halt",
        "poweroff",
        "sudo",
        "su",
        "chmod",
        "chown",
        "dd",
        "diskutil",
    }
    blocked_shell_tokens = {"&&", "||", ";", "|", ">", ">>", "<", "$(", "`"}

    def __init__(self, workspace_root: Path):
        self.workspace_root = workspace_root.resolve()

    def validate_workspace_path(self, raw_path: str) -> Path:
        if not raw_path or not raw_path.strip():
            raise ValueError("Path is required.")

        path = Path(raw_path).expanduser()
        if not path.is_absolute():
            path = self.workspace_root / path
        resolved = path.resolve()

        if self.workspace_root not in [resolved, *resolved.parents]:
            raise PermissionError(f"Path is outside the allowed workspace: {resolved}")
        return resolved

    def validate_command(self, cmd: str) -> list[str]:
        if not cmd or not cmd.strip():
            raise ValueError("Command is required.")

        for token in self.blocked_shell_tokens:
            if token in cmd:
                raise PermissionError(f"Shell control token is not allowed: {token}")

        parts = cmd.strip().split()
        executable = Path(parts[0]).name.lower()
        if executable in self.blocked_commands:
            raise PermissionError(f"Command is blocked by safety policy: {executable}")
        return parts

