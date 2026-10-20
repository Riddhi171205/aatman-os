import asyncio
from typing import List

from .modules import (
    AppController,
    FileSystemController,
    APIController,
    CommandExecutor,
    TaskScheduler,
    CommunicationController,
    SystemController
)
from .safety import SafetyGuard
from .logger import log_action

class ExecutionController:
    """
    Central router for asynchronous execution actions.
    """

    def __init__(self):
        self.app = AppController()
        self.file = FileSystemController()
        self.api = APIController()
        self.cmd = CommandExecutor()
        self.scheduler = TaskScheduler()
        self.comm = CommunicationController()
        self.system = SystemController()
        self.guard = SafetyGuard()

    async def execute_async(self, action: dict):
        """Asynchronous execution entry point."""
        safe, reason = self.guard.validate(action)
        if not safe:
            result = {"status": "blocked", "reason": reason}
            log_action(action, result)
            return result

        action_type = action.get("type")
        result = {"status": "error", "message": "Unsupported action"}

        if action_type == "app":
            result = self.app.open(action.get("name"))

        elif action_type == "file":
            result = self.file.handle(action)

        elif action_type == "api":
            result = self.api.call(action)

        elif action_type == "command":
            result = self.cmd.run(action.get("cmd"))

        elif action_type == "schedule":
            result = self.scheduler.schedule(
                action.get("delay", 5),
                self.execute,
                action.get("task")
            )

        elif action_type == "communication":
            result = self.comm.send_email(
                action.get("sender"),
                action.get("password"),
                action.get("receiver"),
                action.get("subject"),
                action.get("body")
            )

        elif action_type == "system_mode":
            result = self.system.handle_mode(action)

        log_action(action, result)
        return result

    def execute(self, action: dict):
        """Synchronous wrapper for backward compatibility."""
        return asyncio.run(self.execute_async(action))

    async def execute_parallel(self, actions: List[dict]):
        """Execute multiple actions in parallel."""
        tasks = [self.execute_async(a) for a in actions]
        return await asyncio.gather(*tasks)
