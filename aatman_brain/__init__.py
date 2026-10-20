"""
AATMAN Brain package.

Advanced Core Intelligence Layer for AATMAN OS.
Includes reasoning, memory, knowledge retrieval, explainability,
and improved robustness (logging, error handling, extensibility).
"""

import logging
from datetime import datetime

from .config import get_config
from .llm_client import LLMClient
from .engines.reasoning import ReasoningEngine
from .engines.memory import MemoryEngine
from .engines.knowledge import KnowledgeEngine
from .engines.explainability import ExplainabilityEngine
from .schemas import WorldSimulation

# Version
__version__ = "0.2.0"

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AATMAN_BRAIN")


class AATMANBrain:
    """
    Central Brain Controller that integrates all intelligence modules.
    Now includes:
    - Logging
    - Error handling
    - Timestamped memory
    - Extensible pipeline
    """

    def __init__(self):
        logger.info("Initializing AATMAN Brain...")
        
        self.config = get_config()
        self.config.memory_dir.mkdir(parents=True, exist_ok=True)
        self.config.knowledge_dir.mkdir(parents=True, exist_ok=True)
        
        self.llm = LLMClient(self.config)
        self.reasoning = ReasoningEngine(self.llm)
        self.memory = MemoryEngine(self.config.memory_dir)
        self.knowledge = KnowledgeEngine(self.config.knowledge_dir)
        self.explain = ExplainabilityEngine()

    def process(self, user_input: str) -> dict:
        """
        Main pipeline:
        Input → Memory Recall → Reasoning → Knowledge → Explain → Store Memory
        """
        session_id = "default_session"

        try:
            logger.info(f"Processing input: {user_input}")

            # Step 1: Recall memory
            memory_items = self.memory.retrieve(session_id=session_id, query=user_input, limit=3)
            context = [item.content for item in memory_items]
            logger.debug(f"Memory context: {context}")

            # Step 2: Reasoning
            intent = self.reasoning.understand_intent(user_input)
            plan_steps = self.reasoning.decompose(intent)
            plan_steps = self.reasoning.prioritize(plan_steps, intent)
            plan = [step.description for step in plan_steps]
            logger.debug(f"Plan: {plan}")

            # Step 3: Knowledge retrieval
            knowledge_items = self.knowledge.retrieve(query=user_input, limit=3)
            knowledge = [item.content for item in knowledge_items]
            logger.debug(f"Knowledge: {knowledge}")

            # Step 4: Combine reasoning + knowledge
            timestamp_now = datetime.utcnow().isoformat()
            final_output = {
                "input": user_input,
                "plan": plan,
                "knowledge": knowledge,
                "timestamp": timestamp_now
            }

            # Step 5: Explainability
            simulation = WorldSimulation(
                summary="Processed via MVP pipeline",
                predicted_outcomes=["Expected MVP execution"],
                risks=[],
                confidence=0.8
            )
            explanation = self.explain.explain(
                intent=intent,
                plan=plan_steps,
                memory=memory_items,
                knowledge=knowledge_items,
                simulation=simulation,
                contradictions=[],
                reflection="Reflected on MVP pipeline output."
            )

            # Step 6: Store in memory (episodic)
            self.memory.remember(
                session_id=session_id,
                content=f"User: {user_input}\nResult: {final_output}\nTimestamp: {timestamp_now}",
                kind="conversation"
            )

            logger.info("Processing completed successfully")

            return {
                "status": "success",
                "result": final_output,
                "explanation": explanation
            }

        except Exception as e:
            logger.error(f"Error processing input: {str(e)}")

            return {
                "status": "error",
                "message": str(e),
                "input": user_input
            }
