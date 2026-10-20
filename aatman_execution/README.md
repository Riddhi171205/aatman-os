# AATMAN OS Execution Layer

The Execution Layer is the guarded “hands” of AATMAN OS. It receives structured actions from the AI system, routes them to the right module, executes them, records history, and returns structured results.

## Folder Structure

```text
aatman_execution/
  controller.py              # ExecutionController router
  config.py                  # Runtime config and safety boundaries
  history.py                 # Append-only action history
  permissions.py             # Command and path safety checks
  schemas.py                 # Shared ExecutionResult contract
  main.py                    # Safe example usage script
  modules/
    app_control.py           # Open apps and send OS notifications
    file_system.py           # Read, write, search, delete, list folders
    api_handler.py           # GET/POST API calls
    command_executor.py      # Safe CLI execution
    task_scheduler.py        # Basic persistent task scheduling
    communication.py         # Mock/SMTP email and notification actions
  data/
    history.jsonl            # Runtime action history
    scheduled_tasks.json     # Runtime scheduled task store
```

## Structured Input Examples

```json
{ "type": "app", "action": "open", "name": "chrome" }
```

```json
{ "type": "file", "action": "read", "path": "notes.txt" }
```

```json
{ "type": "command", "cmd": "pwd" }
```

```json
{ "type": "api", "method": "GET", "url": "https://api.example.com/data" }
```

```json
{
  "type": "schedule",
  "action": "schedule",
  "run_at": "2026-05-17T18:00:00+05:30",
  "task": { "type": "communication", "action": "notify", "message": "Review AATMAN OS." }
}
```

## Safety Rules

- File access is restricted to `AATMAN_EXECUTION_ROOT`, defaulting to the current working directory.
- Delete requires `confirm: true`.
- Commands are executed without shell mode.
- Dangerous commands and shell control tokens are blocked.
- Communication defaults to dry-run mode.
- App opening can be dry-run with `AATMAN_DRY_RUN_APPS=1`.
- All actions are recorded in JSONL history.

## Example Usage

```bash
python3 -m aatman_execution.main
```

Programmatic use:

```python
from aatman_execution.controller import ExecutionController

controller = ExecutionController()
result = controller.execute({
    "type": "file",
    "action": "read",
    "path": "README.md",
})
print(result)
```

Batch use:

```python
controller.execute_many([
    {"type": "app", "action": "open", "name": "chrome"},
    {"type": "api", "method": "GET", "url": "https://api.weather.gov"},
])
```

## Sample Output Shape

```json
{
  "id": "action-id",
  "timestamp": "2026-05-17T12:30:00+00:00",
  "success": true,
  "type": "file",
  "action": "read",
  "message": "Read notes.txt",
  "data": {
    "path": "/workspace/notes.txt",
    "content": "AATMAN execution layer online."
  },
  "error": null
}
```

