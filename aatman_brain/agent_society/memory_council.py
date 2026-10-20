from .council import AgentCouncil

class MemoryCouncil(AgentCouncil):
    """Responsible for short-term and long-term memory operations."""
    
    def __init__(self, config=None):
        super().__init__(name="MemoryCouncil", config=config)

    def run(self, state):
        self.log("Running memory operations")
        return {"context": ["Retrieved relevant past interactions"]}
