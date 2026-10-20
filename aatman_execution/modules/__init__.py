"""
Execution modules for apps, files, APIs, commands, schedules, and communication.

Each module handles a specific type of real-world action.
These modules are used by the ExecutionController to perform tasks safely.
"""

from .app_control import AppController
from .file_system import FileSystemController
from .api_handler import APIController
from .command_executor import CommandExecutor
from .scheduler import TaskScheduler
from .communication import CommunicationController
from .system_control import SystemController

__all__ = [
    "AppController",
    "FileSystemController",
    "APIController",
    "CommandExecutor",
    "TaskScheduler",
    "CommunicationController",
    "SystemController",
]
