# AATMAN BRAIN - Core Intelligence MVP

AATMAN BRAIN is a small, modular Python service for the AI-native operating system. It is designed as a real core intelligence loop rather than a single chatbot call.

## Folder Structure

```text
aatman_brain/
  api/
    main.py                  # FastAPI endpoints
  engines/
    reasoning.py             # Intent, task decomposition, reflection
    memory.py                # Short-term + persistent JSONL memory
    knowledge.py             # Local RAG ingestion/retrieval + URL fetch
    world_model.py           # Basic outcome/risk simulation
    explainability.py        # Why, alternatives, confidence
  brain.py                   # Main orchestrator
  config.py                  # Runtime config/env
  llm_client.py              # Ollama/OpenAI-compatible adapter + fallback
  schemas.py                 # Shared data contracts
  vector_utils.py            # Lightweight sparse embeddings
  demo.py                    # Example local flow
  agent_society/
    base.py                  # BaseAgent class
    agents.py                # Planner, Researcher, Executor, Critic
    orchestrator.py          # AgentOrchestrator
    memory.py                # Feedback/self-evolution JSONL memory
    schemas.py               # Agent messages, tasks, run contracts
    demo.py                  # Example multi-agent run
data/
  brain_memory/              # Long-term memory store
  knowledge/                 # Ingested documents
  agent_society/             # Agent runs, feedback, learned guidance
```

## System Flow

```text
User Input
-> Intent Understanding
-> Reasoning Engine
-> Memory Retrieval
-> Knowledge Retrieval
-> World Model Simulation
-> Final Decision
-> Explainability
-> Output
-> Memory Update
```

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-brain.txt
uvicorn aatman_brain.api.main:app --reload --port 8001
```

By default, the brain works without an LLM by using deterministic local fallbacks.

To use Ollama:

```bash
export AATMAN_LLM_PROVIDER=ollama
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=llama3
```

To use an OpenAI-compatible API:

```bash
export AATMAN_LLM_PROVIDER=openai
export OPENAI_BASE_URL=https://api.openai.com/v1
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4o-mini
```

## Example API Calls

### Think

```bash
curl -X POST http://localhost:8001/think \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo","input":"Build a plan for AATMAN Brain to learn from user preferences."}'
```

Example response shape:

```json
{
  "response": "I understand the goal...",
  "intent": { "label": "planning_request", "goal": "..." },
  "plan": [{ "id": "step-1", "description": "Clarify the objective...", "priority": 1 }],
  "memory_context": [],
  "knowledge_context": [],
  "simulation": {
    "summary": "AATMAN simulated the likely path before answering.",
    "predicted_outcomes": ["..."],
    "risks": ["..."],
    "confidence": 0.68
  },
  "explanation": {
    "why": ["Intent classified as planning_request."],
    "alternatives": ["Ask a clarifying question before acting."],
    "confidence": 0.68
  },
  "session_id": "demo"
}
```

### Add Memory

```bash
curl -X POST http://localhost:8001/memory \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo","kind":"preference","content":"The user prefers calm, structured answers."}'
```

### Ingest Knowledge

```bash
curl -X POST http://localhost:8001/knowledge/text \
  -H "Content-Type: application/json" \
  -d '{"name":"aatman_notes.txt","content":"AATMAN OS should reason before it acts."}'
```

```bash
curl -X POST http://localhost:8001/knowledge/file-path \
  -H "Content-Type: application/json" \
  -d '{"path":"./README.md"}'
```

### Retrieve Context

```bash
curl "http://localhost:8001/retrieve?session_id=demo&query=structured%20answers"
```

## Agent Society MVP

The Agent Society simulates a calm team of specialized agents:

- Planner Agent: breaks goals into prioritized tasks.
- Research Agent: gathers relevant context and assumptions.
- Executor Agent: produces the draft answer or action strategy.
- Critic Agent: reviews the draft for gaps and improvement opportunities.
- Agent Orchestrator: routes the task, shares context, refines the output, and stores feedback.

Flow:

```text
User Goal
-> Planner Agent
-> Research Agent
-> Executor Agent
-> Critic Agent
-> Refinement
-> Final Output
-> Feedback Memory
```

### Run Agent Society

```bash
curl -X POST http://localhost:8001/agents/run \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo","goal":"Design a self-evolving agent society for AATMAN OS."}'
```

Sample response shape:

```json
{
  "session_id": "demo",
  "goal": "Design a self-evolving agent society for AATMAN OS.",
  "route": ["planner", "researcher", "executor", "critic"],
  "final_output": "AATMAN Agent Society response: ...",
  "tasks": [{ "description": "Define the expected implementation outcome..." }],
  "messages": [{ "sender": "planner", "receiver": "researcher" }],
  "critique": { "passed": true, "issues": [], "improvements": [] },
  "confidence": 0.75
}
```

### Add Feedback

```bash
curl -X POST http://localhost:8001/agents/feedback \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo","goal":"Design a self-evolving agent society for AATMAN OS.","feedback":"Prefer concise outputs with explicit next steps.","score":5}'
```

Future agent runs retrieve relevant learned guidance from `data/agent_society/learned.jsonl`.

## MVP Design Notes

- Memory uses short-term in-process memory plus persistent JSONL long-term memory.
- Semantic retrieval uses lightweight sparse embeddings to avoid heavy setup.
- The vector layer is intentionally replaceable by Qdrant or FAISS later.
- Knowledge ingestion supports text now, PDF when `pypdf` is installed, and URL fetch for simple external data capture.
- The world model is rule-based first. It predicts likely outcomes, risks, and confidence before the final answer.
- Explainability is returned as structured metadata so the UI can show why AATMAN chose a path.
