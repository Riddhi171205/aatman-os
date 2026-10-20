# AATMAN OS Hybrid Memory Storage System

This package provides a modular memory system for AATMAN OS. It lets the AI store interactions, keep recent context, retrieve relevant past memories, and log full episodes for future learning.

## Folder Structure

```text
aatman_memory/
  config.py                  # Runtime config
  embedding.py               # Dependency-free embedding fallback
  manager.py                 # MemoryManager core controller
  schemas.py                 # MemoryRecord and RetrievedMemory contracts
  main.py                    # Example usage
  storage/
    short_term.py            # In-memory recent context buffer
    persistent.py            # SQLite long-term storage
    semantic.py              # Semantic similarity retrieval
    episodic.py              # Full interaction history
data/
  hybrid_memory/
    memory.sqlite3           # Runtime SQLite database
```

## Memory Layers

- ShortTermMemory: session-based in-memory buffer, limited to the last 5-10 entries.
- PersistentMemory: SQLite long-term storage for all interactions.
- SemanticMemory: vector-style similarity search over stored memories.
- EpisodicMemory: full interaction logs with user input, reasoning/plan, action, and result.
- MemoryManager: central API that stores and retrieves across all layers.

## Data Format

```json
{
  "input": "Open Chrome",
  "plan": "Launch browser",
  "action": { "type": "app", "name": "chrome" },
  "result": "success",
  "timestamp": "auto"
}
```

## Example Usage

```python
from aatman_memory.manager import MemoryManager

memory = MemoryManager()

memory.store_interaction(
    input="Open Chrome",
    plan="Launch browser",
    action={"type": "app", "action": "open", "name": "chrome"},
    result="success",
    session_id="user-1",
    tags=["execution", "browser"],
)

context = memory.retrieve_context(
    query="browser launch task",
    session_id="user-1",
)

print(context["summary"])
```

## Run Demo

```bash
python3 -m aatman_memory.main
```

The demo stores memories, retrieves relevant context, creates a new `MemoryManager`, and proves the memories persist after restart.

## Retrieval Output

```json
{
  "query": "browser launch task",
  "session_id": "user-1",
  "recent": [],
  "relevant": [],
  "context": [],
  "summary": "- [semantic 0.42] User said: Open Chrome; result: success"
}
```

## Design Notes

- The MVP uses SQLite and a lightweight sparse embedding model, so it works without FAISS or sentence-transformers.
- `SemanticMemory` is the only class that needs replacement when moving to FAISS, Qdrant, or sentence-transformers.
- Importance scoring boosts preferences, failures, successes, and long interactions.
- Tag retrieval supports preferences, execution traces, research, planning, and error memories.
- Cleanup can remove low-importance memories and rebuild the semantic index.

## Integration Pattern

Before reasoning:

```python
context = memory.retrieve_context(user_input, session_id=session_id)
```

After action:

```python
memory.store_interaction(
    input=user_input,
    plan=plan_text,
    action=action_json,
    result=result_text,
    reasoning={"confidence": 0.82},
    session_id=session_id,
)
```

